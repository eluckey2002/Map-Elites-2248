const {
  makeRng,
  createLevelState,
  chainMultiplier,
  executeChain,
  applyGravity,
  cloneState,
  findGreedyChains,
} = require('./engine');

function makeTile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function isBlocked(tile) {
  return tile.blocker === 'stone' || tile.blocker === 'ice' || tile.blocker === 'lock';
}

function canExtend(chain, tile) {
  const previous = chain[chain.length - 1];
  if (chain.length === 1) return tile.value === previous.value;
  return tile.value === previous.value || tile.value === previous.value * 2;
}

// Returns every distinct board action, not just every score. Two paths that
// leave different tiles behind must stay separate even if their immediate
// score matches, because their future boards can differ.
function enumerateLegalChains(state) {
  const actions = new Map();
  const pathStates = new Set();

  function indexOf(tile) {
    return tile.y * state.gridWidth + tile.x;
  }

  function maskBit(index) {
    // The largest board has 40 cells, safely below Number's 53-bit integer
    // precision limit. This is faster and smaller than a Set per DFS branch.
    return 1n << BigInt(index);
  }

  function record(chain) {
    if (chain.length < state.minChain) return;
    const finalTile = chain[chain.length - 1];
    const removed = chain.slice(0, -1)
      .map((tile) => `${tile.x},${tile.y}`)
      .sort()
      .join('|');
    const key = `${finalTile.x},${finalTile.y};${removed}`;
    if (!actions.has(key)) actions.set(key, chain.slice());
  }

  function walk(chain, visitedMask, sum) {
    record(chain);
    const previous = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = previous.x + dx;
        const y = previous.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const next = state.grid[y][x];
        if (!next || isBlocked(next) || !canExtend(chain, next)) continue;
        const nextIndex = indexOf(next);
        const nextBit = maskBit(nextIndex);
        if (visitedMask & nextBit) continue;
        chain.push(next);
        const nextMask = visitedMask | nextBit;
        const stateKey = `${nextIndex}:${nextMask}`;
        // Once the final tile and visited set match, the remaining legal
        // extensions and every later board transition match as well. Keeping
        // only the first legal ordering avoids re-walking path permutations.
        if (!pathStates.has(stateKey)) {
          pathStates.add(stateKey);
          walk(chain, nextMask, sum + next.value);
        }
        chain.pop();
      }
    }
  }

  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const tile = state.grid[y][x];
      if (!tile || isBlocked(tile)) continue;
      const startIndex = indexOf(tile);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nextX = x + dx;
          const nextY = y + dy;
          if (nextX < 0 || nextX >= state.gridWidth || nextY < 0 || nextY >= state.gridHeight) continue;
          const next = state.grid[nextY][nextX];
          if (!next || isBlocked(next) || next.value !== tile.value) continue;
          const nextIndex = indexOf(next);
          const mask = maskBit(startIndex) | maskBit(nextIndex);
          const stateKey = `${nextIndex}:${mask}`;
          if (pathStates.has(stateKey)) continue;
          pathStates.add(stateKey);
          walk([tile, next], mask, tile.value + next.value);
        }
      }
    }
  }
  return [...actions.values()];
}

function spawnFrozenValues(state, values, cursor) {
  let nextCursor = cursor;
  for (let x = 0; x < state.gridWidth; x++) {
    for (let y = 0; y < state.gridHeight; y++) {
      if (state.grid[y][x]) continue;
      if (nextCursor >= values.length) throw new Error('Frozen spawn stream exhausted');
      state.grid[y][x] = makeTile(x, y, values[nextCursor]);
      nextCursor += 1;
    }
  }
  return nextCursor;
}

function applyFrozenChain(state, chain, spawnValues, cursor) {
  const next = cloneState(state);
  const mapped = chain.map((tile) => next.grid[tile.y][tile.x]);
  const points = executeChain(next, mapped);
  applyGravity(next);
  const nextCursor = spawnFrozenValues(next, spawnValues, cursor);
  return { state: next, cursor: nextCursor, points };
}

function gridKey(state) {
  return state.grid
    .flat()
    .map((tile) => (tile ? `${tile.value}:${tile.blocker || ''}` : '_'))
    .join(',');
}

