'use strict';

// A synthetic numeric fixture exercises every current recompute path without
// playing a game. Accepted RESULT-0049 outcomes supply the arithmetic example;
// outcomes assigned to variants and chain lengths below are deliberately fake.
// Frozen confirmation sizes/seeds/mutation checks must reject this fixture.
const fs = require('node:fs');
const path = require('node:path');
const { LEVELS: PROJECT_LEVELS } = require('../../../src/game');
const corpus = require('../../../experiments/RESULT-0049/corpus.json');
const { summarizePairs, stageDecision } = require('../../../solver/ruler/core');
const { oneGeneVariants, policyId, shortMyopic } = require('../../../solver/ruler/policies');
const { behavior, cellForBehavior } = require('../../../solver/ruler/game');
const { strongerPolicy } = require('../../../solver/ruler/run');
const levels = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52];
const seeds = Array.from({ length: 6 }, (_, index) => 45000000 + index);
const lookup = new Map(corpus.cells.map((cell) => [cell.level + ',' + cell.seed, cell]));
const cells = levels.flatMap((level) => seeds.map((seed) => {
  const cell = lookup.get(level + ',' + seed);
  if (!cell) throw new Error('accepted corpus missing fixture cell');
  const syntheticChains = (outcome) => ({ ...outcome, chainCount: outcome.movesUsed, chainTiles: 6 * outcome.movesUsed });
  return { ...cell, champion: syntheticChains(cell.champion), base: syntheticChains(cell.base) };
}));
const raw = {
  schemaVersion: 1, result: 'SYNTHETIC-NUMERIC-QUALIFICATION',
  qualification: 'Not measured games: copied historical outcomes, synthetic variant assignments and chain lengths; must DIFF frozen confirmation checks.',
  levelDefinitions: Object.fromEntries(levels.map((number) =>
    [number, PROJECT_LEVELS.find((level) => level.level === number)])),
  policies: { champion: { kind: 'champion', params: null }, base: { kind: 'base', params: null } },
  panels: [], games: [],
  manifest: { null: { tag: 'null' }, positive: { tag: 'positive3000', positive72Tags: [] },
    knownBad: { tag: 'bad72' }, curse: { screenTag: 'curseScreen', freshTag: 'curseFresh', policies: [] },
    map: { mutantPolicies: [], nominees: [], representatives: [] } }, headlines: {},
};
function add(tag, arm, id, pick) {
  raw.panels.push({ tag, arm, policyId: id, levels, seeds,
    games: cells.length, cpuSeconds: 0.001, wallSeconds: 0.001 });
  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    raw.games.push({ stage: tag, arm, policyId: id, level: cell.level, seed: cell.seed, outcome: pick(cell, index) });
  }
}
function summary(candidate, reference) {
  return summarizePairs(cells.map((cell, index) => ({ level: cell.level, seed: cell.seed,
    candidate: candidate(cell, index), champion: reference(cell, index) })), levels, seeds);
}
// This compact schema matches the immutable original headlines, not the later
// full-statistics supplement. Arithmetic mismatches remain real failures.
function compact(s) {
  return Object.fromEntries(['cells', 'winsGained', 'winsLost', 'netWins', 'bothWin', 'meanMovesSaved',
    'moveSe', 'moveSeLevel', 'moveSeSeed', 'moveCi95', 'relativeMovesPct'].map((key) => [key, s[key]]));
}
const champion = (cell) => cell.champion;
const base = (cell) => cell.base;
add('null', 'candidate', 'champion', champion);
add('null', 'reference', 'champion', champion);
for (const tag of ['positive3000', 'map72', 'map600', 'map3000', 'mapFresh', 'mapHoldout']) {
  add(tag, 'candidate', 'champion', champion);
  add(tag, 'reference', 'base', base);
}
const nullSummary = summary(champion, champion);
const positiveSummary = summary(champion, base);
const badParams = shortMyopic();
const badId = policyId(badParams);
raw.policies[badId] = { kind: 'variant', params: badParams };
const syntheticBad = (cell, index) => index === 0
  ? { ...cell.champion, win: false, movesToTarget: null, reason: 'synthetic-loss' } : cell.champion;
add('bad72', 'candidate', badId, syntheticBad);
add('bad72', 'reference', 'champion', champion);
const badSummary = summary(syntheticBad, champion);
const curseRows = [];
for (const tag of ['curseScreen', 'curseFresh']) add(tag, 'reference', 'base', base);
for (const entry of oneGeneVariants()) {
  raw.policies[entry.policyId] = { kind: 'variant', params: entry.params };
  raw.manifest.curse.policies.push({ policyId: entry.policyId, name: entry.name });
  for (const tag of ['curseScreen', 'curseFresh']) add(tag, 'candidate', entry.policyId, champion);
  curseRows.push({ name: entry.name, policyId: entry.policyId,
    screenPct: positiveSummary.relativeMovesPct, freshPct: positiveSummary.relativeMovesPct, gapPct: 0,
    screen: compact(positiveSummary), fresh: compact(positiveSummary) });
}
const cell = cellForBehavior(behavior(cells.map(champion)));
raw.manifest.map = {
  mutantPolicies: [{ policyId: 'champion', cell, stage1: 'ADVANCE' }],
  nominees: [{ policyId: 'champion', cell }], representatives: [{ policyId: 'champion', cell }],
};
const stronger = strongerPolicy(positiveSummary);
raw.headlines = {
  null: { summary: compact(nullSummary) }, positive: { summary: compact(positiveSummary), correct: 0, blocks: 0 },
  knownBad: { summary: compact(badSummary), eliminatedAt: 'stage1' }, curse: { rows: curseRows, meanGapPct: 0 },
  map: { mutants: 1,
    stage1Survivors: stageDecision(positiveSummary, 1) === 'ADVANCE' ? 1 : 0,
    stage2Survivors: stageDecision(positiveSummary, 2) === 'ADVANCE' ? 1 : 0,
    nominees: stageDecision(positiveSummary, 3) === 'NOMINATE' ? 1 : 0,
    recheckRefused: 0, archiveEntrants: 1, strongerRuleHeld: stronger.held,
    representatives: [{ policyId: 'champion', cell, screen72: compact(positiveSummary),
      screen3000: compact(positiveSummary), fresh: compact(positiveSummary), holdout: compact(positiveSummary), stronger }],
    cost: Object.fromEntries(['stage1', 'stage2', 'stage3'].map((name) =>
      [name, { gamesPerCandidate: cells.length, meanCpuSeconds: 0.001, candidates: 1 }])) },
  domainOutcome: stronger.held ? 'SUPPORTED' : 'INCONCLUSIVE',
};
const output = process.argv[2] || path.join(__dirname, 'recompute-qualification-current.json');
fs.writeFileSync(output, JSON.stringify(raw, null, 2) + '\n', { flag: 'wx' });
console.log('QUALIFICATION_FIXTURE SYNTHETIC_NUMERIC_ONLY source=RESULT-0049 levels=' + levels.length
  + ' seeds=' + seeds.length + ' rows=' + raw.games.length + ' paired_moves=' + positiveSummary.meanMovesSaved
  + ' two_axis_se=' + positiveSummary.moveSe + ' expected_confirmation_verdict=DIFF');
