// Look-ahead player (depth-limited expectimax with sampled drops). For each
// of a short list of chains it imagines a few possible tile drops, then looks
// for the best follow-up move on each, and so on down to a fixed depth. It
// scores a line by the points it earns along the way; a line that ends the
// game earns nothing after that. There are no hand-tuned weights.
//
// Points alone make it short-sighted: with no sense of what a board is worth
// after the last move it looks at, it trades the future for points now and
// its games end early. `leafPlays` fixes that the weight-free way: the board
// at the end of each line is valued by the points a few quick random games
// from it go on to score (the play-out player's estimate, used only at the
// leaves). With leafPlays 0 it is the pure points look-ahead.
//
// It is fair: it never sees the seed, and every imagined tile comes from its
// own random numbers and the published odds (the same `hide` the play-out
// player uses).
const E = require('./engine');
const {candidates, hide, playOut} = require('./playout');

function chainPoints(state, ch) {
  return Math.floor(ch.reduce((a, [c, r]) => a + state.board[r][c].v, 0) * E.chainBonus(ch.length));
}

// What a line is worth per move: its points, or with objective 'moves' just
// one more move survived.
function gain(state, ch, o) {
  return o.objective === 'moves' ? 1 : chainPoints(state, ch);
}

// noStone: drop the chains whose move turns a tile to stone, unless all of
// them do. Whether a move makes stone does not depend on the new tiles (they
// are never small enough to rescue a stranded tile), so one try tells.
function dropStoning(state, list, o) {
  if (!o.noStone || list.length < 2) return list;
  const safe = list.filter(ch => E.applyMove(state, ch, () => 0).state.stones === state.stones);
  return safe.length ? safe : list;
}

// noOdd: only chains whose merged tile is a power of 2, when there are any.
function keeper(state, o) {
  if (!o.noOdd) return undefined;
  return ch => {
    const sum = ch.reduce((a, [c, r]) => a + state.board[r][c].v, 0);
    // Not `sum & (sum - 1)`: bit operations cut numbers to 32 bits, and
    // tiles here pass 2^32.
    return Number.isInteger(Math.log2(sum));
  };
}

// Points this chain earns plus what the board after it is worth, judged by
// `leafPlays` quick random games (0: the chain's points only), or by
// `leaf(state, chain, rng)` when given (e.g. a learned board score).
function leafValue(state, ch, rng, o) {
  if (o.leaf) return o.leaf(state, ch, rng);
  if (!o.leafPlays) return gain(state, ch, o);
  let total = 0;
  for (let p = 0; p < o.leafPlays; p++) {
    const after = E.applyMove(state, ch, () => rng()).state;
    const end = playOut(after, rng, o.maxMoves);
    total += o.objective === 'moves' ? end.moves - state.moves : end.score - state.score;
  }
  return total / o.leafPlays;
}

// Best points obtainable from `state` over `depth` more moves, averaging over
// sampled drops after each move. widths[i] / samples[i] apply at ply i.
function bestLine(state, depth, ply, rng, o) {
  if (state.over || depth === 0) return 0;
  const list = dropStoning(state, candidates(state, rng, o.widths[ply], o.extra, keeper(state, o)), o);
  // -Infinity, not 0: a leaf score (heur.js) can be negative.
  let best = list.length ? -Infinity : 0;
  for (const ch of list) {
    let v = depth === 1 ? leafValue(state, ch, rng, o) : gain(state, ch, o);
    if (depth > 1) {
      let total = 0;
      const n = o.samples[ply];
      for (let s = 0; s < n; s++) {
        const after = E.applyMove(state, ch, () => rng()).state;
        total += bestLine(after, depth - 1, ply + 1, rng, o);
      }
      v += total / n;
    }
    if (v > best) best = v;
  }
  return best;
}

// opts: depth (moves looked at, counting this one), widths (chains tried per
// ply), samples (drops imagined per ply), extra (random chains added per ply),
// leafPlays (quick random games valuing each line's last board), leaf (a
// function valuing it instead), maxMoves, objective ('points', the default,
// or 'moves': how long the game lasts), noOdd (never make a tile that is not
// a power of 2 while another chain is open), noStone (never turn a tile to
// stone while another of the chains tried does not).
function lookaheadChooser(opts) {
  const o = {depth: 2, widths: [12, 8, 6], samples: [6, 3, 2], extra: 2, leafPlays: 0, maxMoves: 200, ...(opts || {})};
  return (state, rng) => {
    const hidden = hide(state);
    const list = dropStoning(hidden, candidates(hidden, rng, o.widths[0], o.extra, keeper(hidden, o)), o);
    if (list.length === 1) return list[0];
    let best = list[0];
    let bestValue = -Infinity;
    for (const ch of list) {
      let v = o.depth === 1 ? leafValue(hidden, ch, rng, o) : gain(hidden, ch, o);
      if (o.depth > 1) {
        let total = 0;
        for (let s = 0; s < o.samples[0]; s++) {
          const after = E.applyMove(hidden, ch, () => rng()).state;
          total += bestLine(after, o.depth - 1, 1, rng, o);
        }
        v += total / o.samples[0];
      }
      if (v > bestValue) { bestValue = v; best = ch; }
    }
    return best;
  };
}

module.exports = {lookaheadChooser, chainPoints};
