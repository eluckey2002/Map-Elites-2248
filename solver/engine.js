// Seedable PRNG: mulberry32 (small, fast, good enough for this).
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeTile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

// Mirrors game.js loadLevel's initial-grid spawn weights (line ~607-612).
// `scale` multiplies every spawned value uniformly. Because chains match on
// equal-or-double and merges sum, a uniform scale is an exact isomorphism:
// identical play, every score multiplied by the same factor. Mixing scales on
// one board is NOT safe - it adds distinct values and hurts matchability.
function randomInitialValue(rng, scale = 1) {
  const r = rng();
  if (r < 0.5) return 2 * scale;
  if (r < 0.8) return 4 * scale;
  if (r < 0.95) return 8 * scale;
  return 16 * scale;
}

function createLevelState(levelData, rng) {
  const tileScale = levelData.tileScale || 1;
  const grid = [];
  for (let row = 0; row < levelData.gridH; row++) {
    grid[row] = [];
    for (let col = 0; col < levelData.gridW; col++) {
      grid[row][col] = makeTile(col, row, randomInitialValue(rng, tileScale));
    }
  }

  levelData.blockers.forEach((b) => {
    const tile = grid[b.y][b.x];
    if (!tile) return;
    if (b.type === 'stone') {
      tile.value = 0;
      tile.blocker = 'stone';
    } else if (b.type === 'ice') {
      tile.blocker = 'ice';
      tile.blockerDuration = b.duration;
    } else if (b.type === 'bomb') {
      tile.blocker = 'bomb';
      tile.bombTimer = b.timer;
    }
  });

  return {
    grid,
    gridWidth: levelData.gridW,
    gridHeight: levelData.gridH,
    score: 0,
    moves: 0,
    maxMoves: levelData.moves,
    targetScore: levelData.target,
    minChain: levelData.minChain,
    tileScale,
  };
}

// Mirrors game.js canExtendChain (line ~325-337).
function canExtendChain(chain, newTile) {
  if (chain.length === 0) return true;
  const lastTile = chain[chain.length - 1];
  if (chain.length === 1) return newTile.value === lastTile.value;
  return newTile.value === lastTile.value || newTile.value === lastTile.value * 2;
}

// Mirrors game.js isValidChain (line ~339-348).
function isValidChain(chain, minChain) {
  if (chain.length < minChain) return false;
  if (chain.length >= 2 && chain[0].value !== chain[1].value) return false;
  return true;
}

function chainValue(chain) {
  return chain.reduce((sum, tile) => sum + tile.value, 0);
}

// Mirrors game.js getChainMultiplier (line ~358-365).
function chainMultiplier(length) {
  if (length >= 9) return 5;
  if (length >= 7) return 3;
  if (length >= 5) return 2;
  if (length >= 3) return 1.5;
  return 1;
}

// Mirrors game.js executeChain scoring/mutation (line ~367-410), minus animation/UI.
function executeChain(state, chain) {
  const sum = chainValue(chain);
  const multiplier = chainMultiplier(chain.length);
  const points = Math.floor(sum * multiplier);

  const finalTile = chain[chain.length - 1];
  chain.forEach((tile, index) => {
    if (index < chain.length - 1) {
      state.grid[tile.y][tile.x] = null;
    }
  });

  finalTile.value = sum;
  if (finalTile.blocker === 'bomb') {
    finalTile.blocker = null;
    finalTile.bombTimer = 0;
  }

  state.score += points;
  state.moves += 1;

  return points;
}

// Mirrors game.js applyGravity (line ~434-453).
function applyGravity(state) {
  for (let col = 0; col < state.gridWidth; col++) {
    let writeRow = state.gridHeight - 1;
    for (let row = state.gridHeight - 1; row >= 0; row--) {
      const tile = state.grid[row][col];
      if (tile && tile.blocker !== 'stone') {
        if (row !== writeRow) {
          state.grid[writeRow][col] = tile;
          state.grid[row][col] = null;
          tile.y = writeRow;
        }
        writeRow--;
      } else if (tile && tile.blocker === 'stone') {
        writeRow = row - 1;
      }
    }
  }
}

