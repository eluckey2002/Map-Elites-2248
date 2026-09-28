const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  inspectChainLegality,
  validateManifest,
  verifyBuiltCoverage,
} = require('../../tools/diagnose-lc0005-complete-harvest');

const ROOT = path.join(__dirname, '..', '..');

function fixture(points, width = 6, height = 1) {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => null));
  for (const [x, y, value] of points) {
    grid[y][x] = { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
  }
  return { grid, gridWidth: width, gridHeight: height, minChain: 3, tileScale: 1 };
}

test('complete-harvest route uses actual king adjacency and equal-or-double values', () => {
  const state = fixture([
    [0, 0, 4], [1, 0, 4], [2, 0, 8], [3, 0, 16], [4, 0, 32], [5, 0, 64],
  ]);
  const route = [
    { x: 0, y: 0, value: 4 }, { x: 1, y: 0, value: 4 },
    { x: 2, y: 0, value: 8 }, { x: 3, y: 0, value: 16 },
    { x: 4, y: 0, value: 32 }, { x: 5, y: 0, value: 64 },
  ];
  assert.equal(inspectChainLegality(state, route).legal, true);
  state.grid[0][3] = null;
  state.grid.push(Array.from({ length: 6 }, () => null));
  state.gridHeight = 2;
  state.grid[1][3] = { x: 3, y: 1, value: 16, blocker: null, blockerDuration: 0, bombTimer: 0 };
  assert.match(inspectChainLegality(state, route).reason, /route point 3,0 is absent/);
});

test('coverage verifier rejects a planted extra built coordinate', () => {
  const built = [
    { x: 0, y: 0, value: 32 },
    { x: 1, y: 0, value: 32 },
    { x: 2, y: 0, value: 64 },
  ];
  const chain = built.slice(0, 2);
  assert.deepEqual(verifyBuiltCoverage(chain, built).excluded, [built[2]]);
  assert.throws(
    () => verifyBuiltCoverage(chain, built, built),
    /claimed built coverage mismatch/,
  );
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0005-complete-harvest-manifest.json');
test('committed manifest inspects real frozen files and rejects a coherent identity twin', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0005-complete-harvest.js'));

  const coherent = structuredClone(manifest);
  coherent.identities.bot = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = require('node:crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity/);
});

test('diagnostic source cannot define a metric or alter policy', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0005-complete-harvest.js'), 'utf8');
  for (const forbidden of ['candidateMeasure', 'policyScoreDelta', "qualification: 'PASS'", 'promoteChampion']) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
