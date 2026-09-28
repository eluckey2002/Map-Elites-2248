const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { verifyArtifactIdentity } = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(
  ROOT, 'docs', 'learning-cycles', 'LC-0004-move6-move8-causal-contrast-raw.json',
);

test('the retained LC-0004 artifact is complete, self-authenticating, and has the six frozen arms', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.equal(artifact.status, 'COMPLETE');
  assert.deepEqual(artifact.arms.map(({ id }) => id), [
    'M6-BASELINE', 'M6-CONNECT', 'M6-DISCONNECT',
    'M8-BASELINE', 'M8-CONNECT', 'M8-DISCONNECT',
  ]);
  assert.deepEqual(
    Object.fromEntries(artifact.arms.map(({ id, terminal }) => [id, terminal.targetCost])),
    {
      'M6-BASELINE': 15,
      'M6-CONNECT': 16,
      'M6-DISCONNECT': 18,
      'M8-BASELINE': 17,
      'M8-CONNECT': 14,
      'M8-DISCONNECT': 20,
    },
  );
  for (const arm of artifact.arms) {
    assert.equal(Object.values(arm.invariants).every(Boolean), true, arm.id);
  }
});

test('a planted change to the retained outcome invalidates its artifact identity', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  artifact.arms[0].terminal.targetCost += 1;
  assert.equal(verifyArtifactIdentity(artifact), false);
});
