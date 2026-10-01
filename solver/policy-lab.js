const { LEVELS } = require('../src/game');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs, chainValue } = require('./engine');
const { analyzeMove } = require('./bot');
const { analyzePowerOfTwoMove } = require('./power-of-two-challenger');

const LOOKAHEAD_BASE = 987654321;

function snapshotBoard(state) {
  return state.grid.map((row) => row.map((tile) => (tile ? {
    value: tile.value, blocker: tile.blocker || null, bombTimer: tile.bombTimer || 0,
  } : null)));
}

function chainSnapshot(chain) {
  return chain.map(({ x, y, value, blocker, bombTimer }) => ({ x, y, value, blocker: blocker || null, bombTimer: bombTimer || 0 }));
}

function recordPolicy(level, seed, policy) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const moves = [];
  let terminal = null;
  for (let index = 0; index < level.moves; index += 1) {
    const before = snapshotBoard(state);
    const decision = policy.decide(state, index);
    const chain = decision.selectedChain;
    if (!chain) { terminal = { result: 'stop', reason: decision.reason, movesUsed: state.moves, finalScore: state.score }; break; }
    const endingValue = chainValue(chain);
    const points = executeChain(state, chain);
    applyGravity(state); spawnNewTiles(state, rng); tickBlockers(state);
    moves.push({ index, boardBefore: before, boardAfter: snapshotBoard(state), chain: chainSnapshot(chain), points, endingValue, scoreBefore: state.score - points, scoreAfter: state.score, decision: { ...decision, selectedChain: undefined } });
    if (checkBombs(state)) { terminal = { result: 'lose', reason: 'bomb', movesUsed: state.moves, finalScore: state.score }; break; }
    if (state.score >= state.targetScore) { terminal = { result: 'win', reason: 'target', movesUsed: state.moves, finalScore: state.score }; break; }
  }
  return { label: policy.label, moves, terminal: terminal || { result: 'lose', reason: 'out of moves', movesUsed: state.moves, finalScore: state.score } };
}

function comparePolicies(levelNumber, seed) {
  const level = LEVELS.find(({ level: number }) => number === levelNumber);
  if (!level) throw new Error(`Level ${levelNumber} is unavailable`);
  return {
    level: level.level, seed, gridW: level.gridW, gridH: level.gridH, targetScore: level.target, moveBudget: level.moves,
    champion: recordPolicy(level, seed, { label: 'Current champion', decide: (state, index) => analyzeMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + index) }) }),
    powerOfTwo: recordPolicy(level, seed, { label: 'Highest-value power-of-two survivor', decide: analyzePowerOfTwoMove }),
  };
}

module.exports = { comparePolicies, recordPolicy, snapshotBoard };
