// solver-exact.js — exact difficulty for a seeded 2048 level.
//
// WHY THIS EXISTS
//
// The previous project ranked levels by simulating games and averaging. Tile
// spawns were random, so every "difficulty" was an estimate with noise in it,
// and ranking on a noisy estimate selects for luck (see
// HANDOFF-NEXT-MAP-ELITES.md §2 — the top 6 boards lost 10.3% on re-scoring).
//
// Once the seed is part of the level, the game is a deterministic function of
// the player's moves. Difficulty stops being a sample mean and becomes a
// property: the minimum number of moves in which the target tile can be
// reached, over every legal line of play. Search finds it exactly. There is
// nothing to average, so there is no winner's curse to guard against.
//
// HONESTY RULE
//
// A search that ran out of budget has NOT proved anything. Every result below
// carries a `status` and callers must branch on it. `minMoves` is meaningful
// only when status === 'solved'; 'unsolvable' is a proof of absence within the
// move budget; 'unknown' means the node cap was hit and the answer is still
// open. Never let 'unknown' silently become a number.

import { DIRS, EMPTY, cloneLevel, maxTile, rngSeed, step } from './engine.js';

const DEFAULT_NODE_CAP = 2_000_000;

// The largest tile value a spawn can ever contribute.
const MAX_SPAWN = 4;

/** Total value on the board. Walls are negative and must not be counted. */
function tileSum(cells) {
  let s = 0;
  for (let i = 0; i < cells.length; i++) if (cells[i] > 0) s += cells[i];
  return s;
}

/**
 * Admissible pruning bound.
 *
 * A tile of value T is built by merging, and a merge preserves total value
 * (2 + 2 = 4). So the only way board value grows is a spawn, worth at most 4.
 * If the value already present, plus the most every remaining spawn could
 * possibly add, is still short of the target, no line of play from here can
 * reach it -- whatever the player does.
 *
 * This prunes only provably hopeless branches, so the search stays exact. It
 * is what makes proving a level UNSOLVABLE cheap; without it, that proof means
 * exhausting the whole tree.
 */
function hopeless(cells, target, movesLeft) {
  return tileSum(cells) + MAX_SPAWN * movesLeft < target;
}

function stateKey(cells, rngState) {
  // rngState is almost always implied by depth (see the invariant on `step`),
  // but a full board skips its spawn and desynchronises the tape, so it stays
  // in the key. The cost is a few characters per node.
  let s = '';
  for (let i = 0; i < cells.length; i++) s += cells[i] + ',';
  return s + '|' + rngState;
}

function pathOf(node) {
  const out = [];
  for (let n = node; n.prev; n = n.prev) out.push(n.dir);
  return out.reverse();
}

/**
 * Exact minimum number of moves to bring `level.target` onto the board,
 * playing `level` from `seed`, within `level.budget` moves.
 *
 * Breadth-first, so the first solved node found is provably optimal: every
 * shallower line of play was fully expanded before it.
 *
 * @returns {{
 *   status: 'solved' | 'unsolvable' | 'unknown',
 *   minMoves: number | null,
 *   solution: string[] | null,
 *   nodes: number,
 *   depthReached: number,
 * }}
 */
export function exactMinMoves(
  level,
  seed,
  { pFour = 0.1, nodeCap = DEFAULT_NODE_CAP, prune = true } = {},
) {
  const start = cloneLevel(level);
  const budget = start.budget;

  if (maxTile(start) >= start.target) {
    return { status: 'solved', minMoves: 0, solution: [], nodes: 1, depthReached: 0 };
  }

  if (prune && hopeless(start.cells, start.target, budget)) {
    // Proved short of the target on tile value alone; no search needed.
    return { status: 'unsolvable', minMoves: null, solution: null, nodes: 1, depthReached: 0 };
  }

  const seen = new Set([stateKey(start.cells, rngSeed(seed))]);
  let frontier = [{ cells: start.cells, rngState: rngSeed(seed), prev: null, dir: null }];
  let nodes = 1;
  let depth = 0;

  while (frontier.length > 0 && depth < budget) {
    depth++;
    const next = [];

    for (const node of frontier) {
      const lv = { w: start.w, h: start.h, cells: node.cells };

      for (const dir of DIRS) {
        const res = step(lv, dir, node.rngState, { pFour });
        if (!res.moved) continue;

        const key = stateKey(res.cells, res.rngState);
        if (seen.has(key)) continue;
        seen.add(key);
        nodes++;

        const child = { cells: res.cells, rngState: res.rngState, prev: node, dir };

        if (maxTile({ cells: res.cells }) >= start.target) {
          return {
            status: 'solved',
            minMoves: depth,
            solution: pathOf(child),
            nodes,
            depthReached: depth,
          };
        }

        if (!prune || !hopeless(res.cells, start.target, budget - depth)) next.push(child);

        if (nodes > nodeCap) {
          return { status: 'unknown', minMoves: null, solution: null, nodes, depthReached: depth };
        }
      }
    }

    frontier = next;
  }

  // Frontier emptied, or the budget was exhausted, with no target tile reached.
  // Either way this is a complete search of everything reachable in `budget`
  // moves: a proof that the level cannot be solved in time.
  return { status: 'unsolvable', minMoves: null, solution: null, nodes, depthReached: depth };
}

/**
 * Independent reference implementation: depth-limited exhaustive search with no
 * deduplication and no early exit, used only to cross-check `exactMinMoves` on
 * small levels. Deliberately naive — it shares the step function with the real
 * solver but none of its search machinery, so a bug in the transposition set,
 * the frontier handling, or the optimality argument shows up as disagreement.
 */
export function referenceMinMoves(level, seed, { pFour = 0.1 } = {}) {
  const start = cloneLevel(level);
  let best = null;

  const recurse = (cells, rngState, depth) => {
    if (maxTile({ cells }) >= start.target) {
      if (best === null || depth < best) best = depth;
      return;
    }
    if (depth >= start.budget) return;
    if (best !== null && depth + 1 >= best) return; // cannot beat the incumbent

    for (const dir of DIRS) {
      const res = step({ w: start.w, h: start.h, cells }, dir, rngState, { pFour });
      if (!res.moved) continue;
      recurse(res.cells, res.rngState, depth + 1);
    }
  };

  recurse(start.cells, rngSeed(seed), 0);
  return best;
}

/**
 * Descriptors for a level, all exact. These are candidates for MAP-Elites axes;
 * none of them is a fitness value.
 *
 * Note `occupancy` and `wallCount` are read off the starting board, so they
 * cost nothing. `minMoves` requires the search.
 */
export function levelDescriptors(level) {
  let filled = 0;
  let walls = 0;
  for (const v of level.cells) {
    if (v === EMPTY) continue;
    if (v < 0) walls++;
    else filled++;
  }
  const area = level.w * level.h;
  return {
    area,
    wallCount: walls,
    occupancy: filled / (area - walls || 1),
    budget: level.budget,
    target: level.target,
  };
}
