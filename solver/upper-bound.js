const { createHash } = require('node:crypto');
const { LEVELS } = require('../src/game');
const { makeRng, createLevelState, chainMultiplier } = require('./engine');
const { makeFrozenSpawnValues } = require('./exact-score');

function boardValue(state) {
  return state.grid.flat().reduce((sum, tile) => sum + (tile ? tile.value : 0), 0);
}

function frozenValuesIdentity(state, spawnValues) {
  const initial = state.grid.flat().map((tile) => (tile ? tile.value : 0));
  return createHash('sha256').update(Buffer.from([...initial, ...spawnValues])).digest('hex');
}

// Exact dynamic program over a deliberately generous resource relaxation.
//
// A physical L-tile merge:
//   * scores floor(multiplier(L) * chainSum), where chainSum cannot exceed
//     the total value currently on the board;
//   * conserves board value in its survivor; and
//   * consumes exactly L - 1 frozen spawn values while refilling the holes.
//
// The relaxation keeps those three facts, but discards geometry, value
// compatibility, blockers, and the requirement that any chain actually
// exists. It therefore contains every physical continuation. The DP fully
// explores every relaxed chain length at every (moves-left, spawn-cursor)
// state; maxNodes is only a fail-closed resource guard, never a cutoff result.
function solveMassCursorUpperBound({
  state,
  spawnValues,
  cursor = 0,
  target = state.targetScore,
  maxNodes = Infinity,
  inputIdentity = null,
}) {
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > spawnValues.length) {
    throw new Error('cursor must identify an entry in the frozen spawn stream');
  }

  const remainingMoves = Math.max(0, state.maxMoves - state.moves);
  const maxChainLength = state.gridWidth * state.gridHeight;
  const initialValue = boardValue(state);
  const prefix = [0];
  for (const value of spawnValues) prefix.push(prefix[prefix.length - 1] + value);

  const memo = new Map();
  const stats = { visited: 0, memoHits: 0, transitions: 0 };

  function solve(movesLeft, currentCursor) {
    if (movesLeft === 0) return { score: 0, chainLengths: [] };
    const key = `${movesLeft}|${currentCursor}`;
    const saved = memo.get(key);
    if (saved) {
      stats.memoHits += 1;
      return saved;
    }

    stats.visited += 1;
    if (stats.visited > maxNodes) {
      throw new Error(`Upper-bound search exceeded node cap ${maxNodes}; no bound was produced`);
    }

    // Merges conserve value. Thus, after consuming a prefix of the frozen
    // stream, current mass is independent of all earlier relaxed choices.
    const currentValue = initialValue + prefix[currentCursor] - prefix[cursor];
    let best = { score: 0, chainLengths: [] };

    for (let length = state.minChain; length <= maxChainLength; length += 1) {
      const nextCursor = currentCursor + length - 1;
      if (nextCursor > spawnValues.length) break;
      stats.transitions += 1;
      const points = Math.floor(currentValue * chainMultiplier(length));
      const future = solve(movesLeft - 1, nextCursor);
      const score = points + future.score;
      if (score > best.score) {
        best = { score, chainLengths: [length, ...future.chainLengths] };
      }
    }

    memo.set(key, best);
    return best;
  }

  const result = solve(remainingMoves, cursor);
  const decidesTarget = result.score < target;
  return {
    kind: 'certified-mass-cursor-upper-bound',
    complete: true,
    score: result.score,
    target,
    targetComparison: decidesTarget ? 'decisive-unreachable' : 'non-decisive',
    decidesTarget,
    inputIdentity,
    assumptions: [
      'fixed initial board values and frozen spawn stream',
      'merge conserves chain value in one survivor',
      'an L-tile merge consumes exactly L-1 spawn values',
      'relaxation permits every chain length from minChain through board capacity regardless of geometry or values',
      'per-move relaxed score is floor(board total value times the shipped length multiplier)',
    ],
    relaxationWitness: { chainLengths: result.chainLengths },
    finiteBound: {
      remainingMoves,
      maxChainLength,
      spawnValuesAvailable: spawnValues.length - cursor,
      maxNodes,
    },
    stats,
  };
}

function solveFrozenLevel26() {
  const level = LEVELS.find((entry) => entry.level === 26);
  if (!level) throw new Error('Level 26 is missing');
  const state = createLevelState(level, makeRng(0));
  const spawnValues = makeFrozenSpawnValues(level, 0);
  const inputIdentity = frozenValuesIdentity(state, spawnValues);
  return {
    level: 26,
    seed: 0,
    ...solveMassCursorUpperBound({
      state,
      spawnValues,
      target: level.target,
      maxNodes: 50000,
      inputIdentity,
    }),
  };
}

if (require.main === module) {
  const result = solveFrozenLevel26();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

module.exports = {
  boardValue,
  frozenValuesIdentity,
  solveMassCursorUpperBound,
  solveFrozenLevel26,
};
