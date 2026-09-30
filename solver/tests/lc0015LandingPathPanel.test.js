const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  artifactWithIdentity,
} = require('../../tools/diagnose-lc0004-move6-move8');
const {
  deriveLandingPathPanelArtifact,
  verifyLandingPathPanelArtifact,
} = require('../../tools/diagnose-lc0015-landing-path-panel');
const { enumerateLegalChains } = require('../exact-score');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0015-landing-path-panel.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let derivedArtifact;
function deriveArtifact() {
  if (!derivedArtifact) derivedArtifact = deriveLandingPathPanelArtifact(loadJson(RAW_PATH));
  return derivedArtifact;
}

function independentSurvivorSummary(arm) {
  const width = Math.max(...arm.postFirstAction.board.map(({ x }) => x)) + 1;
  const height = Math.max(...arm.postFirstAction.board.map(({ y }) => y)) + 1;
  const grid = Array.from({ length: height }, () => Array(width).fill(null));
  for (const snapshot of arm.postFirstAction.board) grid[snapshot.y][snapshot.x] = { ...snapshot };
  const state = { grid, gridWidth: width, gridHeight: height, minChain: arm.postFirstAction.minChain };
  const chains = enumerateLegalChains(state).filter((chain) => chain.some(({ nodeId }) => nodeId === 'M0001'));
  const maxPreparedValue = chains.reduce((best, chain) => {
    const roots = new Map();
    for (const tile of chain) for (const root of tile.preparedRoots) roots.set(root.id, root);
    return Math.max(best, [...roots.values()].reduce((sum, root) => sum + root.value, 0));
  }, 0);
  return { legalPathCount: chains.length, maxPreparedValue };
}

test('all 14 frozen pairs expose both prospective survivor-path arms', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.cases.length, 14);
  assert.deepEqual(artifact.panel.pairClasses, {
    CASH_NOW_FASTER: 10,
    OBSERVED_WAIT_FASTER: 3,
    TARGET_COST_TIE: 1,
  });
  for (const caseRecord of artifact.cases) {
    assert.deepEqual(Object.keys(caseRecord.arms), ['OBSERVED_WAIT', 'CASH_NOW']);
    for (const arm of Object.values(caseRecord.arms)) {
      assert.equal(arm.replayMatchesRetainedFirstAction, true);
      assert.ok(arm.postFirstAction.survivorLanding);
      assert.ok(arm.postFirstAction.board.length > 0);
      assert.equal(arm.survivorPath.complete, true);
      assert.ok(arm.survivorPath.visitedPathStates > 0);
      assert.ok(arm.survivorPath.legalPathCount >= 0);
      if (arm.survivorPath.legalPathCount > 0) {
        assert.ok(arm.survivorPath.maxPreparedValue.witness.tiles.some(({ nodeId }) => nodeId === 'M0001'));
      } else {
        assert.equal(arm.survivorPath.maxPreparedValue.value, 0);
        assert.equal(arm.survivorPath.maxPreparedValue.witness, null);
      }
    }
  }
});

test('outcome comparison is derived only after both post-action structures exist', () => {
  const artifact = deriveArtifact();

  assert.equal(artifact.comparisons.length, 14);
  assert.equal(artifact.comparisons.filter(({ pairClass }) => pairClass === 'OBSERVED_WAIT_FASTER').length, 3);
  assert.equal(artifact.comparisons.filter(({ pairClass }) => pairClass === 'CASH_NOW_FASTER').length, 10);
  assert.equal(artifact.comparisons.filter(({ pairClass }) => pairClass === 'TARGET_COST_TIE').length, 1);
  assert.equal(
    artifact.panel.strictPreparedValueAgreements + artifact.panel.strictPreparedValueReversals
      + artifact.panel.preparedValueTiesOnNonTiedOutcomes + artifact.panel.targetCostTies,
    14,
  );
  assert.deepEqual(
    artifact.panel.waitFasterRecordingIds.slice().sort(),
    artifact.comparisons
      .filter(({ pairClass }) => pairClass === 'OBSERVED_WAIT_FASTER')
      .map(({ recordingId }) => recordingId)
      .sort(),
  );
  assert.deepEqual(
    artifact.panel.cashFasterCounterexampleRecordingIds.slice().sort(),
    artifact.comparisons
      .filter(({ pairClass, preparedValueDirection }) => (
        pairClass === 'CASH_NOW_FASTER' && preparedValueDirection !== 'CASH_NOW'
      ))
      .map(({ recordingId }) => recordingId)
      .sort(),
  );
});

test('a pre-existing exact enumerator confirms the two LC-0014 examples', () => {
  const artifact = deriveArtifact();
  const ids = [
    'ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf',
    '9cd33937c5c0185968762e270a51ab2fa3ebed2d3cb89851258a25dc69b43bf0',
  ];
  for (const id of ids) {
    const caseRecord = artifact.cases.find(({ recordingId }) => recordingId === id);
    for (const arm of Object.values(caseRecord.arms)) {
      const independent = independentSurvivorSummary(arm);
      assert.equal(arm.survivorPath.legalPathCount, independent.legalPathCount);
      assert.equal(arm.survivorPath.maxPreparedValue.value, independent.maxPreparedValue);
    }
  }
});

test('retained LC-0015 artifact exactly matches a fresh derivation', () => {
  const retained = loadJson(ARTIFACT_PATH);
  const recomputed = deriveArtifact();

  assert.deepEqual(retained, recomputed);
  assert.equal(verifyLandingPathPanelArtifact(retained), true);
});

test('source substitution and coherent structural tampering fail closed', () => {
  const raw = loadJson(RAW_PATH);
  const substituted = structuredClone(raw);
  substituted.artifactIdentity = '0'.repeat(64);
  assert.throws(() => deriveLandingPathPanelArtifact(substituted), /LC-0012 raw identity mismatch/);

  const artifact = deriveArtifact();
  const witnessBody = structuredClone(artifact);
  delete witnessBody.artifactIdentity;
  witnessBody.cases[0].arms.OBSERVED_WAIT.survivorPath.maxPreparedValue.witness.preparedValue += 32;
  const coherentlyTamperedWitness = artifactWithIdentity(witnessBody);
  assert.equal(verifyLandingPathPanelArtifact(coherentlyTamperedWitness), false);

  const routeBody = structuredClone(artifact);
  delete routeBody.artifactIdentity;
  routeBody.cases[0].arms.OBSERVED_WAIT.survivorPath.maxPreparedValue.witness.survivorIndex += 1;
  const coherentlyTamperedRoute = artifactWithIdentity(routeBody);
  assert.equal(verifyLandingPathPanelArtifact(coherentlyTamperedRoute), false);

  const conclusionBody = structuredClone(artifact);
  delete conclusionBody.artifactIdentity;
  conclusionBody.panel.strictPreparedValueAgreements += 1;
  conclusionBody.panel.strictPreparedValueReversals -= 1;
  const coherentlyTamperedConclusion = artifactWithIdentity(conclusionBody);
  assert.equal(verifyLandingPathPanelArtifact(coherentlyTamperedConclusion), false);
});
