// Experimental policy: preserve the shipped champion except when another
// route earns exactly the same immediate points and leaves a denser set of
// legal minimum-length continuations after the deterministic lookahead draw.
const { analyzeMove } = require('./bot');
const {
  generateRouteDiverseSupplement,
  routeSignature,
} = require('./route-diverse-challenger');
const { rankByContinuationDensity } = require('./continuation-density-probe');

const DIVERSITY_OPTIONS = Object.freeze({
  searchWidth: 384,
  supplementLimit: 128,
});

function mapSnapshotsToState(state, chain) {
  return chain.map(({ x, y }) => state.grid[y][x]);
}

function candidateFromDescription(state, candidate) {
  return {
    chain: mapSnapshotsToState(state, candidate.chain),
    points: candidate.immediatePoints,
  };
}

function preserveChampion(champion, championChain) {
  return {
    ...champion,
    selectedChain: championChain,
    championChain,
    densityApplied: false,
    championDensity: null,
    selectedDensity: null,
    selectedImmediatePoints: null,
  };
}

function analyzeContinuationDensityMove(state, options = {}) {
  const champion = analyzeMove(state, options);
  if (!champion.selectedChain) return preserveChampion(champion, null);

  const championChain = mapSnapshotsToState(state, champion.selectedChain);
  if (!options.lookaheadRngFactory
      || champion.reason === 'bomb-priority'
      || champion.reason === 'immediate-target-win') {
    return preserveChampion(champion, championChain);
  }

  const selected = champion.candidates.find(({ id }) => id === champion.selectedId);
  if (!selected) return preserveChampion(champion, championChain);

  const candidates = new Map();
  for (const described of champion.candidates) {
    if (described.immediatePoints !== selected.immediatePoints) continue;
    const candidate = candidateFromDescription(state, described);
    candidates.set(routeSignature(candidate.chain), candidate);
  }
  for (const candidate of generateRouteDiverseSupplement(
    state,
    { ...DIVERSITY_OPTIONS, ...options.diversity },
  )) {
    if (candidate.points !== selected.immediatePoints) continue;
    const signature = routeSignature(candidate.chain);
    if (!candidates.has(signature)) candidates.set(signature, candidate);
  }

  const ranked = rankByContinuationDensity(
    state,
    [...candidates.values()],
    options.lookaheadRngFactory,
  );
  const championSignature = routeSignature(championChain);
  const championResult = ranked.find(({ signature }) => signature === championSignature);
  const winner = ranked[0];
  const densityApplied = Boolean(
    winner
      && championResult
      && winner.signature !== championSignature
      && winner.density > championResult.density,
  );

  return {
    ...champion,
    selectedChain: densityApplied ? winner.chain : championChain,
    championChain,
    densityApplied,
    championDensity: championResult ? championResult.density : null,
    selectedDensity: densityApplied ? winner.density : championResult?.density ?? null,
    selectedImmediatePoints: selected.immediatePoints,
  };
}

function chooseContinuationDensityMove(state, options = {}) {
  return analyzeContinuationDensityMove(state, options).selectedChain;
}

module.exports = {
  DIVERSITY_OPTIONS,
  analyzeContinuationDensityMove,
  chooseContinuationDensityMove,
};
