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
  renderMapHtml,
  summarizeBreadth,
} = require('../board-map-elites-core');

function candidate(name, target = 1000) {
  return {
    schemaVersion: 1, name, level: 56, target, tileScale: 32,
    moves: 20, minChain: 3, gridW: 5, gridH: 6, blockers: [],
    sourceShapeIdentity: 'a'.repeat(64),
  };
}

function evaluation(name, breadth, harvest, winRate, overrides = {}) {
  const board = candidate(name, overrides.target || 1000);
  return {
    eligible: true,
    candidate: board,
    boardIdentity: boardIdentity(board),
    quality: { winRate },
    descriptors: {
      breadth: { standing: 'replayed_lower_bound', value: breadth, bin: breadthBin(breadth) },
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
  assert.equal(archive.get('3,3').length, 3);
  assert.deepEqual(archive.get('3,3').map(({ quality }) => quality.winRate), [0.2, 0.4, 0.4]);
  const expectedTieOrder = entries.slice(1, 3).sort((a, b) => a.boardIdentity.localeCompare(b.boardIdentity));
  assert.deepEqual(archive.get('3,3').slice(1).map(({ boardIdentity: id }) => id), expectedTieOrder.map(({ boardIdentity: id }) => id));
});

test('a cosmetic rename is the same board and cannot consume another slot', () => {
  const original = evaluation('original', 4, 0, 0.4);
  const renamed = { ...original, candidate: { ...original.candidate, name: 'renamed' } };
  assert.equal(boardIdentity(original.candidate), boardIdentity(renamed.candidate));
  const archive = new Map();
  assert.equal(placeElite(archive, original).admitted, true);
  assert.deepEqual(placeElite(archive, renamed), { admitted: false, reason: 'duplicate-board', cell: '3,3' });
  assert.equal(archive.get('3,3').length, 1);
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
  assert.match(html, /data-cell="3,3"/);
  assert.match(html, /#3/);
  assert.match(html, />Empty</);
});
