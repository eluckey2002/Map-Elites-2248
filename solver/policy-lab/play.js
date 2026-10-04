'use strict';

const crypto = require('node:crypto');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs } = require('../engine');

// Same objective and transition order as the sealed ruler, with an injected chooser.
function play(levelData, seed, chooser, { lookaheadBase = 987654321, onPosition } = {}) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const trace = [];
  let reason = 'out_of_moves';
  let chainCount = 0, chainTiles = 0, lateScore = 0;
  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex++) {
    const options = { moveIndex, lookaheadBase, lookaheadRngFactory: () => makeRng(lookaheadBase + moveIndex) };
    if (onPosition) onPosition(state, options);
    const chain = chooser(state, options);
    if (!chain) { reason = 'no_valid_moves'; break; }
    trace.push(chain.map(({ x, y }) => x + ',' + y).join('|'));
    const scoreBefore = state.score;
    executeChain(state, chain);
    chainCount++; chainTiles += chain.length;
    if (state.moves > state.maxMoves * (2 / 3)) lateScore += state.score - scoreBefore;
    applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
    if (checkBombs(state)) { reason = 'bomb'; break; }
    if (state.score >= state.targetScore) { reason = 'target'; break; }
    if (state.moves >= state.maxMoves) break;
  }
  return { win: reason === 'target', movesToTarget: reason === 'target' ? state.moves : null,
    movesUsed: state.moves, moveBudget: state.maxMoves, score: state.score, reason,
    chainCount, chainTiles, lateScore,
    traceIdentity: crypto.createHash('sha256').update(JSON.stringify(trace)).digest('hex') };
}
module.exports = { play };
