#!/usr/bin/env node

const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState } = require('../engine');
const { makeFrozenSpawnValues, replayFrozenWitness } = require('../exact-score');

const EXPECTED_INPUT_SHA256 = 'edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880';

function frozenIdentity(level, seed) {
  const state = createLevelState(level, makeRng(seed));
  const initial = state.grid.flat().map((tile) => tile.value);
  const spawns = makeFrozenSpawnValues(level, seed);
  return createHash('sha256').update(Buffer.from([...initial, ...spawns])).digest('hex');
}

function replayRequest(request) {
  const level = LEVELS.find((entry) => entry.level === 26);
  if (!level || request.level !== 26 || request.seed !== 0) {
    throw new Error('replay request is outside frozen Level 26 seed-0 scope');
  }
  if (!Number.isFinite(request.threshold) || request.threshold <= 0) {
    throw new Error('replay request has no positive threshold');
  }
  if (!Array.isArray(request.witness)) throw new Error('replay request has no witness');

  const inputIdentity = frozenIdentity(level, 0);
  if (inputIdentity !== EXPECTED_INPUT_SHA256) throw new Error('live frozen input identity changed');
  if (request.inputIdentity !== inputIdentity) throw new Error('request input identity mismatch');

  const replay = replayFrozenWitness({ level, seed: 0, witness: request.witness });
  if (request.claimedScore != null && replay.score !== request.claimedScore) {
    throw new Error(`claimed score ${request.claimedScore} disagrees with replay ${replay.score}`);
  }
  if (replay.score < request.threshold) {
    throw new Error(`replayed score ${replay.score} is below threshold ${request.threshold}`);
  }
  return {
    verdict: 'PASS',
    level: 26,
    seed: 0,
    threshold: request.threshold,
    inputIdentity,
    score: replay.score,
    moves: replay.moves,
    cursor: replay.cursor,
    reachesThreshold: true,
    reachesTarget: replay.score >= level.target,
    interpretation: replay.score >= level.target
      ? 'replayed reachability witness only; no maximum or upper-bound claim'
      : 'replayed lower witness only; no maximum or upper-bound claim',
  };
}

if (require.main === module) {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    process.stdout.write(`${JSON.stringify(replayRequest(request))}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ verdict: 'FAIL', error: error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = { frozenIdentity, replayRequest };
