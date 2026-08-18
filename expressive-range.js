// expressive-range.js — what kinds of level can this generator actually make?
// Run: node expressive-range.js [count]
//
// This is step 2 of the build order in HANDOFF-NEXT-MAP-ELITES.md §5, and it is
// deliberately BEFORE any ranking. The previous project skipped it, went
// straight to ranking, and spent a session discovering the hard way that its
// numbers were noise. The point here is not to find good levels. It is to look
// at the cloud and find out whether there is anything to search at all.
//
// Everything printed below is exact. No sampling, no averaging, no estimate.

import { WALL, createLevel, mulberry32 } from './engine.js';
import { exactMinMoves, levelDescriptors } from './solver-exact.js';

const COUNT = Number(process.argv[2] || 300);

// ---------------------------------------------------------------------------
// The generator: random seeded levels inside a declared space.
//
// A level is (board, walls, target, budget, seed). The seed is PART OF THE
// LEVEL, not a runtime accident -- that is what makes difficulty a fact rather
// than an average.
// ---------------------------------------------------------------------------

function randomLevel(rng) {
  const w = 4;
  const h = 4;
  const cells = new Array(w * h).fill(0);

  const wallCount = Math.floor(rng() * 4);        // 0-3 walls
  const startTiles = 2 + Math.floor(rng() * 3);   // 2-4 starting tiles

  const free = [...cells.keys()];
  const take = () => free.splice(Math.floor(rng() * free.length), 1)[0];

  for (let i = 0; i < wallCount; i++) cells[take()] = WALL;
  for (let i = 0; i < startTiles; i++) cells[take()] = rng() < 0.75 ? 2 : 4;

  const target = [16, 32, 64][Math.floor(rng() * 3)];
  const budget = 8 + Math.floor(rng() * 13);      // 8-20 moves
  const seed = Math.floor(rng() * 1e9);

  return { level: createLevel({ w, h, cells, target, budget }), seed };
}

// ---------------------------------------------------------------------------
// Generate and measure.
// ---------------------------------------------------------------------------

const rng = mulberry32(20260818);
const rows = [];
const counts = { solved: 0, unsolvable: 0, unknown: 0 };
let totalMs = 0;

for (let i = 0; i < COUNT; i++) {
  const { level, seed } = randomLevel(rng);
  const t0 = Date.now();
  const r = exactMinMoves(level, seed, { nodeCap: 400_000 });
  totalMs += Date.now() - t0;

  counts[r.status]++;
  if (r.status !== 'solved') continue;

  const d = levelDescriptors(level);
  rows.push({
    minMoves: r.minMoves,
    // How much of the level's move budget the optimal line consumes. Near 1.0
    // means a tight level with no slack; low means the budget is generous.
    slack: r.minMoves / level.budget,
    occupancy: d.occupancy,
    wallCount: d.wallCount,
    target: d.target,
    budget: d.budget,
    nodes: r.nodes,
  });
}

console.log(`\ngenerated ${COUNT} levels in ${(totalMs / 1000).toFixed(1)}s ` +
  `(${(totalMs / COUNT).toFixed(0)}ms each)`);
console.log(`  solvable:   ${counts.solved}`);
console.log(`  impossible: ${counts.unsolvable}`);
console.log(`  gave up:    ${counts.unknown}   (node cap; answer still open)`);

if (rows.length === 0) {
  console.log('\nNothing solvable — the generator space is misconfigured.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// The cloud. Two descriptors, plotted as text, exactly as Smith & Whitehead
// prescribe. If this comes out as a blob in one corner, the generator has no
// expressive range and no search will give it one.
// ---------------------------------------------------------------------------

function histogram(label, values, buckets, lo, hi) {
  const bins = new Array(buckets).fill(0);
  for (const v of values) {
    let b = Math.floor(((v - lo) / (hi - lo)) * buckets);
    if (b < 0) b = 0;
    if (b >= buckets) b = buckets - 1;
    bins[b]++;
  }
  const peak = Math.max(...bins);
  console.log(`\n${label}`);
  for (let b = 0; b < buckets; b++) {
    const from = (lo + ((hi - lo) * b) / buckets).toFixed(2);
    const bar = '#'.repeat(Math.round((bins[b] / peak) * 40));
    console.log(`  ${from.padStart(6)} | ${bar} ${bins[b]}`);
  }
}

histogram('minimum moves to solve (exact difficulty)',
  rows.map((r) => r.minMoves), 12,
  Math.min(...rows.map((r) => r.minMoves)),
  Math.max(...rows.map((r) => r.minMoves)) + 1);

histogram('slack — optimal moves as a fraction of budget',
  rows.map((r) => r.slack), 10, 0, 1);

// ---------------------------------------------------------------------------
// Descriptor quality, per traps 2 and 3 in the handoff:
//   - correlated with difficulty  -> the archive collapses to a ranked list
//   - correlated with nothing     -> the descriptor measures nothing at all
// A good axis sits between: low correlation, but real variation.
// ---------------------------------------------------------------------------

function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

const diff = rows.map((r) => r.minMoves);
console.log('\ncandidate descriptors vs exact difficulty (want |r| low, spread wide)');
for (const key of ['occupancy', 'wallCount', 'target', 'budget', 'slack']) {
  const xs = rows.map((r) => r[key]);
  const uniq = new Set(xs).size;
  const r = pearson(xs, diff);
  console.log(`  ${key.padEnd(11)} r=${r.toFixed(2).padStart(6)}   distinct values=${uniq}`);
}

const ms = rows.map((r) => r.minMoves);
console.log(`\ndifficulty range: ${Math.min(...ms)} to ${Math.max(...ms)} moves ` +
  `across ${new Set(ms).size} distinct values`);
