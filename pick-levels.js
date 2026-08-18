// pick-levels.js — curate a playable set spanning the difficulty range.
// Run: node pick-levels.js
//
// Writes play/levels.json. Every level here is PROVEN solvable and carries its
// exact optimal move count, so a human playthrough can be compared against
// perfect play. That comparison is the calibration data — it is the one thing
// the solver cannot produce on its own.

import { writeFileSync, mkdirSync } from 'node:fs';
import { WALL, createLevel, mulberry32 } from './engine.js';
import { exactMinMoves } from './solver-exact.js';

const rng = mulberry32(777);

// Wall counts start at 4: descriptor-check.js showed the first three walls do
// nothing at all, so anything below that is a level with decorative blockers.
function randomLevel() {
  const cells = new Array(16).fill(0);
  const free = [...cells.keys()];
  const take = () => free.splice(Math.floor(rng() * free.length), 1)[0];

  const wallCount = 4 + Math.floor(rng() * 2);
  for (let i = 0; i < wallCount; i++) cells[take()] = WALL;

  const startTiles = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < startTiles; i++) cells[take()] = rng() < 0.75 ? 2 : 4;

  // Target 64 was never solvable on a 4x4 within 20 moves, so it is dropped.
  const target = rng() < 0.5 ? 16 : 32;
  const budget = 10 + Math.floor(rng() * 11);
  const seed = Math.floor(rng() * 1e9);

  return { level: createLevel({ w: 4, h: 4, cells, target, budget }), seed, wallCount };
}

// One level per difficulty band, so the set spans easy to hard rather than
// clustering wherever the generator happens to be dense.
const wanted = [
  { band: 'gentle', lo: 4, hi: 6 },
  { band: 'steady', lo: 7, hi: 9 },
  { band: 'firm', lo: 10, hi: 12 },
  { band: 'hard', lo: 13, hi: 15 },
  { band: 'brutal', lo: 16, hi: 24 },
];

const picked = [];
let tried = 0;

while (picked.length < wanted.length && tried < 4000) {
  tried++;
  const { level, seed, wallCount } = randomLevel();
  const r = exactMinMoves(level, seed, { nodeCap: 300_000 });
  if (r.status !== 'solved') continue;

  const slot = wanted.find((wnt) =>
    r.minMoves >= wnt.lo && r.minMoves <= wnt.hi &&
    !picked.some((p) => p.band === wnt.band));
  if (!slot) continue;

  // Slack -- moves to spare beyond perfect play -- is how forgiving the level
  // is. Zero slack means only the optimal line wins.
  picked.push({
    band: slot.band,
    seed,
    target: level.target,
    budget: level.budget,
    wallCount,
    optimalMoves: r.minMoves,
    slack: level.budget - r.minMoves,
    cells: Array.from(level.cells),
  });
  console.log(`${slot.band.padEnd(8)} optimal=${String(r.minMoves).padEnd(3)} ` +
    `budget=${String(level.budget).padEnd(3)} slack=${String(level.budget - r.minMoves).padEnd(3)} ` +
    `target=${level.target} walls=${wallCount}`);
}

picked.sort((a, b) => a.optimalMoves - b.optimalMoves);

mkdirSync('play', { recursive: true });
writeFileSync('play/levels.json', JSON.stringify(picked, null, 2));
console.log(`\nwrote play/levels.json — ${picked.length} levels, ${tried} candidates examined`);
