const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const heur = require('./heur');
const {lookaheadChooser} = require('./lookahead');
const {makeRng} = require('./players');

const SETTINGS = {poolSize: 7, poolStart: 8};

test('the signs count pairs, ready tiles, risk and stone', () => {
  const s = E.newGame(SETTINGS, 3);
  const board = s.board.map(row => row.map(() => ({v: 8, risk: false})));
  // A board of distinct values except one pair of 16s side by side.
  let v = 1;
  for (const row of board) for (const cell of row) cell.v = 2 ** (10 + v++);
  board[0][0] = {v: 16, risk: false};
  board[0][1] = {v: 16, risk: false};
  board[6][4] = {stone: true};
  board[6][3] = {v: 4, risk: true};
  const g = heur.signs({...s, board});
  assert.deepStrictEqual(g, {ready: 32, pairs: 1, risk: 1, stones: 1});
});

test('the board-score look-ahead picks legal chains', () => {
  const pick = lookaheadChooser({depth: 2, widths: [4, 3], samples: [2], leaf: heur.leaf(heur.WEIGHTS.a)});
  const s = E.newGame(SETTINGS, 9);
  const ch = pick(s, makeRng(1));
  assert.strictEqual(E.chainError(s, ch), null);
});
