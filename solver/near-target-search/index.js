const fs = require('node:fs');
const { createHash } = require('node:crypto');

const { LEVELS } = require('../../src/game');
const {
  makeRng,
  createLevelState,
  chainMultiplier,
  cloneState,
} = require('../engine');
const {
  applyFrozenChain,
  makeFrozenSpawnValues,
  replayFrozenWitness,
} = require('../exact-score');
const { candidateChains, frozenIdentity } = require('../target-witness-search');

const BASE_ARTIFACT_SHA256 = '4e47c05ed42cfd978e85591913ae2062c10525d003ece73e6b2feeef0e12094e';
const FROZEN_INPUT_SHA256 = 'edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function witnessHash(witness) {
  return sha256(Buffer.from(JSON.stringify(witness)));
}

function level26() {
  const level = LEVELS.find((entry) => entry.level === 26);
  if (!level || level.gridW !== 5 || level.gridH !== 8 || level.moves !== 32
    || level.minChain !== 4 || level.target !== 13000 || level.blockers.length !== 0) {
    throw new Error('Level 26 rules no longer match the frozen search scope');
  }
  return level;
}

function mapCoordinates(state, coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < state.minChain) {
    throw new Error('Candidate chain is shorter than the level minimum');
  }
  const seen = new Set();
  const chain = [];
  for (const coordinate of coordinates) {
    if (!Array.isArray(coordinate) || coordinate.length !== 2) {
      throw new Error('Candidate coordinate must be an [x,y] pair');
    }
    const [x, y] = coordinate;
    if (!Number.isInteger(x) || !Number.isInteger(y)
      || x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) {
      throw new Error('Candidate coordinate is off-board');
    }
    const key = `${x},${y}`;
    if (seen.has(key)) throw new Error('Candidate reuses a tile');
    seen.add(key);
    const tile = state.grid[y][x];
    if (!tile || tile.blocker) throw new Error('Candidate selects an unavailable tile');
    if (chain.length > 0) {
      const previous = chain[chain.length - 1];
      if (Math.abs(previous.x - x) > 1 || Math.abs(previous.y - y) > 1) {
        throw new Error('Candidate has a non-adjacent step');
      }
      if (chain.length === 1 ? tile.value !== previous.value
        : tile.value !== previous.value && tile.value !== previous.value * 2) {
        throw new Error('Candidate violates the value-extension rule');
      }
    }
    chain.push(tile);
  }
  return chain;
}

function replayPrefix({ level, seed, witness, moves }) {
  let state = createLevelState(level, makeRng(seed));
  const spawnValues = makeFrozenSpawnValues(level, seed);
  let cursor = 0;
  let score = 0;
  for (let move = 0; move < moves; move += 1) {
    const chain = mapCoordinates(state, witness[move]);
    const transition = applyFrozenChain(state, chain, spawnValues, cursor);
    state = transition.state;
    cursor = transition.cursor;
    score += transition.points;
  }
  return { state, spawnValues, cursor, score };
}

function gridKey(state) {
  return state.grid.flat().map((tile) => tile.value).join(',');
}

function chainKey(chain) {
  return chain.map((tile) => `${tile.x},${tile.y}`).join('|');
}

function chainPoints(chain) {
  const sum = chain.reduce((total, tile) => total + tile.value, 0);
  return Math.floor(sum * chainMultiplier(chain.length));
}

function boardFeatures(state) {
  const counts = new Map();
  let mass = 0;
  for (const tile of state.grid.flat()) {
    counts.set(tile.value, (counts.get(tile.value) || 0) + 1);
    mass += tile.value;
  }
  let repeatedMass = 0;
  let bridgeMass = 0;
  let maxRepeat = 0;
  for (const [value, count] of counts) {
    if (count >= 2) {
      repeatedMass += value * Math.min(count, 6);
      maxRepeat = Math.max(maxRepeat, value * count);
    }
    if (counts.has(value * 2)) bridgeMass += value * Math.min(count, 4);
  }
  return { repeatedMass, bridgeMass, maxRepeat, mass };
}

function selectBeam(nodes, width) {
  if (nodes.length <= width) return nodes;
  const profiles = [
    (node) => node.score,
    (node) => node.score + node.features.repeatedMass * 2 + node.features.bridgeMass,
    (node) => node.score + node.features.maxRepeat * 3 + node.features.bridgeMass * 2,
    (node) => node.score + node.features.mass * 0.04 - node.cursor * 0.02,
  ];
  const selected = new Map();
  const quota = Math.max(1, Math.floor(width / profiles.length));
  for (const rank of profiles) {
    const ordered = nodes.slice().sort((left, right) => rank(right) - rank(left)
      || right.score - left.score || left.key.localeCompare(right.key));
    for (const node of ordered.slice(0, quota)) selected.set(node.key, node);
  }
  if (selected.size < width) {
    const ordered = nodes.slice().sort((left, right) => right.score - left.score
      || left.key.localeCompare(right.key));
    for (const node of ordered) {
      selected.set(node.key, node);
      if (selected.size >= width) break;
    }
  }
  return [...selected.values()].slice(0, width);
}

