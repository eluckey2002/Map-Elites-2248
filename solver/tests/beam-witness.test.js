const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findBeamWitness, replayFrozenWitness } = require('../exact-score');

test('beam witness returns a deterministic legal lower-bound result', () => {
  const level = {
    level: 'fixture', target: 18, moves: 1, minChain: 4, gridW: 4, gridH: 1, blockers: [],
  };
  // Seed 0 gives the fixture's initial 2/4 mix. The assertion is about
  // determinism and witness shape, not a maximum claim.
  const first = findBeamWitness({ level, seed: 0, width: 8, actionsPerState: 8 });
  const second = findBeamWitness({ level, seed: 0, width: 8, actionsPerState: 8 });

  assert.deepEqual(first, second);
  assert.equal(first.kind, 'beam-search-lower-bound');
  assert.equal(first.complete, false);
  assert.equal(replayFrozenWitness({ level, seed: 0, witness: first.witness }).score, first.score);
});
