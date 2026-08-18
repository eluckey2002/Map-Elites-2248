// prune-check.js — does the pruning bound ever change an answer?
// Run: node prune-check.js
//
// The bound is claimed to be admissible: it discards only branches that
// provably cannot reach the target. If that claim is wrong it would make
// levels look unsolvable that are in fact solvable — a silent corruption of
// every fitness number downstream. So compare pruned against unpruned on a
// wide spread of levels and require exact agreement, not just similar results.

import { WALL, createLevel } from './engine.js';
import { exactMinMoves } from './solver-exact.js';

let checked = 0;
let agreed = 0;
let bitCount = 0; // levels where the bound actually did some work
const problems = [];

for (let seed = 1; seed <= 220; seed++) {
  const w = 3 + (seed % 2);
  const h = 3 + ((seed >> 2) % 2);
  const cells = new Array(w * h).fill(0);

  cells[seed % cells.length] = 2;
  cells[(seed * 7) % cells.length] = seed % 3 === 0 ? 4 : 2;
  if (seed % 4 === 0) cells[(seed * 5) % cells.length] = 2;
  if (seed % 6 === 0) cells[(seed * 11) % cells.length] = WALL;

  // Spread targets and budgets so some levels are comfortably solvable, some
  // are impossible on tile value alone, and some are genuinely borderline.
  const target = [8, 16, 32][seed % 3];
  const budget = 6 + (seed % 7);

  const lv = createLevel({ w, h, cells, target, budget });

  const on = exactMinMoves(lv, seed, { prune: true });
  const off = exactMinMoves(lv, seed, { prune: false });

  checked++;
  if (on.status === off.status && on.minMoves === off.minMoves) agreed++;
  else problems.push(`seed ${seed} ${w}x${h} t${target} b${budget}: pruned=${on.status}/${on.minMoves} unpruned=${off.status}/${off.minMoves}`);

  if (on.nodes < off.nodes) bitCount++;
}

console.log(`levels compared:        ${checked}`);
console.log(`identical answers:      ${agreed}`);
console.log(`bound actually pruned:  ${bitCount}`);
if (problems.length) {
  console.log('\nDISAGREEMENTS:');
  for (const p of problems.slice(0, 10)) console.log('  ' + p);
}
console.log(`\n${agreed === checked ? 'PASS — pruning is answer-preserving' : 'FAIL — pruning changed answers'}`);
process.exit(agreed === checked ? 0 : 1);
