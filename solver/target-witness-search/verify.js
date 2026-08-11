#!/usr/bin/env node

const fs = require('node:fs');
const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState } = require('../engine');
const { makeFrozenSpawnValues, replayFrozenWitness } = require('../exact-score');
const { frozenIdentity } = require('./index');

function verifyResult(result) {
  const level = LEVELS.find((entry) => entry.level === 26);
  const seed = 0;
  const initialState = createLevelState(level, makeRng(seed));
  const spawnValues = makeFrozenSpawnValues(level, seed);
  const inputIdentity = frozenIdentity(initialState, spawnValues);
  if (result.level !== 26 || result.seed !== seed || result.target !== 13000) {
    throw new Error('result is outside the frozen Level 26 seed-0 target scope');
  }
  if (result.inputIdentity !== inputIdentity) throw new Error('frozen input identity mismatch');
  if (!Array.isArray(result.witness)) throw new Error('result has no machine-readable witness');

  const replay = replayFrozenWitness({ level, seed, witness: result.witness });
  if (result.scoreClaim !== replay.score) throw new Error('score claim disagrees with replay');
  if (result.replay.moves !== replay.moves) throw new Error('move count disagrees with replay');
  if (result.replay.cursor !== replay.cursor) throw new Error('spawn cursor disagrees with replay');
  if (result.targetReached !== replay.reachesTarget) throw new Error('target status disagrees with replay');
  return {
    verdict: 'PASS',
    level: 26,
    seed,
    target: 13000,
    inputIdentity,
    score: replay.score,
    moves: replay.moves,
    cursor: replay.cursor,
    targetReached: replay.reachesTarget,
    interpretation: replay.reachesTarget
      ? 'replayed lower witness only; no exact maximum or upper-bound claim'
      : 'replayed lower bound only; non-decisive miss with no feasibility or upper-bound claim',
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
