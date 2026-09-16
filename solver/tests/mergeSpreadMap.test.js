const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  CELL_KEYS,
  archiveCandidate,
  buildArchive,
  cellFor,
  summarizeMap,
} = require('../merge-spread-map');

function analysis(depth, spread, id, standing = 'replayed_witness_proxy') {
  return {
    standing,
    puzzleIdentity: id,
    descriptors: standing === 'UNKNOWN' ? null : {
      peakMergeDepth: depth,
      meanNormalizedChainSpan: spread,
    },
  };
}

function row(index, shallowDepth, shallowSpread, deepDepth = shallowDepth, deepSpread = shallowSpread) {
  return {
    level: [10, 31, 53, 54][index % 4],
    dimensions: 'fixture',
    seed: index,
    shallow: analysis(shallowDepth, shallowSpread, `puzzle-${String(index).padStart(3, '0')}`),
    deep: analysis(deepDepth, deepSpread, `puzzle-${String(index).padStart(3, '0')}`),
  };
}

test('the fixed axes assign all four intended cells', () => {
  assert.deepEqual([
    cellFor({ peakMergeDepth: 1, meanNormalizedChainSpan: 0.81 }),
    cellFor({ peakMergeDepth: 1, meanNormalizedChainSpan: 0.82 }),
    cellFor({ peakMergeDepth: 2, meanNormalizedChainSpan: 0.81 }),
    cellFor({ peakMergeDepth: 3, meanNormalizedChainSpan: 0.82 }),
  ], CELL_KEYS);
});

test('archive admission requires cross-width cell agreement and spread stability', () => {
  assert.ok(archiveCandidate(row(0, 1, 0.79, 1, 0.80)));
  assert.equal(archiveCandidate(row(0, 1, 0.79, 1, 0.83)), null);
  assert.equal(archiveCandidate(row(0, 1, 0.70, 1, 0.81)), null);
  const missing = row(0, 1, 0.79);
  missing.shallow = analysis(1, 0.79, 'puzzle-000', 'UNKNOWN');
  assert.equal(archiveCandidate(missing), null);
});

test('each cell retains the four most reproducible identities deterministically', () => {
  const rows = Array.from({ length: 6 }, (_, index) => row(index, 1, 0.70 + index / 1000, 1, 0.70));
  const archive = buildArchive(rows);
  const retained = archive.cells['depth-1/compact'].retained;
  assert.equal(retained.length, 4);
  assert.deepEqual(retained.map(({ seed }) => seed), [0, 1, 2, 3]);
});

test('a planted complete 128-row map supports all registered claims', () => {
  const rows = [];
  const fixtures = [[1, 0.75], [1, 0.90], [2, 0.75], [2, 0.90]];
  for (let index = 0; index < 128; index += 1) {
    const [depth, spread] = fixtures[index % fixtures.length];
    rows.push(row(index, depth, spread));
  }
  const summary = summarizeMap(rows);
  assert.equal(summary.P1.outcome, 'SUPPORTED');
  assert.equal(summary.P2.outcome, 'SUPPORTED');
  assert.equal(summary.P3.outcome, 'SUPPORTED');
  assert.equal(summary.disposition, 'CANONICAL_MAP_CORPUS_READY');
});

test('a two-cell collapse is falsified rather than called inconclusive', () => {
  const rows = Array.from({ length: 128 }, (_, index) => row(index, 1, index % 2 ? 0.75 : 0.90));
  const summary = summarizeMap(rows);
  assert.equal(summary.P2.outcome, 'FALSIFIED');
  assert.equal(summary.disposition, 'MAP_CORPUS_NOT_SUPPORTED');
});
