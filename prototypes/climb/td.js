// Self-taught player: a learned board score, trained by playing itself
// (TD(0) learning on after-move boards with an n-tuple network, the standard
// self-taught method for 2048-style games). No hand-written strategy: it
// starts knowing only the rules and learns which boards turn out well.
//
// The score of a board is the sum of table entries, one per small group of
// squares (a "tuple"), looked up by what sits in those squares. Each move it
// picks the chain whose points plus the score of the board after it (before
// new tiles fall) is highest. After every move it nudges the tables so the
// last board's score moves toward what actually followed.
//
// Values are kept relative to the smallest falling value, so one table works
// at every stage of a game: a climb doubles the scale, and the learning
// target is doubled to match.
//
// It is fair: it plays on a copy with the seed removed, and imagined tiles
// never come from the real seed.
const E = require('./engine');
const {hide} = require('./playout');

const W = E.FIXED.width;
const H = E.FIXED.height;
const TOKENS = 16;

// 0 empty, 1 stone, 2 stranded (below the pool), 3.. a tile 1x, 2x, 4x ...
// the smallest falling value (capped). Odd sums count with the power of 2
// below them.
function token(cell, poolBottom) {
  if (!cell) return 0;
  if (cell.stone) return 1;
  const k = Math.floor(Math.log2(cell.v / poolBottom));
  if (k < 0) return 2;
  return Math.min(TOKENS - 1, 3 + k);
}

// Every 2x2 square, every run of 4 across, every run of 4 down.
function makeTuples() {
  const out = [];
  for (let r = 0; r + 1 < H; r++) for (let c = 0; c + 1 < W; c++) out.push([[c, r], [c + 1, r], [c, r + 1], [c + 1, r + 1]]);
  for (let r = 0; r < H; r++) for (let c = 0; c + 3 < W; c++) out.push([0, 1, 2, 3].map(i => [c + i, r]));
  for (let c = 0; c < W; c++) for (let r = 0; r + 3 < H; r++) out.push([0, 1, 2, 3].map(i => [c, r + i]));
  return out.map(t => t.map(([c, r]) => r * W + c));
}

const TUPLES = makeTuples();
const SIZE = TOKENS ** 4;
// The board is the same mirrored left to right, so each tuple also reads
// the mirrored squares and shares one table.
const MIRROR = TUPLES.map(t => t.map(i => Math.floor(i / W) * W + (W - 1 - (i % W))));

function newWeights(shared) {
  const bytes = TUPLES.length * SIZE * 4;
  const buf = shared ? new SharedArrayBuffer(bytes) : new ArrayBuffer(bytes);
  return new Float32Array(buf);
}

function encode(state) {
  const cells = new Uint8Array(W * H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cells[r * W + c] = token(state.board[r][c], state.poolBottom);
  return cells;
}

function indexes(cells) {
  const out = new Int32Array(TUPLES.length * 2);
  for (let t = 0; t < TUPLES.length; t++) {
    for (const [k, list] of [[0, TUPLES[t]], [1, MIRROR[t]]]) {
      let i = 0;
      for (const sq of list) i = i * TOKENS + cells[sq];
      out[t * 2 + k] = t * SIZE + i;
    }
  }
  return out;
}

function value(weights, idx) {
  let v = 0;
  for (let i = 0; i < idx.length; i++) v += weights[idx[i]];
  return v;
}

// The board right after a chain, before new tiles fall. The engine always
// refills, so the move is made with placeholder drops and those squares are
// emptied again.
function afterMove(state, chain) {
  const out = E.applyMove(state, chain, () => 0);
  const board = out.state.board.map(row => row.slice());
  for (const [c, r] of out.events.dropped) board[r][c] = null;
  return {after: {...out.state, board}, points: out.events.points};
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

// The best chain by points (scaled to the pool) plus the after-board's score.
function choose(weights, state) {
  let best = null;
  for (const ch of uniqueChains(state)) {
    const {after, points} = afterMove(state, ch);
    const idx = indexes(encode(after));
    const scale = after.poolBottom / state.poolBottom;
    const q = points / state.poolBottom + scale * value(weights, idx);
    if (!best || q > best.q) best = {ch, q, idx, scale, reward: points / state.poolBottom};
  }
  return best;
}

// The chooser the game players and the sweep use. Plays greedily.
function tdChooser(weights) {
  return state => choose(weights, hide(state)).ch;
}

// Learned score plus a short look-ahead. For the `width` chains the learned
// score likes best now, it imagines `samples` tile drops after each, and on
// each imagined board takes the best next chain by points plus learned score.
// A chain is worth its points plus the average of those best follow-ups (a
// game that ends is worth nothing more). Imagined drops come from its own
// random numbers, never the seed.
function tdLookaheadChooser(weights, opts) {
  const o = {width: 8, samples: 4, ...(opts || {})};
  const rate = (state, ch) => {
    const {after, points} = afterMove(state, ch);
    return points + after.poolBottom * value(weights, indexes(encode(after)));
  };
  const bestNext = state => {
    let best = 0;
    for (const ch of uniqueChains(state)) best = Math.max(best, rate(state, ch));
    return best;
  };
  return (state, rng) => {
    const hidden = hide(state);
    const ranked = uniqueChains(hidden).map(ch => ({ch, v: rate(hidden, ch)})).sort((a, b) => b.v - a.v);
    if (ranked.length === 1) return ranked[0].ch;
    let pick = ranked[0];
    let pickValue = -Infinity;
    for (const {ch} of ranked.slice(0, o.width)) {
      const {points} = afterMove(hidden, ch);
      let total = 0;
      for (let s = 0; s < o.samples; s++) {
        const next = E.applyMove(hidden, ch, () => rng()).state;
        if (!next.over) total += bestNext(next);
      }
      const v = points + total / o.samples;
      if (v > pickValue) { pickValue = v; pick = {ch}; }
    }
    return pick.ch;
  };
}

// One self-play game with learning. `alpha` is the step per table entry.
// Returns the finished state.
function trainGame(weights, settings, seed, alpha, onMove) {
  const rng = require('./players').makeRng(seed ^ 0x2f6b1c3d);
  let state = E.newGame(settings, seed);
  let prev = null; // last after-board: its indexes
  const step = alpha / (TUPLES.length * 2);
  while (!state.over) {
    const pick = choose(weights, {...state, seed: 0});
    if (prev) {
      // TD(0): the last after-board should be worth this move's points plus
      // this after-board's score, both in the last board's units (this
      // move started from that board's pool, so pick.q is already in them).
      const err = pick.q - value(weights, prev.idx);
      for (let i = 0; i < prev.idx.length; i++) weights[prev.idx[i]] += step * err;
    }
    const before = state;
    state = E.applyMove(state, pick.ch, () => rng()).state;
    prev = {idx: pick.idx};
    if (onMove) onMove(before, state);
  }
  // A finished game is worth nothing more.
  if (prev) {
    const err = 0 - value(weights, prev.idx);
    for (let i = 0; i < prev.idx.length; i++) weights[prev.idx[i]] += step * err;
  }
  return state;
}

module.exports = {tdChooser, tdLookaheadChooser, trainGame, newWeights, choose, afterMove, encode, indexes, value, token, TUPLES, SIZE};
