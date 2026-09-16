const { test } = require('node:test');
const assert = require('node:assert/strict');

const { summarizeMap } = require('../../solver/merge-spread-map');

function analysis(depth, spread, id) {
  return {
    standing: 'replayed_witness_proxy',
    puzzleIdentity: id,
    descriptors: { peakMergeDepth: depth, meanNormalizedChainSpan: spread },
  };
}

test('the decision summary detects a planted collapsed archive', () => {
  const rows = Array.from({ length: 128 }, (_, index) => ({
    level: [10, 31, 53, 54][index % 4],
    dimensions: 'fixture',
    seed: index,
    shallow: analysis(1, 0.75, `puzzle-${index}`),
    deep: analysis(1, 0.75, `puzzle-${index}`),
  }));
  const summary = summarizeMap(rows);
  assert.equal(summary.P2.outcome, 'FALSIFIED');
  assert.equal(summary.disposition, 'MAP_CORPUS_NOT_SUPPORTED');
});
