const test = require('node:test');
const assert = require('node:assert');
const E = require('./engine');
const td6 = require('./td6');
const tds = require('./tds');

const SETTINGS = {poolSize: 7, poolStart: 8};
// A full staged model holds 5.4 GB, too much for a test machine, so these
// checks use sparse stand-ins: every entry reads 0 until it is set.
const sparse = () => new Proxy({}, {get: (o, k) => (k in o ? o[k] : 0)});

test('the stage is the number of pool climbs, capped at the last stage', () => {
  const s = E.newGame(SETTINGS, 4);
  assert.strictEqual(tds.stage(s), 0);
  assert.strictEqual(tds.stage({...s, slides: 2}), 2);
  assert.strictEqual(tds.stage({...s, slides: 9}), tds.STAGES - 1);
});

test('each stage reads its own copy of the 6-square tables', () => {
  const s = {...E.newGame(SETTINGS, 4), slides: 2};
  const base = td6.indexes(s);
  const idx = tds.indexes(s);
  for (let i = 0; i < idx.length; i++) assert.strictEqual(idx[i], base[i] + 2 * tds.N);
});

test('an untouched entry borrows the value from the stage below', () => {
  const w = sparse();
  const k = 12345;
  w[k] = 1.5;
  assert.strictEqual(tds.value(w, [k + 2 * tds.N]), 1.5);
  w[k + tds.N] = -0.5;
  assert.strictEqual(tds.value(w, [k + 2 * tds.N]), -0.5);
  w[k + 2 * tds.N] = 2;
  assert.strictEqual(tds.value(w, [k + 2 * tds.N]), 2);
});

test('the staged player only picks legal chains', () => {
  const w = sparse();
  const pick = tds.tdChooser(w);
  const state = E.newGame(SETTINGS, 9);
  assert.strictEqual(E.chainError(state, pick(state)), null);
  assert.deepStrictEqual(pick(state), pick({...state, seed: 77}));
});
