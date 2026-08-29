const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  describeChainFeedback,
} = require('../../src/game.js');

test('live chain feedback explains exact on-lattice outcomes without judging the choice', () => {
  assert.deepEqual(describeChainFeedback([8, 8, 16], 3, 1), {
    values: [8, 8, 16],
    resultTile: 32,
    multiplier: 1.5,
    projectedPoints: 48,
    ready: true,
    futureMatchability: 'matchable',
  });

  assert.deepEqual(describeChainFeedback([2, 2, 4, 4, 4, 8, 8], 4, 1), {
    values: [2, 2, 4, 4, 4, 8, 8],
    resultTile: 32,
    multiplier: 3,
    projectedPoints: 96,
    ready: true,
    futureMatchability: 'matchable',
  });
});

test('live chain feedback names an off-lattice result neutrally', () => {
  assert.deepEqual(describeChainFeedback([2, 2, 4, 4], 4, 1), {
    values: [2, 2, 4, 4],
    resultTile: 12,
    multiplier: 1.5,
    projectedPoints: 18,
    ready: true,
    futureMatchability: 'off-lattice',
  });
});
