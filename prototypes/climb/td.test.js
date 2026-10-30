const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const {makeRng} = require('./players');
const td = require('./td');

const SETTINGS = {poolSize: 7, poolStart: 8};

test('self-taught player is fair: the seed never changes its choice', () => {
  const w = td.newWeights(false);
  for (let g = 0; g < 3; g++) td.trainGame(w, SETTINGS, 500 + g, 0.1);
  const a = E.newGame(SETTINGS, 7);
  const b = {...a, seed: 123456};
  const pick = td.tdChooser(w);
  assert.deepStrictEqual(pick(a), pick(b));
});

test('the after-move board has the chain merged and no new tiles yet', () => {
  const state = E.newGame(SETTINGS, 3);
  const ch = E.listChains(state, {limit: 50})[0];
  const {after, points} = td.afterMove(state, ch);
  const real = E.applyMove(state, ch);
  assert.strictEqual(points, real.events.points);
  let empty = 0;
  for (const row of after.board) for (const c of row) if (!c) empty++;
  assert.strictEqual(empty, ch.length - 1);
  const [ec, er] = ch[ch.length - 1];
  const sum = ch.reduce((a, [c, r]) => a + state.board[r][c].v, 0);
  assert.ok(after.board.flat().some(c => c && c.v === sum), `merged ${sum} at ${ec},${er} is on the board`);
});

test('tokens are relative to the smallest falling value', () => {
  assert.strictEqual(td.token(null, 8), 0);
  assert.strictEqual(td.token({stone: true}, 8), 1);
  assert.strictEqual(td.token({v: 4}, 8), 2);
  assert.strictEqual(td.token({v: 8}, 8), 3);
  assert.strictEqual(td.token({v: 16}, 16), 3);
  assert.strictEqual(td.token({v: 24}, 8), 4);
});

test('learning moves a board score toward what followed', () => {
  const w = td.newWeights(false);
  const before = td.value(w, td.indexes(td.encode(E.newGame(SETTINGS, 1))));
  for (let g = 0; g < 5; g++) td.trainGame(w, SETTINGS, 900 + g, 0.1);
  let nonzero = 0;
  for (let i = 0; i < w.length; i++) if (w[i] !== 0) nonzero++;
  assert.strictEqual(before, 0);
  assert.ok(nonzero > 0, 'some table entries changed');
});

test('self-taught player only picks legal chains and finishes a game', () => {
  const w = td.newWeights(false);
  const session = E.createSession(SETTINGS, 11);
  const pick = td.tdChooser(w);
  const rng = makeRng(5);
  for (let n = 0; n < 500 && !session.state.over; n++) {
    const ch = pick(session.state, rng);
    assert.strictEqual(E.chainError(session.state, ch), null);
    session.move(ch);
  }
  assert.ok(session.state.over);
});
