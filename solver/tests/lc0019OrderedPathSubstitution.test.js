const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveOrderedPathSubstitutionArtifact,
  verifyOrderedPathSubstitutionArtifact,
} = require('../../tools/diagnose-lc0019-ordered-path-substitution');
const { artifactWithIdentity } = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0019-ordered-path-substitution.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveOrderedPathSubstitutionArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

test('the adjacent Level 3 refill root and a Level 52 counterpart both break their exact target-chain slots', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 2);
  for (const caseRecord of artifact.cases) {
    assert.deepEqual(caseRecord.originalChainLegality, []);
    assert.ok(caseRecord.substitutionLegality.some((issue) => issue.includes('not adjacent')));
  }
  const level3 = artifact.cases.find(({ level }) => level === 3);
  assert.equal(level3.enteringRoot.id, 'S0026');
  assert.equal(level3.matchedRoot.id, 'S0022');
  assert.ok(level3.substitutionLegality.some((issue) => issue.includes('(2,3) -> (0,2)')));
  assert.equal(verifyOrderedPathSubstitutionArtifact(artifact), true);
});

test('the retained ordered-path substitution artifact exactly matches derivation', () => {
  assert.deepEqual(loadJson(ARTIFACT_PATH), deriveArtifact());
});

test('the verifier rejects a re-identified altered substitution edge', () => {
  const altered = structuredClone(deriveArtifact());
  altered.cases[0].targetChainSlot.next.x += 1;
  delete altered.artifactIdentity;
  assert.equal(verifyOrderedPathSubstitutionArtifact(artifactWithIdentity(altered)), false);
});
