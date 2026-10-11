const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  BREADTH_BINS,
  HARVEST_BINS,
  boardIdentity,
  breadthBin,
  buildArchive,
  harvestBin,
  pairedHarvestAdvantage,
  placeElite,
  regretBin,
  renderMapHtml,
  spearman,
  summarizeBreadth,
  summarizeRun,
} = require('../board-map-elites-core');

function candidate(name, target = 1000) {
  return {
    schemaVersion: 1, name, level: 56, target, tileScale: 32,
    moves: 20, minChain: 3, gridW: 5, gridH: 6, blockers: [],
    sourceShapeIdentity: 'a'.repeat(64),
  };
}

function evaluation(name, breadth, regret, winRate, overrides = {}) {
  const harvest = overrides.harvest ?? 0;
  const board = candidate(name, overrides.target || 1000);
  return {
    eligible: true,
    candidate: board,
    boardIdentity: boardIdentity(board),
    quality: { winRate },
    descriptors: {
      breadth: { standing: 'replayed_lower_bound', value: breadth, bin: breadthBin(breadth) },
      regret: { standing: 'replayed_lower_bound_against_bot_proxy', value: regret, bin: regretBin(regret) },
      harvest: { standing: 'paired_bounded_search_proxy', value: harvest, bin: harvestBin(harvest) },
    },
  };
}

