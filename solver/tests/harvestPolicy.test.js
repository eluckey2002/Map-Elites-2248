const test = require('node:test');
const assert = require('node:assert/strict');

const { harvestableMass, rankState } = require('../oracle/harvest-policy');
const { RANKERS } = require('../oracle/rankers');
const { search, searchPortfolio } = require('../oracle/search');

function state(values, score = 0) {
  return {
    score,
    grid: [values.map((value, x) => value === null ? null : ({ x, y: 0, value, blocker: null }))],
  };
}

test('harvest policy favors mutually harvestable mass without mutating state', () => {
  const compatible = state([64, 64, 128, 4096], 100);
  const isolated = state([4096], 100);
  const before = structuredClone(compatible);

  assert.ok(Number.isFinite(harvestableMass(compatible)));
  assert.ok(rankState(compatible) > rankState(isolated));
  assert.deepEqual(compatible, before);
});

test('the public ranker registry exposes stable immediate-score and harvesting arms', () => {
  const compatible = state([64, 64, 128, 4096], 100);
  assert.deepEqual(Object.keys(RANKERS), ['immediate-score', 'harvesting']);
  assert.equal(RANKERS['immediate-score'](compatible), 100);
  assert.equal(RANKERS.harvesting(compatible), rankState(compatible));
});

test('portfolio keeps the shortest independently verified witness across identical arm bounds', () => {
  const input = { level: { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 4, tileScale: 1, blockers: [] }, seed: 7 };
  const calls = [];
  const witnesses = {
    'immediate-score': { movesUsed: 2, chains: [], trace: [] },
    harvesting: { movesUsed: 1, chains: [], trace: [] },
  };
  const result = searchPortfolio(
    { ...input, budgetMs: 500, maxExpandedStates: 17, includeBaseline: false },
    () => {},
    {
      searchFn(options) {
        const name = Object.entries(RANKERS).find(([, ranker]) => ranker === options.rankStateFn)[0];
        calls.push({ name, budgetMs: options.budgetMs, maxExpandedStates: options.maxExpandedStates });
        return { best: witnesses[name], standing: 'best-known' };
      },
      verifyWitnessFn(_input, candidate) {
        assert.ok(candidate === witnesses['immediate-score'] || candidate === witnesses.harvesting);
        return { outcome: 'win' };
      },
    },
  );
  assert.deepEqual(calls, [
    { name: 'immediate-score', budgetMs: 500, maxExpandedStates: 17 },
    { name: 'harvesting', budgetMs: 500, maxExpandedStates: 17 },
  ]);
  assert.equal(result.best, witnesses.harvesting);
  assert.equal(result.selectedArm, 'harvesting');
});

test('a bounded UNKNOWN arm cannot erase another arm\'s verified witness', () => {
  const input = { level: { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 4, tileScale: 1, blockers: [] }, seed: 7 };
  const valid = { movesUsed: 2, chains: [], trace: [] };
  const result = searchPortfolio(input, () => {}, {
    searchFn(options) {
      return options.rankStateFn === RANKERS['immediate-score']
        ? { best: valid, standing: 'best-known' }
        : { best: null, standing: 'UNKNOWN', terminationReason: 'work-budget' };
    },
    verifyWitnessFn(_input, candidate) {
      assert.equal(candidate, valid);
      return { outcome: 'win' };
    },
  });
  assert.equal(result.best, valid);
  assert.equal(result.selectedArm, 'immediate-score');
  assert.equal(result.arms.harvesting.standing, 'UNKNOWN');
});

test('deterministic work cap stops search without claiming impossibility', () => {
  const level = { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 1000, tileScale: 1, blockers: [] };
  const result = search({ level, seed: 7, budgetMs: 30000, maxExpandedStates: 1, includeBaseline: false });
  assert.equal(result.stats.expandedStates, 1);
  assert.equal(result.terminationReason, 'work-budget');
  assert.equal(result.standing, 'UNKNOWN');
});
