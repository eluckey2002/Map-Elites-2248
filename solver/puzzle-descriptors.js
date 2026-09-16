const crypto = require('node:crypto');

const {
  createLevelState,
  makeRng,
} = require('./engine');
const {
  applyFrozenChain,
  enumerateLegalChains,
  makeFrozenSpawnValues,
  replayFrozenWitness,
} = require('./exact-score');

class ExactSearchLimit extends Error {
  constructor(maxNodes) {
    super(`exact descriptor search exceeded node cap ${maxNodes}`);
    this.name = 'ExactSearchLimit';
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function gridSnapshot(state) {
  return state.grid.map((row) => row.map((tile) => (tile ? {
    value: tile.value,
    blocker: tile.blocker,
    blockerDuration: tile.blockerDuration,
    bombTimer: tile.bombTimer,
  } : null)));
}

function gridKey(state) {
  return canonicalJson(gridSnapshot(state));
}

function validateExactScope(level) {
  if (!Number.isInteger(level.gridW) || !Number.isInteger(level.gridH) || level.gridW < 1 || level.gridH < 1) {
    throw new Error('exact descriptor scope requires positive integer dimensions');
  }
  if (!Number.isInteger(level.moves) || level.moves < 1) throw new Error('exact descriptor scope requires a positive move budget');
  if (!Number.isInteger(level.minChain) || level.minChain < 2) throw new Error('exact descriptor scope requires minChain >= 2');
  if ((level.tileScale || 1) !== 1) throw new Error('exact descriptor scope currently supports tileScale 1 only');
  if ((level.blockers || []).length !== 0) throw new Error('exact descriptor scope currently supports blocker-free puzzles only');
}

function blankMatrix(rows, columns, value = null) {
  return Array.from({ length: rows }, () => Array(columns).fill(value));
}

function copyWitness(witness) {
  return witness.map((chain) => chain.map(([x, y]) => [x, y]));
}

// Exhaustively explores a fixed starting board and frozen spawn stream. For
// every exact move count and every permitted maximum chain length, it retains
// the highest reachable cumulative score and one replayable witness.
//
// A state with the same board, score, cursor, and move count but a larger
// historical maximum chain length is dominated: every future continuation is
// identical, while the smaller cap is at least as good for this descriptor.
function exactScoreEnvelope({ level, seed, maxNodes = 250000 }) {
  validateExactScope(level);
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('seed must be an unsigned 32-bit integer');
  if (!Number.isInteger(maxNodes) || maxNodes < 1) throw new Error('maxNodes must be a positive integer');

  const initialState = createLevelState(level, makeRng(seed));
  const spawnValues = makeFrozenSpawnValues(level, seed);
  const maximumCap = level.gridW * level.gridH;
  const exactScores = blankMatrix(level.moves + 1, maximumCap + 1);
  const exactWitnesses = blankMatrix(level.moves + 1, maximumCap + 1);
  const stats = { expandedNodes: 0, generatedActions: 0, deduplicatedStates: 0 };
  let frontier = [{ state: initialState, cursor: 0, maximumChainLength: 0, witness: [] }];

  for (let move = 0; move <= level.moves; move++) {
    for (const node of frontier) {
      const minimumCap = Math.max(level.minChain, node.maximumChainLength);
      for (let cap = minimumCap; cap <= maximumCap; cap++) {
        if (exactScores[move][cap] === null || node.state.score > exactScores[move][cap]) {
          exactScores[move][cap] = node.state.score;
          exactWitnesses[move][cap] = copyWitness(node.witness);
        }
      }
    }
    if (move === level.moves) break;

    const nextByState = new Map();
    for (const node of frontier) {
      stats.expandedNodes += 1;
      if (stats.expandedNodes > maxNodes) throw new ExactSearchLimit(maxNodes);
      const actions = enumerateLegalChains(node.state);
      stats.generatedActions += actions.length;
      for (const chain of actions) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const maximumChainLength = Math.max(node.maximumChainLength, chain.length);
        const candidate = {
          state: transition.state,
          cursor: transition.cursor,
          maximumChainLength,
          witness: [...node.witness, chain.map((tile) => [tile.x, tile.y])],
        };
        const key = `${transition.cursor}|${transition.state.score}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (!previous || candidate.maximumChainLength < previous.maximumChainLength) {
          nextByState.set(key, candidate);
        } else {
          stats.deduplicatedStates += 1;
        }
      }
    }
    frontier = [...nextByState.values()];
  }

  const scoresUpTo = blankMatrix(level.moves + 1, maximumCap + 1);
  const witnessesUpTo = blankMatrix(level.moves + 1, maximumCap + 1);
  for (let move = 0; move <= level.moves; move++) {
    for (let cap = level.minChain; cap <= maximumCap; cap++) {
      const previous = move === 0 ? null : scoresUpTo[move - 1][cap];
      const exact = exactScores[move][cap];
      if (previous !== null && (exact === null || previous >= exact)) {
        scoresUpTo[move][cap] = previous;
        witnessesUpTo[move][cap] = copyWitness(witnessesUpTo[move - 1][cap]);
      } else if (exact !== null) {
        scoresUpTo[move][cap] = exact;
        witnessesUpTo[move][cap] = copyWitness(exactWitnesses[move][cap]);
      }
    }
  }

  return {
    complete: true,
    level: { ...level, blockers: (level.blockers || []).map((blocker) => ({ ...blocker })) },
    seed,
    initialBoard: gridSnapshot(initialState),
    spawnStreamIdentity: identity(spawnValues),
    maximumCap,
    exactScores,
    exactWitnesses,
    scoresUpTo,
    witnessesUpTo,
    stats,
  };
}

function descriptorFromEnvelope(envelope, target) {
  if (!Number.isFinite(target) || target <= 0) throw new Error('target must be a positive finite score');
  const { level, maximumCap, scoresUpTo, witnessesUpTo } = envelope;
  let minimumMoves = null;
  for (let move = 1; move <= level.moves; move++) {
    if ((scoresUpTo[move][maximumCap] || 0) >= target) {
      minimumMoves = move;
      break;
    }
  }
  if (minimumMoves === null) {
    return {
      standing: 'exact_result',
      reachable: false,
      target,
      maximumReachableScore: scoresUpTo[level.moves][maximumCap] || 0,
    };
  }

  let chainLengthDependence = null;
  for (let cap = level.minChain; cap <= maximumCap; cap++) {
    if ((scoresUpTo[level.moves][cap] || 0) >= target) {
      chainLengthDependence = cap;
      break;
    }
  }
  const moveWitness = copyWitness(witnessesUpTo[minimumMoves][maximumCap]);
  const capWitness = copyWitness(witnessesUpTo[level.moves][chainLengthDependence]);
  return {
    standing: 'exact_result',
    reachable: true,
    target,
    allowedMoves: level.moves,
    minimumMoves,
    budgetTightness: minimumMoves / level.moves,
    chainLengthDependence,
    minimumMovesWitness: moveWitness,
    minimumCapWitness: capWitness,
    counterfactuals: {
      bestScoreWithFewerMoves: minimumMoves === 1 ? 0 : scoresUpTo[minimumMoves - 1][maximumCap] || 0,
      bestScoreBelowRequiredCap: chainLengthDependence === level.minChain
        ? 0
        : scoresUpTo[level.moves][chainLengthDependence - 1] || 0,
    },
  };
}

function puzzleIdentity({ level, seed, initialBoard, spawnStreamIdentity, target }) {
  return identity({
    rules: '2248-score-target-v1',
    level: {
      gridW: level.gridW,
      gridH: level.gridH,
      moves: level.moves,
      minChain: level.minChain,
      tileScale: level.tileScale || 1,
      blockers: level.blockers || [],
    },
    seed,
    initialBoard,
    spawnStreamIdentity,
    target,
  });
}

function replayDescriptorWitnesses({ level, seed, descriptor }) {
  if (!descriptor.reachable) throw new Error('unreachable descriptor has no witness');
  const minimumMovesReplay = replayFrozenWitness({ level, seed, witness: descriptor.minimumMovesWitness });
  const minimumCapReplay = replayFrozenWitness({ level, seed, witness: descriptor.minimumCapWitness });
  if (!minimumMovesReplay.reachesTarget || minimumMovesReplay.moves !== descriptor.minimumMoves) {
    throw new Error('minimum-moves witness does not replay to the declared target and move count');
  }
  if (!minimumCapReplay.reachesTarget) throw new Error('minimum-cap witness does not replay to the target');
  const replayedMaximum = Math.max(...descriptor.minimumCapWitness.map((chain) => chain.length));
  if (replayedMaximum !== descriptor.chainLengthDependence) {
    throw new Error('minimum-cap witness does not use the declared maximum chain length');
  }
  return { minimumMovesReplay, minimumCapReplay };
}

function analyzePuzzle({ level, seed, target = level.target, maxNodes = 250000 }) {
  try {
    const envelope = exactScoreEnvelope({ level: { ...level, target }, seed, maxNodes });
    const descriptor = descriptorFromEnvelope(envelope, target);
    const result = {
      puzzleIdentity: puzzleIdentity({ ...envelope, target }),
      level: envelope.level,
      seed,
      initialBoard: envelope.initialBoard,
      spawnStreamIdentity: envelope.spawnStreamIdentity,
      descriptor,
      search: { complete: true, ...envelope.stats },
    };
    if (descriptor.reachable) result.replays = replayDescriptorWitnesses(result);
    return result;
  } catch (error) {
    if (!(error instanceof ExactSearchLimit)) throw error;
    return {
      level: { ...level, target },
      seed,
      descriptor: { standing: 'UNKNOWN', reachable: null, target, reason: error.message },
      search: { complete: false, nodeCap: maxNodes },
    };
  }
}

module.exports = {
  ExactSearchLimit,
  analyzePuzzle,
  canonicalJson,
  descriptorFromEnvelope,
  exactScoreEnvelope,
  identity,
  puzzleIdentity,
  replayDescriptorWitnesses,
};
