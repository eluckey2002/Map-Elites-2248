const crypto = require('node:crypto');

const {
  canExtendChain,
  createLevelState,
  findGreedyChains,
  isBlockedTile,
  isValidChain,
  makeRng,
} = require('./engine');
const { applyFrozenChain } = require('./exact-score');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function boardSnapshot(state) {
  return state.grid.map((row) => row.map((tile) => (tile ? {
    value: tile.value,
    blocker: tile.blocker,
    blockerDuration: tile.blockerDuration,
    bombTimer: tile.bombTimer,
  } : null)));
}

function makeScaledFrozenSpawnValues(level, rng) {
  const scale = level.tileScale || 1;
  const maximum = level.moves * (level.gridW * level.gridH - 1);
  return Array.from({ length: maximum }, () => {
    const draw = rng();
    if (draw < 0.6) return 2 * scale;
    if (draw < 0.9) return 4 * scale;
    return 8 * scale;
  });
}

function chainKey(chain) {
  const final = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map((tile) => `${tile.x},${tile.y}`)
    .sort()
    .join('|');
  return `${final.x},${final.y};${removed}`;
}

function gridKey(state) {
  return state.grid.flat().map((tile) => (
    tile ? `${tile.value}:${tile.blocker || ''}:${tile.blockerDuration}:${tile.bombTimer}` : '_'
  )).join(',');
}

function candidateChains(state, { actionsPerState, maxChainLength, pathWidth }) {
  const candidates = new Map();
  for (const preferMergeableSum of [true, false]) {
    const results = findGreedyChains(state, {
      limit: actionsPerState,
      maxLength: maxChainLength,
      pathWidth,
      preferMergeableSum,
    });
    for (const result of results) {
      const key = chainKey(result.chain);
      if (!candidates.has(key)) candidates.set(key, result.chain);
    }
  }
  return [...candidates.values()];
}

