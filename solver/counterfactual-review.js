const { LEVELS } = require('../src/game');
const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  canExtendChain,
  isValidChain,
  checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');
const { snapshotBoard } = require('./record-session');

const LOOKAHEAD_BASE = 987654321;

function coordinateChain(state, coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < state.minChain) {
    throw new Error(`a branch chain needs at least ${state.minChain} tiles`);
  }
  const seen = new Set();
  const chain = [];
  coordinates.forEach(({ x, y }, index) => {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= state.gridWidth || y >= state.gridHeight) {
      throw new Error(`branch tile ${index + 1} is outside the board`);
    }
    const key = `${x},${y}`;
    if (seen.has(key)) throw new Error('a branch chain cannot reuse a tile');
    seen.add(key);
    const tile = state.grid[y][x];
    if (!tile || tile.blocker === 'stone') throw new Error(`branch tile ${index + 1} is unavailable`);
    const previous = chain.at(-1);
    const adjacent = !previous || Math.max(Math.abs(previous.x - x), Math.abs(previous.y - y)) === 1;
    if (index && (!adjacent || !canExtendChain(chain, tile))) throw new Error(`branch tile ${index + 1} is not a legal extension`);
    chain.push(tile);
  });
  if (!isValidChain(chain, state.minChain)) throw new Error('branch chain is not legal');
  return chain;
}

function advance(state, rng, chain) {
  const points = executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return points;
}

function stateBeforeMove(level, seed, moveIndex) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  for (let index = 0; index < moveIndex; index += 1) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + index) });
    if (!chain) throw new Error(`champion has no move before branch move ${moveIndex + 1}`);
    advance(state, rng, chain);
    if (checkBombs(state) || state.score >= state.targetScore || state.moves >= state.maxMoves) {
      throw new Error(`move ${moveIndex + 1} is beyond the recorded champion session`);
    }
  }
  return { state, rng };
}

function continueChampion(state, rng) {
  while (!checkBombs(state) && state.score < state.targetScore && state.moves < state.maxMoves) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves) });
    if (!chain) break;
    advance(state, rng, chain);
  }
  const result = state.score >= state.targetScore ? 'win' : 'lose';
  return {
    result,
    ...(result === 'lose' ? { reason: checkBombs(state) ? 'bomb exploded' : 'no target finish' } : {}),
    movesUsed: state.moves,
    finalScore: state.score,
  };
}

function terminalOutcome(state) {
  if (state.score >= state.targetScore) {
    return { result: 'win', movesUsed: state.moves, finalScore: state.score };
  }
  if (checkBombs(state) || state.moves >= state.maxMoves) {
    return {
      result: 'lose',
      reason: checkBombs(state) ? 'bomb exploded' : 'no target finish',
      movesUsed: state.moves,
      finalScore: state.score,
    };
  }
  return null;
}

function takeoverReplay({ levelNumber, seed, moveIndex, chains }) {
  const level = LEVELS.find(({ level: number }) => number === levelNumber);
  if (!level) throw new Error(`level ${levelNumber} is unavailable`);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed is invalid');
  if (!Number.isInteger(moveIndex) || moveIndex < 0 || moveIndex >= level.moves) throw new Error('move index is invalid');
  if (!Array.isArray(chains)) throw new Error('takeover chains must be an array');

  const { state, rng } = stateBeforeMove(level, seed, moveIndex);
  const turns = [];
  for (const coordinates of chains) {
    if (terminalOutcome(state)) throw new Error('takeover is already complete');
    const chain = coordinateChain(state, coordinates);
    const boardBefore = snapshotBoard(state);
    const points = advance(state, rng, chain);
    turns.push({
      boardBefore,
      boardAfter: snapshotBoard(state),
      chain: chain.map(({ x, y, value }) => ({ x, y, value })),
      points,
      scoreAfter: state.score,
      movesUsed: state.moves,
    });
  }

  return {
    level: levelNumber,
    seed,
    startMoveIndex: moveIndex,
    board: snapshotBoard(state),
    score: state.score,
    movesUsed: state.moves,
    movesRemaining: Math.max(0, state.maxMoves - state.moves),
    turns,
    outcome: terminalOutcome(state),
  };
}

function branchCounterfactual({ levelNumber, seed, moveIndex, chain: coordinates }) {
  const level = LEVELS.find(({ level: number }) => number === levelNumber);
  if (!level) throw new Error(`level ${levelNumber} is unavailable`);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed is invalid');
  if (!Number.isInteger(moveIndex) || moveIndex < 0 || moveIndex >= level.moves) throw new Error('move index is invalid');
  const { state, rng } = stateBeforeMove(level, seed, moveIndex);
  const branch = coordinateChain(state, coordinates);
  const boardBefore = snapshotBoard(state);
  const points = advance(state, rng, branch);
  const scoreAfterBranch = state.score;
  const boardAfter = snapshotBoard(state);
  const outcome = continueChampion(state, rng);
  return {
    level: levelNumber,
    seed,
    moveIndex,
    boardBefore,
    branchChain: branch.map(({ x, y, value }) => ({ x, y, value })),
    points,
    scoreAfterBranch,
    boardAfter,
    outcome,
  };
}

module.exports = { branchCounterfactual, coordinateChain, stateBeforeMove, takeoverReplay };
