// Experimental challenger: keep the shipped champion intact, then offer its
// scorer a small set of mergeable routes with different survivors/afterstates.
const {
  applyGravity,
  canExtendChain,
  chainMultiplier,
  checkBombs,
  cloneState,
  executeChain,
  findGreedyChains,
  isBlockedTile,
  isMergeableSum,
  spawnNewTiles,
} = require('./engine');
const {
  analyzeMove,
  DEFAULT_PARAMS,
  harvestValue,
  remnantPlacementValue,
} = require('./bot');

const SEARCH_WIDTH = 512;
const SUPPLEMENT_LIMIT = 128;

function chainKey(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function endpointKey(chain) {
  const survivor = chain[chain.length - 1];
  return `${survivor.x},${survivor.y}`;
}

// Routes with the same survivor and cleared cells produce the same pre-gravity
// afterstate, regardless of the order used to traverse those cells.
function routeSignature(chain) {
  const survivor = chain[chain.length - 1];
  const cleared = chain
    .slice(0, -1)
    .map(({ x, y }) => `${x},${y}`)
    .sort()
    .join(';');
  return `${survivor.x},${survivor.y}|${cleared}`;
}

function legalExtensions(state, path) {
  const last = path.chain[path.chain.length - 1];
  const extensions = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const x = last.x + dx;
      const y = last.y + dy;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
      const tile = state.grid[y][x];
      if (!tile || isBlockedTile(tile) || path.visited.has(tile)) continue;
      if (canExtendChain(path.chain, tile)) extensions.push(tile);
    }
  }
  return extensions;
}

function pathRank(left, right) {
  if (left.potential !== right.potential) return right.potential - left.potential;
  if (left.points !== right.points) return right.points - left.points;
  if (left.chain.length !== right.chain.length) return right.chain.length - left.chain.length;
  return chainKey(left.chain).localeCompare(chainKey(right.chain));
}

function retainDiverseFrontier(expanded, limit) {
  const ranked = expanded.slice().sort(pathRank);
  const retained = [];
  const byEndpoint = new Map();
  for (const path of ranked) {
    const endpoint = endpointKey(path.chain);
    if (!byEndpoint.has(endpoint)) byEndpoint.set(endpoint, []);
    byEndpoint.get(endpoint).push(path);
  }

  // Round-robin across endpoints. A single global potential ordering is the
  // failure under test: it can spend the whole beam on many near-identical
  // routes and erase a geometrically different route before scoring sees it.
  const groups = [...byEndpoint.values()].sort((left, right) => pathRank(left[0], right[0]));
  const seenPatterns = new Set();
  for (let rank = 0; retained.length < limit; rank += 1) {
    let added = false;
    for (const group of groups) {
      const path = group[rank];
      if (!path) continue;
      const signature = routeSignature(path.chain);
      if (seenPatterns.has(signature)) continue;
      seenPatterns.add(signature);
      retained.push(path);
      added = true;
      if (retained.length >= limit) break;
    }
    if (!added) break;
  }
  return retained;
}

function selectSupplement(candidates, limit) {
  const ranked = [...candidates.values()].sort((left, right) => {
    if (left.points !== right.points) return right.points - left.points;
    if (left.chain.length !== right.chain.length) return right.chain.length - left.chain.length;
    return chainKey(left.chain).localeCompare(chainKey(right.chain));
  });
  const selected = [];
  const selectedSignatures = new Set();
  const endpointRepresentatives = new Map();

  for (const candidate of ranked) {
    const endpoint = endpointKey(candidate.chain);
    if (!endpointRepresentatives.has(endpoint)) endpointRepresentatives.set(endpoint, candidate);
  }
  for (const candidate of [...endpointRepresentatives.values()].sort((a, b) => b.points - a.points)) {
    if (selected.length >= limit) break;
    const signature = routeSignature(candidate.chain);
    selected.push(candidate);
    selectedSignatures.add(signature);
  }
  for (const candidate of ranked) {
    if (selected.length >= limit) break;
    const signature = routeSignature(candidate.chain);
    if (selectedSignatures.has(signature)) continue;
    selected.push(candidate);
    selectedSignatures.add(signature);
  }
  return selected;
}