// Exact position-aware search. This is deliberately reserved for small
// fixtures: it enumerates every legal path and its resulting board exactly.
function solveExactPosition(state, { spawnValues = [], cursor = 0, maxNodes = Infinity } = {}) {
  const memo = new Map();
  const stats = { visited: 0, memoHits: 0, generatedActions: 0 };

  function solve(current, currentCursor) {
    const remainingMoves = current.maxMoves - current.moves;
    if (remainingMoves <= 0) return { score: 0, actions: [] };
    const key = `${remainingMoves}|${currentCursor}|${gridKey(current)}`;
    const saved = memo.get(key);
    if (saved) {
      stats.memoHits += 1;
      return saved;
    }
    stats.visited += 1;
    if (stats.visited > maxNodes) throw new Error(`Exact search exceeded node cap ${maxNodes}`);

    const actions = enumerateLegalChains(current);
    stats.generatedActions += actions.length;
    let best = { score: 0, actions: [] };
    for (const chain of actions) {
      const transition = applyFrozenChain(current, chain, spawnValues, currentCursor);
      const future = solve(transition.state, transition.cursor);
      const candidate = {
        score: transition.points + future.score,
        actions: [chain.map((tile) => [tile.x, tile.y]), ...future.actions],
      };
      if (candidate.score > best.score) best = candidate;
    }
    memo.set(key, best);
    return best;
  }

  const result = solve(state, cursor);
  return { ...result, complete: true, stats };
}

function addCount(counts, value, amount) {
  const next = (counts.get(value) || 0) + amount;
  if (next === 0) counts.delete(value);
  else counts.set(value, next);
}

function countKey(counts) {
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a - b)
    .map(([value, count]) => `${value}x${count}`)
    .join(',');
}

function cloneCounts(counts) {
  return new Map(counts);
}

// The position-relaxed model preserves all value and spawn rules but permits
// any compatible value sequence, regardless of board geometry. Every legal
// board move maps to one of these actions, so its optimum is an admissible
// upper bound for the real board under the same frozen spawn stream.
function enumerateRelaxedActions(counts, minChain) {
  const actions = new Map();
  const used = new Map();

  function record(length, sum) {
    if (length < minChain) return;
    const removed = countKey(used);
    if (actions.has(removed)) return;
    const removedCounts = cloneCounts(used);
    actions.set(removed, {
      removedCounts,
      length,
      sum,
      points: Math.floor(sum * chainMultiplier(length)),
    });
  }

  function consume(value) {
    const available = (counts.get(value) || 0) - (used.get(value) || 0);
    if (available <= 0) return false;
    addCount(used, value, 1);
    return true;
  }

  function release(value) {
    addCount(used, value, -1);
  }

  function walk(lastValue, length, sum) {
    record(length, sum);
    const options = [lastValue, lastValue * 2];
    for (const value of new Set(options)) {
      if (!consume(value)) continue;
      walk(value, length + 1, sum + value);
      release(value);
    }
  }

  for (const [value, count] of counts) {
    if (count < 2) continue;
    consume(value);
    consume(value);
    walk(value, 2, value * 2);
    release(value);
    release(value);
  }
  return [...actions.values()];
}

function applyRelaxedAction(counts, action, spawnValues, cursor) {
  const next = cloneCounts(counts);
  for (const [value, count] of action.removedCounts) addCount(next, value, -count);
  addCount(next, action.sum, 1);
  let nextCursor = cursor;
  for (let i = 0; i < action.length - 1; i++) {
    if (nextCursor >= spawnValues.length) throw new Error('Frozen spawn stream exhausted');
    addCount(next, spawnValues[nextCursor], 1);
    nextCursor += 1;
  }
  return { counts: next, cursor: nextCursor };
}

function initialCounts(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const counts = new Map();
  for (const tile of state.grid.flat()) addCount(counts, tile.value, 1);
  return { counts, rng };
}

function spawnValue(rng) {
  const draw = rng();
  if (draw < 0.6) return 2;
  if (draw < 0.9) return 4;
  return 8;
}

function makeFrozenSpawnValues(level, seed) {
  const { rng } = initialCounts(level, seed);
  const maximum = level.moves * (level.gridW * level.gridH - 1);
  return Array.from({ length: maximum }, () => spawnValue(rng));
}

