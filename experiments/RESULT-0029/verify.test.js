const { test } = require('node:test');
const assert = require('node:assert/strict');

const { analyzePuzzle, exactScoreEnvelope } = require('../../solver/puzzle-descriptors');
const { verifyPuzzleInstance } = require('./verify');

const LEVEL = Object.freeze({
  level: 90290,
  name: 'result-0029-verifier-qualification',
  gridW: 3,
  gridH: 3,
  moves: 2,
  minChain: 3,
  tileScale: 1,
  blockers: [],
  target: 1,
});

function qualificationInstance() {
  const envelope = exactScoreEnvelope({ level: LEVEL, seed: 7 });
  const target = envelope.scoresUpTo[1][3];
  const instance = analyzePuzzle({ level: { ...LEVEL, target }, seed: 7, target });
  return { region: 'relaxed-short', ...instance };
}

test('verifier accepts a recomputed real puzzle instance', () => {
  assert.equal(verifyPuzzleInstance(qualificationInstance()), true);
});

test('verifier goes red when the guarded descriptor is changed', () => {
  const broken = qualificationInstance();
  broken.descriptor.minimumMoves = 2;
  broken.descriptor.budgetTightness = 1;

  assert.throws(() => verifyPuzzleInstance(broken), /descriptor recomputation mismatch/);
});

test('verifier goes red when the replay witness is absent', () => {
  const broken = qualificationInstance();
  broken.descriptor.minimumCapWitness = [];

  assert.throws(() => verifyPuzzleInstance(broken), /descriptor recomputation mismatch/);
});
