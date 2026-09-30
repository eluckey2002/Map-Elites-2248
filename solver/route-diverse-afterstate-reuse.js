// Experimental scorer variant. It intentionally leaves the frozen
// route-diverse module unchanged because RESULT-0057 records that module's
// source identity. This candidate may be qualified, but is not the champion.
const {
  applyGravity,
  checkBombs,
  cloneState,
  executeChain,
  findBestChain,
  findGreedyChains,
  spawnNewTiles,
} = require('./engine');
const { analyzeMove, DEFAULT_PARAMS, harvestValue } = require('./bot');
const {
  generateRouteDiverseSupplement,
  routeSignature,
} = require('./route-diverse-challenger');

function mapChainToClone(chain, cloned) {
  return chain.map(({ x, y }) => cloned.grid[y][x]);
}

function simulateCandidate(state, candidate, lookaheadRngFactory) {
  const sim = cloneState(state);
  const chain = mapChainToClone(candidate.chain, sim);
  const survivor = chain[chain.length - 1];
  executeChain(sim, chain);
  applyGravity(sim);
  spawnNewTiles(sim, lookaheadRngFactory());
  return { sim, survivor };
}

function afterstateKey({ sim, survivor }) {
  return JSON.stringify({
    survivor: [survivor.x, survivor.y, survivor.value, survivor.blocker, survivor.blockerDuration, survivor.bombTimer],
    grid: sim.grid.map((row) => row.map((tile) => (tile ? [
      tile.value, tile.blocker, tile.blockerDuration, tile.bombTimer,
    ] : null))),
  });
}

function afterstateFeatures(outcome, params) {
  const exploded = checkBombs(outcome.sim);
  const next = exploded ? null : findGreedyChains(outcome.sim, {
    limit: 1,
    tieBreak: params.tieBreak,
    pathWidth: params.pathWidth,
  })[0];
  const placement = exploded ? 0 : (findBestChain(outcome.sim, {
    mustStartAt: outcome.survivor,
    maxLength: outcome.sim.minChain,
  })?.points || 0);
  return {
    rollout: next ? next.points : 0,
    placement,
    harvest: harvestValue(outcome.sim, outcome.survivor),
  };
}

function composeScore(state, candidate, features, params) {
  const turnover = (state.tileScale || 1) * (candidate.chain.length - 1);
  return candidate.points
    + (params.wRoll * features.rollout)
    + (params.wPlace * features.placement)
    + (params.turnover * turnover)
    + (params.wHarvest * features.harvest);
}

function scoreSupplementCandidates(state, candidates, lookaheadRngFactory, params) {
  if (!lookaheadRngFactory) {
    return {
      candidates: candidates.map((candidate) => ({ ...candidate, policyScore: candidate.points })),
      cacheEntries: 0,
      cacheHits: 0,
    };
  }
  const cache = new Map();
  let cacheHits = 0;
  const scored = candidates.map((candidate) => {
    const outcome = simulateCandidate(state, candidate, lookaheadRngFactory);
    const key = afterstateKey(outcome);
    let features = cache.get(key);
    if (features) cacheHits += 1;
    else {
      features = afterstateFeatures(outcome, params);
      cache.set(key, features);
    }
    return { ...candidate, policyScore: composeScore(state, candidate, features, params) };
  });
  return { candidates: scored, cacheEntries: cache.size, cacheHits };
}

function mapSnapshotsToState(state, chain) {
  return chain.map(({ x, y }) => state.grid[y][x]);
}

function analyzeRouteDiverseMoveWithAfterstateReuse(state, options = {}) {
  const champion = analyzeMove(state, options);
  if (!champion.selectedChain) return { ...champion, championChain: null, supplement: [], supplementWon: false };
  const championChain = mapSnapshotsToState(state, champion.selectedChain);
  if (champion.reason === 'bomb-priority' || champion.reason === 'immediate-target-win') {
    return { ...champion, selectedChain: championChain, championChain, supplement: [], supplementWon: false };
  }
  const params = { ...DEFAULT_PARAMS, ...options.params };
  const existing = new Set(champion.candidates.map(({ chain }) => routeSignature(chain)));
  const pending = generateRouteDiverseSupplement(state, options.diversity).flatMap((candidate) => {
    const signature = routeSignature(candidate.chain);
    return existing.has(signature) ? [] : [{ ...candidate, signature }];
  });
  const { candidates: supplement, cacheEntries, cacheHits } = scoreSupplementCandidates(
    state, pending, options.lookaheadRngFactory, params,
  );
  const selectedChampion = champion.candidates.find(({ id }) => id === champion.selectedId);
  const winner = supplement.reduce((best, candidate) => (
    !best || candidate.policyScore > best.policyScore ? candidate : best
  ), null);
  const supplementWon = Boolean(winner && selectedChampion && winner.policyScore > selectedChampion.policyScore);
  return {
    ...champion,
    selectedChain: supplementWon ? winner.chain : championChain,
    championChain,
    supplement,
    supplementWon,
    selectedSupplementSignature: supplementWon ? winner.signature : null,
    cacheEntries,
    cacheHits,
  };
}

module.exports = {
  afterstateKey,
  analyzeRouteDiverseMoveWithAfterstateReuse,
  scoreSupplementCandidates,
};
