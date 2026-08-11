const { test } = require('node:test');
const assert = require('node:assert/strict');

const { runFixture, replayFixture } = require('./cli');
const { verifyResult } = require('./verify');

test('fixture mode recovers the known 18-point optimum', () => {
  const result = runFixture();
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.recoveredScore, 18);
  assert.equal(result.replay.moves, 1);
  assert.equal(result.replay.cursor, 3);
});

test('fixture replay rejects a malformed repeated-cell candidate', () => {
  const state = {
    grid: [[2, 2, 4, 4].map((value, x) => ({
      x, y: 0, value, blocker: null, blockerDuration: 0, bombTimer: 0,
    }))],
    gridWidth: 4,
    gridHeight: 1,
    minChain: 4,
  };
  assert.throws(
    () => replayFixture(state, [[[0, 0], [1, 0], [1, 0], [3, 0]]], [2, 4, 8]),
    /reuses a tile/,
  );
});

test('frozen result verifier rejects a malformed repeated-cell witness', () => {
  const result = {
    level: 26,
    seed: 0,
    target: 13000,
    inputIdentity: 'edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880',
    scoreClaim: 0,
    targetReached: false,
    replay: { moves: 1, cursor: 3 },
    witness: [[[0, 0], [0, 0], [1, 0], [1, 1]]],
  };
  assert.throws(() => verifyResult(result), /reuses a tile/);
});
