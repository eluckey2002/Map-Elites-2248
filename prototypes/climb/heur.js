// Hand-made board score for the look-ahead (round 4). Instead of playing
// quick random games from the last board of each line, it reads a few plain
// signs off that board. Nothing is learned; the weights are picked by hand
// and are listed in WEIGHTS. Every sign is in points, scaled by the pool
// bottom, so it adds up with the points earned along the line.
//
// Signs, for the board after the move (one imagined drop):
//   ready   the value of every tile that touches an equal tile: points that
//           are one chain away
//   pairs   how many equal neighbour pairs there are: room to move later
//   risk    small tiles at risk of turning to stone
//   stones  stone squares, which never come back
//   over    the game ended on this line
const E = require('./engine');
const {chainPoints} = require('./lookahead');

const W = 5;
const H = 7;

// Picked by hand. The sizes were set by looking at how each sign lines up
// with the play-out score on 1,500 strong-bot boards (a pair is worth about
// 130 pool-bottoms of later points, a stone or a tile at risk costs about
// 120, and an ended game loses about 1,300); b and c lean harder on survival.
const WEIGHTS = {
  a: {ready: 1, pairs: 130, risk: 120, stones: 120, over: 1300},
  b: {ready: 1, pairs: 130, risk: 120, stones: 250, over: 1300},
  c: {ready: 0.5, pairs: 200, risk: 120, stones: 200, over: 2000},
};

function signs(s) {
  const b = s.board;
  let ready = 0;
  let pairs = 0;
  let risk = 0;
  let stones = 0;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const cell = b[r][c];
      if (!cell) continue;
      if (cell.stone) { stones++; continue; }
      if (cell.risk || cell.v < s.poolBottom) risk++;
      let touches = false;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (!dc && !dr) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
          const o = b[nr][nc];
          if (!o || o.stone || o.v !== cell.v) continue;
          touches = true;
          // Count each pair once.
          if (nr > r || (nr === r && nc > c)) pairs++;
        }
      }
      if (touches) ready += cell.v;
    }
  }
  return {ready, pairs, risk, stones};
}

function boardScore(s, w) {
  const p = s.poolBottom;
  if (s.over) return -w.over * p;
  const g = signs(s);
  return w.ready * g.ready + p * (w.pairs * g.pairs - w.risk * g.risk - w.stones * g.stones);
}

// A `leaf` for lookaheadChooser: the chain's points plus the score of the
// board after it, averaged over `drops` imagined drops. Needs the chooser's
// rng, so lookahead passes it in.
function leaf(w, drops = 1) {
  return (state, ch, rng) => {
    let total = 0;
    for (let d = 0; d < drops; d++) {
      total += boardScore(E.applyMove(state, ch, () => rng()).state, w);
    }
    return chainPoints(state, ch) + total / drops;
  };
}

module.exports = {WEIGHTS, signs, boardScore, leaf};
