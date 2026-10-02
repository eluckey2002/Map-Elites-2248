#!/usr/bin/env node
'use strict';

// Derive the originally omitted win uncertainty from the sealed game rows.
// This producer uses the registered core; recompute.js derives it independently.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { summarizePairs } = require('./core');

const root = path.join(__dirname, '..', '..');
const input = process.argv[2] || path.join(root, 'experiments', 'RESULT-0058', 'raw-games.json');
const output = process.argv[3] || path.join(root, 'experiments', 'RESULT-0058', 'full-summary.json');
const bytes = fs.readFileSync(input);
const sourceRawSha256 = crypto.createHash('sha256').update(bytes).digest('hex');
if (sourceRawSha256 !== '9ffd27bb4d848a032f7698b935304cd3a54fec06ee7b3769507cffb4846d0062') {
  throw new Error('supplement input is not the sealed RESULT-0058 game artifact');
}
const raw = JSON.parse(bytes);
const keyed = new Map();
for (const game of raw.games) {
  const key = [game.stage, game.arm, game.policyId].join('|');
  if (!keyed.has(key)) keyed.set(key, []);
  keyed.get(key).push(game);
}
const panels = raw.panels.filter((panel) => panel.arm === 'candidate').map((panel) => {
  const references = raw.panels.filter((other) => other.tag === panel.tag && other.arm === 'reference');
  if (references.length !== 1) throw new Error('expected one reference for ' + panel.tag);
  const reference = references[0];
  if (JSON.stringify(panel.levels) !== JSON.stringify(reference.levels)
    || JSON.stringify(panel.seeds) !== JSON.stringify(reference.seeds)) throw new Error('unpaired axes');
  const candidates = keyed.get([panel.tag, panel.arm, panel.policyId].join('|'));
  const champions = keyed.get([reference.tag, reference.arm, reference.policyId].join('|'));
  const expected = panel.levels.length * panel.seeds.length;
  if (candidates.length !== expected || champions.length !== expected
    || panel.games !== expected || reference.games !== expected) throw new Error('incomplete panel grid');
  const pairs = candidates.map((candidate, index) => {
    const champion = champions[index];
    if (candidate.level !== champion.level || candidate.seed !== champion.seed) throw new Error('unpaired cell');
    return { level: candidate.level, seed: candidate.seed,
      candidate: candidate.outcome, champion: champion.outcome };
  });
  return { tag: panel.tag, policyId: panel.policyId, referencePolicyId: reference.policyId,
    levels: panel.levels, seeds: panel.seeds,
    summary: summarizePairs(pairs, panel.levels, panel.seeds) };
});
const serialized = JSON.stringify({ schemaVersion: 1, result: raw.result,
  registration: raw.registration, sourceRawSha256, panels }, null, 2) + '\n';
if (process.argv.includes('--print-only')) {
  if (fs.readFileSync(output, 'utf8') !== serialized) throw new Error('stored supplement differs from sealed-data derivation');
} else fs.writeFileSync(output, serialized, { flag: 'wx' });
console.log('FULL SUMMARY result=' + raw.result + ' raw_games=' + raw.games.length
  + ' panels=' + panels.length + ' source_sha256=' + sourceRawSha256);
for (const panel of panels) {
  const s = panel.summary;
  console.log('FULL SUMMARY ' + panel.tag + ' ' + panel.policyId
    + ' gained=' + s.winsGained + ' lost=' + s.winsLost
    + ' win_rate=' + s.winRateDifference + ' win_se_level=' + s.winSeLevel
    + ' win_se_seed=' + s.winSeSeed + ' win_se=' + s.winSe + ' win_interval95=[' + s.winCi95.join(',') + ']'
    + ' moves=' + s.meanMovesSaved + ' move_se_level=' + s.moveSeLevel
    + ' move_se_seed=' + s.moveSeSeed + ' move_se=' + s.moveSe + ' move_interval95=[' + s.moveCi95.join(',') + ']');
}
