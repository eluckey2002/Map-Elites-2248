#!/usr/bin/env node

const path = require('node:path');

const { chainMultiplier } = require('../engine');
const { searchSuffix, mapCoordinates, runImprovement, loadStartingWitness } = require('./index');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function fixtureState() {
  return {
    grid: [[2, 2, 4, 4, 8].map((value, x) => tile(x, 0, value))],
    gridWidth: 5,
    gridHeight: 1,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 40,
    minChain: 4,
  };
}

function replayFixture(witness) {
  const state = fixtureState();
  if (!Array.isArray(witness) || witness.length !== 1) throw new Error('Fixture requires exactly one move');
  const chain = mapCoordinates(state, witness[0]);
  const sum = chain.reduce((total, entry) => total + entry.value, 0);
  return { score: Math.floor(sum * chainMultiplier(chain.length)), moves: 1, cursor: chain.length - 1 };
}

function runFixture() {
  const baseWitness = [[[0, 0], [1, 0], [2, 0], [3, 0]]];
  const baseReplay = replayFixture(baseWitness);
  const result = searchSuffix({
    prefixState: fixtureState(),
    spawnValues: [2, 4, 8, 2],
    prefixCursor: 0,
    prefixScore: 0,
    prefixWitness: [],
    target: 40,
    width: 8,
    walkSamples: 8,
    candidateLimit: 12,
    variants: 2,
    searchSeed: 2248,
    mode: 0,
  });
  const replay = replayFixture(result.best.witness);
  let malformedCandidateRejected = false;
  let malformedError = null;
  try {
    replayFixture([[[0, 0], [1, 0], [1, 0], [3, 0]]]);
  } catch (error) {
    malformedCandidateRejected = true;
    malformedError = error.message;
  }
  return {
    kind: 'near-target-search-fixture',
    verdict: baseReplay.score === 18 && replay.score === 40 && malformedCandidateRejected ? 'PASS' : 'FAIL',
    baseScore: baseReplay.score,
    knownOptimum: 40,
    recoveredScore: replay.score,
    replay,
    witness: result.best.witness,
    malformedCandidateRejected,
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

function startingFilename() {
  const index = process.argv.indexOf('--starting');
  return index === -1
    ? path.resolve(__dirname, '../target-witness-search/frozen-run.json')
    : path.resolve(process.argv[index + 1]);
}

function cutsArgument() {
  const index = process.argv.indexOf('--cuts');
  if (index === -1) return undefined;
  const cuts = process.argv[index + 1].split(',').map((value) => Number(value));
  if (cuts.length === 0 || cuts.some((cut) => !Number.isSafeInteger(cut) || cut < 0 || cut >= 32)) {
    throw new Error('--cuts must be a comma-separated list of move indexes from 0 through 31');
  }
  return cuts;
}

function main() {
  if (process.argv.includes('--fixture')) return runFixture();
  if (process.argv.includes('--base-replay')) {
    const loaded = loadStartingWitness(startingFilename());
    return {
      verdict: 'PASS',
      artifactSha256: loaded.artifactHash,
      inputIdentity: loaded.artifact.inputIdentity,
      ...loaded.replay,
    };
  }
  if (!process.argv.includes('--target')) {
    throw new Error('choose exactly one mode: --fixture, --base-replay, or --target');
  }
  return runImprovement({
    startingFilename: startingFilename(),
    rounds: integerArgument('--rounds', 1),
    cuts: cutsArgument(),
    width: integerArgument('--width', 32),
    walkSamples: integerArgument('--walk-samples', 12),
    candidateLimit: integerArgument('--candidate-limit', 24),
    variants: integerArgument('--variants', 1),
  });
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

module.exports = { fixtureState, replayFixture, runFixture };
