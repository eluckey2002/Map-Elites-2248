const crypto = require('node:crypto');

const {
  canExtendChain,
  createLevelState,
  findGreedyChains,
  isValidChain,
  isBlockedTile,
  makeRng,
} = require('./engine');
const { applyFrozenChain } = require('./exact-score');

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

function makeScaledSpawnStream(level, rng) {
  const scale = level.tileScale || 1;
  const length = level.moves * (level.gridW * level.gridH - 1);
  return Array.from({ length }, () => {
    const draw = rng();
    if (draw < 0.6) return 2 * scale;
    if (draw < 0.9) return 4 * scale;
    return 8 * scale;
  });
}

function canStartLegalChain(state, start) {
  if (!start || isBlockedTile(start)) return false;
  const chain = [start];
  const visited = new Set([start]);

  function walk() {
    if (chain.length >= state.minChain && chain[0].value === chain[1].value) return true;
    const last = chain[chain.length - 1];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = last.x + dx;
        const y = last.y + dy;
        if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
        const tile = state.grid[y][x];
        if (!tile || isBlockedTile(tile) || visited.has(tile) || !canExtendChain(chain, tile)) continue;
        visited.add(tile);
        chain.push(tile);
        if (walk()) return true;
        chain.pop();
        visited.delete(tile);
      }
    }
    return false;
  }

  return walk();
}

function viableStartFraction(state) {
  const tiles = state.grid.flat().filter((tile) => tile && !isBlockedTile(tile));
  const viable = tiles.filter((tile) => canStartLegalChain(state, tile)).length;
  return { viable, available: tiles.length, fraction: tiles.length ? viable / tiles.length : 0 };
}

function chainKey(chain) {
  return chain.map((tile) => `${tile.x},${tile.y}`).join('|');
}

function combinedCandidates(state, { actionsPerState, pathWidth }) {
  const candidates = new Map();
  for (const preferMergeableSum of [true, false]) {
    for (const result of findGreedyChains(state, {
      limit: actionsPerState,
      pathWidth,
      preferMergeableSum,
    })) {
      const key = chainKey(result.chain);
      if (!candidates.has(key)) candidates.set(key, result);
    }
  }
  return [...candidates.entries()]
    .sort(([keyA, a], [keyB, b]) => b.points - a.points || keyA.localeCompare(keyB))
    .slice(0, actionsPerState)
    .map(([, result]) => result.chain);
}

function gridKey(state) {
  return state.grid.flat().map((tile) => (
    tile ? `${tile.value}:${tile.blocker || ''}:${tile.blockerDuration}:${tile.bombTimer}` : '_'
  )).join(',');
}

