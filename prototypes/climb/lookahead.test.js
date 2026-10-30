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