test('the frozen axes have exactly seven bins and every boundary has one home', () => {
  assert.equal(BREADTH_BINS.length, 7);
  assert.equal(HARVEST_BINS.length, 7);
  assert.deepEqual([0, 1, 2, 4, 8, 16, 32].map((value) => breadthBin(value).index), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual([-1, -0.15, -0.05, -0.01, 0.01, 0.05, 0.15].map((value) => harvestBin(value).index), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(harvestBin(1).index, 6);
  assert.throws(() => breadthBin(-1), /outside/);
  assert.throws(() => harvestBin(1.1), /outside/);
});

test('breadth is the median replayed lower bound and bounded misses stay visibly UNKNOWN', () => {
  const result = summarizeBreadth([
    { standing: 'replayed_lower_bound', distinctOutcomeCountLowerBound: 4 },
    { standing: 'replayed_lower_bound', distinctOutcomeCountLowerBound: 11 },
    { standing: 'replayed_lower_bound', distinctOutcomeCountLowerBound: 370 },
  ]);
  assert.equal(result.value, 11);
  assert.equal(result.bin.index, 4);
  assert.equal(result.standing, 'replayed_lower_bound');

  assert.deepEqual(summarizeBreadth([
    { standing: 'UNKNOWN', distinctOutcomeCountLowerBound: 0 },
  ]), {
    standing: 'bounded_lower_bound_with_UNKNOWN_rows',
    value: 0,
    aggregation: 'median distinct verified outcome lower bound across the fixed seed panel',
    bin: BREADTH_BINS[0],
  });
});

test('harvesting advantage requires paired seeds and preserves bounded no-witness standings', () => {
  const result = pairedHarvestAdvantage([
    { seed: 10, policy: 'immediate', moves: 10 },
    { seed: 10, policy: 'harvest', moves: 8 },
    { seed: 11, policy: 'immediate', moves: null },
    { seed: 11, policy: 'harvest', moves: 10 },
  ], 20);
  assert.equal(result.value, 0.325);
  assert.equal(result.bin.index, 6);
  assert.equal(result.pairs[1].immediateStanding, 'UNKNOWN');
  assert.throws(() => pairedHarvestAdvantage([
    { seed: 10, policy: 'immediate', moves: 10 },
  ], 20), /unpaired/);
});

test('a cell retains the three hardest distinct boards with deterministic ties', () => {
  const archive = new Map();
  const entries = [
    evaluation('a', 4, 0, 0.7, { target: 1000 }),
    evaluation('b', 4, 0, 0.4, { target: 1100 }),
    evaluation('c', 4, 0, 0.4, { target: 1200 }),
    evaluation('d', 4, 0, 0.2, { target: 1300 }),
  ];
  entries.forEach((entry) => placeElite(archive, entry));
  assert.equal(archive.get('3,0').length, 3);
  assert.deepEqual(archive.get('3,0').map(({ quality }) => quality.winRate), [0.2, 0.4, 0.4]);
  const expectedTieOrder = entries.slice(1, 3).sort((a, b) => a.boardIdentity.localeCompare(b.boardIdentity));
  assert.deepEqual(archive.get('3,0').slice(1).map(({ boardIdentity: id }) => id), expectedTieOrder.map(({ boardIdentity: id }) => id));
});

test('a cosmetic rename is the same board and cannot consume another slot', () => {
  const original = evaluation('original', 4, 0, 0.4);
  const renamed = { ...original, candidate: { ...original.candidate, name: 'renamed' } };
  assert.equal(boardIdentity(original.candidate), boardIdentity(renamed.candidate));
  const archive = new Map();
  assert.equal(placeElite(archive, original).admitted, true);
  assert.deepEqual(placeElite(archive, renamed), { admitted: false, reason: 'duplicate-board', cell: '3,0' });
  assert.equal(archive.get('3,0').length, 1);
});

test('archive construction rejects duplicate board identities globally', () => {
  const first = evaluation('one', 4, 0, 0.4);
  const renamed = { ...first, candidate: { ...first.candidate, name: 'two' } };
  assert.throws(() => buildArchive([first, renamed]), /duplicate evaluated board/);
});

test('the readable map always renders 49 honest cells and up to three boards', () => {
  const entries = [
    evaluation('a', 4, 0, 0.2, { target: 1000 }),
    evaluation('b', 4, 0, 0.3, { target: 1100 }),
    evaluation('c', 4, 0, 0.4, { target: 1200 }),
  ];
  const artifact = { artifactIdentity: 'f'.repeat(64), archive: buildArchive(entries) };
  const html = renderMapHtml(artifact);
  assert.equal((html.match(/<article class="cell/g) || []).length, 49);
  assert.match(html, /Each cell retains up to three distinct viable board designs/);
  assert.match(html, /data-cell="3,0"/);
  assert.match(html, /#3/);
  assert.match(html, />Empty</);
});

test('the map is breadth by baseline regret, with harvest kept only as evidence', () => {
  const low = evaluation('low', 4, 0, 0.4, { harvest: 0.2 });
  const high = evaluation('high', 4, 0.12, 0.4, { target: 1100, harvest: 0.2 });
  const cells = buildArchive([low, high]).map(({ cell }) => cell);
  assert.deepEqual(cells, ['3,0', '3,4']);
  const html = renderMapHtml({ artifactIdentity: 'f'.repeat(64), archive: buildArchive([low, high]) });
  assert.match(html, /Baseline regret ↑/);
  assert.match(html, /bot behind 12\.0%/);
});

test('spearman handles ties, constants and short panels', () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1);
  assert.equal(spearman([1, 2, 3, 4], [4, 3, 2, 1]), -1);
  assert.equal(spearman([1, 1, 2], [5, 6, 7]).toFixed(6), '0.866025');
  assert.equal(spearman([1, 1, 1], [1, 2, 3]), null);
  assert.equal(spearman([1, 2], [1, 2]), null);
  assert.throws(() => spearman([1], [1, 2]), /paired/);
});

test('the premise needs five cells across two breadth and two regret bins', () => {
  const regrets = [0, 0.02, 0.04, 0.07, 0.12];
  const spread = regrets.map((regret, index) => evaluation(`s${index}`, index % 2 ? 128 : 0, regret, 0.5, { target: 1000 + index * 100, harvest: regret }));
  const supported = summarizeRun([], spread, buildArchive(spread));
  assert.equal(supported.premise, 'SUPPORTED_AT_BOUNDED_SCOPE');
  assert.equal(supported.regretHarvestSpearman, 1);
  const four = spread.slice(0, 4);
  assert.equal(summarizeRun([], four, buildArchive(four)).premise, 'DISCONFIRMED_AT_BOUNDED_SCOPE');
  const flat = regrets.map((_, index) => evaluation(`f${index}`, [0, 1, 2, 4, 8][index], 0, 0.5, { target: 2000 + index * 100 }));
  const flatSummary = summarizeRun([], flat, buildArchive(flat));
  assert.equal(flatSummary.occupiedCells, 5);
  assert.equal(flatSummary.premise, 'DISCONFIRMED_AT_BOUNDED_SCOPE', 'one regret bin never supports the premise');
});
