const assert = require('node:assert/strict');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../engine');
const { replayRecording, classifyTerminal } = require('../benchmark-replay');

// This verifier does not import the oracle transition or candidate generator.
// Recompute the complete trace directly through the existing game engine.
function verifyWitness(input, result) {
  assert.ok(result && Array.isArray(result.chains), 'missing witness');
  const recording = {
    ...result, seed: input.seed, candidateIdentity: null,
    reason: result.outcome === 'win' ? 'target reached' : undefined,
  };
  const replay = replayRecording(input.level, recording, { expectedSeed: input.seed });
  assert.equal(replay.validity, 'valid', replay.reasons.join('; '));
  assert.equal(result.trace.length, result.chains.length, 'trace length');
  const source = makeRng(input.seed);
  let draws = 0;
  const rng = () => { draws++; return source(); };
  const state = createLevelState(input.level, rng);
  const initialDraws = draws;
  for (let i = 0; i < result.chains.length; i++) {
    const chain = result.chains[i].tiles.map(({ x, y }) => state.grid[y][x]);
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    const board = state.grid.map(row => row.map(tile => tile ? [tile.value, tile.blocker, tile.blockerDuration, tile.bombTimer] : null));
    assert.deepEqual(result.trace[i], { board, score: state.score, cursor: draws - initialDraws }, `trace at move ${i + 1}`);
  }
  assert.equal(classifyTerminal(state).outcome, result.outcome);
  return replay;
}

function assessPuzzle(puzzle, result) {
  if (result.baseline) verifyWitness(puzzle.input, result.baseline);
  if (result.best) {
    const replay = verifyWitness(puzzle.input, result.best);
    assert.equal(replay.outcome, 'win', 'best must be a win');
  }
  assert.ok(Number.isFinite(result.searchMs) && result.searchMs >= 0 && result.searchMs <= 30000, 'search budget exceeded');
  const botMoves = result.baseline?.outcome === 'win' ? result.baseline.movesUsed : null;
  const oracleMoves = result.best?.movesUsed ?? null;
  if (botMoves !== null) assert.ok(oracleMoves !== null && oracleMoves <= botMoves, 'regressed verified bot incumbent');
  return {
    humanBestMoves: puzzle.humanBestMoves, botMoves, oracleMoves,
    movesSaved: puzzle.humanBestMoves === null || oracleMoves === null ? null : puzzle.humanBestMoves - oracleMoves,
    pass: oracleMoves !== null && (puzzle.humanBestMoves === null || oracleMoves <= puzzle.humanBestMoves),
  };
}

module.exports = { verifyWitness, assessPuzzle };
