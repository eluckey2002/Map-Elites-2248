// Faster chain listing for the bots (round 4, step 2). It gives exactly the
// chains engine.listChains gives, in exactly the same order, so a bot that
// switches to it plays the very same moves; it is only faster. It reads the
// board once into flat arrays and walks with no copying until a chain is
// kept. fastchains.test.js checks it against the engine on many boards.
const E = require('./engine');

const W = E.FIXED.width;
const H = E.FIXED.height;
const N = W * H;

// Neighbours of each square in the engine's order: rows above first, then
// left to right.
const NEIGH = [];
for (let r = 0; r < H; r++) {
  for (let c = 0; c < W; c++) {
    const list = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        const nc = c + dc;
        const nr = r + dr;
        if (nc < 0 || nc >= W || nr < 0 || nr >= H) continue;
        list.push(nr * W + nc);
      }
    }
    NEIGH.push(Int8Array.from(list));
  }
}

const vals = new Float64Array(N);
const used = new Uint8Array(N);
const path = new Int8Array(N);

function load(board) {
  for (let r = 0; r < H; r++) {
    const row = board[r];
    for (let c = 0; c < W; c++) {
      const cell = row[c];
      vals[r * W + c] = cell && !cell.stone ? cell.v : 0;
    }
  }
}

// Walks every chain in the engine's order. For each one, `visit(len)` gets
// the chain's length (its squares are path[0..len-1]); returning true stops.
function walkAll(maxLength, visit) {
  let stop = false;
  function walk(len) {
    if (len >= 2 && visit(len)) { stop = true; return; }
    if (len >= maxLength) return;
    const at = path[len - 1];
    const v = vals[at];
    const nb = NEIGH[at];
    for (let i = 0; i < nb.length; i++) {
      const n = nb[i];
      if (used[n]) continue;
      const nv = vals[n];
      if (!nv) continue;
      if (len === 1 ? nv !== v : nv !== v && nv !== v * 2) continue;
      used[n] = 1;
      path[len] = n;
      walk(len + 1);
      used[n] = 0;
      if (stop) return;
    }
  }
  for (let s = 0; s < N && !stop; s++) {
    if (!vals[s]) continue;
    used[s] = 1;
    path[0] = s;
    walk(1);
    used[s] = 0;
  }
  used.fill(0);
}

function toChain(len) {
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = [path[i] % W, (path[i] / W) | 0];
  return out;
}

// Same as E.listChains(state, opts).
function listChains(state, opts) {
  const limit = (opts && opts.limit) || Infinity;
  const maxLength = (opts && opts.maxLength) || Infinity;
  const out = [];
  load(state.board);
  walkAll(maxLength, len => {
    out.push(toChain(len));
    return out.length >= limit;
  });
  return out;
}

// Same as players.randomChain: a chain picked evenly from the first 300 the
// engine lists, using one rng() call. It walks once, keeping the chains in a
// flat buffer, and builds only the picked one.
const PICK = 300;
const buf = new Int8Array(PICK * N);
const lens = new Uint8Array(PICK);

function randomChain(state, rng) {
  load(state.board);
  let n = 0;
  walkAll(Infinity, len => {
    buf.set(path.subarray(0, len), n * N);
    lens[n] = len;
    return ++n >= PICK;
  });
  const k = Math.floor(rng() * n);
  if (k >= n) return undefined;
  const len = lens[k];
  const out = new Array(len);
  for (let i = 0; i < len; i++) {
    const sq = buf[k * N + i];
    out[i] = [sq % W, (sq / W) | 0];
  }
  return out;
}

module.exports = {listChains, randomChain};
