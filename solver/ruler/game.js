'use strict';

const crypto = require('node:crypto');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('../engine');
const { chooseMove, chooseBaseMove } = require('../bot');

const LOOKAHEAD_BASE = 987654321;

function play(levelData, seed, policy) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const chooser = policy.kind === 'base' ? chooseBaseMove : chooseMove;
  const options = policy.kind === 'variant' ? { params: policy.params } : {};
  const trace = [];
  let reason = 'out_of_moves';
  let chainTiles = 0;
  let lateScore = 0;
  let chainCount = 0;
  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex += 1) {
    const chain = chooser(state, {
      ...options,
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) {
      reason = 'no_valid_moves';
      break;
    }
    trace.push(chain.map(({ x, y }) => x + ',' + y).join('|'));
    const scoreBefore = state.score;
    executeChain(state, chain);
    chainCount += 1;
    chainTiles += chain.length;
    if (state.moves > state.maxMoves * (2 / 3)) lateScore += state.score - scoreBefore;
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) {
      reason = 'bomb';
      break;
    }
    if (state.score >= state.targetScore) {
      reason = 'target';
      break;
    }
    if (state.moves >= state.maxMoves) break;
  }
  return {
    win: reason === 'target',
    movesToTarget: reason === 'target' ? state.moves : null,
    movesUsed: state.moves,
    moveBudget: state.maxMoves,
    score: state.score,
    reason,
    chainCount,
    chainTiles,
    lateScore,
    traceIdentity: crypto.createHash('sha256').update(JSON.stringify(trace)).digest('hex'),
  };
}

function behavior(outcomes) {
  const chainCount = outcomes.reduce((sum, outcome) => sum + outcome.chainCount, 0);
  const chainTiles = outcomes.reduce((sum, outcome) => sum + outcome.chainTiles, 0);
  const pace = outcomes.reduce((sum, outcome) => (
    sum + (outcome.win ? outcome.movesToTarget : outcome.moveBudget + 1) / outcome.moveBudget
  ), 0) / outcomes.length;
  return { meanChainLength: chainCount ? chainTiles / chainCount : 0, targetPace: pace };
}

function cellForBehavior(value) {
  const bin = (n, minimum, maximum) => Math.max(0, Math.min(4, Math.floor(5 * (n - minimum) / (maximum - minimum))));
  return bin(value.meanChainLength, 3, 12) + ',' + bin(value.targetPace, 0, 1.2);
}

module.exports = { LOOKAHEAD_BASE, behavior, cellForBehavior, play };
