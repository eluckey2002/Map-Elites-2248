// Fast quick random game for the bots (round 4, step 2). It plays the same
// random game playout.playOut plays (the same rules, the same random
// numbers used in the same order) on flat arrays instead of copying the
// board on every move, so it ends with the same score after the same number
// of moves; it is only faster. It handles the usual settings (slide on a
// tile made, steady pacing); playOut falls back to the engine for others.
// fastplay.test.js checks it against the engine on many boards.
const E = require('./engine');

const W = E.FIXED.width;
const H = E.FIXED.height;
const N = W * H;
const PICK = 300;

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

// Board as flat arrays: vals (0 for empty or stone), stone, risk.
const vals = new Float64Array(N);
const stone = new Uint8Array(N);
const risk = new Uint8Array(N);
const used = new Uint8Array(N);
const path = new Int8Array(N);
const lens = new Uint8Array(PICK);
const verdict = new Int8Array(N);

function fits(settings) {
  return settings.slideTrigger === 'tile' && settings.pacing === 'steady';
}

// Lists up to PICK chains in the engine's order; returns how many. Each
// chain is stored as its last square plus the chain it grew from (-1 for a
// single square), so keeping one costs no copying.
let found = 0;
const parent = new Int16Array(PICK);
const last = new Int8Array(PICK);

function walk(len, from) {
  let me = from;
  if (len >= 2) {
    me = found;
    parent[found] = from;
    last[found] = path[len - 1];
    lens[found] = len;
    if (++found >= PICK) return;
  }
  const at = path[len - 1];
  const v = vals[at];
  const nb = NEIGH[at];
  for (let i = 0; i < nb.length; i++) {
    const q = nb[i];
    if (used[q]) continue;
    const nv = vals[q];
    if (!nv) continue;
    if (len === 1 ? nv !== v : nv !== v && nv !== v * 2) continue;
    used[q] = 1;
    path[len] = q;
    walk(len + 1, me);
    used[q] = 0;
    if (found >= PICK) return;
  }
}

function listInto() {
  found = 0;
  for (let s = 0; s < N && found < PICK; s++) {
    if (!vals[s]) continue;
    used[s] = 1;
    path[0] = s;
    walk(1, -1 - s);
    used[s] = 0;
  }
  return found;
}

// Writes chain k's squares into path[0..len-1]; returns its length.
function readChain(k) {
  const len = lens[k];
  let at = k;
  for (let i = len - 1; i >= 1; i--) {
    path[i] = last[at];
    at = parent[at];
  }
  path[0] = -1 - at;
  return len;
}

function chainBonus(len) {
  for (const [l, mult] of E.FIXED.chainBonus) if (len >= l) return mult;
  return 1;
}

// Tiles fall inside each stretch between stones, carrying their risk mark.
function gravity() {
  for (let c = 0; c < W; c++) {
    let write = H - 1;
    for (let r = H - 1; r >= 0; r--) {
      const i = r * W + c;
      if (stone[i]) {
        write = r - 1;
      } else if (vals[i]) {
        if (r !== write) {
          const j = write * W + c;
          vals[j] = vals[i];
          risk[j] = risk[i];
          vals[i] = 0;
          risk[i] = 0;
        }
        write--;
      }
    }
  }
}

function floorRow(c, r) {
  for (let rr = r + 1; rr < H; rr++) if (stone[rr * W + c]) return rr - 1;
  return H - 1;
}

function canMeet(ca, ra, cb, rb) {
  if (Math.abs(ca - cb) > 1) return false;
  if (ca === cb) {
    const lo = Math.min(ra, rb);
    const hi = Math.max(ra, rb);
    for (let r = lo + 1; r < hi; r++) if (stone[r * W + ca]) return false;
    return true;
  }
  return ra <= floorRow(cb, rb) + 1 && rb <= floorRow(ca, ra) + 1;
}

