'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { strongerPolicy, recheckArchive } = require('../ruler/run');
const root = path.resolve(__dirname, '..', '..');
const rawFile = path.join(root, 'experiments', 'RESULT-0058', 'raw-games.json');

function runNumeric(file) {
  return spawnSync(process.execPath, [path.join(root, 'solver', 'ruler', 'recompute.js'), file, '--numeric-only'],
    { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 30000 });
}
function tamper(edit) {
  const directory = fs.mkdtempSync(path.join(__dirname, 'ruler-review-fixture-'));
  try {
    const raw = JSON.parse(fs.readFileSync(rawFile));
    edit(raw);
    const file = path.join(directory, 'raw.json');
    fs.writeFileSync(file, JSON.stringify(raw));
    return runNumeric(file);
  } finally {
    const resolved = path.resolve(directory);
    assert.ok(resolved.startsWith(path.resolve(__dirname) + path.sep), 'temporary deletion stays inside solver/tests');
    fs.rmSync(resolved, { recursive: true });
  }
}
function positive(moves) {
  return { cells: 72, netWins: 0, meanMovesSaved: moves, relativeMovesPct: moves, moveCi95: [moves, moves] };
}

test('recheck counts accepted same-cell replacements as admissions, not refusals', () => {
  const result = recheckArchive([
    { policyId: 'first', cell: '1,1', stage3: positive(3), fresh: positive(1) },
    { policyId: 'replacement', cell: '1,1', stage3: positive(2), fresh: positive(2) },
  ]);
  assert.equal(result.refused, 0);
  assert.equal(result.archive.size, 1);
  assert.equal(result.archive.get('1,1').policyId, 'replacement');
});

test('recheck counts only actual fresh-block admission refusals', () => {
  const result = recheckArchive([
    { policyId: 'first', cell: '1,1', stage3: positive(3), fresh: positive(1) },
    { policyId: 'replacement', cell: '1,1', stage3: positive(2), fresh: positive(2) },
    { policyId: 'negative', cell: '2,2', stage3: positive(3), fresh: positive(-3) },
    { policyId: 'worse-incumbent', cell: '1,1', stage3: positive(9), fresh: positive(1.5) },
  ]);
  assert.equal(result.refused, 2);
  assert.equal(result.archive.get('1,1').policyId, 'replacement');
});

test('stronger-policy t retains negative Infinity and labels zero over zero UNKNOWN', () => {
  const negative = strongerPolicy({ netWins: 0, meanMovesSaved: -2, moveSe: 0, relativeMovesPct: -3 });
  assert.equal(negative.t, '-Infinity');
  assert.equal(negative.held, false);
  const zero = strongerPolicy({ netWins: 0, meanMovesSaved: 0, moveSe: 0, relativeMovesPct: 0 });
  assert.equal(zero.t, 'UNKNOWN');
  assert.equal(zero.held, false);
});

test('independent recompute rejects a canonically rekeyed out-of-range cut mutant', () => {
  const child = tamper((raw) => {
    const curseIds = new Set(raw.manifest.curse.policies.map((entry) => entry.policyId));
    const mutant = raw.manifest.map.mutantPolicies.find((entry) => entry.stage1 === 'CUT' && !curseIds.has(entry.policyId));
    assert.ok(mutant);
    const oldId = mutant.policyId;
    const params = { ...raw.policies[oldId].params, bombMax: 999 };
    const sorted = Object.fromEntries(Object.keys(params).sort().map((key) => [key, params[key]]));
    const newId = crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 12);
    raw.policies[newId] = { ...raw.policies[oldId], params };
    delete raw.policies[oldId];
    for (const row of raw.games) if (row.policyId === oldId) row.policyId = newId;
    for (const panel of raw.panels) if (panel.policyId === oldId) panel.policyId = newId;
    mutant.policyId = newId;
  });
  assert.equal(child.status, 1, child.stderr);
  assert.match(child.stdout, /DIFF frozen mutation ID/);
  assert.match(child.stdout, /DIFF mutation gene outside frozen range .* bombMax/);
  assert.doesNotMatch(child.stdout, /DIFF policy ID does not hash/);
  assert.match(child.stdout, /deterministic_replays=0/);
});

test('independent recompute rejects a 599-row stage-2 panel with matching self-reported counts', () => {
  const child = tamper((raw) => {
    const panel = raw.panels.find((entry) => entry.tag === 'map600' && entry.arm === 'candidate');
    const index = raw.games.findLastIndex((entry) => entry.stage === panel.tag
      && entry.arm === panel.arm && entry.policyId === panel.policyId);
    raw.games.splice(index, 1);
    panel.games = 599;
    raw.headlines.map.cost.stage2.gamesPerCandidate = 599;
  });
  assert.equal(child.status, 1, child.stderr);
  assert.match(child.stdout, /DIFF incomplete panel grid map600\|candidate\|.* expected=600 declared=599 retained=599/);
  assert.match(child.stdout, /deterministic_replays=0/);
});

test('current synthetic qualification fixture traverses every recompute path and is refused as confirmation evidence', () => {
  const child = runNumeric(path.join(root, 'docs', 'goals', 'trustworthy-ruler', 'recompute-qualification-current.json'));
  assert.equal(child.status, 1, child.stderr);
  assert.equal(child.stderr, '');
  for (const item of [3, 4, 5, 7, 9]) assert.match(child.stdout, new RegExp('RECOMPUTE item' + item + ' '));
  assert.match(child.stdout, /moves=1\.0140845070422535/);
  assert.doesNotMatch(child.stdout, /DIFF item4\.positive/);
  assert.match(child.stdout, /DIFF item9\.frozenMutantCount/);
  assert.match(child.stdout, /deterministic_replays=0/);
});
