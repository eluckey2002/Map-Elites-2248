// solver-exact.test.js — does the solver return the TRUE minimum?
// Run: node solver-exact.test.js
//
// Three kinds of check, in increasing strength:
//   1. hand-computed answers on boards small enough to reason about by eye
//   2. agreement with an independent exhaustive search over random levels
//   3. the determinism claim itself — same level and seed, same answer

import { WALL, createLevel, playEpisode } from './engine.js';
import { exactMinMoves, referenceMinMoves } from './solver-exact.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  if (got === want) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got  ${got}\n         want ${want}`); }
};
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detail ? '\n         ' + detail : ''}`); }
};

// ---------------------------------------------------------------------------
console.log('\nhand-computed minimums');
// ---------------------------------------------------------------------------

// A single row [2,2,_,_] with target 4. One move left merges them. Nothing
// cheaper exists, because move 0 has no 4 on the board.
{
  const lv = createLevel({ w: 4, h: 1, cells: [2, 2, 0, 0], target: 4, budget: 6 });
  const r = exactMinMoves(lv, 1);
  is('two adjacent 2s -> 4 in one move', r.minMoves, 1);
  is('  ...and reports solved', r.status, 'solved');
}

// Target already present: zero moves, and the search must not "helpfully" play.
{
  const lv = createLevel({ w: 4, h: 1, cells: [8, 0, 0, 0], target: 8, budget: 6 });
  const r = exactMinMoves(lv, 1);
  is('target already on the board -> 0 moves', r.minMoves, 0);
  is('  ...solution is the empty sequence', r.solution.length, 0);
}

// [2,2,4,_] with target 8: merge the 2s (->4), then merge the 4s (->8).
// Two moves is the floor; a spawn cannot supply an 8.
{
  const lv = createLevel({ w: 4, h: 1, cells: [2, 2, 4, 0], target: 8, budget: 8 });
  const r = exactMinMoves(lv, 3);
  is('2,2,4 -> 8 in two moves', r.minMoves, 2);
}

// Frozen board: full, no equal neighbours, so no direction shifts anything.
{
  const lv = createLevel({ w: 2, h: 2, cells: [2, 4, 16, 8], target: 32, budget: 10 });
  const r = exactMinMoves(lv, 1);
  is('gridlocked board is unsolvable', r.status, 'unsolvable');
  is('  ...and returns no move count', r.minMoves, null);
}

// Walls must block a merge that would otherwise be trivial.
{
  const open = createLevel({ w: 4, h: 1, cells: [2, 0, 2, 0], target: 4, budget: 4 });
  is('no wall between the 2s -> solvable', exactMinMoves(open, 5).status, 'solved');

  const walled = createLevel({ w: 4, h: 1, cells: [2, WALL, 2, WALL], target: 4, budget: 4 });
  const r = exactMinMoves(walled, 5);
  is('wall between the 2s -> unsolvable', r.status, 'unsolvable');
}

// A budget too small to reach the target must come back unsolvable, not solved.
{
  const lv = createLevel({ w: 4, h: 1, cells: [2, 2, 4, 0], target: 8, budget: 1 });
  is('budget of 1 cannot reach a 2-move target', exactMinMoves(lv, 3).status, 'unsolvable');
}

// ---------------------------------------------------------------------------
console.log('\nagreement with independent exhaustive search');
// ---------------------------------------------------------------------------

// Random small levels, answered twice by two different search strategies. The
// reference has no transposition table and no breadth-first optimality
// argument, so if either of those is wrong here is where it shows.
{
  let checked = 0, agreed = 0;
  const disagreements = [];

  for (let seed = 1; seed <= 60; seed++) {
    const w = 2 + (seed % 2);          // 2 or 3 wide
    const h = 2 + ((seed >> 1) % 2);   // 2 or 3 tall
    const cells = new Array(w * h).fill(0);

    // Sprinkle a couple of starting tiles deterministically from the seed.
    cells[seed % cells.length] = 2;
    cells[(seed * 7) % cells.length] = seed % 3 === 0 ? 4 : 2;
    if (seed % 5 === 0) cells[(seed * 3) % cells.length] = WALL;

    const lv = createLevel({ w, h, cells, target: seed % 4 === 0 ? 16 : 8, budget: 7 });

    const exact = exactMinMoves(lv, seed).minMoves;
    const ref = referenceMinMoves(lv, seed);
    checked++;
    if (exact === ref) agreed++;
    else disagreements.push(`seed ${seed} (${w}x${h}): exact=${exact} ref=${ref}`);
  }

  ok(`exhaustive agreement on ${checked} random levels`,
    agreed === checked,
    disagreements.slice(0, 5).join('\n         '));
}

// ---------------------------------------------------------------------------
console.log('\ndeterminism — the property the whole approach rests on');
// ---------------------------------------------------------------------------

{
  const mk = () => createLevel({ w: 4, h: 4, cells: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0], target: 32, budget: 12 });

  const a = exactMinMoves(mk(), 99);
  const b = exactMinMoves(mk(), 99);
  is('same level + seed -> same minimum', a.minMoves, b.minMoves);
  is('  ...same node count too (search is reproducible)', a.nodes, b.nodes);

  const c = exactMinMoves(mk(), 12345);
  ok('a different seed is a different level',
    c.minMoves !== a.minMoves || c.nodes !== a.nodes,
    `seed 99 -> ${a.minMoves} in ${a.nodes} nodes; seed 12345 -> ${c.minMoves} in ${c.nodes}`);
}

// The solution the solver returns must actually be playable in the real engine
// and must actually reach the target. This is the check that catches a solver
// that has quietly drifted from the game.
{
  const lv = createLevel({ w: 4, h: 4, cells: [2, 2, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], target: 32, budget: 14 });
  const seed = 2026;
  const r = exactMinMoves(lv, seed);

  ok('solver found a solution to replay', r.status === 'solved', `status=${r.status}`);

  if (r.status === 'solved') {
    // Replay the exact move list through playEpisode, which knows nothing about
    // the solver, and confirm the game agrees it is a win in that many moves.
    let i = 0;
    const scripted = () => r.solution[i++];
    const ep = playEpisode(lv, scripted, seed);

    is('replaying the solution wins in the engine', ep.solved, true);
    is('  ...in exactly the number of moves claimed', ep.movesUsed, r.minMoves);
  }
}

// ---------------------------------------------------------------------------
console.log('\ncost — is exact search actually affordable?');
// ---------------------------------------------------------------------------

{
  const lv = createLevel({
    w: 4, h: 4,
    cells: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    target: 64, budget: 18,
  });
  const t0 = Date.now();
  const r = exactMinMoves(lv, 7);
  const ms = Date.now() - t0;
  console.log(`       4x4, target 64, budget 18 -> ${r.status} ${r.minMoves} | ${r.nodes} nodes | ${ms}ms`);
  ok('a realistic 4x4 level resolves without hitting the node cap', r.status !== 'unknown');
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
