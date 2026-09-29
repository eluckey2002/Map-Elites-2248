const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  calibrationControls,
  validateManifest,
} = require('../../tools/diagnose-lc0009-route-readiness');

const ROOT = path.join(__dirname, '..', '..');

test('ready, missing-node, broken-adjacency, false-ready, and persistence controls pass', () => {
  const controls = calibrationControls();
  assert.deepEqual(controls.map(({ id, pass }) => [id, pass]), [
    ['C3-ready-route-known-good', true],
    ['C4-missing-node-known-negative', true],
    ['C5-broken-adjacency-known-negative', true],
    ['C6-planted-false-ready', true],
    ['C7-restoration-and-persistence', true],
  ]);
});

test('controls name the exact missing node and broken adjacency', () => {
  const controls = Object.fromEntries(calibrationControls().map((control) => [control.id, control]));
  assert.equal(controls['C4-missing-node-known-negative'].observed.missingDirectInputs.length, 1);
  assert.equal(controls['C5-broken-adjacency-known-negative'].observed.missingAdjacencyLinks.length, 1);
  assert.match(controls['C6-planted-false-ready'].observed.mutationMessage, /readiness\/evidence contradiction/);
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0009-route-readiness-manifest.json');
test('manifest inspects real frozen files and rejects a coherent identity twin', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0009-route-readiness.js'));
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('diagnostic source cannot define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0009-route-readiness.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', 'promoteChampion']) assert.equal(source.includes(forbidden), false, forbidden);
});
