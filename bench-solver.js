// bench-solver.js — what does exact search actually cost?
// Run: node bench-solver.js
//
// MAP-Elites needs thousands of evaluations, so the per-level cost of the
// solver is the budget that governs the whole design. Measure it before
// building on top of it.

import { createLevel } from './engine.js';
import { exactMinMoves } from './solver-exact.js';

const cfgs = [
  { name: '4x4 target 16 budget 10', w: 4, h: 4, target: 16, budget: 10 },
  { name: '4x4 target 32 budget 12', w: 4, h: 4, target: 32, budget: 12 },
  { name: '4x4 target 32 budget 16', w: 4, h: 4, target: 32, budget: 16 },
  { name: '4x4 target 64 budget 20', w: 4, h: 4, target: 64, budget: 20 },
  { name: '3x3 target 32 budget 14', w: 3, h: 3, target: 32, budget: 14 },
  { name: '3x3 target 64 budget 18', w: 3, h: 3, target: 64, budget: 18 },
];

for (const c of cfgs) {
  const cells = new Array(c.w * c.h).fill(0);
  cells[0] = 2;
  cells[c.w + 1] = 2;
  const lv = createLevel({ w: c.w, h: c.h, cells, target: c.target, budget: c.budget });

  const t0 = Date.now();
  const r = exactMinMoves(lv, 7);
  const ms = Date.now() - t0;

  console.log(
    `${c.name.padEnd(26)} ${String(r.status).padEnd(11)} ` +
    `min=${String(r.minMoves).padEnd(5)} nodes=${String(r.nodes).padEnd(9)} ${ms}ms`,
  );
}
