const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzeMergeSpread,
  coordinateSpan,
  measureWitness,
  replayMergeSpread,
} = require('../merge-spread-descriptors');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFrom(values, minChain = 2) {
  return {
    grid: values.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: values[0].length,
    gridHeight: values.length,
    score: 0,
    moves: 0,
    maxMoves: 8,
    targetScore: Number.MAX_SAFE_INTEGER,
    minChain,
    tileScale: 1,
  };
}

test('merge-depth control distinguishes a two-generation dependency', () => {
  const nested = measureWitness({
    state: stateFrom([[2, 2, 4, 4]]),
    spawnValues: [16, 16, 16, 16, 16, 16],
    witness: [[[0, 0], [1, 0]], [[1, 0], [2, 0]]],
  });
  const flat = measureWitness({
    state: stateFrom([[2, 2, 2]]),
    spawnValues: [16, 16, 16],
    witness: [[[0, 0], [1, 0], [2, 0]]],
  });
  assert.equal(nested.descriptors.peakMergeDepth, 2);
  assert.equal(flat.descriptors.peakMergeDepth, 1);
});

test('spatial-spread control distinguishes compact and board-wide chains', () => {
  const state = stateFrom(Array.from({ length: 4 }, () => Array(4).fill(2)), 3);
  assert.equal(coordinateSpan([[0, 0], [1, 0], [1, 1]], state).normalized, 1 / 3);
  assert.equal(coordinateSpan([[0, 0], [1, 1], [2, 2]], state).normalized, 2 / 3);
});

test('uniform scale preserves merge-depth and spatial-spread proxies', () => {
  const base = {
    level: 'scale-control', target: 90, moves: 5, minChain: 2,
    tileScale: 1, gridW: 5, gridH: 4, blockers: [],
  };
  const scaled = { ...base, level: 'scale-control-x32', target: 90 * 32, tileScale: 32 };
  const search = { width: 8, actionsPerState: 8, pathWidth: 1 };
  const first = analyzeMergeSpread({ level: base, seed: 9, search });
  const second = analyzeMergeSpread({ level: scaled, seed: 9, search });
  assert.equal(first.standing, 'replayed_witness_proxy');
  assert.deepEqual(first.descriptors, second.descriptors);
  assert.equal(replayMergeSpread(base, first), true);
});

test('bounded misses remain UNKNOWN and planted witnesses fail replay', () => {
  const level = {
    level: 'unknown-control', target: Number.MAX_SAFE_INTEGER, moves: 1, minChain: 3,
    tileScale: 1, gridW: 3, gridH: 3, blockers: [],
  };
  const result = analyzeMergeSpread({
    level, seed: 4, search: { width: 2, actionsPerState: 2, pathWidth: 1 },
  });
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.descriptors, null);
  const planted = structuredClone(result);
  planted.reference.witness = [[[99, 99]]];
  assert.throws(() => replayMergeSpread(level, planted), /unavailable tile/);
});
