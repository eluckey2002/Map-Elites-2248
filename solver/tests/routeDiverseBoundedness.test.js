const test = require('node:test');
const assert = require('node:assert/strict');

const { SUPPLEMENT_LIMIT } = require('../route-diverse-challenger');
const { qualify } = require('../../tools/qualify-route-diverse-boundedness');

test('route-diverse boundedness qualification measures every frozen puzzle initial state without exceeding its cap', () => {
  const artifact = qualify();

  assert.equal(artifact.corpus.puzzles, 20);
  assert.equal(artifact.training.puzzles, 1);
  assert.equal(artifact.qualification.puzzles, 19);
  assert.ok(artifact.training.decisions > 0);
  assert.ok(artifact.qualification.decisions > 0);
  assert.ok(artifact.qualification.maxSupplementCandidates <= SUPPLEMENT_LIMIT);
  assert.ok(Number.isFinite(artifact.qualification.wallClockRatio));
  assert.equal(artifact.rows.every(({ decisions }) => decisions.every(({ supplementCandidates }) => (
    supplementCandidates <= SUPPLEMENT_LIMIT
  ))), true);
});
