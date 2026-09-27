const test = require('node:test');
const assert = require('node:assert/strict');

const { harvestableMass, rankState } = require('../oracle/harvest-policy');
const { search } = require('../oracle/search');

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

test('deterministic work cap stops search without claiming impossibility', () => {
  const level = { gridW: 2, gridH: 2, moves: 3, minChain: 2, target: 1000, tileScale: 1, blockers: [] };
  const result = search({ level, seed: 7, budgetMs: 30000, maxExpandedStates: 1, includeBaseline: false });
  assert.equal(result.stats.expandedStates, 1);
  assert.equal(result.terminationReason, 'work-budget');
  assert.equal(result.standing, 'UNKNOWN');
});