function canStillMerge(c, r) {
  const v = vals[r * W + c];
  let halves = 0;
  for (let cc = Math.max(0, c - 1); cc <= Math.min(W - 1, c + 1); cc++) {
    for (let rr = 0; rr < H; rr++) {
      if (cc === c && rr === r) continue;
      const ov = vals[rr * W + cc];
      if (!ov) continue;
      if (ov !== v && ov * 2 !== v) continue;
      if (!canMeet(c, r, cc, rr)) continue;
      if (ov === v) return true;
      halves++;
      if (halves >= 2) return true;
    }
  }
  return false;
}

function hasLegalChain() {
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const v = vals[r * W + c];
      if (!v) continue;
      if (c + 1 < W && vals[r * W + c + 1] === v) return true;
      if (r + 1 < H) {
        if (vals[(r + 1) * W + c] === v) return true;
        if (c + 1 < W && vals[(r + 1) * W + c + 1] === v) return true;
        if (c - 1 >= 0 && vals[(r + 1) * W + c - 1] === v) return true;
      }
    }
  }
  return false;
}

// Same as playOut(state, rng, maxMoves) for the settings `fits` accepts;
// returns {score, moves, over}.
function playOut(state, rng, maxMoves) {
  const st = state.settings;
  const weights = [];
  for (let i = 0; i < st.poolSize; i++) {
    const n = st.poolSize;
    if (st.fallOdds === 'halving') weights.push(2 ** (n - 1 - i));
    else if (st.fallOdds === 'soft') weights.push(4 ** (n - 1 - i) * 3 ** i);
    else if (st.fallOdds === 'gentle') weights.push(n - i);
    else weights.push(1);
  }
  const wTotal = weights.reduce((a, b) => a + b, 0);
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const cell = state.board[r][c];
      const i = r * W + c;
      stone[i] = cell && cell.stone ? 1 : 0;
      vals[i] = cell && !cell.stone ? cell.v : 0;
      risk[i] = cell && !cell.stone && cell.risk ? 1 : 0;
    }
  }
  let poolBottom = state.poolBottom;
  let score = state.score;
  let moves = state.moves;
  let over = state.over;
  for (let step = 0; step < maxMoves && !over; step++) {
    // Pick a random chain the way players.randomChain does.
    const n = listInto();
    const k = Math.floor(rng() * n);
    const len = readChain(k);
    let sum = 0;
    for (let i = 0; i < len; i++) sum += vals[path[i]];
    score += Math.floor(sum * chainBonus(len));
    moves++;
    for (let i = 0; i < len - 1; i++) {
      vals[path[i]] = 0;
      risk[path[i]] = 0;
    }
    const end = path[len - 1];
    vals[end] = sum;
    risk[end] = 0;
    if (sum >= st.slideAmount * poolBottom * 2 ** (st.poolSize - 1)) poolBottom *= 2;
    gravity();
    // Refill column by column, top to bottom, one rng() per new tile.
    for (let c = 0; c < W; c++) {
      for (let r = 0; r < H; r++) {
        const i = r * W + c;
        if (vals[i] || stone[i]) continue;
        const x = rng() * wTotal;
        let cum = 0;
        let v = poolBottom * 2 ** (weights.length - 1);
        for (let j = 0; j < weights.length; j++) {
          cum += weights[j];
          if (x < cum) { v = poolBottom * 2 ** j; break; }
        }
        vals[i] = v;
        risk[i] = 0;
      }
    }
    // Stranded tiles: judge all first, then mark or turn to stone.
    for (let i = 0; i < N; i++) {
      verdict[i] = -1;
      if (!vals[i]) continue;
      if (vals[i] >= poolBottom) { risk[i] = 0; continue; }
      verdict[i] = canStillMerge(i % W, (i / W) | 0) ? 1 : 0;
    }
    for (let i = 0; i < N; i++) {
      if (verdict[i] < 0) continue;
      if (verdict[i]) risk[i] = 0;
      else if (risk[i]) {
        vals[i] = 0;
        risk[i] = 0;
        stone[i] = 1;
      } else risk[i] = 1;
    }
    if (!hasLegalChain()) over = true;
  }
  return {score, moves, over};
}

module.exports = {fits, playOut};
