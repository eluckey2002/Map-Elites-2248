// Simple players for tests and the default check. They are not the bots
// evan will choose later; they only drive the engine.
const E = require('./engine');

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks a random legal chain each move. `chooser(state, rng)` can replace it.
function playRandomGame(settings, seed, opts) {
  const o = opts || {};
  const rng = makeRng(seed ^ 0x5bd1e995);
  const session = E.createSession(settings, seed);
  const cap = o.maxMoves || 3000;
  let steps = 0;
  while (!session.state.over && steps < cap) {
    steps++;
    if (o.undoEvery && steps % o.undoEvery === 0 && session.canUndo) {
      session.undo();
      continue;
    }
    const before = session.state;
    const chain = o.chooser ? o.chooser(before, rng) : randomChain(before, rng);
    const events = session.move(chain);
    if (o.onMove) o.onMove(before, session.state, events);
  }
  return {session, state: session.state, capped: !session.state.over};
}

function randomChain(state, rng) {
  const chains = E.listChains(state, {limit: 300});
  return chains[Math.floor(rng() * chains.length)];
}

// Longest chain it can find, ties broken by the bigger merged tile.
function greedyChain(state) {
  const chains = E.listChains(state, {limit: 5000, maxLength: 12});
  let best = null;
  let bestKey = -1;
  for (const ch of chains) {
    const sum = ch.reduce((a, [c, r]) => a + state.board[r][c].v, 0);
    const key = ch.length * 1e12 + sum;
    if (key > bestKey) { bestKey = key; best = ch; }
  }
  return best;
}

module.exports = {makeRng, playRandomGame, randomChain, greedyChain};
