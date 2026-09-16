const test = require('node:test');
const assert = require('node:assert/strict');

const { exactGreedDenominator } = require('../exact-greed-denominator');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

test('child-process exact denominator finds the hand-enumerated maximum within a deterministic work cap', () => {
  const state = {
    grid: [[tile(0, 0, 2), tile(1, 0, 2), tile(2, 0, 4), tile(3, 0, 8)]],
    gridWidth: 4,
    gridHeight: 1,
    minChain: 3,
  };
  assert.deepEqual(exactGreedDenominator(state, { maxPathStates: 100, timeoutMs: 1000 }), {
    standing: 'exact_result',
    maxPathStates: 100,
    timeoutMs: 1000,
    points: 24,
    legalChains: 2,
    visitedPathStates: 4,
  });
});

test('child-process work cap fails closed deterministically as UNKNOWN', () => {
  const grid = Array.from({ length: 8 }, (_, y) => Array.from({ length: 5 }, (_, x) => tile(x, y, 2)));
  const state = { grid, gridWidth: 5, gridHeight: 8, minChain: 3 };
  const options = { maxPathStates: 1000, timeoutMs: 1000 };
  const first = exactGreedDenominator(state, options);
  const second = exactGreedDenominator(state, options);

  assert.deepEqual(first, second);
  assert.deepEqual(first, {
    standing: 'UNKNOWN',
    reason: 'work-limit',
    maxPathStates: 1000,
    timeoutMs: 1000,
    visitedPathStates: 1000,
  });
});
