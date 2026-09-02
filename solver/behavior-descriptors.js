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
  POST_MOVE_DESCRIPTORS,
  addPostMoveTrace,
  boardFootprint,
  capturePostMove,
  createPostMoveTotals,
  strandedCellPressure,
  summarizePostMoveTotals,
  summarizePostMoveTrace,
};
