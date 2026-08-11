const { createHash } = require('node:crypto');

const {
  makeRng,
  createLevelState,
  chainMultiplier,
  findGreedyChains,
  cloneState,
} = require('../engine');
const {
  applyFrozenChain,
  enumerateLegalChains,
  makeFrozenSpawnValues,
  replayFrozenWitness,
} = require('../exact-score');

function chainKey(chain) {
  const final = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map((tile) => `${tile.x},${tile.y}`)
    .sort()
    .join('|');
  return `${final.x},${final.y};${removed}`;
}

function gridKey(state) {
  return state.grid.flat().map((tile) => tile.value).join(',');
}

function canExtend(chain, tile) {
  const previous = chain[chain.length - 1];
  if (chain.length === 1) return tile.value === previous.value;
  return tile.value === previous.value || tile.value === previous.value * 2;
}

function neighbors(state, chain, seen) {
  const previous = chain[chain.length - 1];
  const result = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const x = previous.x + dx;
      const y = previous.y + dy;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
      const tile = state.grid[y][x];
      if (!tile || tile.blocker || seen.has(tile) || !canExtend(chain, tile)) continue;
      result.push(tile);
    }
  }
  return result;
}

function onwardDegree(state, chain, seen, tile) {
  chain.push(tile);
  seen.add(tile);
  const degree = neighbors(state, chain, seen).length;
  seen.delete(tile);
  chain.pop();
  return degree;
}

