const {
  findBestChain, findGreedyChains, cloneState, executeChain, applyGravity, spawnNewTiles, checkBombs,
  isBlockedTile,
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
// so anything that trades points now for a better board later is discarded
// before it can be evaluated.
//
// This was 12, on a single-level reading that was wrong. The original data
// (level 26, 50 seeds) was width 12 -> 7584 avg, 24 -> 7678, and was recorded
// as "flat past ~12". It is not flat: that is a 1.2% gain, and 50 seeds of one
// level could not resolve it, so a real effect was filed as noise.
//
// Re-measured across all 51 levels on 150 unseen seeds per level (7,650 games
// per width), paired per (level, seed) against the shipped bot, with the
// standard error clustered by level:
//
//     width 12  +0.10% (t 0.4)   cap binds on 65.5% of decisions
//     width 16  +0.77% (t 2.8)                    37.7%
//     width 20  +1.01% (t 3.9)                    18.9%
//     width 24  +1.10% (t 4.1)                     5.6%
//     width 26  +1.10% (t 4.1)                     1.2%
//     width 32  +1.10% (t 4.1)   identical play to 26 — the cap never binds
//
// So the gain saturates at 24 and the knob is self-limiting: boards offer a
// median of 15 legal chains and at most 30, so lookahead work plateaus at
// 1.37x the old setting no matter how high this goes. 24 buys the whole
// effect at 1.36x. Anything below it is throwing away real options on the
// majority of moves.
//
// See EVIDENCE_LEDGER RESULT-0010.
const CANDIDATE_LIMIT = 24;

// How the chain walk chooses between equally-good next tiles.
//
// The walk is self-avoiding and never backtracks, so taking a well-connected
// tile early can wall it off from tiles it could still have reached. Measured
// against full enumeration of every legal chain, the plain walk finds 11-tile
// chains on boards where 19-tile chains exist, and because points scale with
// the chain sum that is close to half the points available on the board's best
// move: it reaches 0.56 of the best mergeable-sum chain, averaged over 16
// boards across six levels.
//
// 'degree' applies Warnsdorff's rule -- the standard heuristic for long
// self-avoiding paths in a grid -- as a TIE-BREAK: among next tiles of equal
// value, take the one with the fewest onward moves, because a nearly cut-off
// tile has to be used now or lost, while a well-connected one will still be
// there later. That lifts the same measure to 0.69 and never scored below the
// plain walk on any board tested.
//
// It stays a tie-break. Ranking on connectivity ahead of value scores 0.19 --
// far worse than doing nothing -- because lowest-value-first is what makes the
// walk long in the first place. `engine.test.js` guards that ordering.
//
// Worth +5.25% median score against the previous bot (geometric mean of
// per-game log-ratios, 51 levels x 300 unseen seeds = 15,300 games per arm,
// paired per (level, seed), standard error clustered by level, n = 51,
// t = 15.7), for about 1.16x the compute. 50 of 51 levels improve. A 100-seed
// pilot on a different disjoint seed set measured +4.87%; the confirmation came
// back larger, so the effect is not a selection artifact.
//
// See EVIDENCE_LEDGER RESULT-0011.
const CHAIN_TIE_BREAK = 'degree';

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
//
// This is points-per-cell AT TILE SCALE 1. It is derived above from expected
// spawn value, which scales with the level's tile scale, while every other
// ranking term is already in points and scales on its own. Leaving it fixed
// would quietly de-weight turnover on large-value levels and make the bot play
// worse there for no reason but a unit mismatch.
const TURNOVER_BONUS_PER_TILE = 40;

// Measured worth: +2.60% median score against the same bot with this term off
// (51 levels x 300 unseen seeds = 15,300 games per arm, paired per (level,
// seed), standard error clustered by level, t = 9.4), win rate 92.3% -> 93.9%.
// A 100-seed pilot on a different disjoint seed set measured +1.76%; the
// confirmation came back larger, so the weight is not a selection artifact.
//
// The response peaks and falls: 0.25 -> +0.80%, 0.5 -> +1.16%, 1 -> +1.67%,
// 2 -> +2.60%, 4 -> +1.43%. Overweighting it makes the bot hoard tiles it never
// cashes, which is the failure mode the shape of that curve is showing.
//
// See EVIDENCE_LEDGER RESULT-0014.
const HARVEST_WEIGHT = 2;

// The tunable surface of this policy, gathered in one place so a search can
// vary it. DEFAULTS reproduce the hand-tuned bot exactly; every constant above
// is its documented derivation, not a placeholder. `wNow` is deliberately not
// tunable: it anchors the scale (multiplying all four weights by a constant
// leaves the argmax unchanged), so searching it would add a redundant
// dimension and let the search wander along a ridge that changes nothing.
const DEFAULT_PARAMS = {
  wRoll: 1,                          // weight on best next-move points
  wPlace: 1,                         // weight on a legal chain from the survivor
  turnover: TURNOVER_BONUS_PER_TILE, // points per emptied cell, at tile scale 1
  width: CANDIDATE_LIMIT,            // candidates surviving the pre-lookahead cut
  bombMax: BOMB_MAX_CHAIN_LENGTH,    // longest chain the defuse search will hunt
  tieBreak: CHAIN_TIE_BREAK,         // how the walk chooses between equal tiles
  wHarvest: HARVEST_WEIGHT,          // weight on setting up a chain of built tiles
};

// Maps a chain from the real state onto the equivalent tiles in a clone
// (same positions, different object identities).
function mapChainToClone(chain, cloned) {
  return chain.map((tile) => cloned.grid[tile.y][tile.x]);
}

// Simulates the game's execute -> gravity -> spawn sequence without mutating
// `state`. Keeping the cloned survivor object lets placement evaluation follow
// it when gravity changes its coordinates instead of inspecting the cell where
// it used to be.
function simulateCandidate(state, candidate, lookaheadRngFactory) {
  const sim = cloneState(state);
  const mappedChain = mapChainToClone(candidate.chain, sim);
  const survivor = mappedChain[mappedChain.length - 1];
  executeChain(sim, mappedChain);
  applyGravity(sim);
  spawnNewTiles(sim, lookaheadRngFactory());
  return { sim, survivor };
}

// Returns the best chain points achievable anywhere on an already-simulated
// result (0 if the bomb exploded or no chain exists).
function rolloutValue(outcome) {
  if (checkBombs(outcome.sim)) return 0;
  const next = findGreedyChains(outcome.sim, { limit: 1 })[0];
  return next ? next.points : 0;
}

// Scores only a legal future chain that begins at the merge survivor after
// execute -> gravity -> spawn. A valid longer chain necessarily has a valid
// minChain prefix, so the depth cap proves chainability without turning this
// placement signal into an exhaustive endpoint search. Its natural unit is
// points, matching the other ranking terms without introducing a tuned weight.
function remnantPlacementValueFromOutcome(outcome) {
  if (checkBombs(outcome.sim)) return 0;
  const next = findBestChain(outcome.sim, {
    mustStartAt: outcome.survivor,
    maxLength: outcome.sim.minChain,
  });
  return next ? next.points : 0;
}

function remnantPlacementValue(state, candidate, lookaheadRngFactory) {
  const outcome = simulateCandidate(state, candidate, lookaheadRngFactory);
  return remnantPlacementValueFromOutcome(outcome);
}

// The strategy the owner described, which the bot does not currently play:
// build up to a tile a few doublings above the dealt ones -- as high as you can
// go without landing off the mergeable lattice -- and then, mid game, chain
// THOSE built tiles together. A chain of equal tiles of value v sums to a
// multiple of v, so harvesting the tiles you made lands back on the lattice
// rather than bricking, and it pays enormously: eight tiles at 16x the base
// score 128x base at the 3x length multiplier, against 8x base for chaining
// what you were dealt.
//
// `remnantPlacementValueFromOutcome` above cannot see any of this. It asks one
// question -- can the survivor begin SOME legal chain next move -- so it is
// blind to which tile survived and to where the other built tiles are sitting.
// Measured: the bot completes a chain of built tiles about once per game across
// a 24-30 move budget.
//
// This term scores the survivor's harvest potential -- how usable the tile it
// just made actually is. The key is that a built tile is NOT stranded merely
// because nothing equals it. `canExtendChain` requires the opening PAIR to be
// equal and then allows equal-or-double, so a chain climbs a ladder: a lone 32
// is reachable as `16, 16, 32`. A built tile therefore looks both ways --
// half its value can climb into it, and it can climb into double its value.
//
// That is also why the bot does not have to build the big tile in one chain.
// It can make a 16, then make a 32, and the ladder connects them. Scoring only
// equal-valued company would have missed every one of those steps and pushed
// the bot to reach the whole way in a single move, which is how you overshoot
// the lattice and make a brick.
//
// Weights: an equal tile is worth most (it can open a pair with the survivor
// directly), a half-value tile next (it can climb in), double-value last (the
// survivor climbs into it, which needs a pair below it first).
//
// Distance is Chebyshev because the board is 8-connected, and near counts for
// more than far because the board churns underneath you. Scaled by the
// survivor's own value to keep the term in points, like every other term here.
//
// Only tiles above the dealt ones count. Rewarding company among the tiles the
// game hands you would just be a second turnover term.
const HARVEST_KINSHIP = [
  [1, 1.0],   // an equal tile: opens a pair with the survivor
  [0.5, 0.7], // half value: can climb into the survivor
  [2, 0.4],   // double value: the survivor can climb into it
];

function harvestValue(sim, survivor) {
  const base = 2 * (sim.tileScale || 1); // the smallest tile the game deals
  if (!survivor || survivor.value <= base) return 0;
  let kin = 0;
  for (let y = 0; y < sim.gridHeight; y++) {
    for (let x = 0; x < sim.gridWidth; x++) {
      const tile = sim.grid[y][x];
      if (!tile || tile === survivor || isBlockedTile(tile)) continue;
      let weight = 0;
      for (const [ratio, w] of HARVEST_KINSHIP) {
        if (tile.value === survivor.value * ratio) { weight = w; break; }
      }
      if (weight === 0) continue;
      const distance = Math.max(Math.abs(tile.x - survivor.x), Math.abs(tile.y - survivor.y));
      kin += weight / (1 + distance);
    }
  }
  return kin * survivor.value;
}

// Heuristic: defuse the most urgent reachable bomb (lowest timer) first;
// otherwise take the chain maximizing (this move's points + best next-move
// points on the resulting board + a legal chain beginning at the survivor +
// the turnover value of the cells it empties), a 2-ply lookahead over
// greedy-walk candidates. The turnover term is a forecast of value arriving
// after the horizon, so it sits with the rollout terms, not with the immediate
// score. Without lookaheadRngFactory this falls back to plain 1-ply (highest
// immediate score) and none of the forecasts applies.
// `options.params` overrides any subset of DEFAULT_PARAMS; omitted keys keep
// their hand-tuned value, so every existing caller is unaffected.
// Returns null if the board has no legal move.
function chooseMove(state, options = {}) {
  const { lookaheadRngFactory } = options;
  const { wRoll, wPlace, turnover, width, bombMax, tieBreak, wHarvest } = { ...DEFAULT_PARAMS, ...options.params };

  const bombs = findBombTiles(state).sort((a, b) => a.bombTimer - b.bombTimer);
  for (const bomb of bombs) {
    const result = findBestChain(state, { mustEndAt: bomb, maxLength: bombMax });
    if (result) return result.chain;
  }

  const candidates = findGreedyChains(state, { limit: width, tieBreak });
  if (candidates.length === 0) return null;
  if (!lookaheadRngFactory || candidates.length === 1) return candidates[0].chain;

  let bestCandidate = candidates[0];
  let bestTotal = -Infinity;
  for (const candidate of candidates) {
    const emptiedCells = candidate.chain.length - 1; // the last tile survives
    const outcome = simulateCandidate(state, candidate, lookaheadRngFactory);
    const total = candidate.points
      + wRoll * rolloutValue(outcome)
      + wPlace * remnantPlacementValueFromOutcome(outcome)
      + turnover * (state.tileScale || 1) * emptiedCells
      + wHarvest * harvestValue(outcome.sim, outcome.survivor);
    if (total > bestTotal) {
      bestTotal = total;
      bestCandidate = candidate;
    }
  }
  return bestCandidate.chain;
}

module.exports = { chooseMove, remnantPlacementValue, harvestValue, DEFAULT_PARAMS };
