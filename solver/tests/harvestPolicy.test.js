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
  assert.equal(
    RANKERS.harvesting(compatible, { potentialWeight: 4 }),
    rankState(compatible, { potentialWeight: 4 }),
  );
});

test('portfolio keeps the shortest independently verified witness across identical arm bounds', () => {
  const input = { level: { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 4, tileScale: 1, blockers: [] }, seed: 7 };
  const calls = [];
  const verified = [];
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
        const { rankStateFn, ...shared } = options;
        calls.push({ name, shared });
        return { best: witnesses[name], standing: 'best-known' };
      },
      verifyWitnessFn(actualInput, candidate) {
        assert.deepEqual(actualInput, input);
        assert.ok(candidate === witnesses['immediate-score'] || candidate === witnesses.harvesting);
        verified.push(candidate);
        return { outcome: 'win' };
      },
    },
  );
  assert.deepEqual(calls, [
    { name: 'immediate-score', shared: { ...input, budgetMs: 500, maxExpandedStates: 17, includeBaseline: false } },
    { name: 'harvesting', shared: { ...input, budgetMs: 500, maxExpandedStates: 17, includeBaseline: false } },
  ]);
  assert.deepEqual(verified, [witnesses['immediate-score'], witnesses.harvesting]);
  assert.equal(result.best, witnesses.harvesting);
  assert.equal(result.selectedArm, 'harvesting');
});

test('portfolio rejects an invalid shorter witness instead of selecting it', () => {
  const input = { level: { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 4, tileScale: 1, blockers: [] }, seed: 7 };
  const longer = { movesUsed: 2, chains: [], trace: [] };
  const invalidShorter = { movesUsed: 1, chains: [], trace: [] };
  const result = searchPortfolio(input, () => {}, {
    searchFn(options) {
      return {
        best: options.rankStateFn === RANKERS['immediate-score'] ? longer : invalidShorter,
        standing: 'best-known',
      };
    },
    verifyWitnessFn(_input, candidate) {
      if (candidate === invalidShorter) throw new Error('planted invalid witness');
      return { outcome: 'win' };
    },
  });
  assert.equal(result.best, longer);
  assert.equal(result.selectedArm, 'immediate-score');
  assert.equal(result.arms.harvesting.standing, 'INVALID');
  assert.match(result.arms.harvesting.verificationError, /planted invalid witness/);
});

test('both named rankers evaluate the same fixed puzzle under the same deterministic work cap', () => {
  const level = { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 1000, tileScale: 1, blockers: [] };
  const result = searchPortfolio({
    level,
    seed: 7,
    budgetMs: 30000,
    maxExpandedStates: 17,
    includeBaseline: false,
  });
  assert.deepEqual(Object.keys(result.arms), ['immediate-score', 'harvesting']);
  for (const arm of Object.values(result.arms)) {
    assert.equal(arm.stats.expandedStates, 17);
    assert.equal(arm.terminationReason, 'work-budget');
    assert.equal(arm.standing, 'UNKNOWN');
  }
  assert.equal(result.arms['immediate-score'].stats.generatedActions, result.arms.harvesting.stats.generatedActions);
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
