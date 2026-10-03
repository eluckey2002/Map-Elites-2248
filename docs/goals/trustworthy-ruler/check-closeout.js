#!/usr/bin/env node
'use strict';

// Read-only close-out checks against the task's initial Git base and receipts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const base = 'fced429c4afc2b62312e32fdb202f8c0457c53d2';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trimEnd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const lf = (text) => text.replace(/\r\n/g, '\n');
function failureNames(text) {
  return [...new Set(text.split(/\r?\n/).filter((line) => /^✖ (?!failing tests:)/u.test(line))
    .map((line) => line.slice(2).replace(/ \([0-9.]+ms\)$/u, '')))].sort();
}
function skippedNames(text) {
  return text.split(/\r?\n/).filter((line) => /^﹣ /u.test(line))
    .map((line) => line.slice(2).replace(/ \([0-9.]+ms\)/u, '')).sort();
}
console.log('HEAD=' + git('rev-parse', 'HEAD'));
console.log('BRANCH=' + git('branch', '--show-current'));
const protectedFiles = ['solver/bot.js', 'solver/engine.js', 'solver/level-author.js',
  'solver/generate-levels.js', 'src/game.js', 'solver/calibrations/calib-1.js'];
assert.equal(git('diff', base, '--', ...protectedFiles), '');
console.log('PROTECTED_FILES_ZERO_DIFF=true');
assert.equal(git('diff', '--name-status', '--diff-filter=MDRTC', base, '--', 'solver/tests'), '');
console.log('EXISTING_TESTS_UNCHANGED=true');
const baseline = read('docs/goals/trustworthy-ruler/baseline-output.txt');
const closeout = read('docs/goals/trustworthy-ruler/reviewed-closeout-tests.txt');
const before = failureNames(baseline);
const after = failureNames(closeout);
console.log('BASELINE_FAILURE_NAMES=' + JSON.stringify(before));
console.log('REVIEWED_CLOSEOUT_FAILURE_NAMES=' + JSON.stringify(after));
console.log('NEW_FAILURE_NAMES=' + JSON.stringify(after.filter((name) => !before.includes(name))));
assert.deepEqual(after, before);
assert.deepEqual(skippedNames(closeout), skippedNames(baseline));
console.log('EXISTING_SKIP_NAMES_MATCH=true');
assert.ok(lf(read('experiments/SEEDS.md')).startsWith(lf(git('show', base + ':experiments/SEEDS.md'))));
console.log('SEEDS_APPEND_ONLY=true');
for (const file of ['docs/backlog/BL-0011-shipped-levels-cannot-measure-policy-quality.md',
  'docs/backlog/BL-0013-policy-vocabulary-gaps.md']) {
  assert.equal(lf(read(file)).split('## History')[0], lf(git('show', base + ':' + file)).split('## History')[0]);
  assert.ok(lf(read(file)).startsWith(lf(git('show', base + ':' + file))));
  console.log('HISTORY_ONLY ' + file + '=true');
}
const rawBytes = fs.readFileSync(path.join(root, 'experiments/RESULT-0058/raw-games.json'));
const hash = crypto.createHash('sha256').update(rawBytes).digest('hex');
assert.equal(hash, '9ffd27bb4d848a032f7698b935304cd3a54fec06ee7b3769507cffb4846d0062');
console.log('SEALED_RAW_SHA256=' + hash);
const games = JSON.parse(rawBytes).games.length;
const replayCount = (file) => Number(/deterministic_replays=(\d+)/u.exec(read(file))[1]);
const initialReplays = replayCount('experiments/RESULT-0058/recompute-output.txt');
const supplementalReplays = replayCount('experiments/RESULT-0058/recompute-reviewed-output.txt');
assert.equal(initialReplays + supplementalReplays, 8);
console.log('CONFIRMATION_GAMES=' + games + ' INDEPENDENT_REPLAYS=' + (initialReplays + supplementalReplays)
  + ' TOTAL=' + (games + initialReplays + supplementalReplays) + ' LIMIT=60000');
assert.ok(games + initialReplays + supplementalReplays + 8 < 60000);
console.log('HISTORICAL_QUALIFICATION_REPLAYS=8 TOTAL_INCLUDING_QUALIFICATION='
  + (games + initialReplays + supplementalReplays + 8));
const ledger = read('EVIDENCE_LEDGER.md');
for (const id of ['RESULT-0058', 'CORRECTION-0018']) {
  const block = ledger.split('### ' + id + ' — ')[1].split('\n##')[0];
  assert.match(block, /\*\*status:\*\* provisional/u);
  assert.match(block, /\*\*written_by:\*\* codex/u);
  assert.doesNotMatch(block, /\*\*checked_by:\*\*/u);
  console.log('LEDGER_PROVISIONAL_WITH_WRITER_AND_NO_CHECKER ' + id + '=true');
}
const imports = [...read('solver/ruler/recompute.js').matchAll(/require\(['"]([^'"]+)['"]\)/gu)]
  .map((match) => match[1]);
assert.deepEqual(imports.sort(), ['../bot', '../engine', 'node:crypto', 'node:fs', 'node:path'].sort());
console.log('INDEPENDENT_RECOMPUTE_IMPORTS=' + JSON.stringify(imports));
console.log('LOCAL_CLOSEOUT_MATCH');
