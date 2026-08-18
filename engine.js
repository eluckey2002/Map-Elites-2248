// engine.js — vanilla 2048 rules. Deterministic, headless, no rendering.
//
// This is the ONLY implementation of the rules. The headless search imports it,
// and the p5 viewer imports it. If these ever diverge, every fitness number
// collected becomes a lie.
//
// Board model: flat array, index = y * w + x.
//   0   = empty
//   -1  = wall (immovable, blocks sliding, never merges)
//   n>0 = tile of value n (always a power of two)

export const EMPTY = 0;
export const WALL = -1;

export const DIRS = ['left', 'right', 'up', 'down'];

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32). Same seed => same sequence, forever, everywhere.
// ---------------------------------------------------------------------------

/**
 * One step of mulberry32, as a pure function of the generator state.
 *
 * This is the primitive; `mulberry32` below is a closure over it. The solver
 * needs the pure form: it explores many branches from one position, and a
 * generator with hidden mutable state cannot be forked. Keeping both on top of
 * one step function means the search and the playable game can never drift.
 */
export function rngStep(a0) {
  const a = (a0 + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { state: a, value: ((t ^ (t >>> 14)) >>> 0) / 4294967296 };
}

export function rngSeed(seed) {
  return seed >>> 0;
}

export function mulberry32(seed) {
  let a = rngSeed(seed);
  return function rng() {
    const r = rngStep(a);
    a = r.state;
    return r.value;
  };
}

// ---------------------------------------------------------------------------
// Level / board construction
// ---------------------------------------------------------------------------

export function createLevel({ w = 4, h = 4, cells = null, target = 128, budget = 20 } = {}) {
  return {
    w,
    h,
    cells: cells ? Int32Array.from(cells) : new Int32Array(w * h),
    target,
    budget,
  };
}

export function cloneLevel(lv) {
  return { w: lv.w, h: lv.h, cells: Int32Array.from(lv.cells), target: lv.target, budget: lv.budget };
}

export function boardKey(lv) {
  return `${lv.w}x${lv.h}:${Array.from(lv.cells).join(',')}`;
}

// ---------------------------------------------------------------------------
// Traversal order
//
// For each direction, produce the lines of the board as arrays of flat indices,
// ordered so that index 0 of each line is the cell nearest the wall the tiles
// are sliding TOWARD. Everything downstream can then treat every line as
// "slide toward the front", regardless of direction.
// ---------------------------------------------------------------------------

export function lines(w, h, dir) {
  const out = [];
  if (dir === 'left' || dir === 'right') {
    for (let y = 0; y < h; y++) {
      const line = [];
      for (let x = 0; x < w; x++) line.push(y * w + x);
      out.push(dir === 'left' ? line : line.reverse());
    }
  } else {
    for (let x = 0; x < w; x++) {
      const line = [];
      for (let y = 0; y < h; y++) line.push(y * w + x);
      out.push(dir === 'up' ? line : line.reverse());
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// The core: slide + merge one contiguous run of non-wall cells toward index 0.
//
// Vanilla 2048 semantics, preserved exactly:
//   - each tile may take part in at most ONE merge per move
//   - merges resolve in the direction of travel, so [2,2,2] -> [4,2]
//     (the two nearest the target wall merge, the trailing one does not)
//   - [2,2,2,2] -> [4,4], never [8]
// ---------------------------------------------------------------------------

function slideRun(vals) {
  const packed = vals.filter((v) => v !== EMPTY);
  const out = [];
  let gained = 0;
  for (let i = 0; i < packed.length; i++) {
    if (i + 1 < packed.length && packed[i] === packed[i + 1]) {
      const merged = packed[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // consume the partner; neither tile can merge again this move
    } else {
      out.push(packed[i]);
    }
  }
  while (out.length < vals.length) out.push(EMPTY);
  return { out, gained };
}

/**
 * Apply a move. Pure: returns a new cells array, never mutates the input.
 * `moved` is false when nothing shifted or merged — those moves are illegal
 * in 2048 and must NOT trigger a spawn.
 */
export function move(lv, dir) {
  const cells = Int32Array.from(lv.cells);
  let moved = false;
  let gained = 0;

  for (const line of lines(lv.w, lv.h, dir)) {
    // Walls split a line into independent runs; tiles can never cross one.
    let run = [];
    const flush = () => {
      if (run.length === 0) return;
      const vals = run.map((i) => cells[i]);
      const { out, gained: g } = slideRun(vals);
      gained += g;
      for (let k = 0; k < run.length; k++) {
        if (cells[run[k]] !== out[k]) moved = true;
        cells[run[k]] = out[k];
      }
      run = [];
    };
    for (const idx of line) {
      if (cells[idx] === WALL) flush();
      else run.push(idx);
    }
    flush();
  }

  return { cells, moved, gained };
}

// ---------------------------------------------------------------------------
// Queries and spawning
// ---------------------------------------------------------------------------

export function emptyCells(lv) {
  const out = [];
  for (let i = 0; i < lv.cells.length; i++) if (lv.cells[i] === EMPTY) out.push(i);
  return out;
}

export function maxTile(lv) {
  let m = 0;
  for (const v of lv.cells) if (v > m) m = v;
  return m;
}

export function legalMoves(lv) {
  return DIRS.filter((d) => move(lv, d).moved);
}

export function isStuck(lv) {
  return legalMoves(lv).length === 0;
}

/** Spawn a tile: 2 with p=0.9, 4 with p=0.1. Mutates `lv.cells`. */
export function spawn(lv, rng, pFour = 0.1) {
  const free = emptyCells(lv);
  if (free.length === 0) return null;
  const idx = free[Math.floor(rng() * free.length)];
  lv.cells[idx] = rng() < pFour ? 4 : 2;
  return idx;
}

// ---------------------------------------------------------------------------
// The deterministic step: move + spawn, with the RNG carried as a value.
//
// This is what makes exact search possible. Given (cells, rngState), a move
// yields exactly one successor -- no hidden generator, nothing to fork.
//
// INVARIANT, relied on by the solver: a successful move consumes exactly two
// random numbers (one to pick the empty cell, one to pick 2-vs-4), and an
// unsuccessful one consumes none. So after k successful moves the RNG state is
// a function of k alone, never of WHICH moves were made. The spawn *positions*
// still depend on the board; only the tape position is path-independent.
//
// The single exception is a board with no empty cell, where the spawn is
// skipped and no numbers are drawn. `rngState` is therefore still part of the
// search key -- it is nearly always redundant, and cheap enough to keep honest.
// ---------------------------------------------------------------------------

export function step(lv, dir, rngState, { pFour = 0.1 } = {}) {
  const res = move(lv, dir);
  if (!res.moved) {
    return { moved: false, cells: lv.cells, gained: 0, rngState, spawnedAt: null };
  }

  const cells = res.cells;
  let a = rngState;
  let spawnedAt = null;

  const free = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] === EMPTY) free.push(i);

  if (free.length > 0) {
    const pick = rngStep(a);
    a = pick.state;
    spawnedAt = free[Math.floor(pick.value * free.length)];
    const val = rngStep(a);
    a = val.state;
    cells[spawnedAt] = val.value < pFour ? 4 : 2;
  }

  return { moved: true, cells, gained: res.gained, rngState: a, spawnedAt };
}

// ---------------------------------------------------------------------------
// Episode runner — this is the unit of fitness evaluation.
//
// A level is *solved* when the target tile appears within the move budget.
// Returns enough detail for fitness to be computed without re-simulating.
// ---------------------------------------------------------------------------

export function playEpisode(level, policy, seed, { pFour = 0.1 } = {}) {
  const lv = cloneLevel(level);
  let rngState = rngSeed(seed);
  // The policy draws from its own stream, so a randomising policy cannot shift
  // the spawn tape out from under the solver's path-independence invariant.
  const policyRng = mulberry32(seed ^ 0x9e3779b9);
  let score = 0;
  let moves = 0;

  for (; moves < lv.budget; ) {
    if (maxTile(lv) >= lv.target) break;
    const legal = legalMoves(lv);
    if (legal.length === 0) break;

    const dir = policy(lv, legal, policyRng);
    const res = step(lv, dir, rngState, { pFour });
    if (!res.moved) break; // policy returned an illegal move; treat as forfeit
    lv.cells = res.cells;
    rngState = res.rngState;
    score += res.gained;
    moves++;
  }

  const best = maxTile(lv);
  return {
    solved: best >= lv.target,
    movesUsed: moves,
    score,
    maxTile: best,
    // Fraction of the budget consumed. Near 1.0 on a solve == tight design.
    budgetUsed: lv.budget === 0 ? 1 : moves / lv.budget,
  };
}
