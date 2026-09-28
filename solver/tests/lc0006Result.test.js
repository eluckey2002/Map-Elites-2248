const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { verifyArtifactIdentity } = require('../../tools/diagnose-lc0004-move6-move8');
const { summaryFromArtifact } = require('../../tools/diagnose-lc0006-harvest-counterexample');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0006-complete-harvest-counterexample-raw.json');
const RECOMPUTED = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0006-complete-harvest-counterexample-recomputed.json');

test('retained LC-0006 result is the exact impossible-complete-harvest counterexample', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.equal(artifact.status, 'COMPLETE');
  assert.equal(artifact.artifactIdentity, '92c59fd63c591b0abc303602a2438b0ee33284d153e401b3045767d2171e3947');
  assert.equal(artifact.built.length, 8);
  assert.equal(artifact.entryEdges.length, 0);
  assert.equal(artifact.topology.maxCoverage, 7);
  assert.equal(artifact.topology.completePathCount, 0);
  assert.equal(artifact.selected.builtCoverage.coveredCount, 0);
  assert.equal(artifact.comparison.baseline.targetCost, 15);
  assert.equal(artifact.comparison.connected.targetCost, 16);
  assert.deepEqual(summaryFromArtifact(artifact), JSON.parse(fs.readFileSync(RECOMPUTED, 'utf8')));
});

test('a planted topology change invalidates the retained artifact identity', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  artifact.topology.maxCoverage = 8;
  assert.equal(verifyArtifactIdentity(artifact), false);
});