function generateRouteDiverseSupplement(state, {
  searchWidth = SEARCH_WIDTH,
  supplementLimit = SUPPLEMENT_LIMIT,
} = {}) {
  let frontier = [];
  for (let y = 0; y < state.gridHeight; y += 1) {
    for (let x = 0; x < state.gridWidth; x += 1) {
      const tile = state.grid[y][x];
      if (!tile || isBlockedTile(tile)) continue;
      frontier.push({
        chain: [tile],
        visited: new Set([tile]),
        sum: tile.value,
        points: 0,
        potential: tile.value,
      });
    }
  }

  const candidates = new Map();
  const maxLength = frontier.length;
  for (let depth = 1; depth < maxLength && frontier.length; depth += 1) {
    const expanded = [];
    for (const path of frontier) {
      const extensions = legalExtensions(state, path);
      if (!extensions.length) continue;
      const lowestValue = Math.min(...extensions.map(({ value }) => value));
      for (const tile of extensions) {
        const closesMergeablePrefix = path.chain.length + 1 >= state.minChain
          && isMergeableSum(path.sum + tile.value, state.tileScale || 1);
        if (tile.value !== lowestValue && !closesMergeablePrefix) continue;
        const chain = [...path.chain, tile];
        const visited = new Set(path.visited);
        visited.add(tile);
        const sum = path.sum + tile.value;
        const points = Math.floor(sum * chainMultiplier(chain.length));
        const nextPath = { chain, visited, sum, points, potential: points };
        const onward = legalExtensions(state, nextPath);
        nextPath.potential += onward.reduce((total, candidate) => total + candidate.value, 0);
        expanded.push(nextPath);

        if (chain.length >= state.minChain && isMergeableSum(sum, state.tileScale || 1)) {
          const signature = routeSignature(chain);
          if (!candidates.has(signature)) candidates.set(signature, { chain, points });
        }
      }
    }
    frontier = retainDiverseFrontier(expanded, searchWidth);
  }

  return selectSupplement(candidates, supplementLimit);
}

function mapChainToClone(chain, cloned) {
  return chain.map(({ x, y }) => cloned.grid[y][x]);
}

function scoreSupplementCandidate(state, candidate, lookaheadRngFactory, params) {
  if (!lookaheadRngFactory) return candidate.points;
  const sim = cloneState(state);
  const mapped = mapChainToClone(candidate.chain, sim);
  const survivor = mapped[mapped.length - 1];
  executeChain(sim, mapped);
  applyGravity(sim);
  spawnNewTiles(sim, lookaheadRngFactory());
  const exploded = checkBombs(sim);
  const next = exploded ? null : findGreedyChains(sim, {
    limit: 1,
    tieBreak: params.tieBreak,
    pathWidth: params.pathWidth,
  })[0];
  const rollout = next ? next.points : 0;
  const placement = remnantPlacementValue(state, candidate, lookaheadRngFactory);
  const turnover = (state.tileScale || 1) * (candidate.chain.length - 1);
  const harvest = harvestValue(sim, survivor);
  return candidate.points
    + (params.wRoll * rollout)
    + (params.wPlace * placement)
    + (params.turnover * turnover)
    + (params.wHarvest * harvest);
}

function mapSnapshotsToState(state, chain) {
  return chain.map(({ x, y }) => state.grid[y][x]);
}

function analyzeRouteDiverseMove(state, options = {}) {
  const champion = analyzeMove(state, options);
  if (!champion.selectedChain) {
    return {
      ...champion,
      championChain: null,
      supplement: [],
      supplementWon: false,
    };
  }

  const championChain = mapSnapshotsToState(state, champion.selectedChain);
  if (champion.reason === 'bomb-priority' || champion.reason === 'immediate-target-win') {
    return {
      ...champion,
      selectedChain: championChain,
      championChain,
      supplement: [],
      supplementWon: false,
    };
  }

  const params = { ...DEFAULT_PARAMS, ...options.params };
  const existingSignatures = new Set(champion.candidates.map(({ chain }) => routeSignature(chain)));
  const generated = generateRouteDiverseSupplement(state, options.diversity);
  const supplement = [];
  for (const candidate of generated) {
    const signature = routeSignature(candidate.chain);
    if (existingSignatures.has(signature)) continue;
    supplement.push({
      ...candidate,
      signature,
      policyScore: scoreSupplementCandidate(
        state,
        candidate,
        options.lookaheadRngFactory,
        params,
      ),
    });
  }

  const selectedChampion = champion.candidates.find(({ id }) => id === champion.selectedId);
  let winner = null;
  for (const candidate of supplement) {
    if (!winner || candidate.policyScore > winner.policyScore) winner = candidate;
  }
  const supplementWon = Boolean(
    winner && selectedChampion && winner.policyScore > selectedChampion.policyScore,
  );

  return {
    ...champion,
    selectedChain: supplementWon ? winner.chain : championChain,
    championChain,
    supplement,
    supplementWon,
    selectedSupplementSignature: supplementWon ? winner.signature : null,
  };
}

function chooseRouteDiverseMove(state, options = {}) {
  return analyzeRouteDiverseMove(state, options).selectedChain;
}

module.exports = {
  SEARCH_WIDTH,
  SUPPLEMENT_LIMIT,
  analyzeRouteDiverseMove,
  chooseRouteDiverseMove,
  generateRouteDiverseSupplement,
  routeSignature,
  scoreSupplementCandidate,
};
