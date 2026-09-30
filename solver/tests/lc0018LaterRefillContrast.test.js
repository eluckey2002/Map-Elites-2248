const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveLaterRefillContrastArtifact,
  verifyLaterRefillContrastArtifact,
} = require('../../tools/diagnose-lc0018-later-refill-contrast');
const { artifactWithIdentity } = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0018-later-refill-contrast.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveLaterRefillContrastArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

test('every later-refill root entering a cash target chain has a matched non-entering live root when available', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 2);
  for (const caseRecord of artifact.cases) {
    assert.ok(caseRecord.enteringRoots.length > 0);
    assert.equal(caseRecord.replayMatchesRetainedTrace, true);
    for (const root of caseRecord.enteringRoots) {
      assert.equal(root.origin, 'later-refill');
      assert.equal(root.isDirectTargetInput, true);
      if (root.matchedNonEnteringRoot) {
        assert.equal(root.matchedNonEnteringRoot.origin, 'later-refill');
        assert.equal(root.matchedNonEnteringRoot.spawnedAtRelativeMove, root.spawnedAtRelativeMove);
        assert.equal(root.matchedNonEnteringRoot.value, root.value);
      }
    }
  }
  assert.equal(verifyLaterRefillContrastArtifact(artifact), true);
});

test('the retained later-refill contrast artifact exactly matches replay derivation', () => {
  assert.deepEqual(loadJson(ARTIFACT_PATH), deriveArtifact());
});

test('the verifier rejects a re-identified altered same-birth match', () => {
  const altered = structuredClone(deriveArtifact());
  altered.cases[1].enteringRoots[5].matchedNonEnteringRoot.preTargetPosition.x += 1;
  delete altered.artifactIdentity;
  assert.equal(verifyLaterRefillContrastArtifact(artifactWithIdentity(altered)), false);
});
