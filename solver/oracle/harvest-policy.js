const { isBlockedTile } = require('../engine');

// This is the only module the harvesting-policy optimizer may change. It ranks
// already-generated legal successor states; it cannot change rules, invent
// moves, alter the seeded stream, or bypass replay verification.
function harvestableMass(state) {
  const counts = new Map();
  for (const tile of state.grid.flat()) {
    if (tile && !isBlockedTile(tile)) counts.set(tile.value, (counts.get(tile.value) || 0) + 1);
  }
  let result = 0;
  for (const [value, count] of counts) {
    if (count > 1 || counts.has(value / 2) || counts.has(value * 2)) result += value * count;
  }
  return result;
}

function rankState(state, { potentialWeight = 1 } = {}) {
  return state.score + potentialWeight * harvestableMass(state);
}

module.exports = { harvestableMass, rankState };
