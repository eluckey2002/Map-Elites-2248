const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_PARAMS } = require('../bot');
const { strandedCellPressure } = require('../behavior-descriptors');
const { playToBudget } = require('../policy-eval');

const OPEN_LEVEL = {
  level: 999,
  target: Infinity,
  tileScale: 1,
  moves: 1,
  minChain: 3,
  gridW: 2,
  gridH: 2,
  blockers: [],
};

const alwaysTwoRng = () => 0;

test('the real post-move seam distinguishes an open subject from its one-stone twin', () => {
  const open = playToBudget(OPEN_LEVEL, alwaysTwoRng, DEFAULT_PARAMS);
  const oneStone = playToBudget({
    ...OPEN_LEVEL,
    blockers: [{ type: 'stone', x: 1, y: 1 }],
  }, alwaysTwoRng, DEFAULT_PARAMS);

  assert.deepEqual(open.postMoveTrace, [{
    moveNumber: 1,
    playableCells: 4,
    occupiedPlayableCells: 4,
    temporarilyBlockedCells: 0,
    descriptorValues: { strandedCellPressure: 0 },
  }]);
  assert.deepEqual(oneStone.postMoveTrace, [{
    moveNumber: 1,
    playableCells: 3,
    occupiedPlayableCells: 3,
    temporarilyBlockedCells: 0,
    descriptorValues: { strandedCellPressure: 1 / 3 },
  }]);
});

test('the post-move seam observes temporary blockers after they tick', () => {
  const thawed = playToBudget({
    ...OPEN_LEVEL,
    blockers: [{ type: 'ice', x: 1, y: 1, duration: 1 }],
  }, alwaysTwoRng, DEFAULT_PARAMS);

  assert.deepEqual(thawed.postMoveTrace, [{
    moveNumber: 1,
    playableCells: 4,
    occupiedPlayableCells: 4,
    temporarilyBlockedCells: 0,
    descriptorValues: { strandedCellPressure: 1 / 4 },
  }]);
});

test('stranded-cell pressure uses the tile-scale lattice, not raw powers of two', () => {
  const state = {
    grid: [[{ value: 6, blocker: null }, { value: 9, blocker: null }]],
    gridWidth: 2,
    gridHeight: 1,
    tileScale: 3,
  };

  assert.equal(strandedCellPressure(state), 1 / 2);
});
