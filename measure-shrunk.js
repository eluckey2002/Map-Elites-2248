// measure-shrunk.js — is a small, no-refill version of 2248 exactly solvable?
// Run: node measure-shrunk.js
//
// THE QUESTION
//
// 2248 as shipped has ~1.87M legal moves on move one of Level 26 (RESULT-0003
// in EVIDENCE_LEDGER.md). That kills exact search outright.
//
// Two changes might rescue it, and they compound:
//   1. Small board  -> fewer chains, because chains are paths and path count
//                      explodes with area.
//   2. No refill    -> every move permanently removes tiles, so the game is
//                      SHORT. Depth is bounded by area / minChain. It also
//                      removes the last source of randomness.
//
// Branching alone does not decide this. What decides it is the size of the
// whole game tree, which is what this measures.
//
// Uses the project's own verified enumerator (`enumerateLegalChains`), the one
// behind RESULT-0003 — not a reimplementation.

const {
  makeRng, createLevelState, executeChain, applyGravity, cloneState,
} = require('./solver/engine');
const { enumerateLegalChains } = require('./solver/exact-score');

const NODE_CAP = 300_000;

function makeLevel(gridW, gridH, minChain) {
  return {
    level: 999, gridW, gridH, minChain, blockers: [], tileScale: 1,
    moves: 99, target: 1e9,
  };
}

function signature(state) {
  const out = [];
  for (let y = 0; y < state.gridHeight; y++) {
    for (let x = 0; x < state.gridWidth; x++) {
      const t = state.grid[y][x];
      out.push(t ? (t.blocker === 'stone' ? 'S' : t.value) : '.');
    }
  }
  return out.join(',');
}

/** One move with NO refill: resolve the chain, let tiles fall, spawn nothing. */
function applyNoRefill(state, chain) {
  const next = cloneState(state);
  // Re-resolve the chain against the cloned grid: the chain holds tile objects
  // from the original state, which the clone does not share.
  const mapped = chain.map((t) => next.grid[t.y][t.x]);
  executeChain(next, mapped);
  applyGravity(next);
  return next;
}

/** Exhaustively explore the no-refill game tree. */
function exploreTree(level, seed) {
  const root = createLevelState(level, makeRng(seed));
  const seen = new Set([signature(root)]);
  let frontier = [root];
  let nodes = 1;
  let depth = 0;
  let capped = false;

  while (frontier.length > 0) {
    const next = [];
    for (const st of frontier) {
      for (const chain of enumerateLegalChains(st)) {
        const child = applyNoRefill(st, chain);
        const sig = signature(child);
        if (seen.has(sig)) continue;
        seen.add(sig);
        nodes++;
        if (nodes > NODE_CAP) { capped = true; break; }
        next.push(child);
      }
      if (capped) break;
    }
    if (capped) break;
    if (next.length === 0) break;
    frontier = next;
    depth++;
  }

  return { nodes, depth, capped };
}

const CONFIGS = [
  { w: 3, h: 3, minChain: 2 },
  { w: 3, h: 4, minChain: 2 },
  { w: 4, h: 4, minChain: 2 },
  { w: 4, h: 4, minChain: 3 },
  { w: 4, h: 5, minChain: 3 },
  { w: 5, h: 5, minChain: 3 },
  { w: 5, h: 5, minChain: 4 },
  { w: 5, h: 7, minChain: 4 },  // a shipped shape, for scale
];

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

console.log('\nMOVE-ONE CHOICES (how many legal chains from the opening board)\n');
console.log('board  minChain   median      max        note');

const branchOk = new Map();

for (const c of CONFIGS) {
  const level = makeLevel(c.w, c.h, c.minChain);
  const counts = [];
  let bailed = false;

  for (const seed of SEEDS) {
    const st = createLevelState(level, makeRng(seed));
    const t0 = Date.now();
    counts.push(enumerateLegalChains(st).length);
    if (Date.now() - t0 > 20_000) { bailed = true; break; }
  }

  counts.sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)];
  const max = counts[counts.length - 1];
  branchOk.set(`${c.w}x${c.h}:${c.minChain}`, median);

  console.log(
    `${c.w}x${c.h}       ${c.minChain}    ${String(median).padStart(9)} ` +
    `${String(max).padStart(10)}   ${bailed ? 'ABORTED — too slow' : ''}`,
  );
}

console.log('\n\nWHOLE GAME TREE, no refill (every distinct position reachable)\n');
console.log('board  minChain   positions    depth    verdict');

for (const c of CONFIGS) {
  const key = `${c.w}x${c.h}:${c.minChain}`;
  if ((branchOk.get(key) || Infinity) > 50_000) {
    console.log(`${c.w}x${c.h}       ${c.minChain}    ${'—'.padStart(10)}       —    skipped: opening alone is too wide`);
    continue;
  }

  const level = makeLevel(c.w, c.h, c.minChain);
  const t0 = Date.now();
  const r = exploreTree(level, 1);
  const ms = Date.now() - t0;

  const verdict = r.capped
    ? `OVER ${NODE_CAP.toLocaleString()} — not exactly solvable`
    : `solvable exactly in ${ms}ms`;

  console.log(
    `${c.w}x${c.h}       ${c.minChain}    ${String(r.nodes).padStart(10)} ` +
    `${String(r.depth).padStart(7)}    ${verdict}`,
  );
}

console.log('');
