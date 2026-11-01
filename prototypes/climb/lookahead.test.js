const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const {makeRng} = require('./players');
const {lookaheadChooser, chainPoints} = require('./lookahead');

test('look-ahead player is fair: the seed never changes its choice', () => {
  const a = E.newGame({}, 7);
  const b = {...a, seed: 123456};
  const pick = lookaheadChooser({depth: 2, widths: [6, 4], samples: [2]});
  assert.deepStrictEqual(pick(a, makeRng(1)), pick(b, makeRng(1)));
});

test('look-ahead points match the engine', () => {
  const state = E.newGame({}, 3);
  const ch = E.listChains(state, {limit: 50})[0];
  assert.strictEqual(chainPoints(state, ch), E.applyMove(state, ch).events.points);
});

test('depth-1 look-ahead takes the chain worth the most points now', () => {
  const state = E.newGame({}, 9);
  const pick = lookaheadChooser({depth: 1, widths: [5000], extra: 0});
  const best = Math.max(...E.listChains(state, {limit: 5000, maxLength: 12}).map(ch => chainPoints(state, ch)));
  assert.strictEqual(chainPoints(state, pick(state, makeRng(1))), best);
});

test('look-ahead player only picks legal chains and finishes a game', () => {
  const session = E.createSession({}, 11);
  const pick = lookaheadChooser({depth: 2, widths: [4, 4], samples: [2]});
  const rng = makeRng(5);
  for (let n = 0; n < 300 && !session.state.over; n++) {
    const ch = pick(session.state, rng);
    assert.strictEqual(E.chainError(session.state, ch), null);
    session.move(ch);
  }
  assert.ok(session.state.over);
});

const isPow2 = v => Number.isInteger(Math.log2(v));
const sumOf = (state, ch) => ch.reduce((t, [c, r]) => t + state.board[r][c].v, 0);

test('noOdd habit only makes power-of-2 tiles while one is open', () => {
  const session = E.createSession({poolSize: 7, poolStart: 8, fallOdds: 'equal'}, 21);
  const pick = lookaheadChooser({depth: 2, widths: [6, 4], samples: [2], noOdd: true});
  const rng = makeRng(3);
  for (let n = 0; n < 40 && !session.state.over; n++) {
    const s = session.state;
    const ch = pick(s, rng);
    const open = E.listChains(s, {limit: 300}).some(c => isPow2(sumOf(s, c)));
    if (open) assert.ok(isPow2(sumOf(s, ch)), 'made a tile that is not a power of 2');
    session.move(ch);
  }
});

test('noStone habit never turns a tile to stone when another move avoids it', () => {
  const session = E.createSession({poolSize: 7, poolStart: 8, fallOdds: 'equal'}, 22);
  const pick = lookaheadChooser({depth: 2, widths: [6, 4], samples: [2], noStone: true});
  const rng = makeRng(4);
  for (let n = 0; n < 40 && !session.state.over; n++) {
    const s = session.state;
    const ch = pick(s, rng);
    const stones = c => E.applyMove(s, c, () => 0).state.stones !== s.stones;
    const avoidable = E.listChains(s, {limit: 300}).some(c => !stones(c));
    if (avoidable) assert.ok(!stones(ch), 'made stone when it could have been avoided');
    session.move(ch);
  }
});

test('stay-alive habit is fair and picks legal chains', () => {
  const a = E.newGame({}, 7);
  const pick = lookaheadChooser({depth: 2, widths: [6, 4], samples: [2], objective: 'moves'});
  const ch = pick(a, makeRng(1));
  assert.strictEqual(E.chainError(a, ch), null);
  assert.deepStrictEqual(ch, pick({...a, seed: 99}, makeRng(1)));
});

test('noOdd habit judges tiles past 2^32 correctly', () => {
  const s = E.newGame({poolSize: 7, poolStart: 8, fallOdds: 'equal'}, 5);
  const half = 2 ** 32;
  // Filler tiles that never chain, then three 2^32 tiles in an L: the
  // three-tile chain sums to 3 x 2^32 (not a power of 2, but its low 32
  // bits are 0), the two-tile chains to 2^33.
  let p = 1001;
  const board = s.board.map(row => row.map(() => ({v: (p += 2) * 7})));
  board[6][0] = {v: half};
  board[6][1] = {v: half};
  board[5][0] = {v: half};
  const st = {...s, board};
  assert.ok(E.listChains(st, {limit: 300}).some(ch => ch.length === 3), 'the odd chain is on offer');
  const pick = lookaheadChooser({depth: 1, widths: [50], extra: 0, noOdd: true});
  const ch = pick(st, makeRng(1));
  assert.strictEqual(sumOf(st, ch), 2 ** 33);
});
