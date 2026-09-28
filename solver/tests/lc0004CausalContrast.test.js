const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  builtComponentSizes,
  stateIdentity,
  swapNormalizedTiles,
  tileMultiset,
  validateManifest,
  verifyArtifactIdentity,
} = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');

function tile(x, y, value) {
  return {
    x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0,
  };
}

function fixture() {
  const grid = Array.from({ length: 4 }, (_, y) => (
    Array.from({ length: 4 }, (_, x) => tile(x, y, 2))
  ));
  grid[0][0].value = 32;
  grid[1][1].value = 32;
  grid[3][3].value = 64;
  return {
    gridWidth: 4,
    gridHeight: 4,
    grid,
    score: 100,
    moves: 7,
    maxMoves: 24,
    targetScore: 126000,
    tileScale: 1,
  };
}

test('built components use king-move adjacency and exclude initial-value tiles', () => {
  const state = fixture();
  assert.deepEqual(builtComponentSizes(state), [2, 1]);
});

test('a declared coordinate swap preserves the exact tile multiset and changes placement', () => {
  const state = fixture();
  const beforeMultiset = tileMultiset(state);
  const beforeIdentity = stateIdentity(state);

  const observation = swapNormalizedTiles(state, {
    id: 'TEST-SWAP',
    a: { x: 3, y: 3, value: 64 },
    b: { x: 2, y: 2, value: 2 },
  });

  assert.equal(observation.id, 'TEST-SWAP');
  assert.deepEqual(tileMultiset(state), beforeMultiset);
  assert.notEqual(stateIdentity(state), beforeIdentity);
  assert.equal(state.grid[2][2].value, 64);
  assert.equal(state.grid[2][2].x, 2);
  assert.equal(state.grid[2][2].y, 2);
  assert.equal(state.grid[3][3].value, 2);
  assert.equal(state.grid[3][3].x, 3);
  assert.equal(state.grid[3][3].y, 3);
});

test('the real swap seam rejects a planted false endpoint value', () => {
  const state = fixture();
  assert.throws(() => swapNormalizedTiles(state, {
    id: 'PLANTED-BAD-ENDPOINT',
    a: { x: 3, y: 3, value: 32 },
    b: { x: 2, y: 2, value: 2 },
  }), /expected 32, observed 64/);
});

test('the committed manifest inspects the real frozen files and rejects a planted identity twin', () => {
  const manifestPath = path.join(
    ROOT, 'docs', 'learning-cycles', 'LC-0004-move6-move8-causal-contrast-manifest.json',
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(verifyArtifactIdentity(manifest), true);
  const paths = validateManifest(manifest);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0004-move6-move8.js'));

  const corrupted = structuredClone(manifest);
  corrupted.identities.bot = '0'.repeat(64);
  assert.equal(verifyArtifactIdentity(corrupted), false);
  assert.throws(() => validateManifest(corrupted), /manifest artifact identity mismatch/);
});

test('the diagnostic source cannot define a metric or policy verdict', () => {
  const source = fs.readFileSync(
    path.join(ROOT, 'tools', 'diagnose-lc0004-move6-move8.js'),
    'utf8',
  );
  for (const forbidden of ['candidateMeasure', "qualification: 'PASS'", 'SUPPORTED', 'policyScoreDelta']) {
    assert.equal(source.includes(forbidden), false, `forbidden decision term: ${forbidden}`);
  }
});
