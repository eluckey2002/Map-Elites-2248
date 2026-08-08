const {
  findBestChain, findGreedyChains, cloneState, executeChain, applyGravity, spawnNewTiles, checkBombs,
} = require('./engine');

function findBombTiles(state) {
  const bombs = [];
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (tile && tile.blocker === 'bomb') bombs.push(tile);
    }
  }
  return bombs;
}

// Bomb search uses the exhaustive DFS (findBestChain), since it needs
// mustEndAt semantics a no-backtracking greedy walk can't reliably satisfy.
// Capped: DFS cost grows steeply with length, and bomb urgency doesn't need
// a long chain, just some chain that reaches the bomb.
const BOMB_MAX_CHAIN_LENGTH = 9;

// The candidate list is cut to this width BEFORE the lookahead runs, and it is
// cut by immediate points — the very criterion the lookahead exists to override,
// so anything that trades points now for a better board later was being
// discarded before it could be evaluated. Measured on level 26 (50 seeds, with
// the turnover term below): width 4 -> 6822 avg, 8 -> 7515, 12 -> 7584,
// 16 -> 7678, 24 -> 7678. Flat past ~12; 12 keeps the sweep about 2.3x baseline
// cost rather than 2.9x.
const CANDIDATE_LIMIT = 12;

// Points a candidate earns per cell it empties, beyond its own score.
// Rationale, measured not assumed: `executeChain` deletes every chain tile but
// the last and sets that one to the chain's SUM, so a merge conserves total
// board value — the only value that ever enters the board is `spawnNewTiles`
// refilling the emptied cells. A level-26 game (30 seeds) starts with 156 board
// value and gains 1030 from spawns, and the bot converts the 1721 of value it
// chains into 6655 points, an effective 3.87x. So each emptied cell is worth
// roughly one spawn (3.2 expected value) times that conversion — ~12 points —
// and more in practice, because churning the board also keeps chains available.
// Ranking on immediate points alone ignores all of it and systematically
// prefers short high-value chains that starve the board of new material.
// Measured optimum on level 26 (50 seeds, candidate width 16): 0 -> 6555 avg,
// 30 -> 7658, 40 -> 7678, 50 -> 7654, 60 -> 7823, 80 -> 7667. A broad plateau,
// so 40 is a mid-plateau pick, not a knife-edge fit.
const TURNOVER_BONUS_PER_TILE = 40;

// Maps a chain from the real state onto the equivalent tiles in a clone
// (same positions, different object identities).
function mapChainToClone(chain, cloned) {
  return chain.map((tile) => cloned.grid[tile.y][tile.x]);
}

// Simulates executing `candidate.chain`, then gravity + a spawn draw from a
// fresh rng, and returns the best chain points achievable on the result (0 if
// the bomb exploded or no chain exists). Doesn't mutate `state`.
function rolloutValue(state, candidate, lookaheadRngFactory) {
  const sim = cloneState(state);
  executeChain(sim, mapChainToClone(candidate.chain, sim));
  applyGravity(sim);
  spawnNewTiles(sim, lookaheadRngFactory());
  if (checkBombs(sim)) return 0;
  const next = findGreedyChains(sim, { limit: 1 })[0];
  return next ? next.points : 0;
}

// Heuristic: defuse the most urgent reachable bomb (lowest timer) first;
// otherwise take the chain maximizing (this move's points + best next-move
// points on the resulting board + the turnover value of the cells it empties),
// a 2-ply lookahead over greedy-walk candidates. The turnover term is a
// forecast of value arriving after the horizon, so it sits with the rollout
// term, not with the immediate score. Without lookaheadRngFactory this falls
// back to plain 1-ply (highest immediate score) and neither forecast applies.
// Returns null if the board has no legal move.
function chooseMove(state, options = {}) {
  const { lookaheadRngFactory } = options;

  const bombs = findBombTiles(state).sort((a, b) => a.bombTimer - b.bombTimer);
  for (const bomb of bombs) {
    const result = findBestChain(state, { mustEndAt: bomb, maxLength: BOMB_MAX_CHAIN_LENGTH });
    if (result) return result.chain;
  }

  const candidates = findGreedyChains(state, { limit: CANDIDATE_LIMIT });
  if (candidates.length === 0) return null;
  if (!lookaheadRngFactory || candidates.length === 1) return candidates[0].chain;

  let bestCandidate = candidates[0];
  let bestTotal = -Infinity;
  for (const candidate of candidates) {
    const emptiedCells = candidate.chain.length - 1; // the last tile survives
    const total = candidate.points
      + rolloutValue(state, candidate, lookaheadRngFactory)
      + TURNOVER_BONUS_PER_TILE * emptiedCells;
    if (total > bestTotal) {
      bestTotal = total;
      bestCandidate = candidate;
    }
  }
  return bestCandidate.chain;
}

module.exports = { chooseMove };
