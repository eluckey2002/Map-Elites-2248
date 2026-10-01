const { chainValue, findTopChains, isMergeableSum } = require('./engine');

function choosePowerOfTwoMove(state) {
  const candidate = findTopChains(state).find(({ chain }) => (
    isMergeableSum(chainValue(chain), state.tileScale || 1)
  ));
  return candidate ? candidate.chain : null;
}

function analyzePowerOfTwoMove(state) {
  const candidates = findTopChains(state);
  const selected = candidates.find(({ chain }) => (
    isMergeableSum(chainValue(chain), state.tileScale || 1)
  ));
  return {
    reason: selected ? 'highest-immediate-points-with-power-of-two-survivor' : 'no-power-of-two-survivor-chain',
    candidateCount: candidates.length,
    qualifyingCount: candidates.filter(({ chain }) => isMergeableSum(chainValue(chain), state.tileScale || 1)).length,
    selectedChain: selected ? selected.chain : null,
  };
}

module.exports = { choosePowerOfTwoMove, analyzePowerOfTwoMove };
