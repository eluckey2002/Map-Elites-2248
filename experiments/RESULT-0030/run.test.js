const { test } = require('node:test');
const assert = require('node:assert/strict');

const { descriptorBin, summarizeRows } = require('./run');

function analysis(moves, cap, standing = 'replayed_upper_bound') {
  return {
    standing,
    descriptors: {
      minimumMovesUpperBound: moves,
      budgetTightnessUpperBound: moves === null ? null : moves / 10,
      chainLengthDependenceUpperBound: cap,
    },
  };
}

test('descriptor bins retain the explicit upper-bound interpretation', () => {
  assert.equal(descriptorBin(analysis(4, 8)), 'relaxed-short');
  assert.equal(descriptorBin(analysis(8, 20)), 'tight-long');
  assert.equal(descriptorBin(analysis(null, null, 'UNKNOWN')), 'UNKNOWN');
});

test('summary does not support a panel with missing profile coverage', () => {
  const rows = Array.from({ length: 8 }, (_, index) => ({
    level: index < 7 ? 10 : 31,
    shallow: analysis(4, 8),
    deep: analysis(4, 8),
    shallowBin: 'relaxed-short',
    deepBin: 'relaxed-short',
    deterministicCost: { shallowExpandedStates: 10, deepExpandedStates: 20 },
  }));
  const summary = summarizeRows(rows);
  assert.equal(summary.P1.outcome, 'INCONCLUSIVE');
  assert.equal(summary.descriptorDisposition, 'REVISE_BEFORE_MAP_CORPUS');
});