function localActions(state, options) {
  const actions = new Map();
  for (let variant = 0; variant < options.variants; variant += 1) {
    const generated = candidateChains(state, {
      walkSamples: options.walkSamples,
      candidateLimit: options.candidateLimit,
      searchSeed: (options.searchSeed + variant * 2654435761) >>> 0,
      mode: options.mode + variant,
    });
    for (const chain of generated) actions.set(chainKey(chain), chain);
  }
  return [...actions.values()]
    .sort((left, right) => chainPoints(right) - chainPoints(left)
      || chainKey(left).localeCompare(chainKey(right)))
    .slice(0, options.candidateLimit);
}

function searchSuffix({
  prefixState,
  spawnValues,
  prefixCursor,
  prefixScore,
  prefixWitness,
  target,
  width,
  walkSamples,
  candidateLimit,
  variants,
  searchSeed,
  mode,
}) {
  let frontier = [{
    state: cloneState(prefixState),
    cursor: prefixCursor,
    score: prefixScore,
    witness: prefixWitness,
    key: `${prefixCursor}|${gridKey(prefixState)}`,
    features: boardFeatures(prefixState),
  }];
  let best = frontier[0];
  const remainingMoves = prefixState.maxMoves - prefixState.moves;
  const stats = {
    expandedStates: 0,
    generatedCandidates: 0,
    uniqueSuccessors: 0,
    duplicateSuccessors: 0,
    completedDepth: 0,
  };

  for (let depth = 0; depth < remainingMoves; depth += 1) {
    const nextByState = new Map();
    for (let nodeIndex = 0; nodeIndex < frontier.length; nodeIndex += 1) {
      const node = frontier[nodeIndex];
      stats.expandedStates += 1;
      const actions = localActions(node.state, {
        walkSamples,
        candidateLimit,
        variants,
        searchSeed: (searchSeed + depth * 1000003 + nodeIndex * 9176) >>> 0,
        mode: mode + depth,
      });
      stats.generatedCandidates += actions.length;
      for (const chain of actions) {
        const transition = applyFrozenChain(node.state, chain, spawnValues, node.cursor);
        const score = node.score + transition.points;
        const key = `${transition.cursor}|${gridKey(transition.state)}`;
        const previous = nextByState.get(key);
        if (previous && previous.score >= score) {
          stats.duplicateSuccessors += 1;
          continue;
        }
        const next = {
          state: transition.state,
          cursor: transition.cursor,
          score,
          witness: [...node.witness, chain.map((tile) => [tile.x, tile.y])],
          key,
          features: boardFeatures(transition.state),
        };
        nextByState.set(key, next);
        if (next.score > best.score) best = next;
        if (next.score >= target) {
          stats.uniqueSuccessors += nextByState.size;
          stats.completedDepth = depth + 1;
          return { best: next, targetReached: true, stats };
        }
      }
    }
    stats.uniqueSuccessors += nextByState.size;
    stats.completedDepth = depth + 1;
    frontier = selectBeam([...nextByState.values()], width);
    if (frontier.length === 0) break;
  }
  return { best, targetReached: best.score >= target, stats };
}

function verifyRetained({ level, seed, candidate }) {
  const replay = replayFrozenWitness({ level, seed, witness: candidate.witness });
  if (replay.score !== candidate.score || replay.cursor !== candidate.cursor
    || replay.moves !== candidate.witness.length) {
    throw new Error('Independent replay disagrees with retained candidate');
  }
  return replay;
}

function loadStartingWitness(filename) {
  const bytes = fs.readFileSync(filename);
  const artifactHash = sha256(bytes);
  if (artifactHash !== BASE_ARTIFACT_SHA256) throw new Error('Starting witness artifact hash mismatch');
  const artifact = JSON.parse(bytes);
  const level = level26();
  const initialState = createLevelState(level, makeRng(0));
  const spawnValues = makeFrozenSpawnValues(level, 0);
  if (frozenIdentity(initialState, spawnValues) !== FROZEN_INPUT_SHA256
    || artifact.inputIdentity !== FROZEN_INPUT_SHA256) {
    throw new Error('Frozen input identity mismatch');
  }
  const replay = replayFrozenWitness({ level, seed: 0, witness: artifact.witness });
  if (replay.score !== 12336 || replay.moves !== 32 || replay.cursor !== 520
    || replay.reachesTarget) {
    throw new Error('Starting witness replay does not match the frozen 12,336 baseline');
  }
  return { artifact, artifactHash, level, replay };
}

