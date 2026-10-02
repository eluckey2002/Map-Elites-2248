'use strict';
const fs = require('node:fs');
const { LEVELS: PROJECT_LEVELS } = require('../../../src/game');
const corpus = require('../../../experiments/RESULT-0049/corpus.json');
const { summarizePairs, stageDecision } = require('../../../solver/ruler/core');
const levels = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52];
const seeds = Array.from({ length: 6 }, (_, index) => 45000000 + index);
const lookup = new Map(corpus.cells.map((cell) => [cell.level + ',' + cell.seed, cell]));
const cells = levels.flatMap((level) => seeds.map((seed) => {
  const cell = lookup.get(level + ',' + seed);
  if (!cell) throw new Error('accepted corpus missing fixture cell');
  return cell;
}));
const raw = {
  schemaVersion: 1,
  result: 'SYNTHETIC-QUALIFICATION',
  levelDefinitions: Object.fromEntries(levels.map((number) =>
    [number, PROJECT_LEVELS.find((level) => level.level === number)])),
  policies: { champion: { kind: 'champion', params: null }, base: { kind: 'base', params: null } },
  panels: [],
  games: [],
  manifest: {
    null: { tag: 'null' },
    positive: { tag: 'positive3000', positive72Tags: [] },
    map: {
      mutantPolicies: [{ policyId: 'champion', cell: '0,0', stage1: 'ADVANCE' }],
      nominees: [{ policyId: 'champion', cell: '0,0' }],
      representatives: [{ policyId: 'champion', cell: '0,0' }],
    },
  },
  headlines: {},
};
function add(tag, arm, policyId, pick) {
  raw.panels.push({ tag, arm, policyId, levels, seeds,
    games: cells.length, cpuSeconds: 0.001, wallSeconds: 0.001 });
  for (const cell of cells) {
    raw.games.push({ stage: tag, arm, policyId, level: cell.level, seed: cell.seed,
      outcome: pick(cell) });
  }
}
add('null', 'candidate', 'champion', (cell) => cell.champion);
add('null', 'reference', 'champion', (cell) => cell.champion);
for (const tag of ['positive3000', 'map72', 'map600', 'map3000', 'mapFresh', 'mapHoldout']) {
  add(tag, 'candidate', 'champion', (cell) => cell.champion);
  add(tag, 'reference', 'base', (cell) => cell.base);
}
const nullSummary = summarizePairs(cells.map((cell) => ({
  level: cell.level, seed: cell.seed, candidate: cell.champion, champion: cell.champion,
})), levels, seeds);
const positiveSummary = summarizePairs(cells.map((cell) => ({
  level: cell.level, seed: cell.seed, candidate: cell.champion, champion: cell.base,
})), levels, seeds);
function compact(summary) {
  return Object.fromEntries([
    'cells','winsGained','winsLost','netWins','bothWin','meanMovesSaved',
    'moveSe','moveSeLevel','moveSeSeed','moveCi95','relativeMovesPct',
  ].map((key) => [key, summary[key]]));
}
const t = positiveSummary.moveSe === 0 ? 'Infinity'
  : positiveSummary.moveSe === null ? 'UNKNOWN'
    : (positiveSummary.meanMovesSaved / positiveSummary.moveSe).toFixed(6);
const stronger = {
  holdoutLiftPct: positiveSummary.relativeMovesPct,
  t,
  held: positiveSummary.netWins >= 0 && positiveSummary.relativeMovesPct > 0 && Number(t) > 3,
};
raw.headlines = {
  null: { summary: compact(nullSummary) },
  positive: { summary: compact(positiveSummary), correct: 0 },
  map: {
    mutants: 1,
    stage1Survivors: stageDecision(positiveSummary, 1) === 'ADVANCE' ? 1 : 0,
    stage2Survivors: stageDecision(positiveSummary, 2) === 'ADVANCE' ? 1 : 0,
    nominees: stageDecision(positiveSummary, 3) === 'NOMINATE' ? 1 : 0,
    recheckRefused: 0, archiveEntrants: 1, strongerRuleHeld: stronger.held,
    representatives: [{
      policyId: 'champion', cell: '0,0', screen72: compact(positiveSummary),
      screen3000: compact(positiveSummary), fresh: compact(positiveSummary),
      holdout: compact(positiveSummary), stronger,
    }],
    cost: Object.fromEntries(['stage1', 'stage2', 'stage3'].map((name) =>
      [name, { gamesPerCandidate: cells.length, meanCpuSeconds: 0.001, candidates: 1 }])),
  },
  domainOutcome: stronger.held ? 'SUPPORTED' : 'INCONCLUSIVE',
};
fs.writeFileSync('docs/goals/trustworthy-ruler/recompute-qualification.json',
  JSON.stringify(raw, null, 2) + '\n');
console.log('QUALIFICATION_FIXTURE source=RESULT-0049 levels=' + levels.length
  + ' seeds=' + seeds.length + ' rows=' + raw.games.length
  + ' paired_moves=' + positiveSummary.meanMovesSaved
  + ' two_axis_se=' + positiveSummary.moveSe);
