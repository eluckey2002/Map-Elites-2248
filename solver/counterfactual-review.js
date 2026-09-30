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

module.exports = { branchCounterfactual, coordinateChain, stateBeforeMove };
