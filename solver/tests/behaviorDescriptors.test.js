const { test } = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_PARAMS } = require('../bot');
const {
  captureGameMove,
  greedRatio,
  halfScoreMove,
  strandedCellPressure,
  summarizeGameTrace,
} = require('../behavior-descriptors');
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

test('half-score move distinguishes early, steady, and late cash-in games', () => {
  assert.equal(halfScoreMove([
    { moveNumber: 1, scoreGain: 60 },
    { moveNumber: 2, scoreGain: 20 },
    { moveNumber: 3, scoreGain: 20 },
    { moveNumber: 4, scoreGain: 0 },
  ]), 1 / 4);
  assert.equal(halfScoreMove([
    { moveNumber: 1, scoreGain: 10 },
    { moveNumber: 2, scoreGain: 20 },
    { moveNumber: 3, scoreGain: 70 },
    { moveNumber: 4, scoreGain: 0 },
  ]), 3 / 4);
  assert.equal(halfScoreMove([]), null);
});

test('greed ratio averages per-move opportunity capture and bounds a denominator miss', () => {
  const trace = [
    captureGameMove({ moveNumber: 1, scoreGain: 20, strongestGreedyPoints: 100 }),
    captureGameMove({ moveNumber: 2, scoreGain: 80, strongestGreedyPoints: 40 }),
  ];
  assert.deepEqual(trace, [
    { moveNumber: 1, scoreGain: 20, greedDenominatorPoints: 100 },
    { moveNumber: 2, scoreGain: 80, greedDenominatorPoints: 80 },
  ]);
  assert.equal(greedRatio(trace), 0.6);
  assert.deepEqual(summarizeGameTrace(trace), { halfScoreMove: 1, greedRatio: 0.6 });
  assert.equal(greedRatio([
    ...trace,
    captureGameMove({ moveNumber: 3, scoreGain: 10, strongestGreedyPoints: null }),
  ]), null);
});

test('policy evaluation can collect the registered per-game measures through real play', () => {
  const result = playToBudget(OPEN_LEVEL, alwaysTwoRng, DEFAULT_PARAMS, {
    measureGameDescriptors: true,
  });
  assert.deepEqual(result.gameDescriptors, { halfScoreMove: 1, greedRatio: 1 });
  assert.equal(result.gameDescriptorTrace.length, 1);
});