// Finds one legal witness under a bounded, deterministic search. Success is a
// replayable upper bound on moves/cap required. Failure is UNKNOWN: the beam
// does not enumerate all legal play and cannot establish unreachability.
function findBoundedWitness({
  level,
  seed,
  maxChainLength = level.gridW * level.gridH,
  width = 64,
  actionsPerState = 24,
  pathWidth = 2,
}) {
  const rng = makeRng(seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeScaledFrozenSpawnValues(level, rng);
  let frontier = [{ state: initialState, cursor: 0, score: 0, actions: [] }];
  let best = frontier[0];
  let expandedStates = 0;
  let generatedActions = 0;

  for (let turn = 0; turn < level.moves; turn++) {
    const nextByState = new Map();
    for (const node of frontier) {
      expandedStates += 1;
      const chains = candidateChains(node.state, {
        actionsPerState,
        maxChainLength,
        pathWidth,
      });
      generatedActions += chains.length;
      for (const chain of chains) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const score = node.score + transition.points;
        const next = {
          state: transition.state,
          cursor: transition.cursor,
          score,
          actions: [...node.actions, chain.map((tile) => [tile.x, tile.y])],
        };
        const key = `${transition.cursor}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (!previous || next.score > previous.score) nextByState.set(key, next);
        if (next.score > best.score) best = next;
      }
    }
    frontier = [...nextByState.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, width);
    if (frontier.length === 0 || best.score >= level.target) break;
  }

  return {
    standing: best.score >= level.target ? 'replayed_upper_bound' : 'UNKNOWN',
    searchKind: 'bounded-deterministic-beam',
    complete: false,
    maxChainLength,
    score: best.score,
    reachesTarget: best.score >= level.target,
    movesUsed: best.actions.length,
    witness: best.actions,
    diagnostics: { width, actionsPerState, pathWidth, expandedStates, generatedActions },
  };
}

function normalizeCaps(level, caps) {
  const maximum = level.gridW * level.gridH;
  return [...new Set(caps
    .map((cap) => Math.max(level.minChain, Math.min(maximum, cap)))
    .concat(maximum))]
    .sort((a, b) => a - b);
}

function analyzeWitnessBounds({ level, seed, caps, search = {} }) {
  const rng = makeRng(seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeScaledFrozenSpawnValues(level, rng);
  const testedCaps = normalizeCaps(level, caps || [level.minChain, 4, 6, 8, 12]);
  const runs = testedCaps.map((maxChainLength) => findBoundedWitness({
    level,
    seed,
    maxChainLength,
    ...search,
  }));
  const successes = runs.filter((run) => run.reachesTarget);
  const minimumMovesWitness = successes
    .slice()
    .sort((a, b) => a.movesUsed - b.movesUsed || a.maxChainLength - b.maxChainLength)[0] || null;
  const minimumCapWitness = successes
    .slice()
    .sort((a, b) => a.maxChainLength - b.maxChainLength || a.movesUsed - b.movesUsed)[0] || null;
  const puzzle = {
    level: level.level,
    target: level.target,
    moves: level.moves,
    minChain: level.minChain,
    tileScale: level.tileScale || 1,
    gridW: level.gridW,
    gridH: level.gridH,
    blockers: level.blockers,
    seed,
    initialBoard: boardSnapshot(initialState),
    spawnStreamIdentity: identity(spawnValues),
  };

  return {
    puzzleIdentity: identity(puzzle),
    puzzle,
    standing: successes.length ? 'replayed_upper_bound' : 'UNKNOWN',
    descriptors: successes.length ? {
      minimumMovesUpperBound: minimumMovesWitness.movesUsed,
      budgetTightnessUpperBound: minimumMovesWitness.movesUsed / level.moves,
      chainLengthDependenceUpperBound: minimumCapWitness.maxChainLength,
    } : {
      minimumMovesUpperBound: null,
      budgetTightnessUpperBound: null,
      chainLengthDependenceUpperBound: null,
    },
    testedCaps,
    runs,
  };
}

function replayWitnessAnalysis(analysis) {
  for (const run of analysis.runs.filter(({ reachesTarget }) => reachesTarget)) {
    const level = {
      level: analysis.puzzle.level,
      target: analysis.puzzle.target,
      moves: analysis.puzzle.moves,
      minChain: analysis.puzzle.minChain,
      tileScale: analysis.puzzle.tileScale,
      gridW: analysis.puzzle.gridW,
      gridH: analysis.puzzle.gridH,
      blockers: analysis.puzzle.blockers,
    };
    const rng = makeRng(analysis.puzzle.seed);
    let state = createLevelState(level, rng);
    const spawnValues = makeScaledFrozenSpawnValues(level, rng);
    let cursor = 0;
    let score = 0;
    for (const coordinates of run.witness) {
      const seen = new Set();
      const chain = [];
      for (const [x, y] of coordinates) {
        const key = `${x},${y}`;
        const tile = state.grid[y] && state.grid[y][x];
        if (!tile || isBlockedTile(tile)) throw new Error('witness selects an unavailable tile');
        if (seen.has(key)) throw new Error('witness reuses a tile');
        if (chain.length) {
          const previous = chain[chain.length - 1];
          if (Math.abs(previous.x - x) > 1 || Math.abs(previous.y - y) > 1) {
            throw new Error('witness has a non-adjacent step');
          }
          if (!canExtendChain(chain, tile)) throw new Error('witness violates the value-extension rule');
        }
        seen.add(key);
        chain.push(tile);
      }
      if (!isValidChain(chain, level.minChain)) throw new Error('witness chain is invalid');
      const transition = applyFrozenChain(state, chain, spawnValues, cursor);
      state = transition.state;
      cursor = transition.cursor;
      score += transition.points;
    }
    if (score !== run.score || score < level.target) {
      throw new Error(`witness replay score mismatch at cap ${run.maxChainLength}`);
    }
    if (run.witness.some((chain) => chain.length > run.maxChainLength)) {
      throw new Error(`witness exceeds cap ${run.maxChainLength}`);
    }
  }
  return true;
}

module.exports = {
  analyzeWitnessBounds,
  canonicalJson,
  findBoundedWitness,
  identity,
  makeScaledFrozenSpawnValues,
  replayWitnessAnalysis,
};
