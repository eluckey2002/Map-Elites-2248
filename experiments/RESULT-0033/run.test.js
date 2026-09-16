const { test } = require('node:test');
const assert = require('node:assert/strict');

const { summarizeRows } = require('./run');

function analysis(depth, spread, standing = 'replayed_witness_proxy') {
  return { standing, descriptors: standing === 'UNKNOWN' ? null : {
    peakMergeDepth: depth, meanNormalizedChainSpan: spread,
  } };
}

test('summary rejects search-sensitive merge depth', () => {
  const rows = Array.from({ length: 32 }, (_, index) => ({
    level: [10, 31, 53, 54][index % 4],
    shallow: analysis(index < 16 ? 1 : 2, index / 100),
    deep: analysis(index < 4 ? 1 : 2, index / 100),
  }));
  const summary = summarizeRows(rows);
  assert.equal(summary.P1.outcome, 'SUPPORTED');
  assert.equal(summary.P2.outcome, 'SUPPORTED');
  assert.equal(summary.P3.outcome, 'INCONCLUSIVE');
  assert.equal(summary.descriptorDisposition, 'REVISE_BEFORE_MAP_CORPUS');
});

test('summary requires at least two populated depth values', () => {
  const rows = Array.from({ length: 32 }, (_, index) => ({
    level: [10, 31, 53, 54][index % 4],
    shallow: analysis(1, index / 100),
    deep: analysis(1, index / 100),
  }));
  assert.equal(summarizeRows(rows).P2.outcome, 'INCONCLUSIVE');
});
