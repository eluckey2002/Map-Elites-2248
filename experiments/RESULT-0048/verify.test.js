const { test } = require('node:test');
const assert = require('node:assert/strict');

const { identity } = require('./subject');
const { verifyIdentity, verifyRows } = require('./verify');

test('artifact identity detects a planted outcome mutation', () => {
  const body = { result: 'RESULT-0048', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.doesNotThrow(() => verifyIdentity(artifact));
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verifier rejects a missing paired arm', () => {
  const artifact = {
    panel: { moveLimit: 16 },
    rows: Array.from({ length: 4096 }, (_, index) => ({
      openingIdentity: String(index),
      arms: index === 0 ? [] : [
        { arm: 'a', trace: [] }, { arm: 'b', trace: [] },
        { arm: 'c', trace: [] }, { arm: 'd', trace: [] },
      ],
    })),
  };
  assert.throws(() => verifyRows(artifact), /all four spawn arms/);
});
