const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveFirstCarrierPathArtifact,
  verifyFirstCarrierPathArtifact,
} = require('../../tools/diagnose-lc0016-first-carrier-path');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0016-first-carrier-reentry.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveFirstCarrierPathArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

test('the seven immediate-path disagreements retain exact carrier re-entry traces', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 7);
  for (const caseRecord of artifact.cases) {
    assert.equal(caseRecord.immediatePathDisagreement, true);
    for (const arm of Object.values(caseRecord.arms)) {
      assert.equal(arm.replayMatchesRetainedTrace, true);
      if (arm.firstCarrierReentry) {
        assert.ok(arm.firstCarrierReentry.relativeMove > 1);
        assert.ok(arm.firstCarrierReentry.relativeMove <= arm.movesToTarget);
        assert.ok(arm.firstCarrierReentry.chain.some(({ containsFirstActionSurvivor }) => containsFirstActionSurvivor));
      }
    }
  }
  const cashExample = artifact.cases.find(({ recordingId }) => recordingId.startsWith('9cd33937c5c0'));
  assert.equal(cashExample.arms.CASH_NOW.firstCarrierReentry.relativeMove, 5);
  assert.equal(verifyFirstCarrierPathArtifact(artifact), true);
});

test('the retained carrier re-entry artifact exactly matches the frozen replay derivation', () => {
  assert.deepEqual(loadJson(ARTIFACT_PATH), deriveArtifact());
});
