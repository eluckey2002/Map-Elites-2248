const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveExcludedRootAlternativesArtifact,
  verifyExcludedRootAlternativesArtifact,
} = require('../../tools/diagnose-lc0020-excluded-root-alternatives');
const { artifactWithIdentity } = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0020-excluded-root-alternatives.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveExcludedRootAlternativesArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

test('both excluded roots have exact alternative target-crossing chains on their frozen pre-target boards', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 2);
  for (const caseRecord of artifact.cases) {
    assert.equal(caseRecord.replayMatchesRetainedPrefix, true);
    assert.ok(caseRecord.enumeration.complete);
    assert.ok(caseRecord.alternativeTargetCrossingChainCount > 0);
    assert.ok(caseRecord.shortestAlternativeTargetCrossingChain);
  }
  assert.equal(verifyExcludedRootAlternativesArtifact(artifact), true);
});

test('the retained excluded-root alternatives artifact exactly matches derivation', () => {
  assert.deepEqual(loadJson(ARTIFACT_PATH), deriveArtifact());
});

test('the verifier rejects a re-identified altered alternative count', () => {
  const altered = structuredClone(deriveArtifact());
  altered.cases[0].alternativeTargetCrossingChainCount += 1;
  delete altered.artifactIdentity;
  assert.equal(verifyExcludedRootAlternativesArtifact(artifactWithIdentity(altered)), false);
});
