// Play-out player (flat Monte Carlo). For each of a short list of chains it
// plays many quick random games to the end and picks the chain whose games
// scored best on average. It is fair: it never sees the seed, and every
// imagined tile comes from its own random numbers and the published odds.
const E = require('./engine');
const {makeRng, randomChain} = require('./players');

// A copy of the game with the seed removed. Moves on it must pass a draw
// function, so the real upcoming tiles can never leak in.
function hide(state) {
  return {...E.publicState(state), seed: 0};
}

function chainKey(ch) {
  const end = ch[ch.length - 1];
  return ch.map(([c, r]) => c * 8 + r).sort((a, b) => a - b).join(',') + '>' + (end[0] * 8 + end[1]);
}

// The chains worth trying: the best by points right now, plus a few random
// others so a quiet set-up move can still win.
function candidates(state, rng, top, extra) {
  const seen = new Map();
  for (const ch of E.listChains(state, {limit: 5000, maxLength: 12})) {
    const k = chainKey(ch);
    if (!seen.has(k)) seen.set(k, ch);
  }
  const all = [...seen.values()];
  const points = ch => Math.floor(ch.reduce((a, [c, r]) => a + state.board[r][c].v, 0) * E.chainBonus(ch.length));
  all.sort((a, b) => points(b) - points(a));
  const out = all.slice(0, top);
  const rest = all.slice(top);
  for (let i = 0; i < extra && rest.length; i++) out.push(rest.splice(Math.floor(rng() * rest.length), 1)[0]);
  return out;
}

function playOut(state, rng, maxMoves) {
  let s = state;
  for (let n = 0; n < maxMoves && !s.over; n++) {
    s = E.applyMove(s, randomChain(s, rng), () => rng()).state;
  }
  return s;
}

// opts: plays (play-outs per chain), top, extra, maxMoves (per play-out).
function playoutChooser(opts) {
  const o = {plays: 8, top: 8, extra: 4, maxMoves: 200, ...(opts || {})};
  return (state, rng) => {
    const hidden = hide(state);
    const list = candidates(hidden, rng, o.top, o.extra);
    if (list.length === 1) return list[0];
    let best = list[0];
    let bestValue = -Infinity;
    for (const ch of list) {
      let total = 0;
      for (let p = 0; p < o.plays; p++) {
        const after = E.applyMove(hidden, ch, () => rng()).state;
        total += playOut(after, rng, o.maxMoves).score;
      }
      if (total > bestValue) { bestValue = total; best = ch; }
    }
    return best;
  };
}

module.exports = {playoutChooser, candidates, hide};
