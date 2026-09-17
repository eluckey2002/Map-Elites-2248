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
    if (count > 1 || counts.has(value / 2) || counts.has(value * 2)) {
      // Weight by value magnitude (large tiles matter more than small)
      const valueWeight = Math.max(1, Math.log2(value) / 5);

      // Exact pairs unlock merges immediately (worth more)
      let pairBonus = count > 1 ? 1.5 : 1.0;

      // Bonus for ladder chains: tiles part of sequences like 2→4→8→16
      let ladderBonus = 1.0;
      if (counts.has(value / 2)) {
        let chainDepth = 0;
        let v = value;
        while (counts.has(v)) { chainDepth++; v *= 2; }
        ladderBonus = chainDepth > 1 ? 1.0 + (chainDepth - 1) * 0.18 : 1.0;
      }

      result += value * count * valueWeight * pairBonus * ladderBonus;
    }
  }
  return result;
}

function rankState(state, { potentialWeight = 1.3 } = {}) {
  // Balance immediate progress against chain setup
  return state.score * 0.75 + potentialWeight * harvestableMass(state);
}

module.exports = { harvestableMass, rankState };