// Mirrors game.js spawnNewTiles weights (line ~455-471).
function randomSpawnValue(rng, scale = 1) {
  const r = rng();
  if (r < 0.6) return 2 * scale;
  if (r < 0.9) return 4 * scale;
  return 8 * scale;
}

function spawnNewTiles(state, rng) {
  const scale = state.tileScale || 1;
  for (let col = 0; col < state.gridWidth; col++) {
    for (let row = 0; row < state.gridHeight; row++) {
      if (!state.grid[row][col]) {
        state.grid[row][col] = makeTile(col, row, randomSpawnValue(rng, scale));
      }
    }
  }
}

// Mirrors Tile.tickBlocker (line ~131-141) applied grid-wide.
function tickBlockers(state) {
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (!tile) continue;
      if (tile.blocker === 'ice') {
        tile.blockerDuration -= 1;
        if (tile.blockerDuration <= 0) tile.blocker = null;
      }
      if (tile.blocker === 'bomb') {
        tile.bombTimer -= 1;
      }
    }
  }
}

// Mirrors game.js checkBombs (line ~484-496).
function checkBombs(state) {
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (tile && tile.blocker === 'bomb' && tile.bombTimer <= 0) return true;
    }
  }
  return false;
}

function isBlockedTile(tile) {
  return tile.blocker === 'stone' || tile.blocker === 'ice' || tile.blocker === 'lock';
}

