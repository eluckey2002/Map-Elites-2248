const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const {makeRng} = require('./players');
const {playoutChooser, hide} = require('./playout');

test('play-out player is fair: the seed never changes its choice', () => {
  const a = E.newGame({}, 7);
  const b = {...a, seed: 123456};
  const pick = playoutChooser({plays: 3});
  assert.deepStrictEqual(pick(a, makeRng(1)), pick(b, makeRng(1)));
  assert.strictEqual(hide(a).seed, 0);
});

test('play-out player only picks legal chains and finishes a game', () => {
  const session = E.createSession({}, 11);
  const pick = playoutChooser({plays: 2, top: 4, extra: 2});
  const rng = makeRng(5);
  for (let n = 0; n < 300 && !session.state.over; n++) {
    const ch = pick(session.state, rng);
    assert.strictEqual(E.chainError(session.state, ch), null);
    session.move(ch);
  }
  assert.ok(session.state.over);
});
