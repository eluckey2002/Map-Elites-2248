const test = require('node:test');
const assert = require('node:assert/strict');

const { qualify } = require('../../tools/qualify-route-diverse-afterstate-reuse');

test('afterstate reuse preserves every frozen supplemental score, ordering, and known reversal', () => {
  const artifact = qualify();

  assert.equal(artifact.outcome, 'EXACT_ORDERING_PRESERVED');
  assert.equal(artifact.states, 21);
  assert.equal(artifact.supplementalCandidates, 2143);
  assert.equal(artifact.uniqueAfterstates, 1299);
  assert.equal(artifact.reusedAfterstateEvaluations, 844);
  assert.equal(artifact.lowerImmediateHigherAfterstateReversals, 186);
  assert.equal(artifact.rows.every(({ supplementalCandidates, uniqueAfterstates, reusedAfterstateEvaluations }) => (
    supplementalCandidates === uniqueAfterstates + reusedAfterstateEvaluations
  )), true);
});
