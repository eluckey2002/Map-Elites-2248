const {
  canExtendChain,
  chainMultiplier,
  findGreedyChains,
  isBlockedTile,
  isMergeableSum,
} = require('./engine');

const DEFAULT_LIMITS = Object.freeze({
  maxNodes: 100_000,
  candidateLimit: 512,
  pathWidth: 64,
});

function actionIdentity(chain) {
  if (!Array.isArray(chain) || chain.length === 0) throw new Error('actionIdentity requires a chain');
  const survivor = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map(({ x, y }) => `${x},${y}`)
    .sort()
    .join('|');
  return `${survivor.x},${survivor.y};${removed}`;
}

function exactChainIdentity(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}

function compareIdentity(a, b) {
  return actionIdentity(a.chain).localeCompare(actionIdentity(b.chain));
}

function compareImmediate(a, b) {
  return b.points - a.points || b.chain.length - a.chain.length || compareIdentity(a, b);
}

function compareLongest(a, b) {
  return b.chain.length - a.chain.length || b.points - a.points || compareIdentity(a, b);
}

function retain(pool, candidate, limit, compare) {
  if (pool.length === limit && compare(candidate, pool[pool.length - 1]) >= 0) return;
  let low = 0;
  let high = pool.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (compare(candidate, pool[middle]) < 0) high = middle;
    else low = middle + 1;
  }
  pool.splice(low, 0, candidate);
  if (pool.length > limit) pool.pop();
}

function addCandidate(output, byIdentity, candidate, objective, candidateLimit) {
  const key = actionIdentity(candidate.chain);
  const existing = byIdentity.get(key);
  if (existing) {
    if (!existing.objectives.includes(objective)) existing.objectives.push(objective);
    return false;
  }
  if (output.length >= candidateLimit) return false;
  const entry = {
    chain: candidate.chain,
    points: candidate.points,
    sum: candidate.sum,
    objectives: [objective],
  };
  byIdentity.set(key, entry);
  output.push(entry);
  return true;
}

function heuristicCandidates(state, pathWidth, limit) {
  const candidates = new Map();
  for (const tieBreak of ['none', 'degree']) {
    for (const preferMergeableSum of [true, false]) {
      for (const result of findGreedyChains(state, {
        limit,
        pathWidth,
        preferMergeableSum,
        tieBreak,
      })) {
        const key = actionIdentity(result.chain);
        if (candidates.has(key)) continue;
        candidates.set(key, {
          chain: result.chain,
          points: result.points,
          sum: result.chain.reduce((total, tile) => total + tile.value, 0),
        });
      }
    }
  }
  return [...candidates.values()].sort(compareImmediate);
}

// This traverses real legal path states, but retains only candidates that serve
// one of three generation objectives. Path-state identity is equivalent to
// action identity here: the survivor plus the visited set fixes the unordered
// removed-cell set, so alternate orderings cannot crowd the bounded pool.
function generateTargetedChains(state, options = {}) {
  const maxNodes = positiveInteger(options.maxNodes ?? DEFAULT_LIMITS.maxNodes, 'maxNodes');
  const candidateLimit = positiveInteger(
    options.candidateLimit ?? DEFAULT_LIMITS.candidateLimit,
    'candidateLimit',
  );
  const pathWidth = positiveInteger(options.pathWidth ?? DEFAULT_LIMITS.pathWidth, 'pathWidth');
  const started = process.hrtime.bigint();
  const objectiveLimit = Math.max(1, Math.ceil(candidateLimit / 3));
  const immediate = [];
  const longest = [];
  const latticeBySum = new Map();
  const pathStates = new Set();
  const stack = [];
  let nodesVisited = 0;
  let actionsConsidered = 0;
  let nodeLimitHit = false;

  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      if (!tile || isBlockedTile(tile)) continue;
      const mask = 1n << BigInt(y * state.gridWidth + x);
      stack.push({ chain: [tile], mask, sum: tile.value });
      pathStates.add(`${y * state.gridWidth + x}:${mask}`);
    }
  }
  stack.reverse();

  while (stack.length > 0) {
    if (nodesVisited >= maxNodes) {
      nodeLimitHit = true;
      break;
    }
    const path = stack.pop();
    nodesVisited += 1;

    if (path.chain.length >= state.minChain) {
      actionsConsidered += 1;
      const candidate = {
        chain: path.chain,
        points: Math.floor(path.sum * chainMultiplier(path.chain.length)),
        sum: path.sum,
      };
      retain(immediate, candidate, objectiveLimit, compareImmediate);
      retain(longest, candidate, objectiveLimit, compareLongest);
      if (isMergeableSum(path.sum, state.tileScale || 1)) {
        const previous = latticeBySum.get(path.sum);
        if (!previous || compareImmediate(candidate, previous) < 0) {
          latticeBySum.set(path.sum, candidate);
        }
      }
    }

    const last = path.chain[path.chain.length - 1];
    const extensions = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = last.x + dx;
        const y = last.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const tile = state.grid[y][x];
        if (!tile || isBlockedTile(tile) || !canExtendChain(path.chain, tile)) continue;
        const bit = 1n << BigInt(y * state.gridWidth + x);
        if (path.mask & bit) continue;
        extensions.push({ tile, bit });
      }
    }
    extensions.sort((a, b) => a.tile.value - b.tile.value);
    for (let index = extensions.length - 1; index >= 0; index--) {
      const { tile, bit } = extensions[index];
      const mask = path.mask | bit;
      const key = `${tile.y * state.gridWidth + tile.x}:${mask}`;
      if (pathStates.has(key)) continue;
      pathStates.add(key);
      stack.push({ chain: [...path.chain, tile], mask, sum: path.sum + tile.value });
    }
  }

  const heuristic = heuristicCandidates(state, pathWidth, objectiveLimit);
  const lattice = [...latticeBySum.values()].sort((a, b) => a.sum - b.sum || compareImmediate(a, b));
  const candidates = [];
  const byIdentity = new Map();
  const objectives = [
    ['high-immediate-score', immediate],
    ['long-chain', longest],
    ['mergeable-lattice-sum', lattice],
    ['bounded-path-diversity', heuristic],
  ];
  for (let rank = 0; candidates.length < candidateLimit; rank++) {
    let found = false;
    for (const [objective, pool] of objectives) {
      const candidate = pool[rank];
      if (!candidate) continue;
      found = true;
      addCandidate(candidates, byIdentity, candidate, objective, candidateLimit);
    }
    if (!found) break;
  }

  const candidateLimitHit = actionsConsidered > candidates.length;
  const capReasons = [];
  if (nodeLimitHit) capReasons.push('maxNodes');
  if (candidateLimitHit) capReasons.push('candidateLimit');
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return {
    candidates,
    complete: capReasons.length === 0,
    telemetry: {
      nodesVisited,
      pathStates: pathStates.size,
      actionsConsidered,
      candidatesReturned: candidates.length,
      elapsedMs: Number(elapsedMs.toFixed(3)),
      capReasons,
      limits: { maxNodes, candidateLimit, pathWidth },
    },
  };
}

module.exports = {
  DEFAULT_LIMITS,
  actionIdentity,
  exactChainIdentity,
  generateTargetedChains,
};
