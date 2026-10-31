const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const {makeRng, randomChain} = require('./players');
const F = require('./fastchains');
const FP = require('./fastplay');
const {hide} = require('./playout');

// The engine's own quick random game, as playout.playOut played it before
// round 4: the fast versions must match it exactly.
function enginePlayOut(state, rng, maxMoves) {
  let s = state;
  for (let n = 0; n < maxMoves && !s.over; n++) s = E.applyMove(s, randomChain(s, rng), () => rng()).state;
  return s;
}

// Boards from random games on several settings, stones and risk marks included.
function boards() {
  const out = [];
  const all = [
    {poolSize: 7, poolStart: 8, fallOdds: 'equal'},
    {poolSize: 5, poolStart: 2, fallOdds: 'halving'},
    {poolSize: 6, poolStart: 4, fallOdds: 'gentle'},
    {poolSize: 4, poolStart: 2, fallOdds: 'soft'},
  ];
  for (const settings of all) {
    for (let seed = 1; seed <= 8; seed++) {
      const rng = makeRng(seed * 7);
      let s = hide(E.newGame(settings, seed));
      while (!s.over) {
        out.push(s);
        s = E.applyMove(s, randomChain(s, rng), () => rng()).state;
      }
    }
  }
  return out;
}

const BOARDS = boards();

test('the boards cover stones and tiles at risk', () => {
  assert.ok(BOARDS.length > 500);
  assert.ok(BOARDS.some(s => s.stones > 0));
  assert.ok(BOARDS.some(s => s.board.some(row => row.some(c => c && c.risk))));
});

test('the fast chain list is the engine list, in the same order', () => {
  for (const s of BOARDS) {
    for (const opts of [{limit: 300}, {limit: 5000, maxLength: 12}, {maxLength: 2}]) {
      assert.deepStrictEqual(F.listChains(s, opts), E.listChains(s, opts));
    }
  }
});

test('the fast random chain is the same pick from the same random number', () => {
  BOARDS.forEach((s, i) => {
    const a = makeRng(i);
    const b = makeRng(i);
    assert.deepStrictEqual(F.randomChain(s, a), randomChain(s, b));
    assert.strictEqual(a(), b());
  });
});

test('the fast quick game ends exactly like the engine one', () => {
  BOARDS.forEach((s, i) => {
    if (!FP.fits(s.settings)) return;
    const a = makeRng(1000 + i);
    const b = makeRng(1000 + i);
    const want = enginePlayOut(s, a, 200);
    const got = FP.playOut(s, b, 200);
    assert.deepStrictEqual(got, {score: want.score, moves: want.moves, over: want.over});
    // The same random numbers were used up.
    assert.strictEqual(a(), b());
  });
});

test('a move cap stops the fast quick game at the same place', () => {
  const s = BOARDS[3];
  for (const cap of [0, 1, 5]) {
    const want = enginePlayOut(s, makeRng(5), cap);
    assert.deepStrictEqual(FP.playOut(s, makeRng(5), cap), {score: want.score, moves: want.moves, over: want.over});
  }
});

test('other slide settings are left to the engine', () => {
  assert.strictEqual(FP.fits(E.normalizeSettings({slideTrigger: 'score'})), false);
  assert.strictEqual(FP.fits(E.normalizeSettings({pacing: 'speeds-up'})), false);
  assert.strictEqual(FP.fits(E.normalizeSettings({poolSize: 7, poolStart: 8})), true);
});
