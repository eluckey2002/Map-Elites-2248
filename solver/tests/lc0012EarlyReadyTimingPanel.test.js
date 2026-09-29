const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  routeAssessment,
  selectOneCandidate,
  validateManifest,
} = require('../../tools/diagnose-lc0012-early-ready-timing-panel');

const ROOT = path.join(__dirname, '..', '..');

test('public readiness seam accepts a real legal route and kills a missing-input twin', () => {
  const ids = ['A', 'B', 'C'];
  const pre = {
    minChain: 3,
    liveById: {
      A: { x: 0, y: 0, value: 8, blocker: null },
      B: { x: 1, y: 0, value: 8, blocker: null },
      C: { x: 2, y: 0, value: 16, blocker: null },
    },
  };
  assert.equal(routeAssessment(pre, ids).routeExecutable, true);
  const missing = structuredClone(pre);
  delete missing.liveById.B;
  const killed = routeAssessment(missing, ids);
  assert.equal(killed.routeExecutable, false);
  assert.deepEqual(killed.missingRouteNodeIds, ['B']);
});

test('one-unit selector uses ready move, cashout move, then route identity', () => {
  const candidates = [
    { key: 'later', readyMove: 3, cashoutMove: 4, routeIdentity: 'a' },
    { key: 'longer', readyMove: 2, cashoutMove: 5, routeIdentity: 'a' },
    { key: 'lexical-later', readyMove: 2, cashoutMove: 4, routeIdentity: 'c' },
    { key: 'winner', readyMove: 2, cashoutMove: 4, routeIdentity: 'b' },
  ];
  assert.equal(selectOneCandidate(candidates).key, 'winner');
});

const manifestPath = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-manifest.json');
test('manifest inspects every frozen recording and production source', {
  skip: !fs.existsSync(manifestPath) && 'manifest is created after harness implementation',
}, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = validateManifest(manifest, manifest.artifactIdentity);
  assert.equal(paths.harness, path.join(ROOT, 'tools', 'diagnose-lc0012-early-ready-timing-panel.js'));
  assert.equal(Object.keys(manifest.paths).filter((name) => name.startsWith('recording:')).length, 24);
  const coherent = structuredClone(manifest);
  coherent.identities['production:solver/engine.js'] = '0'.repeat(64);
  const { artifactIdentity: ignored, ...body } = coherent;
  coherent.artifactIdentity = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  assert.throws(() => validateManifest(coherent, manifest.artifactIdentity), /expected manifest identity mismatch/);
});

test('experiment source cannot promote or redefine the champion', () => {
  const source = fs.readFileSync(path.join(ROOT, 'tools', 'diagnose-lc0012-early-ready-timing-panel.js'), 'utf8');
  for (const forbidden of ['promoteChampion', 'writeChampion', 'candidateMeasure']) assert.equal(source.includes(forbidden), false, forbidden);
});
