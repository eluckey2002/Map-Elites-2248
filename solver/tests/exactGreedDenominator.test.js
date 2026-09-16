const test = require('node:test');
const assert = require('node:assert/strict');

const { exactGreedDenominator } = require('../exact-greed-denominator');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

test('child-process exact denominator finds the hand-enumerated maximum', () => {
  const state = {
    grid: [[tile(0, 0, 2), tile(1, 0, 2), tile(2, 0, 4), tile(3, 0, 8)]],
    gridWidth: 4,
    gridHeight: 1,
    minChain: 3,
  };
  assert.deepEqual(exactGreedDenominator(state, { timeoutMs: 1000 }), {
    standing: 'exact_result',
    timeoutMs: 1000,
    points: 24,
    legalChains: 2,
  });
});

test('child-process timeout fails closed as UNKNOWN', () => {
  const grid = Array.from({ length: 8 }, (_, y) => Array.from({ length: 5 }, (_, x) => tile(x, y, 2)));
  const result = exactGreedDenominator({ grid, gridWidth: 5, gridHeight: 8, minChain: 3 }, { timeoutMs: 1 });
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.reason, 'timeout');
});
