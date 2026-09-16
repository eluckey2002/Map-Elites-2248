const { test } = require('node:test');
const assert = require('node:assert/strict');

const { summarizeRows } = require('./run');

function analysis(choice, recovery) {
  return {
    recoveryStanding: recovery === null ? 'UNKNOWN' : 'replayed_lower_bound_fraction',
    descriptors: {
      initialViableStartFraction: choice,
      oneDetourRecoveryWitnessRate: recovery,
    },
  };
}

function row(choice, tight, slack) {
  return {
    shallow: { tight: analysis(choice, tight), slack: analysis(choice, slack) },
    deep: { tight: analysis(choice, tight), slack: analysis(choice, slack) },
  };
}

test('summary refuses fewer than twelve non-ceiling recovery pairs', () => {
  const rows = Array.from({ length: 32 }, (_, index) => (
    row(index < 16 ? 0.5 : 0.8, index < 11 ? 0.5 : 1, 1)
  ));
  const summary = summarizeRows(rows);
  assert.equal(summary.P1.outcome, 'SUPPORTED');
  assert.equal(summary.P2.outcome, 'INCONCLUSIVE');
  assert.equal(summary.descriptorDisposition, 'REVISE_BEFORE_MAP_CORPUS');
});

test('summary detects a planted choice-invariance failure', () => {
  const rows = Array.from({ length: 32 }, (_, index) => row(index < 16 ? 0.5 : 0.8, 0.5, 0.75));
  rows[0].deep.slack.descriptors.initialViableStartFraction = 0.6;
  assert.equal(summarizeRows(rows).P1.outcome, 'INCONCLUSIVE');
});
