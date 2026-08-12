const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState } = require('../engine');
const {
  enumerateLegalChains,
  solveExactPosition,
  enumerateRelaxedActions,
  makeFrozenSpawnValues,
} = require('../exact-score');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFromRows(rows, overrides = {}) {
  return {
    grid: rows.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: rows[0].length,
    gridHeight: rows.length,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 999,
    minChain: 4,
    ...overrides,
  };
}

test('position-aware exact search matches a hand-enumerated four-tile fixture', () => {
  // The only maximum path is 2 -> 2 -> 4 -> 4: sum 12, four-tile multiplier
  // 1.5, so 18 points. This fixture has no second move or spawn dependency.
  const state = stateFromRows([[2, 2, 4, 4]]);
  const result = solveExactPosition(state, { spawnValues: [2, 2, 2] });

  assert.equal(result.complete, true);
  assert.equal(result.score, 18);
  assert.deepEqual(result.actions, [[[0, 0], [1, 0], [2, 0], [3, 0]]]);
});

test('position-aware enumerator keeps distinct survivor actions with equal scores', () => {
  const state = stateFromRows([[2, 2, 2, 2]]);
  const actions = enumerateLegalChains(state);

  // The two directed paths share the same immediate score but leave different
  // survivor positions, which an exact board search must not collapse.
  assert.equal(actions.length, 2);
});

test('position-aware enumerator keeps visited cells distinct above the 32-bit boundary', () => {
  const grid = Array.from({ length: 8 }, (_, y) => Array.from({ length: 5 }, (_, x) => null));
  for (let x = 0; x < 4; x++) grid[7][x] = tile(x, 7, x < 2 ? 2 : 4);
  const state = {
    grid,
    gridWidth: 5,
    gridHeight: 8,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 999,
    minChain: 4,
  };

  const actions = enumerateLegalChains(state);
  assert.equal(actions.length, 1);
  assert.deepEqual(actions[0].map((entry) => [entry.x, entry.y]), [[0, 7], [1, 7], [2, 7], [3, 7]]);
});

test('value-relaxed action enumerator includes the hand-enumerated maximum', () => {
  const actions = enumerateRelaxedActions(new Map([[2, 2], [4, 2]]), 4);
  const best = Math.max(...actions.map((action) => action.points));

  assert.equal(best, 18);
});

// The frozen seed-0 study was run on Level 26 as it stood before the 2026-08-12
// retune, at tile scale 1. Pinning the scale here keeps this fixture testing the
// board it was computed from; letting it follow the shipped level would silently
// re-denominate a frozen hash and every score derived from it.
const FROZEN_LEVEL_26 = () => ({ ...LEVELS.find((entry) => entry.level === 26), tileScale: 1 });

test('Level 26 seed-0 values match the durable certifier frozen hash', () => {
  const level = FROZEN_LEVEL_26();
  const state = createLevelState(level, makeRng(0));
  const initial = state.grid.flat().map((entry) => entry.value);
  const spawns = makeFrozenSpawnValues(level, 0);
  const hash = createHash('sha256').update(Buffer.from([...initial, ...spawns])).digest('hex');

  assert.equal(hash, 'edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880');
});
