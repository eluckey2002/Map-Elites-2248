const { test } = require('node:test');
const assert = require('node:assert/strict');

const { describeWitnessSet, searchWitnessSet } = require('../forced-diversity-descriptors');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFrom(values, target = 4, maxMoves = 1) {
  return {
    grid: values.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: values[0].length, gridHeight: values.length,
    score: 0, moves: 0, maxMoves, targetScore: target, minChain: 2, tileScale: 1,
  };
}

test('linear and branching controls separate both bounded proxies', () => {
  const linear = searchWitnessSet({
    state: stateFrom([[2, 2, 4]], 12, 2), spawnValues: [16, 16, 16, 16],
    width: 8, actionsPerState: 8, pathWidth: 1, successCap: 16,
  });
  const branching = searchWitnessSet({
    state: stateFrom([[2, 2, 8, 2, 2]]), spawnValues: [16, 16, 16, 16],
    width: 8, actionsPerState: 8, pathWidth: 1, successCap: 16,
  });
  const first = describeWitnessSet(linear.successes).descriptors;
  const second = describeWitnessSet(branching.successes).descriptors;
  assert.equal(first.forcedPrefixRatio, 1);
  assert.equal(first.distinctOpeningMoves, 1);
  assert.equal(second.forcedPrefixRatio, 0);
  assert.equal(second.distinctOpeningMoves, 4);
});

test('bounded misses remain UNKNOWN at the consumer boundary', () => {
  const result = searchWitnessSet({
    state: stateFrom([[2, 2, 8]], Number.MAX_SAFE_INTEGER), spawnValues: [16, 16],
    width: 1, actionsPerState: 1, pathWidth: 1, successCap: 1,
  });
  assert.equal(describeWitnessSet(result.successes), null);
});