// Every distinct valid chain reachable in state, searched via DFS over
// king-move adjacency + canExtendChain, mirroring game.js canFormValidChain's
// traversal (line ~535-574) but scoring instead of just checking existence.
// Sorted best-first, capped at options.limit. "Distinct" = a unique
// (finalTile, length, points) combination, since the final tile is the one
// that survives and absorbs the chain's value.
// options.mustEndAt restricts results to chains whose last tile is that tile
// (this is how a bomb gets defused: it must be the merge's final tile).
// options.mustStartAt restricts results to chains starting at that tile.
function findTopChains(state, options = {}) {
  const { mustEndAt, mustStartAt, maxLength = Infinity, limit = Infinity } = options;
  const results = [];
  const seen = new Set();

  function consider(chain) {
    if (chain.length < state.minChain) return;
    if (mustEndAt && chain[chain.length - 1] !== mustEndAt) return;
    const finalTile = chain[chain.length - 1];
    const points = Math.floor(chainValue(chain) * chainMultiplier(chain.length));
    const key = `${finalTile.x},${finalTile.y},${chain.length},${points}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ chain: chain.slice(), points });
  }

  function dfs(chain) {
    consider(chain);
    if (chain.length >= maxLength) return;
    const lastTile = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = lastTile.x + dx;
        const ny = lastTile.y + dy;
        if (nx < 0 || nx >= state.gridWidth || ny < 0 || ny >= state.gridHeight) continue;
        const neighbor = state.grid[ny][nx];
        if (!neighbor || isBlockedTile(neighbor)) continue;
        if (chain.includes(neighbor)) continue;
        if (!canExtendChain(chain, neighbor)) continue;
        chain.push(neighbor);
        dfs(chain);
        chain.pop();
      }
    }
  }

  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (!tile || isBlockedTile(tile)) continue;
      if (mustStartAt && tile !== mustStartAt) continue;
      dfs([tile]);
    }
  }

  results.sort((a, b) => b.points - a.points);
  return results.slice(0, limit);
}

function findBestChain(state, options = {}) {
  const top = findTopChains(state, { ...options, limit: 1 });
  return top[0] || null;
}

// A merge leaves exactly ONE tile behind, valued at the chain's sum. Spawns are
// 2/4/8 and every extension is equal-or-double, so a sum that is a power of two
// lands back inside that lattice and can be chained again; any other sum is a
// tile nothing will ever match. One such tile accrues per move, and they never
// leave: instrumenting level 26 (5x8 grid, 32 moves) showed 31 of 40 cells held
// unmatchable sums (78, 46, 34, ...) by the end, which is the "no valid moves"
// lockout. Preferring a power-of-two sum is what keeps the board alive.
// Under a uniform tile scale k the lattice is k*2^n, not 2^n, so the test is
// "sum/k is a power of two". For k a power of two the two tests coincide, which
// is why a plain power-of-two test looked correct until non-power-of-two scales
// were tried: at k=3 it rejected every healthy sum and the walk fell through to
// the full greedy path, playing a materially different game.
function isMergeableSum(sum, scale = 1) {
  if (sum <= 0 || sum % scale !== 0) return false;
  const n = sum / scale;
  return (n & (n - 1)) === 0;
}

// Walks one no-backtracking path from startTile: at each step, among valid
// extensions (per canExtendChain), takes the LOWEST-value neighbor. That's
// deliberate, not a typo: low-value tiles are the most abundant and best
// connected, so favoring them keeps the walk alive far longer than greedily
// jumping to the biggest neighbor (which strands it at a dead end sooner).
// Length pays off directly via the multiplier, so a longer low-value walk
// consistently beats a short high-value one (measured: length 24 / 390pts
// vs length 8 / 132pts on the same board, favor-low vs favor-high).
// Linear in chain length, not exponential in branching, unlike findTopChains'
// full DFS — the tradeoff is it explores exactly one path, not every
// ordering, so it may still miss the true best chain. Returns null if the
// chain never reaches minChain.
// options.preferMergeableSum (default false — this function stays the raw walk
// primitive; the policy is applied by findGreedyChains, its only caller) picks
// the highest-scoring prefix whose sum is a power of two instead of the whole
// walk, trading immediate points for a remnant tile the board can still use.
function buildGreedyChain(state, startTile, options = {}) {
  const { maxLength = Infinity, preferMergeableSum = false } = options;
  if (isBlockedTile(startTile)) return null;

  const chain = [startTile];
  const visited = new Set(chain);

  while (chain.length < maxLength) {
    const lastTile = chain[chain.length - 1];
    let bestNeighbor = null;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = lastTile.x + dx;
        const ny = lastTile.y + dy;
        if (nx < 0 || nx >= state.gridWidth || ny < 0 || ny >= state.gridHeight) continue;
        const neighbor = state.grid[ny][nx];
        if (!neighbor || isBlockedTile(neighbor) || visited.has(neighbor)) continue;
        if (!canExtendChain(chain, neighbor)) continue;
        if (!bestNeighbor || neighbor.value < bestNeighbor.value) bestNeighbor = neighbor;
      }
    }
    if (!bestNeighbor) break;
    chain.push(bestNeighbor);
    visited.add(bestNeighbor);
  }

  if (chain.length < state.minChain) return null;

  if (preferMergeableSum) {
    let best = null;
    for (let n = state.minChain; n <= chain.length; n++) {
      const prefix = chain.slice(0, n);
      const sum = chainValue(prefix);
      if (!isMergeableSum(sum, state.tileScale || 1)) continue;
      const prefixPoints = Math.floor(sum * chainMultiplier(n));
      if (!best || prefixPoints > best.points) best = { chain: prefix, points: prefixPoints };
    }
    if (best) return best; // no mergeable prefix -> fall through to the full walk
  }

  const points = Math.floor(chainValue(chain) * chainMultiplier(chain.length));
  return { chain, points };
}

// Tries buildGreedyChain from every non-blocked tile, dedupes by (finalTile,
// length, points) same as findTopChains, sorted best-first, capped at limit.
function findGreedyChains(state, options = {}) {
  const { maxLength = Infinity, limit = Infinity, preferMergeableSum = true } = options;
  const results = [];
  const seen = new Set();

  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (!tile || isBlockedTile(tile)) continue;
      const result = buildGreedyChain(state, tile, { maxLength, preferMergeableSum });
      if (!result) continue;
      const finalTile = result.chain[result.chain.length - 1];
      const key = `${finalTile.x},${finalTile.y},${result.chain.length},${result.points}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(result);
    }
  }

  results.sort((a, b) => b.points - a.points);
  return results.slice(0, limit);
}

// Deep copy: new tile objects, same scalar state fields. Used to simulate a
// candidate move without mutating the real (in-progress) game state.
function cloneState(state) {
  return {
    ...state,
    grid: state.grid.map((row) => row.map((tile) => (tile ? { ...tile } : null))),
  };
}

module.exports = {
  makeRng,
  createLevelState,
  canExtendChain,
  isValidChain,
  chainValue,
  chainMultiplier,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
  findBestChain,
  findTopChains,
  buildGreedyChain,
  findGreedyChains,
  cloneState,
};
