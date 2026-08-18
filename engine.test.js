// engine.test.js — merge semantics and determinism.
// Run: node engine.test.js

import {
  EMPTY, WALL, createLevel, move, mulberry32, spawn, playEpisode, legalMoves, boardKey,
} from './engine.js';

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(Array.from(got));
  const w = JSON.stringify(Array.from(want));
  if (g === w) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got  ${g}\n         want ${w}`); }
};
const is = (name, got, want) => {
  if (got === want) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n         got  ${got}\n         want ${want}`); }
};

// Single row helper: 1 x N board.
const row = (cells) => createLevel({ w: cells.length, h: 1, cells });

console.log('\nmerge semantics');
eq('[2,2,4] left -> [4,4,0]',        move(row([2, 2, 4]), 'left').cells,        [4, 4, 0]);
eq('[2,2,2] left -> [4,2,0]',        move(row([2, 2, 2]), 'left').cells,        [4, 2, 0]);
eq('[2,2,2] right -> [0,2,4]',       move(row([2, 2, 2]), 'right').cells,       [0, 2, 4]);
eq('[2,2,2,2] left -> [4,4,0,0]',    move(row([2, 2, 2, 2]), 'left').cells,     [4, 4, 0, 0]);
eq('[4,4,2,2] left -> [8,4,0,0]',    move(row([4, 4, 2, 2]), 'left').cells,     [8, 4, 0, 0]);
eq('no chain merge [4,4,8]',         move(row([4, 4, 8]), 'left').cells,        [8, 8, 0]);
eq('gap closes [0,2,0,2]',           move(row([0, 2, 0, 2]), 'left').cells,     [4, 0, 0, 0]);
eq('no merge of unequals [2,4,8,16]',move(row([2, 4, 8, 16]), 'left').cells,    [2, 4, 8, 16]);

console.log('\nscoring');
is('[2,2] left gains 4',   move(row([2, 2]), 'left').gained, 4);
is('[4,4,2,2] gains 12',   move(row([4, 4, 2, 2]), 'left').gained, 12);
is('no merge gains 0',     move(row([2, 4]), 'left').gained, 0);

console.log('\nmoved flag (illegal moves must not spawn)');
is('full unmergeable row is frozen both ways',
   move(row([2, 4, 8, 16]), 'left').moved || move(row([2, 4, 8, 16]), 'right').moved, false);
eq('row with a gap CAN move right',  move(row([2, 4, 8, 0]), 'right').cells,  [0, 2, 4, 8]);
is('row with a gap cannot move left', move(row([2, 4, 8, 0]), 'left').moved,  false);
is('mergeable row is a move',      move(row([2, 2, 4, 8]), 'left').moved,   true);
is('empty row cannot move',        move(row([0, 0, 0, 0]), 'left').moved,   false);

console.log('\nwalls');
eq('tiles cannot cross a wall',       move(row([0, WALL, 2]), 'left').cells,       [0, WALL, 2]);
eq('runs slide independently',        move(row([2, 2, WALL, 4, 0]), 'left').cells, [4, 0, WALL, 4, 0]);
eq('wall blocks a would-be merge',    move(row([2, WALL, 2, 0]), 'left').cells,    [2, WALL, 2, 0]);
is('wall-blocked row is not a move',  move(row([2, WALL, 2, 0]), 'left').moved,    false);

console.log('\n2d traversal');
{
  //  2 2 . .
  //  2 . . .
  //  . . . .
  //  . . . .
  const lv = createLevel({ cells: [2, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  eq('up merges columns', move(lv, 'up').cells,
     [4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  eq('left merges rows', move(lv, 'left').cells,
     [4, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
}

console.log('\npurity');
{
  const lv = createLevel({ cells: [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  const before = boardKey(lv);
  move(lv, 'left');
  is('move() does not mutate its input', boardKey(lv), before);
}

console.log('\ndeterminism');
{
  const seq = (seed) => { const r = mulberry32(seed); return [r(), r(), r(), r()].join(','); };
  is('same seed -> same stream',      seq(42), seq(42));
  is('different seed -> different',   seq(42) !== seq(43), true);

  const lv = () => createLevel({ target: 64, budget: 40 });
  const greedy = (b, legal) => legal[0];
  const a = playEpisode(lv(), greedy, 7);
  const b = playEpisode(lv(), greedy, 7);
  is('same seed -> identical episode', JSON.stringify(a), JSON.stringify(b));
}

console.log('\nspawn distribution (seeded, 10k draws)');
{
  const rng = mulberry32(12345);
  let fours = 0;
  for (let i = 0; i < 10000; i++) {
    const lv = createLevel({});
    spawn(lv, rng);
    if (Array.from(lv.cells).includes(4)) fours++;
  }
  const rate = fours / 10000;
  is(`p(4) ~= 0.10 (got ${rate.toFixed(3)})`, Math.abs(rate - 0.1) < 0.015, true);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
