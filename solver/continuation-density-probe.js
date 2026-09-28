// Experimental diagnostic only. This measures how many legal minimum-length
// continuations an afterstate preserves; it is not the shipped policy.
const {
  applyGravity,
  canExtendChain,
  cloneState,
  executeChain,
  isBlockedTile,
  spawnNewTiles,
} = require('./engine');
const { routeSignature } = require('./route-diverse-challenger');

function neighbors(state, tile) {
  const result = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const candidate = state.grid[tile.y + dy]?.[tile.x + dx];
      if (candidate && !isBlockedTile(candidate)) result.push(candidate);
    }
  }
  return result;
}

// A continuation is a legal three-tile prefix: an equal opening pair followed
// by an equal-or-double extension. Dividing by the number of tiles that can
// open at least one such prefix distinguishes concentrated branching from a
// board that merely has many tiles.
function continuationDensity(state) {
  const openers = new Set();
  let continuations = 0;

  for (const first of state.grid.flat()) {
    if (!first || isBlockedTile(first)) continue;
    for (const second of neighbors(state, first)) {
      if (second.value !== first.value) continue;
      for (const third of neighbors(state, second)) {
        if (third === first || !canExtendChain([first, second], third)) continue;
        continuations += 1;
        openers.add(first);
      }
    }
  }

  const usableOpeners = openers.size;
  return {
    usableOpeners,
    continuations,
    density: usableOpeners ? continuations / usableOpeners : 0,
  };
}

function simulateAfterstate(state, candidate, lookaheadRngFactory) {
  if (typeof lookaheadRngFactory !== 'function') {
    throw new TypeError('lookaheadRngFactory must be a function');
  }
  const simulated = cloneState(state);
  const chain = candidate.chain.map(({ x, y }) => simulated.grid[y][x]);
  executeChain(simulated, chain);
  applyGravity(simulated);
  spawnNewTiles(simulated, lookaheadRngFactory());
  return simulated;
}

// Preserve immediate-score ordering, then use continuation density only to
// distinguish routes that earned the same points now. This makes the probe's
// tradeoff explicit and avoids inventing a tuned conversion into score points.
function rankByContinuationDensity(state, candidates, lookaheadRngFactory) {
  return candidates.map((candidate) => {
    const afterstate = simulateAfterstate(state, candidate, lookaheadRngFactory);
    const signal = continuationDensity(afterstate);
    return {
      ...candidate,
      signature: routeSignature(candidate.chain),
      ...signal,
    };
  }).sort((left, right) => (
    right.points - left.points
    || right.density - left.density
    || left.signature.localeCompare(right.signature)
  ));
}

module.exports = {
  continuationDensity,
  rankByContinuationDensity,
  simulateAfterstate,
};
