const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveNoReentryTargetChainArtifact,
  verifyNoReentryTargetChainArtifact,
} = require('../../tools/diagnose-lc0017-no-reentry-target-chain');
const { artifactWithIdentity } = require('../../tools/diagnose-lc0004-move6-move8');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0017-no-reentry-target-chain.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveNoReentryTargetChainArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

test('cash target chains are traced for both retained no-reentry winners', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 2);
  for (const caseRecord of artifact.cases) {
    const cash = caseRecord.arms.CASH_NOW.targetCrossingChain;
    assert.equal(cash.firstActionSurvivorContributes, false);
    assert.equal(cash.graphValid, true);
    assert.equal(cash.readyRouteRootContribution.count, 0);
    assert.ok(cash.originBreakdown.some(({ value }) => value > 0));
  }
  assert.equal(verifyNoReentryTargetChainArtifact(artifact), true);
});

test('the retained no-reentry target-chain artifact exactly matches replay derivation', () => {
  assert.deepEqual(loadJson(ARTIFACT_PATH), deriveArtifact());
});

test('the verifier rejects a re-identified target-chain claim with altered ancestry', () => {
  const altered = structuredClone(deriveArtifact());
  altered.cases[0].arms.CASH_NOW.targetCrossingChain.roots[0].origin = 'later-refill';
  delete altered.artifactIdentity;
  assert.equal(verifyNoReentryTargetChainArtifact(artifactWithIdentity(altered)), false);
});
