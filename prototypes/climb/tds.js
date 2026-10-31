// Self-taught player with game stages (the 2048 "multi-stage" trick): the
// same 6-square tables as td6.js, one full set per stage, where the stage is
// how many times the pool has climbed (0, 1, 2, 3 or more). An entry a stage
// has never touched reads its value from the stage below (weight promotion).
// Training games can start from boards a stronger bot reached, so the late
// stages get practice (the "start from strong-bot boards" trick).
const E = require('./engine');
const {hide} = require('./playout');
const {afterMove} = require('./td');
const td6 = require('./td6');

const STAGES = 4;
const N = td6.TUPLES.length * td6.SIZE;

function stage(state) {
  return Math.min(STAGES - 1, state.slides);
}

function newModel(shared) {
  const make = () => new Float32Array(shared ? new SharedArrayBuffer(STAGES * N * 4) : new ArrayBuffer(STAGES * N * 4));
  return {w: make(), e: make(), a: make()};
}

function indexes(state) {
  const idx = td6.indexes(state);
  const off = stage(state) * N;
  for (let i = 0; i < idx.length; i++) idx[i] += off;
  return idx;
}

// An untouched entry (still exactly 0) takes the value of the same entry one
// stage down.
function weight(w, k) {
  while (w[k] === 0 && k >= N) k -= N;
  return w[k];
}

function value(w, idx) {
  let v = 0;
  for (let i = 0; i < idx.length; i++) v += weight(w, idx[i]);
  return v;
}

function choose(w, state) {
  let best = null;
  for (const ch of td6.uniqueChains(state)) {
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
    if (m.a[k] === 0 && m.w[k] === 0) m.w[k] = weight(m.w, k);
    const rate = m.a[k] === 0 ? 1 : Math.abs(m.e[k]) / m.a[k];
    m.w[k] += step * rate * err;
    m.e[k] += err;
    m.a[k] += Math.abs(err);
  }
}

// One self-play game with learning from `start` (a fresh board when null).
function trainGame(m, settings, seed, alpha, start, onMove) {
  const rng = require('./players').makeRng(seed ^ 0x2f6b1c3d);
  let state = start ? {...start, seed: 0} : E.newGame(settings, seed);
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

function leaf(w) {
  return (state, ch) => {
    const {after, points} = afterMove(state, ch);
    return points + after.poolBottom * value(w, indexes(after));
  };
}

module.exports = {STAGES, N, stage, newModel, indexes, value, choose, trainGame, tdChooser, leaf};
