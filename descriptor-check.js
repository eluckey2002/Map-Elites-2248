// descriptor-check.js — do walls actually change anything?
// Run: node descriptor-check.js
//
// The expressive range run showed wallCount correlating with difficulty at
// r = -0.01. HANDOFF-NEXT-MAP-ELITES.md §5 trap 3 warns that this is exactly
// what a descriptor measuring NOTHING looks like: it passes the "uncorrelated
// with fitness" test for the worst possible reason. The previous project hit
// this (structural descriptors at r = -0.05, +0.01) and also found blockers
// barely mattered in 2248. So the correlation is not enough — run the
// controlled version.
//
// The test: hold the board, target, budget and seed FIXED, and add walls one at
// a time. If difficulty moves, walls carry information and the near-zero
// correlation was just the population averaging out. If difficulty sits still,
// walls are decoration and must not become an archive axis.

import { WALL, createLevel } from './engine.js';
import { exactMinMoves } from './solver-exact.js';

const BASE = [
  2, 0, 0, 0,
  0, 2, 0, 0,
  0, 0, 4, 0,
  0, 0, 0, 0,
];

// Positions to convert to walls, in order. All start empty in BASE.
const WALL_SLOTS = [3, 12, 6, 9, 1, 14];

let changedAny = 0;
let comparisons = 0;

for (const seed of [11, 202, 3003, 40004, 57]) {
  const results = [];

  for (let nWalls = 0; nWalls <= 4; nWalls++) {
    const cells = [...BASE];
    for (let i = 0; i < nWalls; i++) cells[WALL_SLOTS[i]] = WALL;

    const lv = createLevel({ w: 4, h: 4, cells, target: 16, budget: 14 });
    const r = exactMinMoves(lv, seed);
    results.push(r.status === 'solved' ? r.minMoves : r.status);
  }

  const baseline = results[0];
  const moved = results.some((v) => v !== baseline);
  if (moved) changedAny++;
  comparisons++;

  console.log(`seed ${String(seed).padEnd(6)} walls 0..4 -> ${results.join('  ')}` +
    `${moved ? '' : '   (no effect)'}`);
}

console.log(`\nwalls changed the exact difficulty on ${changedAny} of ${comparisons} boards`);
console.log(changedAny === 0
  ? 'VERDICT: walls are decoration here — do NOT use wallCount as an archive axis.'
  : 'VERDICT: walls carry real information; the near-zero population correlation\n' +
    '         is the population averaging out, not an empty descriptor.');
