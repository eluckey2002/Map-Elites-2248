const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  artifactWithIdentity,
} = require('../../tools/diagnose-lc0004-move6-move8');
const {
  deriveTimingBoardAncestryArtifact,
  verifyTimingBoardAncestryArtifact,
} = require('../../tools/diagnose-lc0014-timing-board-ancestry');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0014-timing-board-ancestry.json');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('two named timing cases reproduce all four exact replay arms', () => {
  const artifact = deriveTimingBoardAncestryArtifact(loadJson(RAW_PATH));

  assert.equal(artifact.cases.length, 2);
  assert.deepEqual(artifact.cases.map(({ recordingId }) => recordingId), [
    'ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf',
    '9cd33937c5c0185968762e270a51ab2fa3ebed2d3cb89851258a25dc69b43bf0',
  ]);
  assert.deepEqual(artifact.cases.map(({ pairClass }) => pairClass), [
    'OBSERVED_WAIT_FASTER',
    'CASH_NOW_FASTER',
  ]);
  for (const caseRecord of artifact.cases) {
    assert.deepEqual(Object.keys(caseRecord.arms), ['OBSERVED_WAIT', 'CASH_NOW']);
    for (const arm of Object.values(caseRecord.arms)) {
      assert.equal(arm.replayMatchesRetainedTrace, true);
      assert.ok(arm.postFirstAction.survivorLanding);
      assert.ok(arm.postFirstAction.refills.length > 0);
      assert.equal(arm.decisiveChain.graphValid, true);
      assert.equal(arm.decisiveChain.rootValueSum, arm.decisiveChain.chainSum);
    }
  }
});

test('the helpful-wait replay and helpful-cash counterexample retain their decisive chains', () => {
  const artifact = deriveTimingBoardAncestryArtifact(loadJson(RAW_PATH));
  const byId = new Map(artifact.cases.map((entry) => [entry.recordingId, entry]));
  const waitHelpful = byId.get('ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf');
  const cashHelpful = byId.get('9cd33937c5c0185968762e270a51ab2fa3ebed2d3cb89851258a25dc69b43bf0');

  assert.equal(waitHelpful.arms.OBSERVED_WAIT.decisiveChain.relativeMove, 6);
  assert.equal(waitHelpful.arms.OBSERVED_WAIT.decisiveChain.points, 62400);
  assert.equal(waitHelpful.arms.CASH_NOW.decisiveChain.relativeMove, 8);
  assert.equal(waitHelpful.arms.CASH_NOW.decisiveChain.points, 38080);
  assert.equal(cashHelpful.arms.CASH_NOW.decisiveChain.relativeMove, 5);
  assert.equal(cashHelpful.arms.CASH_NOW.decisiveChain.points, 49280);
  assert.equal(cashHelpful.arms.OBSERVED_WAIT.decisiveChain.relativeMove, 5);
  assert.equal(cashHelpful.arms.OBSERVED_WAIT.decisiveChain.points, 38400);
  assert.deepEqual(artifact.sharedWinnerPattern, {
    landingCell: { x: 1, y: 5 },
    survivorDirectlyReused: true,
    decisiveChainUsesMoreCommonBoardRootsAndValue: true,
    routePreservationDirectionReverses: true,
    firstActionRefillCountDirectionReverses: true,
  });
});

test('retained LC-0014 artifact exactly matches a fresh derivation', () => {
  const raw = loadJson(RAW_PATH);
  const retained = loadJson(ARTIFACT_PATH);
  const recomputed = deriveTimingBoardAncestryArtifact(raw);

  assert.deepEqual(retained, recomputed);
  assert.equal(verifyTimingBoardAncestryArtifact(retained), true);
});

test('source substitution and coherent ancestry tampering fail closed', () => {
  const raw = loadJson(RAW_PATH);
  const substituted = structuredClone(raw);
  substituted.artifactIdentity = '0'.repeat(64);
  assert.throws(() => deriveTimingBoardAncestryArtifact(substituted), /LC-0012 raw identity mismatch/);

  const artifact = deriveTimingBoardAncestryArtifact(raw);
  const tamperedBody = structuredClone(artifact);
  delete tamperedBody.artifactIdentity;
  tamperedBody.cases[0].arms.OBSERVED_WAIT.decisiveChain.roots[0].value *= 2;
  const coherentlyTampered = artifactWithIdentity(tamperedBody);
  assert.equal(verifyTimingBoardAncestryArtifact(coherentlyTampered), false);

  const conclusionBody = structuredClone(artifact);
  delete conclusionBody.artifactIdentity;
  conclusionBody.sharedWinnerPattern.landingCell.x = 2;
  const coherentlyRewrittenConclusion = artifactWithIdentity(conclusionBody);
  assert.equal(verifyTimingBoardAncestryArtifact(coherentlyRewrittenConclusion), false);

  const summaryBody = structuredClone(artifact);
  delete summaryBody.artifactIdentity;
  summaryBody.cases[0].arms.OBSERVED_WAIT.decisiveChain.originBreakdown[0].value += 64;
  summaryBody.comparisons = summaryBody.cases.map((caseRecord) => {
    const original = artifact.comparisons.find(({ role }) => role === caseRecord.role);
    return caseRecord.role === 'wait-helpful'
      ? {
        ...original,
        winnerDecisiveChain: {
          ...original.winnerDecisiveChain,
          commonBoardRootValue: original.winnerDecisiveChain.commonBoardRootValue + 64,
        },
      }
      : original;
  });
  const coherentlyRewrittenSummary = artifactWithIdentity(summaryBody);
  assert.equal(verifyTimingBoardAncestryArtifact(coherentlyRewrittenSummary), false);
});
