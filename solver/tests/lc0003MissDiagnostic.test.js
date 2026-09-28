const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  MISS_MOVES,
  collectDiagnosis,
} = require('../../tools/diagnose-lc0003-misses');
const { verifyArtifactIdentity } = require('../../tools/qualify-three-step-target-progress');

const ROOT = path.join(__dirname, '..', '..');
const MANIFEST = path.join(
  ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-manifest.json',
);
const QUALIFICATION = path.join(
  ROOT, 'docs', 'learning-cycles', 'LC-0003-three-step-target-progress-raw.json',
);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

test('the four-miss diagnostic reproduces both frozen seams exactly', { timeout: 120_000 }, () => {
  const artifact = collectDiagnosis({ manifestPath: MANIFEST, qualificationPath: QUALIFICATION });
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.deepEqual(artifact.bounds.moves, MISS_MOVES);
  assert.equal(artifact.sources.qualificationFileSha256, sha256(QUALIFICATION));
  assert.equal(
    artifact.sources.diagnosticScriptSha256,
    sha256(path.join(ROOT, 'tools', 'diagnose-lc0003-misses.js')),
  );
  assert.deepEqual(artifact.misses.map(({ move }) => move), [4, 6, 9, 11]);
  for (const miss of artifact.misses) {
    assert.equal(miss.arms.owner.before.stateIdentity, miss.arms.champion.before.stateIdentity);
    assert.equal(miss.arms.owner.short.continuationMoves, 3);
    assert.equal(miss.arms.champion.short.continuationMoves, 3);
    assert.equal(miss.arms.owner.short.status, 'active');
    assert.equal(miss.arms.champion.short.status, 'active');
    assert.equal(miss.arms.owner.terminal.status, 'win');
    assert.equal(miss.arms.champion.terminal.status, 'win');
  }
});

test('the diagnostic source does not define a successor cost or verdict', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0003-misses.js'), 'utf8');
  assert.equal(source.includes('successorCost'), false);
  assert.equal(source.includes("qualification: 'PASS'"), false);
  assert.equal(source.includes('SUPPORTED'), false);
});
