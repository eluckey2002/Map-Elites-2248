const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');

// Fixed base for the lookahead rollout rng: intentionally independent of the
// main seed/rng, so evaluating a candidate move's hypothetical next turn
// never consumes from (or perturbs) the real spawn sequence. Every move at
// the same index gets the same rollout draw across all seeds/levels; that's
// a uniform simplification, not a bias toward any particular one.
const LOOKAHEAD_BASE = 987654321;

// Plays one level to completion against a single rng stream (initial grid +
// every subsequent spawn draw from it). Returns { result: 'win'|'lose', reason?, movesUsed }.
function playLevel(levelData, rng) {
  const state = createLevelState(levelData, rng);
  const hardCap = levelData.moves + 5; // guards against an engine bug looping forever
  let moveIndex = 0;

  for (let i = 0; i < hardCap; i++) {
    const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + moveIndex);
    const chain = chooseMove(state, { lookaheadRngFactory });
    moveIndex += 1;
    if (!chain) {
      return { result: 'lose', reason: 'no valid moves', movesUsed: state.moves };
    }

    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);

    if (checkBombs(state)) {
      return { result: 'lose', reason: 'bomb exploded', movesUsed: state.moves };
    }
    if (state.score >= state.targetScore) {
      return { result: 'win', movesUsed: state.moves };
    }
    if (state.moves >= state.maxMoves) {
      return { result: 'lose', reason: 'out of moves', movesUsed: state.moves };
    }
  }

  return { result: 'lose', reason: 'hard cap exceeded (engine bug?)', movesUsed: state.moves };
}

// Runs playLevel across seeds 0..seedCount-1, returns win rate + a sample of losses.
function sweepLevel(levelData, seedCount) {
  let wins = 0;
  const lossReasons = {};
  for (let seed = 0; seed < seedCount; seed++) {
    const outcome = playLevel(levelData, makeRng(seed));
    if (outcome.result === 'win') {
      wins += 1;
    } else {
      lossReasons[outcome.reason] = (lossReasons[outcome.reason] || 0) + 1;
    }
  }
  return { level: levelData.level, winRate: wins / seedCount, seedCount, lossReasons };
}

module.exports = { playLevel, sweepLevel };
