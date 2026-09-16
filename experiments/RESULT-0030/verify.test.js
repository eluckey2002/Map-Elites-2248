const { test } = require('node:test');
const assert = require('node:assert/strict');

const { verifyIdentity, verifyRow } = require('./verify');
const { identity } = require('./subject');

test('artifact identity check sees a planted body mutation', () => {
  const body = { result: 'RESULT-0030', rows: [] };
  const artifact = { ...body, registration: {}, artifactIdentity: identity(body) };
  assert.equal(verifyIdentity(artifact), undefined);
  assert.throws(() => verifyIdentity({ ...artifact, rows: [{ planted: true }] }), /identity mismatch/);
});

test('row verifier rejects search arms bound to different puzzles', () => {
  const row = {
    level: 10,
    seed: 1,
    puzzleIdentity: 'expected',
    shallow: { puzzleIdentity: 'wrong' },
    deep: { puzzleIdentity: 'expected' },
  };
  assert.throws(() => verifyRow(row), /do not share puzzle identity/);
});
