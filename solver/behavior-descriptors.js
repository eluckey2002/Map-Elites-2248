const { isMergeableSum } = require('./engine');

function boardFootprint(state) {
  let playableCells = 0;
  let occupiedPlayableCells = 0;
  let temporarilyBlockedCells = 0;

  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (tile?.blocker === 'stone') continue;
      playableCells += 1;
      if (tile) {
        occupiedPlayableCells += 1;
        if (tile.blocker === 'ice' || tile.blocker === 'lock') temporarilyBlockedCells += 1;
      }
    }
  }

  return { playableCells, occupiedPlayableCells, temporarilyBlockedCells };
}

function strandedCellPressure(state) {
  const { playableCells } = boardFootprint(state);
  if (playableCells === 0) return 0;

  let strandedCells = 0;
  const scale = state.tileScale || 1;
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (!tile || tile.blocker === 'stone') continue;
      if (!isMergeableSum(tile.value, scale)) strandedCells += 1;
    }
  }
  return strandedCells / playableCells;
}

function halfScoreMove(trace) {
  if (!trace.length) return null;
  const finalScore = trace.reduce((sum, move) => sum + move.scoreGain, 0);
  if (finalScore <= 0) return null;
  const threshold = finalScore / 2;
  let cumulative = 0;
  for (const move of trace) {
    cumulative += move.scoreGain;
    if (cumulative >= threshold) return move.moveNumber / trace.length;
  }
  throw new Error('half-score threshold was not reached by the final move');
}

function greedRatio(trace) {
  if (trace.some(({ greedDenominatorPoints }) => greedDenominatorPoints === null)) return null;
  const measured = trace.filter(({ greedDenominatorPoints }) => greedDenominatorPoints > 0);
  if (!measured.length) return null;
  return measured.reduce((sum, move) => (
    sum + move.scoreGain / move.greedDenominatorPoints
  ), 0) / measured.length;
}

const PER_GAME_DESCRIPTORS = Object.freeze({ halfScoreMove, greedRatio });

function captureGameMove({ moveNumber, scoreGain, strongestGreedyPoints }) {
  if (!Number.isInteger(moveNumber) || moveNumber < 1) throw new Error('moveNumber must be positive');
  if (!Number.isFinite(scoreGain) || scoreGain < 0) throw new Error('scoreGain must be non-negative');
  if (strongestGreedyPoints !== null
      && (!Number.isFinite(strongestGreedyPoints) || strongestGreedyPoints < 0)) {
    throw new Error('strongestGreedyPoints must be non-negative');
  }
  return {
    moveNumber,
    scoreGain,
    greedDenominatorPoints: strongestGreedyPoints === null
      ? null
      : Math.max(scoreGain, strongestGreedyPoints),
  };
}

function summarizeGameTrace(trace, descriptors = PER_GAME_DESCRIPTORS) {
  return Object.fromEntries(Object.entries(descriptors).map(([name, measure]) => [
    name,
    measure(trace),
  ]));
}

function createPerGameTotals(descriptors = PER_GAME_DESCRIPTORS) {
  return Object.fromEntries(Object.keys(descriptors).map((name) => [name, { count: 0, sum: 0 }]));
}

function addPerGameDescriptors(totals, values) {
  for (const [name, value] of Object.entries(values)) {
    if (value === null) continue;
    if (!Number.isFinite(value)) throw new Error(`${name} must be finite or null`);
    if (!totals[name]) totals[name] = { count: 0, sum: 0 };
    totals[name].count += 1;
    totals[name].sum += value;
  }
  return totals;
}

function summarizePerGameTotals(totals) {
  return Object.fromEntries(Object.entries(totals).map(([name, value]) => [
    name,
    value.count ? value.sum / value.count : null,
  ]));
}

const POST_MOVE_DESCRIPTORS = Object.freeze({ strandedCellPressure });

function capturePostMove(state, descriptors = POST_MOVE_DESCRIPTORS) {
  const descriptorValues = Object.fromEntries(
    Object.entries(descriptors).map(([name, measure]) => [name, measure(state)]),
  );
  return {
    moveNumber: state.moves,
    ...boardFootprint(state),
    descriptorValues,
  };
}

function createPostMoveTotals(descriptors = POST_MOVE_DESCRIPTORS) {
  return {
    observationCount: 0,
    descriptorSums: Object.fromEntries(Object.keys(descriptors).map((name) => [name, 0])),
  };
}

function addPostMoveTrace(totals, trace) {
  for (const observation of trace) {
    totals.observationCount += 1;
    for (const [name, value] of Object.entries(observation.descriptorValues)) {
      totals.descriptorSums[name] = (totals.descriptorSums[name] || 0) + value;
    }
  }
  return totals;
}

function summarizePostMoveTotals(totals) {
  return Object.fromEntries(Object.entries(totals.descriptorSums).map(([name, sum]) => [
    name,
    totals.observationCount ? sum / totals.observationCount : 0,
  ]));
}

function summarizePostMoveTrace(trace) {
  return summarizePostMoveTotals(addPostMoveTrace(createPostMoveTotals(), trace));
}

module.exports = {
  PER_GAME_DESCRIPTORS,
  POST_MOVE_DESCRIPTORS,
  addPerGameDescriptors,
  addPostMoveTrace,
  boardFootprint,
  captureGameMove,
  capturePostMove,
  createPerGameTotals,
  createPostMoveTotals,
  greedRatio,
  halfScoreMove,
  strandedCellPressure,
  summarizeGameTrace,
  summarizePerGameTotals,
  summarizePostMoveTotals,
  summarizePostMoveTrace,
};
