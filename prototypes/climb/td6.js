// Self-taught player, larger version: the same learning as td.js, but each
// table reads a block of 6 squares (2 wide x 3 tall, or 3 wide x 2 tall)
// instead of 4, the way the strongest 2048 learners see the board, and each
// table entry learns at its own pace (temporal coherence: an entry whose
// errors keep pointing the same way takes big steps, one whose errors cancel
// out slows down). Kept apart from td.js so the pilot (RESULT-0086) still
// replays from its own code.
const E = require('./engine');
const {hide} = require('./playout');
const {afterMove} = require('./td');

const W = E.FIXED.width;
const H = E.FIXED.height;
// 0 empty, 1 stone, 2 stranded, 3.. a tile 1x, 2x, 4x ... the smallest
// falling value, capped at 256x.
const TOKENS = 12;

function token(cell, poolBottom) {
  if (!cell) return 0;
  if (cell.stone) return 1;
  const k = Math.floor(Math.log2(cell.v / poolBottom));
  if (k < 0) return 2;
  return Math.min(TOKENS - 1, 3 + k);
}

function makeTuples() {
  const out = [];
  for (let r = 0; r + 2 < H; r++) for (let c = 0; c + 1 < W; c++) out.push([[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1], [c, r + 2], [c + 1, r + 2]]);
  for (let r = 0; r + 1 < H; r++) for (let c = 0; c + 2 < W; c++) out.push([[c, r], [c + 1, r], [c + 2, r], [c, r + 1], [c + 1, r + 1], [c + 2, r + 1]]);
  return out.map(t => t.map(([c, r]) => r * W + c));
}

const TUPLES = makeTuples();
const SIZE = TOKENS ** 6;
const MIRROR = TUPLES.map(t => t.map(i => Math.floor(i / W) * W + (W - 1 - (i % W))));
const N = TUPLES.length * SIZE;

// weights, plus two running sums per entry for the learning pace.
function newModel(shared) {
  const make = () => new Float32Array(shared ? new SharedArrayBuffer(N * 4) : new ArrayBuffer(N * 4));
  return {w: make(), e: make(), a: make()};
}

function indexes(state) {
  const cells = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cells[r * W + c] = token(state.board[r][c], state.poolBottom);
  const out = new Int32Array(TUPLES.length * 2);
  for (let t = 0; t < TUPLES.length; t++) {
    let i = 0;
    let j = 0;
    for (const sq of TUPLES[t]) i = i * TOKENS + cells[sq];
    for (const sq of MIRROR[t]) j = j * TOKENS + cells[sq];
    out[t * 2] = t * SIZE + i;
    out[t * 2 + 1] = t * SIZE + j;
  }
  return out;
}

function value(w, idx) {
  let v = 0;
  for (let i = 0; i < idx.length; i++) v += w[idx[i]];
  return v;
}

function chainKey(ch) {
  const end = ch[ch.length - 1];
  return ch.map(([c, r]) => c * 8 + r).sort((a, b) => a - b).join(',') + '>' + (end[0] * 8 + end[1]);
}

function uniqueChains(state) {
  const seen = new Map();
  for (const ch of E.listChains(state, {limit: 5000, maxLength: 12})) {
    const k = chainKey(ch);
    if (!seen.has(k)) seen.set(k, ch);
  }
  return [...seen.values()];
}

function choose(w, state) {
  let best = null;
  for (const ch of uniqueChains(state)) {
    const {after, points} = afterMove(state, ch);
    const idx = indexes(after);
    const q = points / state.poolBottom + (after.poolBottom / state.poolBottom) * value(w, idx);
    if (!best || q > best.q) best = {ch, q, idx};
  }
  return best;
}

function update(m, idx, err, alpha) {
  const step = alpha / idx.length;
  for (let i = 0; i < idx.length; i++) {
    const k = idx[i];
    const rate = m.a[k] === 0 ? 1 : Math.abs(m.e[k]) / m.a[k];
    m.w[k] += step * rate * err;
    m.e[k] += err;
    m.a[k] += Math.abs(err);
  }
}

// One self-play game with learning; returns the finished state.
function trainGame(m, settings, seed, alpha, onMove) {
  const rng = require('./players').makeRng(seed ^ 0x2f6b1c3d);
  let state = E.newGame(settings, seed);
  let prev = null;
  while (!state.over) {
    const pick = choose(m.w, {...state, seed: 0});
    if (prev) update(m, prev, pick.q - value(m.w, prev), alpha);
    const before = state;
    state = E.applyMove(state, pick.ch, () => rng()).state;
    prev = pick.idx;
    if (onMove) onMove(before, state);
  }
  if (prev) update(m, prev, 0 - value(m.w, prev), alpha);
  return state;
}

function tdChooser(w) {
  return state => choose(w, hide(state)).ch;
}

// The learned score as a look-ahead leaf, in points.
function leaf(w) {
  return (state, ch) => {
    const {after, points} = afterMove(state, ch);
    return points + after.poolBottom * value(w, indexes(after));
  };
}

module.exports = {newModel, trainGame, tdChooser, leaf, choose, indexes, value, token, TUPLES, SIZE, TOKENS};
