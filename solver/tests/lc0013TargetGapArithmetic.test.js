const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  deriveTargetGapArtifact,
  verifyTargetGapArtifact,
} = require('../../tools/diagnose-lc0013-target-gap-arithmetic');

const ROOT = path.join(__dirname, '..', '..');
const RAW_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0012-early-ready-timing-panel-raw.json');
const ARTIFACT_PATH = path.join(ROOT, 'docs', 'learning-cycles', 'LC-0013-target-gap-arithmetic.json');

function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('target-gap arithmetic accounts for every closed LC-0012 pair', () => {
  const artifact = deriveTargetGapArtifact(read(RAW_PATH));

  assert.equal(artifact.rows.length, 14);
  assert.deepEqual(artifact.summary.pairClasses, {
    CASH_NOW_FASTER: 10,
    OBSERVED_WAIT_FASTER: 3,
    TARGET_COST_TIE: 1,
  });
  assert.deepEqual(artifact.summary.arithmeticStates, {
    CASH_NOW_REACHES_TARGET: 0,
    OBSERVED_PACKAGE_REACHES_TARGET: 0,
    FUTURE_BOARD_REQUIRED: 14,
  });
  assert.equal(artifact.summary.initialScoreLeaderAgreesWithTargetCost, 7);
  assert.equal(artifact.summary.initialScoreLeaderDisagreesWithTargetCost, 7);
  assert.equal(artifact.finding, 'COMMON_STATE_ARITHMETIC_INSUFFICIENT');
});

test('one wait-helpful replay and one cash-helpful counterexample expose the missing term', () => {
  const artifact = deriveTargetGapArtifact(read(RAW_PATH));
  const waitHelpful = artifact.rows.find(({ recordingId }) => recordingId.startsWith('ed62dd5655e8'));
  const cashHelpful = artifact.rows.find(({ recordingId }) => recordingId.startsWith('9cd33937c5c0'));

  assert.deepEqual({
    pairClass: waitHelpful.pairClass,
    scoreNeeded: waitHelpful.scoreNeeded,
    movesRemaining: waitHelpful.movesRemaining,
    routePoints: waitHelpful.readyRoute.points,
    preservingPoints: waitHelpful.observedWait.pointsBeforeCash,
    initialScoreLeader: waitHelpful.initialScoreLeader,
    targetCostEffect: waitHelpful.targetCost.cashNowMinusWait,
  }, {
    pairClass: 'OBSERVED_WAIT_FASTER',
    scoreNeeded: 92208,
    movesRemaining: 18,
    routePoints: 4096,
    preservingPoints: 5120,
    initialScoreLeader: 'OBSERVED_WAIT',
    targetCostEffect: 4,
  });

  assert.deepEqual({
    pairClass: cashHelpful.pairClass,
    scoreNeeded: cashHelpful.scoreNeeded,
    movesRemaining: cashHelpful.movesRemaining,
    routePoints: cashHelpful.readyRoute.points,
    preservingPoints: cashHelpful.observedWait.pointsBeforeCash,
    initialScoreLeader: cashHelpful.initialScoreLeader,
    targetCostEffect: cashHelpful.targetCost.cashNowMinusWait,
  }, {
    pairClass: 'CASH_NOW_FASTER',
    scoreNeeded: 97328,
    movesRemaining: 18,
    routePoints: 768,
    preservingPoints: 3072,
    initialScoreLeader: 'OBSERVED_WAIT',
    targetCostEffect: -2,
  });

  assert.equal(artifact.missingTerm, 'POST_ACTION_BOARD_AND_REFILL_VALUE');
});

test('retained diagnostic exactly matches a fresh derivation and verifies its identity', () => {
  const retained = read(ARTIFACT_PATH);
  const derived = deriveTargetGapArtifact(read(RAW_PATH));
  assert.deepEqual(retained, derived);
  assert.equal(verifyTargetGapArtifact(retained), true);
});

test('source substitution and row tampering fail closed', () => {
  const raw = read(RAW_PATH);
  assert.throws(
    () => deriveTargetGapArtifact({ ...raw, artifactIdentity: '0'.repeat(64) }),
    /LC-0012 raw identity mismatch/,
  );

  const artifact = deriveTargetGapArtifact(raw);
  artifact.rows[0].scoreNeeded += 1;
  assert.equal(verifyTargetGapArtifact(artifact), false);
});