// Computes an exact optimum in the position-relaxed state space. When it
// completes, the answer is a certified upper bound for the physical board;
// it is intentionally not described as an exact board score.
function solveRelaxedUpperBound({ level, seed, maxNodes = Infinity }) {
  const { counts } = initialCounts(level, seed);
  const spawnValues = makeFrozenSpawnValues(level, seed);
  const memo = new Map();
  const stats = { visited: 0, memoHits: 0, generatedActions: 0 };

  function solve(currentCounts, cursor, remainingMoves) {
    if (remainingMoves === 0) return { score: 0, actions: [] };
    const key = `${remainingMoves}|${cursor}|${countKey(currentCounts)}`;
    const saved = memo.get(key);
    if (saved) {
      stats.memoHits += 1;
      return saved;
    }
    stats.visited += 1;
    if (stats.visited > maxNodes) throw new Error(`Relaxed search exceeded node cap ${maxNodes}`);

    const actions = enumerateRelaxedActions(currentCounts, level.minChain);
    stats.generatedActions += actions.length;
    let best = { score: 0, actions: [] };
    for (const action of actions) {
      const transition = applyRelaxedAction(currentCounts, action, spawnValues, cursor);
      const future = solve(transition.counts, transition.cursor, remainingMoves - 1);
      const candidate = {
        score: action.points + future.score,
        actions: [{ removed: countKey(action.removedCounts), sum: action.sum, length: action.length, points: action.points }, ...future.actions],
      };
      if (candidate.score > best.score) best = candidate;
    }
    memo.set(key, best);
    return best;
  }

  const result = solve(counts, 0, level.moves);
  return {
    kind: 'position-relaxed-upper-bound',
    level: level.level,
    seed,
    target: level.target,
    score: result.score,
    reachesTarget: result.score >= level.target,
    witness: result.actions,
    complete: true,
    stats,
  };
}

function chainKey(chain) {
  const final = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map((tile) => `${tile.x},${tile.y}`)
    .sort()
    .join('|');
  return `${final.x},${final.y};${removed}`;
}

function candidateChains(state, limit) {
  const candidates = new Map();
  for (const preferMergeableSum of [true, false]) {
    for (const result of findGreedyChains(state, { limit, preferMergeableSum })) {
      const key = chainKey(result.chain);
      if (!candidates.has(key)) candidates.set(key, result.chain);
    }
  }
  return [...candidates.values()];
}

// A deterministic lower-bound search used only to find a legal witness while
// the exact/upper-bound solver is being developed. It is not a certificate of
// a maximum and is never used to prove a failure.
function findBeamWitness({ level, seed, width = 128, actionsPerState = 32 }) {
  const rng = makeRng(seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeFrozenSpawnValues(level, seed);
  let frontier = [{ state: initialState, cursor: 0, score: 0, actions: [] }];
  let best = frontier[0];

  for (let turn = 0; turn < level.moves; turn++) {
    const nextByState = new Map();
    for (const node of frontier) {
      for (const chain of candidateChains(node.state, actionsPerState)) {
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
    kind: 'beam-search-lower-bound',
    level: level.level,
    seed,
    target: level.target,
    score: best.score,
    reachesTarget: best.score >= level.target,
    witness: best.actions,
    complete: false,
  };
}

function replayFrozenWitness({ level, seed, witness }) {
  const rng = makeRng(seed);
  let state = createLevelState(level, rng);
  const spawnValues = makeFrozenSpawnValues(level, seed);
  let cursor = 0;
  let score = 0;

  for (const coordinates of witness) {
    if (coordinates.length < state.minChain) throw new Error('Witness chain is shorter than the level minimum');
    const seen = new Set();
    const chain = [];
    for (const [x, y] of coordinates) {
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) throw new Error('Witness coordinate is off-board');
      const key = `${x},${y}`;
      if (seen.has(key)) throw new Error('Witness reuses a tile');
      seen.add(key);
      const tile = state.grid[y][x];
      if (!tile || isBlocked(tile)) throw new Error('Witness selects an unavailable tile');
      if (chain.length > 0) {
        const previous = chain[chain.length - 1];
        if (Math.abs(previous.x - x) > 1 || Math.abs(previous.y - y) > 1) throw new Error('Witness has a non-adjacent step');
        if (!canExtend(chain, tile)) throw new Error('Witness violates the value-extension rule');
      }
      chain.push(tile);
    }
    const transition = applyFrozenChain(state, chain, spawnValues, cursor);
    state = transition.state;
    cursor = transition.cursor;
    score += transition.points;
  }
  return { score, cursor, moves: state.moves, reachesTarget: score >= level.target };
}

module.exports = {
  enumerateLegalChains,
  applyFrozenChain,
  solveExactPosition,
  enumerateRelaxedActions,
  solveRelaxedUpperBound,
  makeFrozenSpawnValues,
  findBeamWitness,
  replayFrozenWitness,
};
