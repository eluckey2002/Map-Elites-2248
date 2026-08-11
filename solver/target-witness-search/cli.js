#!/usr/bin/env node

const { LEVELS } = require('../../src/game');
const { chainMultiplier } = require('../engine');
const { replayFrozenWitness } = require('../exact-score');
const { runFrozenSearch, searchFromState } = require('./index');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function fixtureState() {
  return {
    grid: [[2, 2, 4, 4].map((value, x) => tile(x, 0, value))],
    gridWidth: 4,
    gridHeight: 1,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 18,
    minChain: 4,
  };
}

function replayFixture(state, witness, spawnValues) {
  const seen = new Set();
  const chain = witness[0].map(([x, y]) => {
    if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) {
      throw new Error('fixture witness coordinate is off-board');
    }
    const key = `${x},${y}`;
    if (seen.has(key)) throw new Error('fixture witness reuses a tile');
    seen.add(key);
    return state.grid[y][x];
  });
  for (let index = 1; index < chain.length; index += 1) {
    const previous = chain[index - 1];
    const current = chain[index];
    if (Math.abs(previous.x - current.x) > 1 || Math.abs(previous.y - current.y) > 1) {
      throw new Error('fixture witness has a non-adjacent step');
    }
    if (index === 1 && previous.value !== current.value) {
      throw new Error('fixture witness first pair is unequal');
    }
    if (index > 1 && current.value !== previous.value && current.value !== previous.value * 2) {
      throw new Error('fixture witness violates the value-extension rule');
    }
  }
  if (chain.length < state.minChain) throw new Error('fixture witness is shorter than minimum chain');
  const sum = chain.reduce((total, entry) => total + entry.value, 0);
  return {
    score: Math.floor(sum * chainMultiplier(chain.length)),
    moves: 1,
    cursor: chain.length - 1,
    spawnPrefix: spawnValues.slice(0, chain.length - 1),
  };
}

function runFixture() {
  const state = fixtureState();
  const spawnValues = [2, 4, 8];
  const result = searchFromState({
    initialState: state,
    spawnValues,
    target: 18,
    width: 8,
    walkSamples: 8,
    candidateLimit: 8,
    searchSeed: 2248,
  });
  const replay = replayFixture(state, result.best.witness, spawnValues);
  let malformedRejected = false;
  let malformedError = null;
  try {
    replayFixture(state, [[[0, 0], [1, 0], [1, 0], [3, 0]]], spawnValues);
  } catch (error) {
    malformedRejected = true;
    malformedError = error.message;
  }
  return {
    kind: 'target-witness-search-fixture',
    verdict: replay.score === 18 && malformedRejected ? 'PASS' : 'FAIL',
    knownOptimum: 18,
    recoveredScore: replay.score,
    replay,
    witness: result.best.witness,
    malformedCandidateRejected: malformedRejected,
    malformedError,
    searchCoverage: result.stats,
  };
}

function integerArgument(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  const parsed = Number(process.argv[index + 1]);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function main() {
  if (process.argv.includes('--fixture')) return runFixture();
  if (!process.argv.includes('--target')) {
    throw new Error('choose exactly one mode: --fixture or --target');
  }
  const level = LEVELS.find((entry) => entry.level === 26);
  const result = runFrozenSearch({
    level,
    seed: 0,
    restarts: integerArgument('--restarts', 6),
    width: integerArgument('--width', 384),
    walkSamples: integerArgument('--walk-samples', 80),
    candidateLimit: integerArgument('--candidate-limit', 80),
  });

  // A malformed-candidate negative control runs through the frozen replayer,
  // not through the search transition code.
  let malformedRejected = false;
  let malformedError = null;
  try {
    replayFrozenWitness({
      level,
      seed: 0,
      witness: [[[0, 0], [0, 0], [1, 0], [1, 1]]],
    });
  } catch (error) {
    malformedRejected = true;
    malformedError = error.message;
  }
  if (!malformedRejected) throw new Error('Frozen replayer accepted the malformed negative control');
  return { ...result, malformedCandidateRejected: malformedRejected, malformedError };
}

if (require.main === module) {
  try {
    const result = main();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.verdict === 'PASS' || result.targetReached ? 0 : 2;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ verdict: 'ERROR', error: error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = { runFixture, replayFixture };
