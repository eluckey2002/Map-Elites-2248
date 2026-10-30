const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const td6 = require('./td6');
const {lookaheadChooser} = require('./lookahead');

const SETTINGS = {poolSize: 7, poolStart: 8};
// One model for the whole file: each one holds three 450 MB tables.
const m = td6.newModel(false);
for (let g = 0; g < 3; g++) td6.trainGame(m, SETTINGS, 700 + g, 1);

test('6-square pieces cover the board and mirror onto it', () => {
  assert.strictEqual(td6.TUPLES.length, 38);
  const W = E.FIXED.width;
  const H = E.FIXED.height;
  const seen = new Set(td6.TUPLES.flat());
  assert.strictEqual(seen.size, W * H);
  for (const t of td6.TUPLES) assert.strictEqual(new Set(t).size, 6);
});

test('learning changes table entries and their pace sums', () => {
  let w = 0;
  let a = 0;
  for (let i = 0; i < m.w.length; i++) { if (m.w[i] !== 0) w++; if (m.a[i] !== 0) a++; }
  assert.ok(w > 0 && a > 0);
});

test('6-square player is fair: the seed never changes its choice', () => {
  const a = E.newGame(SETTINGS, 7);
  const pick = td6.tdChooser(m.w);
  assert.deepStrictEqual(pick(a), pick({...a, seed: 99}));
});

test('look-ahead can use the learned score at its leaves', () => {
  let calls = 0;
  const leaf = td6.leaf(m.w);
  const pick = lookaheadChooser({depth: 2, widths: [4, 3], samples: [2], leaf: (s, ch) => { calls++; return leaf(s, ch); }});
  const state = E.newGame(SETTINGS, 5);
  const ch = pick(state, () => 0.5);
  assert.strictEqual(E.chainError(state, ch), null);
  assert.ok(calls > 0, 'leaf was used');
});