function searchWitness({ state, cursor, spawnValues, width, actionsPerState, pathWidth }) {
  let frontier = [{ state, cursor, score: state.score, witness: [] }];
  let best = frontier[0];
  let expandedStates = 0;
  let generatedActions = 0;

  while (frontier.length && best.score < state.targetScore) {
    const nextByState = new Map();
    for (const node of frontier) {
      if (node.state.moves >= node.state.maxMoves) continue;
      expandedStates += 1;
      const candidates = combinedCandidates(node.state, { actionsPerState, pathWidth });
      generatedActions += candidates.length;
      for (const chain of candidates) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const next = {
          state: transition.state,
          cursor: transition.cursor,
          score: transition.state.score,
          witness: [...node.witness, chain.map((tile) => [tile.x, tile.y])],
        };
        const key = `${transition.cursor}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (!previous || next.score > previous.score) nextByState.set(key, next);
        if (next.score > best.score) best = next;
      }
    }
    frontier = [...nextByState.values()].sort((a, b) => b.score - a.score).slice(0, width);
  }
  return {
    reachesTarget: best.score >= state.targetScore,
    score: best.score,
    witness: best.witness,
    diagnostics: { width, actionsPerState, pathWidth, expandedStates, generatedActions },
  };
}

function applyCoordinates(state, coordinates, spawnValues, cursor) {
  const chain = coordinates.map(([x, y]) => state.grid[y] && state.grid[y][x]);
  if (chain.some((tile) => !tile)) throw new Error('witness selects an unavailable tile');
  if (new Set(chain).size !== chain.length) throw new Error('witness selects a tile more than once');
  for (let index = 1; index < chain.length; index += 1) {
    const previous = chain[index - 1];
    const current = chain[index];
    if (Math.max(Math.abs(previous.x - current.x), Math.abs(previous.y - current.y)) !== 1) {
      throw new Error('witness contains non-adjacent tiles');
    }
    if (!canExtendChain(chain.slice(0, index), current)) {
      throw new Error('witness contains an illegal value extension');
    }
  }
  if (!isValidChain(chain, state.minChain)) throw new Error('witness chain is too short');
  return applyFrozenChain(state, chain, spawnValues, cursor);
}

function puzzleRecord(level, seed, initialState, spawnValues) {
  return {
    level: level.level,
    seed,
    target: level.target,
    moves: level.moves,
    minChain: level.minChain,
    tileScale: level.tileScale || 1,
    gridW: level.gridW,
    gridH: level.gridH,
    blockers: level.blockers,
    initialGridIdentity: identity(initialState.grid.map((row) => row.map((tile) => ({
      value: tile && tile.value,
      blocker: tile && tile.blocker,
      blockerDuration: tile && tile.blockerDuration,
      bombTimer: tile && tile.bombTimer,
    })))),
    spawnStreamIdentity: identity(spawnValues),
  };
}

function analyzeChoiceRecovery({
  level,
  seed,
  search = { width: 24, actionsPerState: 16, pathWidth: 2 },
  recoveryAlternatives = 8,
  recoveryCandidatePool = 64,
}) {
  const rng = makeRng(seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeScaledSpawnStream(level, rng);
  const initialChoice = viableStartFraction(initialState);
  const puzzle = puzzleRecord(level, seed, initialState, spawnValues);
  const reference = searchWitness({ state: initialState, cursor: 0, spawnValues, ...search });
  if (!reference.reachesTarget || reference.witness.length === 0) {
    return {
      standing: 'UNKNOWN',
      choiceStanding: 'exact_initial_state',
      recoveryStanding: 'UNKNOWN',
      seed,
      puzzleIdentity: identity(puzzle),
      puzzle,
      descriptors: {
        initialViableStartFraction: initialChoice.fraction,
        witnessViableStartFraction: null,
        oneDetourRecoveryWitnessRate: null,
      },
      initialChoice,
      choiceTrace: [],
      recovery: null,
      reference,
    };
  }

  let state = initialState;
  let cursor = 0;
  const choiceTrace = [];
  for (const coordinates of reference.witness) {
    choiceTrace.push(viableStartFraction(state));
    const transition = applyCoordinates(state, coordinates, spawnValues, cursor);
    state = transition.state;
    cursor = transition.cursor;
  }

  const referenceFirst = reference.witness[0].map(([x, y]) => `${x},${y}`).join('|');
  const alternatives = combinedCandidates(initialState, {
    ...search,
    actionsPerState: recoveryCandidatePool,
  })
    .filter((chain) => chainKey(chain) !== referenceFirst)
    .reverse()
    .slice(0, recoveryAlternatives);
  const recoveryTrials = [];
  for (const chain of alternatives) {
    const transition = applyFrozenChain(initialState, chain, spawnValues, 0);
    if (transition.state.score >= level.target) continue;
    const continuation = searchWitness({
      state: transition.state,
      cursor: transition.cursor,
      spawnValues,
      ...search,
    });
    recoveryTrials.push({
      firstMove: chain.map((tile) => [tile.x, tile.y]),
      reachesTarget: continuation.reachesTarget,
      continuationMoves: continuation.witness.length,
      continuationWitness: continuation.witness,
      score: continuation.score,
    });
  }
  const recovered = recoveryTrials.filter(({ reachesTarget }) => reachesTarget).length;
  const meanChoice = choiceTrace.reduce((sum, row) => sum + row.fraction, 0) / choiceTrace.length;
  if (identity(puzzleRecord(level, seed, initialState, spawnValues)) !== identity(puzzle)) {
    throw new Error('analysis mutated its initial puzzle state');
  }
  return {
    standing: recoveryTrials.length ? 'bounded_proxy_observation' : 'UNKNOWN',
    choiceStanding: 'exact_initial_state',
    recoveryStanding: recoveryTrials.length ? 'replayed_lower_bound_fraction' : 'UNKNOWN',
    seed,
    puzzleIdentity: identity(puzzle),
    puzzle,
    descriptors: recoveryTrials.length ? {
      initialViableStartFraction: initialChoice.fraction,
      witnessViableStartFraction: meanChoice,
      oneDetourRecoveryWitnessRate: recovered / recoveryTrials.length,
    } : null,
    initialChoice,
    choiceTrace,
    recovery: {
      recovered,
      tested: recoveryTrials.length,
      candidatePoolLimit: recoveryCandidatePool,
      selection: 'lowest-scoring non-reference candidates first',
      trials: recoveryTrials,
    },
    reference,
  };
}

function replayChoiceRecoveryAnalysis(level, analysis) {
  const rng = makeRng(analysis.seed);
  const initialState = createLevelState(level, rng);
  const spawnValues = makeScaledSpawnStream(level, rng);
  const puzzle = puzzleRecord(level, analysis.seed, initialState, spawnValues);
  if (analysis.puzzleIdentity && analysis.puzzleIdentity !== identity(puzzle)) {
    throw new Error('puzzle identity mismatch');
  }

  let state = initialState;
  let cursor = 0;
  const choiceTrace = [];
  for (const coordinates of analysis.reference.witness) {
    choiceTrace.push(viableStartFraction(state));
    const transition = applyCoordinates(state, coordinates, spawnValues, cursor);
    state = transition.state;
    cursor = transition.cursor;
  }
  if (state.score !== analysis.reference.score) throw new Error('reference witness score mismatch');
  if (analysis.standing === 'UNKNOWN') return true;
  if (canonicalJson(choiceTrace) !== canonicalJson(analysis.choiceTrace || [])) {
    throw new Error('choice trace mismatch');
  }

  let recovered = 0;
  for (const trial of analysis.recovery.trials) {
    let transition = applyCoordinates(initialState, trial.firstMove, spawnValues, 0);
    for (const coordinates of trial.continuationWitness) {
      transition = applyCoordinates(transition.state, coordinates, spawnValues, transition.cursor);
    }
    const reachesTarget = transition.state.score >= level.target;
    if (transition.state.score !== trial.score || reachesTarget !== trial.reachesTarget) {
      throw new Error('recovery witness replay mismatch');
    }
    if (reachesTarget) recovered += 1;
  }
  if (recovered !== analysis.recovery.recovered) throw new Error('recovery count mismatch');
  const expectedRate = recovered / analysis.recovery.tested;
  if (expectedRate !== analysis.descriptors.oneDetourRecoveryWitnessRate) {
    throw new Error('recovery witness rate mismatch');
  }
  return true;
}

module.exports = {
  analyzeChoiceRecovery,
  canStartLegalChain,
  combinedCandidates,
  replayChoiceRecoveryAnalysis,
  searchWitness,
  viableStartFraction,
};
