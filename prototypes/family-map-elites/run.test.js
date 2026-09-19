const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildArchive,
  candidateSpec,
  createOpeningState,
  openingValues,
  replayOpeningWitness,
  searchOpening,
} = require('./run');

test('family openings retain full blue separator rows or columns', () => {
  const horizontal = candidateSpec(0);
  const vertical = Array.from({ length: 80 }, (_, index) => candidateSpec(index))
    .find(({ template, family }) => template === 'vertical-3' && family === 9);
  const horizontalValues = openingValues(horizontal);
  assert.ok(horizontalValues[3].every((value) => [2, 4, 8].includes(value)));
  const verticalValues = openingValues(vertical);
  assert.ok(verticalValues.every((row) => [2, 4, 8].includes(row[1]) && [2, 4, 8].includes(row[3])));
});

test('opening state uses ordinary rules and the family-scaled target', () => {
  const candidate = candidateSpec(3);
  const state = createOpeningState(candidate);
  assert.equal(candidate.family, 9);
  assert.equal(state.gridWidth, 5);
  assert.equal(state.gridHeight, 8);
  assert.equal(state.maxMoves, 16);
  assert.equal(state.targetScore, 1440);
  assert.equal(state.minChain, 2);
});

test('archive retains at most three distinct candidates per 7x7 cell', () => {
  const evaluation = (id, winRate) => ({
    boardIdentity: id,
    candidate: { name: id },
    eligible: true,
    quality: { winRate },
    descriptors: {
      breadth: { standing: 'replayed_lower_bound', value: 3, bin: { index: 2 } },
      harvest: { standing: 'paired_bounded_search_proxy', value: 0, bin: { index: 3 } },
    },
  });
  const archive = buildArchive([
    evaluation('a', 1), evaluation('b', 0.8), evaluation('c', 0.6), evaluation('d', 0.4),
  ]);
  assert.equal(archive.length, 1);
  assert.deepEqual(archive[0].elites.map(({ boardIdentity }) => boardIdentity), ['d', 'c', 'b']);
});

test('a retained family-opening witness replays through the same frozen refill stream', () => {
  const candidate = candidateSpec(0);
  const result = searchOpening(candidate, 45_100_000, (state) => state.score);
  assert.ok(result.best);
  assert.doesNotThrow(() => replayOpeningWitness(candidate, 45_100_000, result.best));
});
