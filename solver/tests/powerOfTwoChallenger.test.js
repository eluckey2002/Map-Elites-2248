const assert = require('node:assert/strict');
const test = require('node:test');
const { chainValue } = require('../engine');
const { choosePowerOfTwoMove } = require('../power-of-two-challenger');
const { comparePolicies } = require('../policy-lab');

function state(values, minChain = 2) {
  return { grid: [values.map((value, x) => value === null ? null : ({ x, y: 0, value, blocker: null, bombTimer: 0 }))], gridWidth: values.length, gridHeight: 1, minChain, tileScale: 1 };
}

test('chooses the highest-immediate-points legal chain with a power-of-two survivor', () => {
  const chain = choosePowerOfTwoMove(state([2, 2, null, 4, 4]));
  assert.deepEqual(chain.map(({ x }) => x), [3, 4]);
  assert.equal(chainValue(chain), 8);
});

test('does not hide a fallback when no legal power-of-two survivor exists', () => {
  assert.equal(choosePowerOfTwoMove(state([2, 2, 2], 3)), null);
});

test('policy lab records selected chains with their ending values for the already-opened Level 58 board', () => {
  const replay = comparePolicies(58, 42_000_001);
  assert.equal(replay.level, 58);
  assert.ok(replay.champion.moves.length > 0);
  for (const move of replay.powerOfTwo.moves) assert.equal(Number.isInteger(Math.log2(move.endingValue)), true);
});
