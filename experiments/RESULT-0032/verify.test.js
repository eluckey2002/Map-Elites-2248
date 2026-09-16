const { test } = require('node:test');
const assert = require('node:assert/strict');

const { identity } = require('./subject');
const { verifyIdentity, verifyRow } = require('./verify');

test('artifact identity check sees a planted body mutation', () => {
  const body = { result: 'RESULT-0032', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verifier inspects and rejects a planted illegal witness', () => {
  const level = {
    level: 'fixture', target: 12, moves: 2, minChain: 2,
    tileScale: 1, gridW: 2, gridH: 2, blockers: [],
  };
  const invalid = {
    shallow: {
      tight: { seed: 1, standing: 'UNKNOWN', reference: { witness: [[[99, 99]]], score: 0 } },
      slack: { seed: 1, standing: 'UNKNOWN', reference: { witness: [], score: 0 } },
    },
    deep: {
      tight: { seed: 1, standing: 'UNKNOWN', reference: { witness: [], score: 0 } },
      slack: { seed: 1, standing: 'UNKNOWN', reference: { witness: [], score: 0 } },
    },
  };
  assert.throws(() => verifyRow(invalid, level), /unavailable tile/);
});
