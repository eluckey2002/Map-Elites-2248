const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { verifyArtifactIdentity } = require('../../tools/diagnose-lc0004-move6-move8');
const { summaryFromArtifact } = require('../../tools/diagnose-lc0007-decision-lineage');

const ROOT = path.join(__dirname, '..', '..');
const RAW = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-raw.json');
const RECOMPUTED = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0007-decision-lineage-recomputed.json');

test('retained LC-0007 result finds winner lineage in two of four correction chains', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.equal(artifact.artifactIdentity, '6074b33ac0d68aba78c0ddd68c94041dc2e871392f9c50d573c00e1fd218dc19');
  assert.equal(artifact.status, 'COMPLETE');
  assert.equal(artifact.disposition, 'WINNER_LINEAGE_EXPLAINS_SOME');
  assert.deepEqual(
    artifact.cells.map(({ move, outcome }) => [move, outcome]),
    [[4, 'WINNER_ONLY'], [6, 'NEITHER'], [9, 'WINNER_ONLY'], [11, 'NEITHER']],
  );
  assert.deepEqual(summaryFromArtifact(artifact), JSON.parse(fs.readFileSync(RECOMPUTED, 'utf8')));
});

test('a planted correction-use change invalidates the retained artifact identity', () => {
  const artifact = JSON.parse(fs.readFileSync(RAW, 'utf8'));
  artifact.cells[1].winnerCorrectionUsesLineage = true;
  assert.equal(verifyArtifactIdentity(artifact), false);
});
