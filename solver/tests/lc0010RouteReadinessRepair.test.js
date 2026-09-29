const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  calibrationControls,
  validateManifest,
} = require('../../tools/diagnose-lc0010-route-readiness-repair');

const ROOT = path.join(__dirname, '..', '..');

test('all repaired readiness controls pass', () => {
  assert.deepEqual(calibrationControls().map(({ id, pass }) => [id, pass]), [
    ['C3-ready-route-known-good', true],
    ['C4-missing-node-known-negative', true],
    ['C5-broken-adjacency-known-negative', true],
    ['C6-partial-prefix-valid-double', true],
    ['C7-planted-false-ready', true],
    ['C8-restoration-and-persistence', true],
  ]);
});

test('missing earlier input does not renumber a later valid double', () => {
  const control = calibrationControls().find(({ id }) => id === 'C6-partial-prefix-valid-double');
  assert.equal(control.observed.readiness.routeExecutable, false);
  assert.equal(control.observed.readiness.missingDirectInputs.length, 1);
  assert.equal(control.observed.laterPairFalselyRejected, false);
  assert.deepEqual(control.observed.readiness.missingValueLinks, []);
  assert.equal(control.observed.failedAssessorKilled, true);
  assert.deepEqual(control.observed.failedReadiness.missingValueLinks.map(({ leftValue, rightValue }) => [leftValue, rightValue]), [[8, 16]]);
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0010-route-readiness-repair-manifest.json');
test('manifest inspects the real repair and retained invalid predecessor', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0010-route-readiness-repair.js'));
  assert.equal(paths.lc0009Closure, path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-closure.json'));
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('repair source does not define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0010-route-readiness-repair.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', 'promoteChampion']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
