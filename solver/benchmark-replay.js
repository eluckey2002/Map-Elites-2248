const {
  makeRng,
  createLevelState,
  canExtendChain,
  isValidChain,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
  isBlockedTile,
} = require('./engine');
const { validateSeed, valueIdentity } = require('./benchmark-inputs');

function hasLegalMove(state) {
  function visit(chain, seen) {
    if (isValidChain(chain, state.minChain)) return true;
    const last = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = last.x + dx;
        const y = last.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const tile = state.grid[y][x];
        if (!tile || isBlockedTile(tile)) continue;
        const key = `${x},${y}`;
        if (seen.has(key) || !canExtendChain(chain, tile)) continue;
        seen.add(key);
        chain.push(tile);
        if (visit(chain, seen)) return true;
        chain.pop();
        seen.delete(key);
      }
    }
    return false;
  }

  for (const row of state.grid) {
    for (const tile of row) {
      if (!tile || isBlockedTile(tile)) continue;
      if (visit([tile], new Set([`${tile.x},${tile.y}`]))) return true;
    }
  }
  return false;
}

function classifyTerminal(state, { bomb = checkBombs(state), hasLegalMove: legal = null, targetEnabled = true } = {}) {
  if (bomb) return { outcome: 'lose', reason: 'bomb exploded', firstCrossing: null };
  if (targetEnabled && state.score >= state.targetScore) {
    return { outcome: 'win', reason: 'target reached', firstCrossing: state.moves };
  }
  if (state.moves >= state.maxMoves) return { outcome: 'lose', reason: 'out of moves', firstCrossing: null };
  const stillLegal = legal === null ? hasLegalMove(state) : legal;
  if (!stillLegal) return { outcome: 'lose', reason: 'no legal moves', firstCrossing: null };
  return null;
}

function liveChain(state, recordedTiles, move, reasons) {
  if (!Array.isArray(recordedTiles)) {
    reasons.push(`move ${move}: chain tiles missing`);
    return null;
  }
  const chain = [];
  const seen = new Set();
  for (let index = 0; index < recordedTiles.length; index++) {
    const recorded = recordedTiles[index];
    if (!recorded || !Number.isInteger(recorded.x) || !Number.isInteger(recorded.y)
      || recorded.x < 0 || recorded.x >= state.gridWidth || recorded.y < 0 || recorded.y >= state.gridHeight) {
      reasons.push(`move ${move}: coordinate (${recorded && recorded.x},${recorded && recorded.y}) out of bounds`);
      return null;
    }
    const key = `${recorded.x},${recorded.y}`;
    if (seen.has(key)) reasons.push(`move ${move}: chain revisits (${key})`);
    seen.add(key);
    const tile = state.grid[recorded.y][recorded.x];
    if (!tile) {
      reasons.push(`move ${move}: no tile at (${key})`);
      return null;
    }
    if (isBlockedTile(tile)) reasons.push(`move ${move}: blocked tile at (${key})`);
    if (tile.value !== recorded.value) {
      reasons.push(`move ${move}: tile (${key}) holds ${tile.value}, recording claims ${recorded.value}`);
    }
    if (index > 0) {
      const previous = chain[index - 1];
      if (Math.abs(previous.x - tile.x) > 1 || Math.abs(previous.y - tile.y) > 1) {
        reasons.push(`move ${move}: non-adjacent chain step (${previous.x},${previous.y}) -> (${key})`);
      }
      if (!canExtendChain(chain, tile)) reasons.push(`move ${move}: illegal value extension to ${tile.value}`);
    }
    chain.push(tile);
  }
  if (!isValidChain(chain, state.minChain)) reasons.push(`move ${move}: chain is invalid at minChain ${state.minChain}`);
  return chain;
}

function replayRecording(candidate, recording, { expectedSeed, expectedCandidateIdentity } = {}) {
  const reasons = [];
  try {
    validateSeed(recording && recording.seed);
  } catch (error) {
    reasons.push(error.message);
  }
  if (expectedSeed !== undefined && recording && recording.seed !== expectedSeed) reasons.push('seed mismatch');
  if (expectedCandidateIdentity !== undefined && recording && recording.candidateIdentity !== expectedCandidateIdentity) {
    reasons.push('candidate identity mismatch');
  }
  if (expectedCandidateIdentity && valueIdentity(candidate) !== expectedCandidateIdentity) {
    reasons.push('candidate content identity mismatch');
  }
  if (!recording || !Array.isArray(recording.chains)) reasons.push('missing trace');
  if (reasons.length) return { validity: 'unresolved', outcome: null, reason: null, reasons, score: null, moves: null, firstCrossing: null };

  let state;
  try {
    const rng = makeRng(recording.seed);
    state = createLevelState(candidate, rng);
    let terminal = null;
    for (let index = 0; index < recording.chains.length; index++) {
      if (terminal) {
        reasons.push(`move ${index + 1}: continuation after terminal ${terminal.reason}`);
        break;
      }
      const recordedChain = recording.chains[index];
      const before = reasons.length;
      const chain = liveChain(state, recordedChain && recordedChain.tiles, index + 1, reasons);
      if (!chain || reasons.length !== before) break;
      const points = executeChain(state, chain);
      if (points !== recordedChain.points) reasons.push(`move ${index + 1}: scored ${points}, recording claims ${recordedChain.points}`);
      applyGravity(state);
      spawnNewTiles(state, rng);
      tickBlockers(state);
      terminal = classifyTerminal(state);
    }

    if (state.score !== recording.score) reasons.push(`final score ${state.score}, recording claims ${recording.score}`);
    if (state.moves !== recording.movesUsed) reasons.push(`used ${state.moves} moves, recording claims ${recording.movesUsed}`);
    if (!terminal && reasons.length === 0) reasons.push('incomplete trace before a terminal event');
    if (terminal && recording.outcome !== terminal.outcome) {
      reasons.push(`recording claims ${recording.outcome}, replay is ${terminal.outcome} (${terminal.reason})`);
    }
    if (terminal && recording.reason && recording.reason !== terminal.reason) {
      reasons.push(`recording reason ${recording.reason}, replay reason ${terminal.reason}`);
    }
    if (reasons.length) {
      return { validity: 'unresolved', outcome: null, reason: null, reasons, score: state.score, moves: state.moves, firstCrossing: null };
    }
    return {
      validity: 'valid',
      outcome: terminal.outcome,
      reason: terminal.reason,
      reasons: [],
      score: state.score,
      moves: state.moves,
      firstCrossing: terminal.firstCrossing,
    };
  } catch (error) {
    reasons.push(`measurement fault: ${error.message}`);
    return {
      validity: 'unresolved', outcome: null, reason: null, reasons,
      score: state ? state.score : null, moves: state ? state.moves : null, firstCrossing: null,
    };
  }
}

module.exports = { classifyTerminal, hasLegalMove, replayRecording };
