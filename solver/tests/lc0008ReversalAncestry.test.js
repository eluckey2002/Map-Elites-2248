const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { fixtureState } = require('../../tools/diagnose-lc0007-decision-lineage');
const {
  buildCorrectionGraph,
  calibrationControls,
  createTracker,
  executeAncestryMerge,
  registerBoardRoots,
  validateCorrectionGraph,
  validateManifest,
} = require('../../tools/diagnose-lc0008-reversal-ancestry');

const ROOT = path.join(__dirname, '..', '..');

function graphFixture() {
  const state = fixtureState([
    [2, 2, 4, null, 64],
    [8, 8, 8, 16, null],
  ]);
  const tracker = createTracker();
  registerBoardRoots(tracker, state, () => ({ origin: 'carried-board' }));
  const excludedTile = state.grid[0][4];
  const excludedNode = tracker.tileNodes.get(excludedTile);
  executeAncestryMerge(tracker, state, [state.grid[0][0], state.grid[0][1], state.grid[0][2]], 1);
  const firstOutput = state.grid.flat().find((tile) => tile && tracker.tileNodes.get(tile) === 'M001');
  executeAncestryMerge(tracker, state, [
    state.grid[1][0], state.grid[1][1], firstOutput, state.grid[1][2], state.grid[1][3],
  ], 2);
  const graph = buildCorrectionGraph(tracker, 'M002');
  const trustedRoots = [...tracker.roots.values()].map((root) => structuredClone(root));
  return { graph, trustedRoots, excludedNode, tracker, excludedTile };
}

test('two-stage ancestry reaches each contributing root once and conserves value', () => {
  const { graph, trustedRoots } = graphFixture();
  assert.equal(validateCorrectionGraph(graph, trustedRoots), true);
  assert.deepEqual(graph.merges.map(({ id }) => id), ['M001', 'M002']);
  assert.equal(graph.rootValueSum, 48);
  assert.equal(graph.correctionChainSum, 48);
});

test('an unrelated live root stays outside the correction graph', () => {
  const { graph, excludedNode, tracker, excludedTile } = graphFixture();
  assert.equal(graph.roots.some(({ id }) => id === excludedNode), false);
  assert.equal(tracker.tileNodes.get(excludedTile), excludedNode);
});

test('validator kills a planted false origin', () => {
  const { graph, trustedRoots } = graphFixture();
  graph.roots[0].origin = 'decision-refill';
  assert.throws(() => validateCorrectionGraph(graph, trustedRoots), /root-origin mismatch/);
});

test('validator kills a missing contributing root', () => {
  const { graph, trustedRoots } = graphFixture();
  graph.roots.shift();
  assert.throws(() => validateCorrectionGraph(graph, trustedRoots), /graph reachability missing node/);
});

test('all frozen qualification controls pass on disposable fixtures', () => {
  const controls = calibrationControls();
  assert.deepEqual(controls.map(({ id, pass }) => [id, pass]), [
    ['C3-merge-union-known-good', true],
    ['C4-unrelated-root-known-negative', true],
    ['C5-planted-false-origin', true],
    ['C6-conservation-mutation', true],
    ['C7-restoration-and-persistence', true],
  ]);
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0008-reversal-ancestry-manifest.json');
test('manifest inspects real frozen files and rejects a coherent identity twin', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0008-reversal-ancestry.js'));
  const coherent = structuredClone(manifest);
  coherent.identities.engine = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('diagnostic source cannot define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0008-reversal-ancestry.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', 'promoteChampion']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
