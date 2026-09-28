const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  completeHarvestAvailable,
  entryEdges,
  enumerateBuiltPaths,
  stateFromNormalizedGrid,
  validateManifest,
  verifyCoverage,
} = require('../../tools/diagnose-lc0006-harvest-counterexample');

const ROOT = path.join(__dirname, '..', '..');

test('exact built-path search accepts a complete entered reservoir', () => {
  const state = stateFromNormalizedGrid([[16, 32, 32, 32, 64]]);
  const topology = enumerateBuiltPaths(state);
  assert.equal(topology.builtCount, 4);
  assert.equal(topology.maxCoverage, 4);
  assert.equal(completeHarvestAvailable(topology, entryEdges(state)), true);
});

test('exact built-path search rejects a planted adjacency break', () => {
  const state = stateFromNormalizedGrid([[16, 32, 32, null, 32, 64]]);
  const topology = enumerateBuiltPaths(state);
  assert.equal(topology.maxCoverage, 2);
  assert.equal(completeHarvestAvailable(topology, entryEdges(state)), false);
});

test('coverage verifier rejects a planted extra coordinate', () => {
  const built = [
    { x: 0, y: 0, value: 32 },
    { x: 1, y: 0, value: 32 },
    { x: 2, y: 0, value: 64 },
  ];
  const pathTiles = built.slice(0, 2);
  assert.equal(verifyCoverage(pathTiles, built).coveredCount, 2);
  assert.throws(() => verifyCoverage(pathTiles, built, built), /claimed built coverage mismatch/);
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0006-complete-harvest-counterexample-manifest.json');
test('manifest inspects the real frozen files and rejects a coherent identity twin', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0006-harvest-counterexample.js'));

  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = require('node:crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('diagnostic source cannot define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0006-harvest-counterexample.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', 'promoteChampion']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