function runImprovement({
  startingFilename,
  rounds = 1,
  cuts = [31, 30, 29, 28, 27, 26, 24, 22],
  width = 32,
  walkSamples = 12,
  candidateLimit = 24,
  variants = 1,
} = {}) {
  const { artifact, artifactHash, level, replay: startingReplay } = loadStartingWitness(startingFilename);
  let retained = {
    witness: artifact.witness,
    score: startingReplay.score,
    cursor: startingReplay.cursor,
    replay: startingReplay,
    source: 'frozen-start',
  };
  const neighborhoods = [];
  const retainedCandidates = [{
    score: retained.score,
    moves: retained.replay.moves,
    cursor: retained.cursor,
    witnessHash: witnessHash(retained.witness),
    source: retained.source,
  }];
  let retainedReplayCount = 1;

  outer: for (let round = 0; round < rounds; round += 1) {
    for (let cutIndex = 0; cutIndex < cuts.length; cutIndex += 1) {
      const cut = cuts[cutIndex];
      if (cut < 0 || cut >= level.moves) throw new Error(`Invalid neighborhood cut ${cut}`);
      const prefix = replayPrefix({ level, seed: 0, witness: retained.witness, moves: cut });
      const result = searchSuffix({
        prefixState: prefix.state,
        spawnValues: prefix.spawnValues,
        prefixCursor: prefix.cursor,
        prefixScore: prefix.score,
        prefixWitness: retained.witness.slice(0, cut),
        target: level.target,
        width,
        walkSamples,
        candidateLimit,
        variants,
        searchSeed: (0x4c4e5300 + round * 65537 + cut * 7919) >>> 0,
        mode: round * cuts.length + cutIndex,
      });
      const coverage = {
        round,
        cut,
        candidateScore: result.best.score,
        candidateMoves: result.best.witness.length,
        ...result.stats,
      };
      neighborhoods.push(coverage);
      if (result.best.score > retained.score
        || (result.best.score === retained.score && result.best.witness.length > retained.witness.length)) {
        const candidate = {
          witness: result.best.witness,
          score: result.best.score,
          cursor: result.best.cursor,
        };
        const replay = verifyRetained({ level, seed: 0, candidate });
        retainedReplayCount += 1;
        retained = { ...candidate, replay, source: `round-${round}-cut-${cut}` };
        retainedCandidates.push({
          score: replay.score,
          moves: replay.moves,
          cursor: replay.cursor,
          witnessHash: witnessHash(candidate.witness),
          source: retained.source,
        });
        if (replay.reachesTarget) break outer;
      }
    }
  }

  // Final output is replayed again as a separate output gate even when it was
  // already replayed at retention time.
  const finalReplay = verifyRetained({ level, seed: 0, candidate: retained });
  retainedReplayCount += 1;
  const targetReached = finalReplay.reachesTarget;
  return {
    kind: 'deterministic-large-neighborhood-lower-bound',
    level: 26,
    seed: 0,
    target: 13000,
    inputIdentity: FROZEN_INPUT_SHA256,
    startingArtifactSha256: artifactHash,
    verdict: targetReached ? 'TARGET_REACHED' : 'NON_DECISIVE_MISS',
    scoreClaim: finalReplay.score,
    bestVerifiedLowerBound: finalReplay.score,
    targetReached,
    complete: false,
    interpretation: targetReached
      ? 'independently replayed reachability witness only; not an exact maximum or upper bound'
      : 'independently replayed lower bound only; fixed-budget local-search miss makes no feasibility or upper-bound claim',
    fixedComputeBudget: { rounds, cuts, width, walkSamples, candidateLimit, variants },
    startingReplay,
    replay: finalReplay,
    witnessSha256: witnessHash(retained.witness),
    retainedReplayCount,
    retainedCandidates,
    searchCoverage: {
      neighborhoodsCompleted: neighborhoods.length,
      expandedStates: neighborhoods.reduce((sum, item) => sum + item.expandedStates, 0),
      generatedCandidates: neighborhoods.reduce((sum, item) => sum + item.generatedCandidates, 0),
      uniqueSuccessors: neighborhoods.reduce((sum, item) => sum + item.uniqueSuccessors, 0),
      duplicateSuccessors: neighborhoods.reduce((sum, item) => sum + item.duplicateSuccessors, 0),
      neighborhoods,
    },
    witness: retained.witness,
  };
}

module.exports = {
  BASE_ARTIFACT_SHA256,
  FROZEN_INPUT_SHA256,
  witnessHash,
  mapCoordinates,
  replayPrefix,
  searchSuffix,
  loadStartingWitness,
  runImprovement,
};
