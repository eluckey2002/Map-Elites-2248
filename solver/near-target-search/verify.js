#!/usr/bin/env node

const fs = require('node:fs');

const { replayFrozenWitness } = require('../exact-score');
const {
  BASE_ARTIFACT_SHA256,
  FROZEN_INPUT_SHA256,
  witnessHash,
} = require('./index');
const { LEVELS } = require('../../src/game');

function verifyResult(result) {
  const level = LEVELS.find((entry) => entry.level === 26);
  if (result.level !== 26 || result.seed !== 0 || result.target !== 13000) {
    throw new Error('Result is outside the frozen Level 26 seed-0 target scope');
  }
  if (result.startingArtifactSha256 !== BASE_ARTIFACT_SHA256) {
    throw new Error('Starting artifact hash mismatch');
  }
  if (result.inputIdentity !== FROZEN_INPUT_SHA256) throw new Error('Frozen input identity mismatch');
  if (!Array.isArray(result.witness)) throw new Error('Result has no machine-readable witness');
  if (result.witnessSha256 !== witnessHash(result.witness)) throw new Error('Witness hash mismatch');
  const replay = replayFrozenWitness({ level, seed: 0, witness: result.witness });
  if (result.scoreClaim !== replay.score || result.bestVerifiedLowerBound !== replay.score) {
    throw new Error('Score claim disagrees with independent replay');
  }
  if (result.replay.moves !== replay.moves || result.replay.cursor !== replay.cursor) {
    throw new Error('Replay metadata disagrees with independent replay');
  }
  if (result.targetReached !== replay.reachesTarget) throw new Error('Target status disagrees with independent replay');
  return {
    verdict: 'PASS',
    level: 26,
    seed: 0,
    target: 13000,
    inputIdentity: FROZEN_INPUT_SHA256,
    startingArtifactSha256: BASE_ARTIFACT_SHA256,
    witnessSha256: result.witnessSha256,
    score: replay.score,
    moves: replay.moves,
    cursor: replay.cursor,
    targetReached: replay.reachesTarget,
    interpretation: replay.reachesTarget
      ? 'independently replayed reachability witness only; not an exact maximum or upper bound'
      : 'independently replayed lower bound only; non-decisive miss with no feasibility or upper-bound claim',
  };
}

if (require.main === module) {
  try {
    const filename = process.argv[2];
    if (!filename) throw new Error('usage: node verify.js <result.json>');
    const result = JSON.parse(fs.readFileSync(filename, 'utf8'));
    process.stdout.write(`${JSON.stringify(verifyResult(result), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ verdict: 'FAIL', error: error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = { verifyResult };
