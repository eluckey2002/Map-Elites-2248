const { test } = require('node:test');
const assert = require('node:assert/strict');

const { identity } = require('./subject');
const { verifyIdentity, verifyRow } = require('./verify');

test('artifact identity check sees a planted body mutation', () => {
  const body = { result: 'RESULT-0033', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verifier rejects search arms bound to different puzzles', () => {
  const row = { shallow: { puzzleIdentity: 'a' }, deep: { puzzleIdentity: 'b' } };
  assert.throws(() => verifyRow(row, {}), /do not share puzzle identity/);
});
