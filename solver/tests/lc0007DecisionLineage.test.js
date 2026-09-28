const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  executeTrackedChain,
  fixtureState,
  validateManifest,
  verifyCarrierClaim,
} = require('../../tools/diagnose-lc0007-decision-lineage');

const ROOT = path.join(__dirname, '..', '..');

function decisionFixture() {
  const state = fixtureState([
    [2, 2, 4, null],
    [8, 8, 8, 16],
  ]);
  const decision = [state.grid[0][0], state.grid[0][1], state.grid[0][2]];
  executeTrackedChain(state, decision);
  return { state, carrier: decision[2] };
}

test('lineage transfers when the carrier is consumed as a non-final tile', () => {
  const { state, carrier } = decisionFixture();
  const event = executeTrackedChain(state, [
    state.grid[1][0], state.grid[1][1], carrier, state.grid[1][2], state.grid[1][3],
  ], carrier);
  assert.equal(event.usesLineage, true);
  assert.equal(event.lineageIndex, 2);
  assert.equal(event.transferred, true);
  assert.deepEqual(event.carrierAfter, { x: 3, y: 1, value: 48 });
  assert.equal(verifyCarrierClaim(event, event.carrierAfter), true);
});

test('an unrelated chain does not steal the lineage', () => {
  const { state, carrier } = decisionFixture();
  const event = executeTrackedChain(state, [state.grid[1][0], state.grid[1][1], state.grid[1][2]], carrier);
  assert.equal(event.usesLineage, false);
  assert.equal(event.transferred, false);
  assert.equal(event.carrier, carrier);
  assert.deepEqual(event.carrierAfter, { x: 2, y: 0, value: 8 });
});

test('carrier validator kills a planted false coordinate', () => {
  const { state, carrier } = decisionFixture();
  const event = executeTrackedChain(state, [
    state.grid[1][0], state.grid[1][1], carrier, state.grid[1][2], state.grid[1][3],
  ], carrier);
  assert.throws(
    () => verifyCarrierClaim(event, { ...event.carrierAfter, x: event.carrierAfter.x - 1 }),
    /lineage carrier mismatch/,
  );
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-manifest.json');
test('manifest inspects real frozen files and rejects a coherent identity twin', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0007-decision-lineage.js'));
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = require('node:crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('diagnostic source cannot define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0007-decision-lineage.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', 'promoteChampion']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
