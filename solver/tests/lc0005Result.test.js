const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { verifyArtifactIdentity } = require('../../tools/diagnose-lc0004-move6-move8');
const { summaryFromArtifact } = require('../../tools/diagnose-lc0005-complete-harvest');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0005-complete-harvest-raw.json');
const RECOMPUTED = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0005-complete-harvest-recomputed.json');

test('retained LC-0005 result is complete and selects the all-built-tile chain', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.equal(artifact.status, 'COMPLETE');
  assert.equal(artifact.artifactIdentity, '3fddd00955778f2d77c1b77b0f30dbedd170f3d989ece05ed3a556b656207aeb');
  const repaired = artifact.arms.find(({ id }) => id === 'M8-PATH-REPAIR');
  assert.equal(repaired.selectedCoverage.builtCount, 10);
  assert.equal(repaired.selectedCoverage.coveredCount, 10);
  assert.equal(repaired.selectedCoverage.complete, true);
  assert.equal(repaired.selected.chainLength, 16);
  assert.equal(repaired.selected.immediatePoints, 63360);
  assert.equal(repaired.terminal.targetCost, 14);
  assert.deepEqual(summaryFromArtifact(artifact), JSON.parse(fs.readFileSync(RECOMPUTED, 'utf8')));
});

test('a planted coverage change invalidates the retained artifact identity', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  artifact.arms[1].selectedCoverage.coveredCount = 9;
  assert.equal(verifyArtifactIdentity(artifact), false);
});
