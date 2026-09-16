const test = require('node:test');
const assert = require('node:assert/strict');

const { descriptorCell } = require('../../solver/greed-descriptor-screen');
const { identity } = require('./subject');
const { verifyIdentity, verifyRow } = require('./verify');

test('artifact identity check sees a planted body mutation', () => {
  const body = { result: 'RESULT-0036', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verification rejects a planted exact-standing mutation', () => {
  const descriptors = { halfScoreMove: 0.5, greedRatio: 0.75 };
  const row = {
    denominator: 'exact',
    moves: 1,
    denominatorObservations: [{ standing: 'exact_result', points: 100 }],
    exactComplete: true,
    descriptors,
    cell: descriptorCell(descriptors),
  };
  assert.equal(verifyRow(row), true);
  assert.throws(() => verifyRow({ ...row, exactComplete: false }), /completeness mismatch/);
});
