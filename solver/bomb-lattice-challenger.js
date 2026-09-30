// Experimental policy: preserve the current champion except when its
// bomb-priority override has a mergeable alternative that reaches the same
// earliest bomb within the shipped bomb-search bound.
const { chainValue, findTopChains, isMergeableSum } = require('./engine');
const { chooseMove, DEFAULT_PARAMS } = require('./bot');

function earliestBomb(state) {
  let selected = null;
  for (const row of state.grid) {
    for (const tile of row) {
      if (tile?.blocker !== 'bomb') continue;
      if (!selected || tile.bombTimer < selected.bombTimer) selected = tile;
    }
  }
  return selected;
}

function bestMergeableBombChain(state, params = DEFAULT_PARAMS) {
  const bomb = earliestBomb(state);
  if (!bomb) return null;
  const resolved = { ...DEFAULT_PARAMS, ...params };
  const candidates = findTopChains(state, {
    mustEndAt: bomb,
    maxLength: resolved.bombMax,
  });
  return candidates.find(({ chain }) => isMergeableSum(
    chainValue(chain),
    state.tileScale || 1,
  ))?.chain || null;
}

function chooseBombLatticeMove(state, options = {}) {
  const champion = chooseMove(state, options);
  if (!champion) return null;
  return bestMergeableBombChain(state, options.params) || champion;
}

module.exports = { earliestBomb, bestMergeableBombChain, chooseBombLatticeMove };
