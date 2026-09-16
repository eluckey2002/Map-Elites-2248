const test = require('node:test');
const assert = require('node:assert/strict');

const { identity } = require('./subject');
const { verifyIdentity, verifyRow } = require('./verify');

test('artifact identity check kills a planted body mutation', () => {
  const body = { result: 'RESULT-0037', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verification kills planted work-cap and exact-standing mutations', () => {
  const row = {
    denominator: 'exact',
    moves: 1,
    denominatorObservations: [{
      standing: 'exact_result',
      maxPathStates: 500000,
      timeoutMs: 30000,
      points: 100,
      legalChains: 2,
      visitedPathStates: 4,
    }],
    exactComplete: true,
    descriptors: { halfScoreMove: 0.5, greedRatio: 0.75 },
  };
  assert.equal(verifyRow(row), true);
  assert.throws(() => verifyRow({
    ...row,
    denominatorObservations: [{ ...row.denominatorObservations[0], maxPathStates: 499999 }],
  }), /work cap mismatch/);
  assert.throws(() => verifyRow({ ...row, exactComplete: false }), /completeness mismatch/);
});
