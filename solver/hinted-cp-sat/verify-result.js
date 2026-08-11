#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { replayRequest } = require('./replay-witness');

const EXPECTED_SCHEDULE = [12336, 12400, 12600, 12800, 13000];

function verifyResult(result) {
  if (result.kind !== 'hinted-cp-sat-threshold-escalation') throw new Error('wrong result kind');
  if (result.scope.level !== 26 || result.scope.seed !== 0 || result.scope.target !== 13000) {
    throw new Error('result is outside frozen Level 26 seed-0 scope');
  }
  if (JSON.stringify(result.budget.thresholdSchedule) !== JSON.stringify(EXPECTED_SCHEDULE)) {
    throw new Error('threshold schedule mismatch');
  }
  if (result.fixture.verdict !== 'PASS') throw new Error('fixture is not PASS');

  const start = result.startingWitness.hintedAcceptance;
  if (start.verdict !== 'SAT' || !start.matchesStartingWitness) {
    throw new Error('starting witness was not accepted by the hinted model');
  }
  if (start.replay.score !== 12336 || start.replay.moves !== 32 || start.replay.cursor !== 520) {
    throw new Error('starting witness replay mismatch');
  }

  const verdicts = [];
  for (const threshold of EXPECTED_SCHEDULE) {
    const entry = result.thresholdResults.find((candidate) => candidate.threshold === threshold);
    if (!entry || !['SAT', 'UNSAT', 'UNKNOWN'].includes(entry.verdict)) {
      throw new Error(`missing normalized verdict for threshold ${threshold}`);
    }
    if (entry.verdict === 'SAT') {
      if (!Array.isArray(entry.witness)) throw new Error(`SAT ${threshold} has no witness`);
      const replay = replayRequest({
        level: 26,
        seed: 0,
        threshold,
        inputIdentity: result.inputIdentity,
        claimedScore: entry.score,
        witness: entry.witness,
      });
      for (const key of ['verdict', 'level', 'seed', 'threshold', 'inputIdentity', 'score',
        'moves', 'cursor', 'reachesThreshold', 'reachesTarget', 'interpretation']) {
        if (replay[key] !== entry.replay[key]) {
          throw new Error(`stored replay ${key} disagrees at threshold ${threshold}`);
        }
      }
    } else if ('witness' in entry || 'score' in entry) {
      throw new Error(`${entry.verdict} ${threshold} must not carry a score or witness`);
    }
    verdicts.push({ threshold, verdict: entry.verdict });
  }
  const target = result.thresholdResults.find((entry) => entry.threshold === 13000);
  const targetReached = target.verdict === 'SAT' && target.replay.reachesTarget;
  if (result.targetReached !== targetReached) throw new Error('targetReached disagrees with target result');
  return {
    verdict: 'PASS',
    inputIdentity: result.inputIdentity,
    startingWitness: { score: start.replay.score, moves: start.replay.moves, cursor: start.replay.cursor },
    fixture: result.fixture,
    thresholdResults: verdicts,
    targetReached,
    interpretation: targetReached
      ? 'replayed reachability witness only; no maximum or upper-bound claim'
      : 'no replayed target witness; UNKNOWN results are non-decisive',
  };
}

if (require.main === module) {
  try {
    const filename = process.argv[2];
    if (!filename) throw new Error('usage: node verify-result.js <result.json>');
    const result = JSON.parse(fs.readFileSync(path.resolve(filename), 'utf8'));
    process.stdout.write(`${JSON.stringify(verifyResult(result), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ verdict: 'FAIL', error: error.message })}\n`);
    process.exitCode = 1;
  }
}

module.exports = { verifyResult };