function coordinateHash(chain) {
  let hash = 2166136261;
  for (const tile of chain) {
    hash ^= (tile.y * 8) + tile.x + 1;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Samples legal self-avoiding walks with several deterministic orderings.
// This deliberately generates action shapes that the old one-walk-per-start
// greedy beam cannot see, while keeping an auditable finite expansion count.
function candidateChains(state, {
  walkSamples = 96,
  candidateLimit = 96,
  searchSeed = 1,
  mode = 0,
} = {}) {
  const candidates = new Map();

  function retain(chain) {
    if (chain.length < state.minChain) return;
    const key = chainKey(chain);
    if (!candidates.has(key)) candidates.set(key, chain.slice());
  }

  for (const preferMergeableSum of [true, false]) {
    for (const result of findGreedyChains(state, {
      limit: Math.max(16, Math.floor(candidateLimit / 3)),
      preferMergeableSum,
    })) retain(result.chain);
  }

  // A bounded path beam complements the randomized walks. It retains a
  // fixed number of partial self-avoiding paths at each depth, so it can find
  // high-value long chains without materializing millions of exact actions.
  let pathFrontier = [];
  for (const start of state.grid.flat()) {
    if (!start || start.blocker) continue;
    const firstChain = [start];
    const firstSeen = new Set(firstChain);
    for (const next of neighbors(state, firstChain, firstSeen)) {
      pathFrontier.push({
        chain: [start, next],
        seen: new Set([start, next]),
        sum: start.value + next.value,
      });
    }
  }
  const pathWidth = Math.max(48, walkSamples * 4);
  while (pathFrontier.length > 0) {
    const expanded = [];
    for (const path of pathFrontier) {
      if (path.chain.length >= state.minChain) retain(path.chain);
      for (const next of neighbors(state, path.chain, path.seen)) {
        expanded.push({
          chain: [...path.chain, next],
          seen: new Set([...path.seen, next]),
          sum: path.sum + next.value,
        });
      }
    }
    expanded.sort((left, right) => {
      const leftPoints = left.sum * chainMultiplier(left.chain.length);
      const rightPoints = right.sum * chainMultiplier(right.chain.length);
      const leftDegree = neighbors(state, left.chain, left.seen).length;
      const rightDegree = neighbors(state, right.chain, right.seen).length;
      let leftRank;
      let rightRank;
      if (mode % 3 === 0) {
        leftRank = leftPoints + leftDegree * 16 + left.chain.length * 5;
        rightRank = rightPoints + rightDegree * 16 + right.chain.length * 5;
      } else if (mode % 3 === 1) {
        leftRank = leftPoints * 0.7 + leftDegree * 30 + left.chain.length * 9;
        rightRank = rightPoints * 0.7 + rightDegree * 30 + right.chain.length * 9;
      } else {
        leftRank = leftPoints * 1.3 + leftDegree * 6 + left.chain.length * 3;
        rightRank = rightPoints * 1.3 + rightDegree * 6 + right.chain.length * 3;
      }
      return rightRank - leftRank
        || coordinateHash(left.chain) - coordinateHash(right.chain);
    });
    pathFrontier = expanded.slice(0, pathWidth);
  }

  const tiles = state.grid.flat().filter((tile) => tile && !tile.blocker);
  const rng = makeRng((searchSeed ^ coordinateHash(tiles)) >>> 0);
  for (let sample = 0; sample < walkSamples; sample += 1) {
    const start = tiles[Math.floor(rng() * tiles.length)];
    const chain = [start];
    const seen = new Set(chain);

    while (chain.length < tiles.length) {
      const options = neighbors(state, chain, seen);
      if (options.length === 0) break;
      const ranked = options.map((tile) => {
        const degree = onwardDegree(state, chain, seen, tile);
        const jitter = rng();
        let rank;
        if (mode % 4 === 0) rank = degree * 8 - tile.value * 0.08 + jitter * 7;
        else if (mode % 4 === 1) rank = -degree * 5 - tile.value * 0.2 + jitter * 8;
        else if (mode % 4 === 2) rank = degree * 3 + tile.value * 0.25 + jitter * 12;
        else rank = jitter * 20 - Math.abs(degree - 2) * 2 + tile.value * 0.1;
        return { tile, rank };
      }).sort((left, right) => left.rank - right.rank);
      const choiceWindow = Math.min(ranked.length, sample % 5 === 0 ? 1 : 3);
      const selected = ranked[Math.floor(rng() * choiceWindow)].tile;
      chain.push(selected);
      seen.add(selected);

      if (chain.length >= state.minChain) {
        const threshold = chain.length === 4 || chain.length === 5
          || chain.length === 7 || chain.length === 9;
        if (threshold || rng() < 0.12) retain(chain);
      }
    }
    retain(chain);
  }

  return [...candidates.values()]
    .map((chain) => {
      const sum = chain.reduce((total, tile) => total + tile.value, 0);
      return { chain, sum, points: Math.floor(sum * chainMultiplier(chain.length)) };
    })
    .sort((left, right) => right.points - left.points
      || right.chain.length - left.chain.length
      || chainKey(left.chain).localeCompare(chainKey(right.chain)))
    .slice(0, candidateLimit)
    .map((entry) => entry.chain);
}

function stateQuality(state, score, cursor, movesLeft, profile, lookahead = 0) {
  const counts = new Map();
  let liveMass = 0;
  let lowTiles = 0;
  for (const tile of state.grid.flat()) {
    liveMass += tile.value;
    counts.set(tile.value, (counts.get(tile.value) || 0) + 1);
    if (tile.value <= 8) lowTiles += 1;
  }
  let pairMass = 0;
  let compatibleMass = 0;
  for (const [value, count] of counts) {
    if (count >= 2) pairMass += value * Math.min(count, 4);
    if (counts.has(value * 2)) compatibleMass += value * Math.min(count, 3);
  }
  const paceNeeded = Math.max(0, 13000 - score) / Math.max(1, movesLeft);
  return score
    + profile.lookahead * lookahead
    + profile.pairs * pairMass
    + profile.compatible * compatibleMass
    + profile.low * lowTiles
    + profile.mass * liveMass
    - profile.cursor * cursor
    - profile.pace * paceNeeded;
}

const PROFILES = [
  { quota: 0.45, lookahead: 0, pairs: 0, compatible: 0, low: 0, mass: 0, cursor: 0, pace: 0 },
  { quota: 0.25, lookahead: 1, pairs: 0, compatible: 0, low: 0, mass: 0, cursor: 0, pace: 0 },
  { quota: 0.15, lookahead: 1.8, pairs: 0.5, compatible: 0.3, low: 1, mass: 0, cursor: 0, pace: 0 },
  { quota: 0.15, lookahead: 0.5, pairs: 1.5, compatible: 0.8, low: 3, mass: 0.02, cursor: 0.02, pace: 0 },
];

function selectFrontier(nodes, width, movesLeft) {
  if (nodes.length <= width) return nodes;
  const selected = new Map();
  for (const profile of PROFILES) {
    if (profile.lookahead > 0) {
      for (const node of nodes) {
        if (node.lookahead === undefined) {
          const choices = findGreedyChains(node.state, { limit: 1, preferMergeableSum: false });
          node.lookahead = choices.length === 0 ? 0 : choices[0].points;
        }
      }
    }
    const ranked = nodes.slice().sort((left, right) => (
      stateQuality(right.state, right.score, right.cursor, movesLeft, profile, right.lookahead || 0)
      - stateQuality(left.state, left.score, left.cursor, movesLeft, profile, left.lookahead || 0)
    ) || right.score - left.score || left.key.localeCompare(right.key));
    const profileWidth = Math.max(1, Math.floor(width * profile.quota));
    for (const node of ranked.slice(0, profileWidth)) selected.set(node.key, node);
  }
  if (selected.size < width) {
    const remaining = nodes.slice().sort((left, right) => right.score - left.score
      || left.key.localeCompare(right.key));
    for (const node of remaining) {
      selected.set(node.key, node);
      if (selected.size >= width) break;
    }
  }
  return [...selected.values()].slice(0, width);
}

function searchFromState({
  initialState,
  spawnValues,
  target,
  width = 256,
  walkSamples = 96,
  candidateLimit = 96,
  searchSeed = 1,
  mode = 0,
  exactCandidateMode = false,
}) {
  let frontier = [{
    state: cloneState(initialState), cursor: 0, score: 0, witness: [], key: gridKey(initialState),
  }];
  let best = frontier[0];
  const stats = {
    expandedStates: 0,
    generatedCandidates: 0,
    uniqueSuccessors: 0,
    duplicateSuccessors: 0,
    completedDepth: 0,
  };

  for (let turn = 0; turn < initialState.maxMoves; turn += 1) {
    const nextByState = new Map();
    for (let nodeIndex = 0; nodeIndex < frontier.length; nodeIndex += 1) {
      const node = frontier[nodeIndex];
      stats.expandedStates += 1;
      const actions = exactCandidateMode
        ? enumerateLegalChains(node.state)
        : candidateChains(node.state, {
          walkSamples,
          candidateLimit,
          searchSeed: (searchSeed + turn * 1000003 + nodeIndex * 9176) >>> 0,
          mode,
        });
      stats.generatedCandidates += actions.length;
      for (const chain of actions) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const score = node.score + transition.points;
        const key = `${transition.cursor}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (previous && previous.score >= score) {
          stats.duplicateSuccessors += 1;
          continue;
        }
        const next = {
          state: transition.state,
          cursor: transition.cursor,
          score,
          witness: [...node.witness, chain.map((tile) => [tile.x, tile.y])],
          key,
        };
        nextByState.set(key, next);
        if (score > best.score) best = next;
        if (score >= target) {
          stats.uniqueSuccessors += nextByState.size;
          stats.completedDepth = turn + 1;
          return { best: next, targetReached: true, stats };
        }
      }
    }
    stats.uniqueSuccessors += nextByState.size;
    stats.completedDepth = turn + 1;
    frontier = selectFrontier(
      [...nextByState.values()],
      width,
      initialState.maxMoves - turn - 1,
    );
    if (frontier.length === 0) break;
  }
  return { best, targetReached: best.score >= target, stats };
}

function frozenIdentity(initialState, spawnValues) {
  const initial = initialState.grid.flat().map((tile) => tile.value);
  return createHash('sha256').update(Buffer.from([...initial, ...spawnValues])).digest('hex');
}

function runFrozenSearch({
  level,
  seed = 0,
  restarts = 6,
  width = 384,
  walkSamples = 80,
  candidateLimit = 80,
} = {}) {
  const initialState = createLevelState(level, makeRng(seed));
  const spawnValues = makeFrozenSpawnValues(level, seed);
  const inputIdentity = frozenIdentity(initialState, spawnValues);
  let best = null;
  const runs = [];

  for (let restart = 0; restart < restarts; restart += 1) {
    const result = searchFromState({
      initialState,
      spawnValues,
      target: level.target,
      width,
      walkSamples,
      candidateLimit,
      searchSeed: 0x22480000 + restart * 7919,
      mode: restart,
    });
    const replay = replayFrozenWitness({ level, seed, witness: result.best.witness });
    if (replay.score !== result.best.score
      || replay.cursor !== result.best.cursor
      || replay.moves !== result.best.witness.length) {
      throw new Error('Independent frozen replay disagrees with search result');
    }
    runs.push({ restart, score: replay.score, moves: replay.moves, cursor: replay.cursor, stats: result.stats });
    if (!best || replay.score > best.replay.score) best = { ...result.best, replay, restart };
    if (replay.reachesTarget) break;
  }

  return {
    kind: 'seeded-portfolio-beam-lower-bound',
    level: level.level,
    seed,
    target: level.target,
    inputIdentity,
    verdict: best.replay.reachesTarget ? 'TARGET_REACHED' : 'NON_DECISIVE_MISS',
    scoreClaim: best.replay.score,
    bestVerifiedLowerBound: Math.max(10132, best.replay.score),
    targetReached: best.replay.reachesTarget,
    complete: false,
    interpretation: best.replay.reachesTarget
      ? 'independently replayed lower witness; not an exact maximum or upper bound'
      : 'replayed lower bound only; fixed-budget heuristic miss makes no feasibility or upper-bound claim',
    fixedComputeBudget: { restarts, width, walkSamples, candidateLimit },
    searchCoverage: {
      runsCompleted: runs.length,
      expandedStates: runs.reduce((sum, run) => sum + run.stats.expandedStates, 0),
      generatedCandidates: runs.reduce((sum, run) => sum + run.stats.generatedCandidates, 0),
      uniqueSuccessors: runs.reduce((sum, run) => sum + run.stats.uniqueSuccessors, 0),
      duplicateSuccessors: runs.reduce((sum, run) => sum + run.stats.duplicateSuccessors, 0),
      maximumCompletedDepth: Math.max(...runs.map((run) => run.stats.completedDepth)),
      runs,
    },
    replay: best.replay,
    bestRestart: best.restart,
    witness: best.witness,
  };
}

module.exports = {
  candidateChains,
  searchFromState,
  runFrozenSearch,
  frozenIdentity,
};
