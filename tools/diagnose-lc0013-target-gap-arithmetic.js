#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { chainMultiplier } = require('../solver/engine');
const {
  artifactWithIdentity,
  verifyArtifactIdentity,
} = require('./diagnose-lc0004-move6-move8');
const { writeJsonOnce } = require('./persist-before-verdict');

const ROOT = path.join(__dirname, '..');
const RAW_RELATIVE = 'docs/learning-cycles/LC-0012-early-ready-timing-panel-raw.json';
const RAW_PATH = path.join(ROOT, RAW_RELATIVE);
const EXPECTED_RAW_SHA256 = '707ff2fcb967d94636ea569515a89240f89133bf7373b78aa9c44ea49dfd934f';
const EXPECTED_RAW_IDENTITY = 'dfaec5aaf632f4da54634e54cc4a64a05598c306360ce88208f0831b707c02ff';

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function actualTargetLeader(pairClass) {
  if (pairClass === 'CASH_NOW_FASTER') return 'CASH_NOW';
  if (pairClass === 'OBSERVED_WAIT_FASTER') return 'OBSERVED_WAIT';
  if (pairClass === 'TARGET_COST_TIE') return 'TIE';
  throw new Error(`unsupported pair class: ${pairClass}`);
}

function scoreLeader(waitPoints, cashPoints) {
  if (cashPoints > waitPoints) return 'CASH_NOW';
  if (waitPoints > cashPoints) return 'OBSERVED_WAIT';
  return 'TIE';
}

function largestLaterChain(trace) {
  if (trace.length < 2) return null;
  return trace.slice(1).map(({ points }, index) => ({
    relativeMove: index + 2,
    points,
  })).sort((left, right) => right.points - left.points || left.relativeMove - right.relativeMove)[0];
}

function deriveRow(pair, selected) {
  if (!selected || selected.key !== pair.selectedKey) {
    throw new Error(`selected opportunity mismatch: ${pair.recordingPath}`);
  }
  const observedPackage = selected.observedPackage;
  const cashout = observedPackage.at(-1);
  if (!cashout || cashout.move !== selected.cashoutMove) {
    throw new Error(`recorded cashout package mismatch: ${pair.recordingPath}`);
  }
  if (cashout.points !== selected.routePointsAtReadiness) {
    throw new Error(`ready-route points mismatch: ${pair.recordingPath}`);
  }

  const routeValues = selected.routeAtReadiness.map(({ value }) => value);
  const routeBaseSum = routeValues.reduce((sum, value) => sum + value, 0);
  const multiplier = chainMultiplier(routeValues.length);
  const computedRoutePoints = Math.floor(routeBaseSum * multiplier);
  if (computedRoutePoints !== selected.routePointsAtReadiness) {
    throw new Error(`ready-route score calculation mismatch: ${pair.recordingPath}`);
  }

  const waitActions = observedPackage.slice(0, -1);
  const waitPoints = waitActions.reduce((sum, action) => sum + action.points, 0);
  const packagePoints = waitPoints + computedRoutePoints;
  const scoreNeeded = selected.targetScore - selected.commonScore;
  const movesRemaining = selected.maxMoves - selected.commonMoves;
  const routeClosesTarget = computedRoutePoints >= scoreNeeded;
  const packageClosesTarget = packagePoints >= scoreNeeded;
  const simpleArithmeticState = routeClosesTarget
    ? 'CASH_NOW_REACHES_TARGET'
    : packageClosesTarget
      ? 'OBSERVED_PACKAGE_REACHES_TARGET'
      : 'FUTURE_BOARD_REQUIRED';

  const observedTrace = pair.arms.OBSERVED_WAIT.trace;
  const cashTrace = pair.arms.CASH_NOW.trace;
  const observedFirstPoints = observedTrace[0].points;
  const cashFirstPoints = cashTrace[0].points;
  if (cashFirstPoints !== computedRoutePoints || observedFirstPoints !== waitActions[0].points) {
    throw new Error(`first-action score mismatch: ${pair.recordingPath}`);
  }
  const initialLeader = scoreLeader(observedFirstPoints, cashFirstPoints);
  const targetLeader = actualTargetLeader(pair.pairClass);

  return {
    recordingPath: pair.recordingPath,
    recordingId: path.basename(pair.recordingPath, '.json'),
    level: pair.level,
    seed: pair.seed,
    selectedKey: pair.selectedKey,
    pairClass: pair.pairClass,
    currentScore: selected.commonScore,
    targetScore: selected.targetScore,
    scoreNeeded,
    movesUsed: selected.commonMoves,
    movesRemaining,
    readyRoute: {
      values: routeValues,
      length: routeValues.length,
      baseSum: routeBaseSum,
      multiplier,
      points: computedRoutePoints,
      closesTarget: routeClosesTarget,
      scoreGapAfterCash: Math.max(0, scoreNeeded - computedRoutePoints),
    },
    observedWait: {
      movesBeforeCash: waitActions.length,
      pointsBeforeCash: waitPoints,
      pointsThroughCash: packagePoints,
      closesTargetThroughCash: packageClosesTarget,
      scoreGapAfterCash: Math.max(0, scoreNeeded - packagePoints),
    },
    simpleArithmeticState,
    firstActionPoints: {
      OBSERVED_WAIT: observedFirstPoints,
      CASH_NOW: cashFirstPoints,
    },
    initialScoreLeader: initialLeader,
    targetCostLeader: targetLeader,
    initialScoreLeaderAgreesWithTargetCost: initialLeader === targetLeader,
    targetCost: {
      observedWaitMoves: pair.arms.OBSERVED_WAIT.movesToTarget,
      cashNowMoves: pair.arms.CASH_NOW.movesToTarget,
      cashNowMinusWait: pair.pairedEffectCashMinusWait,
    },
    postFirstMove: {
      observedWaitStateIdentity: observedTrace[0].postStateIdentity,
      cashNowStateIdentity: cashTrace[0].postStateIdentity,
      statesDiffer: observedTrace[0].postStateIdentity !== cashTrace[0].postStateIdentity,
      observedWaitLargestLaterChain: largestLaterChain(observedTrace),
      cashNowLargestLaterChain: largestLaterChain(cashTrace),
    },
  };
}

function deriveTargetGapArtifact(raw) {
  if (raw.artifactIdentity !== EXPECTED_RAW_IDENTITY || !verifyArtifactIdentity(raw)) {
    throw new Error('LC-0012 raw identity mismatch');
  }
  if (raw.status !== 'COMPLETE' || raw.disposition !== 'MIXED_TARGET_EFFECT') {
    throw new Error('LC-0012 raw result is not the closed mixed panel');
  }

  const selectedByPath = new Map(raw.eligibility.rows
    .filter(({ selected }) => selected)
    .map(({ recordingPath, selected }) => [recordingPath, selected]));
  if (selectedByPath.size !== 14 || raw.pairs.length !== 14) {
    throw new Error('LC-0012 selected denominator mismatch');
  }
  const rows = raw.pairs.map((pair) => deriveRow(pair, selectedByPath.get(pair.recordingPath)));

  const pairClasses = {
    CASH_NOW_FASTER: rows.filter(({ pairClass }) => pairClass === 'CASH_NOW_FASTER').length,
    OBSERVED_WAIT_FASTER: rows.filter(({ pairClass }) => pairClass === 'OBSERVED_WAIT_FASTER').length,
    TARGET_COST_TIE: rows.filter(({ pairClass }) => pairClass === 'TARGET_COST_TIE').length,
  };
  const arithmeticStates = {
    CASH_NOW_REACHES_TARGET: rows.filter(({ simpleArithmeticState }) => simpleArithmeticState === 'CASH_NOW_REACHES_TARGET').length,
    OBSERVED_PACKAGE_REACHES_TARGET: rows.filter(({ simpleArithmeticState }) => simpleArithmeticState === 'OBSERVED_PACKAGE_REACHES_TARGET').length,
    FUTURE_BOARD_REQUIRED: rows.filter(({ simpleArithmeticState }) => simpleArithmeticState === 'FUTURE_BOARD_REQUIRED').length,
  };
  const agreements = rows.filter(({ initialScoreLeaderAgreesWithTargetCost }) => initialScoreLeaderAgreesWithTargetCost).length;
  const byId = new Map(rows.map((row) => [row.recordingId, row]));
  const evidenceIds = {
    waitHelpful: 'ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf',
    cashHelpfulCounterexample: '9cd33937c5c0185968762e270a51ab2fa3ebed2d3cb89851258a25dc69b43bf0',
    sameRouteCashHelpful: '98c224c7368089896eb3fe52699e43859a2b9fdb7868cc310673333c565f34f8',
    sameRouteWaitHelpful: 'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78',
  };
  for (const [label, id] of Object.entries(evidenceIds)) {
    if (!byId.has(id)) throw new Error(`missing named evidence row: ${label}`);
  }

  return artifactWithIdentity({
    schemaVersion: 1,
    kind: 'lc0013-target-gap-arithmetic',
    source: {
      path: RAW_RELATIVE,
      sha256: EXPECTED_RAW_SHA256,
      artifactIdentity: EXPECTED_RAW_IDENTITY,
    },
    question: 'Do current score, target gap, ready-route score, preserving-move score, and moves remaining determine cash-now versus wait target cost on the closed LC-0012 panel?',
    rows,
    summary: {
      rowCount: rows.length,
      pairClasses,
      arithmeticStates,
      initialScoreLeaderAgreesWithTargetCost: agreements,
      initialScoreLeaderDisagreesWithTargetCost: rows.length - agreements,
      postFirstMoveStatesDiffer: rows.filter(({ postFirstMove }) => postFirstMove.statesDiffer).length,
    },
    replayEvidence: {
      waitHelpful: evidenceIds.waitHelpful,
      cashHelpfulCounterexample: evidenceIds.cashHelpfulCounterexample,
      sameReadyRoutePointsOppositeOutcomes: [
        evidenceIds.sameRouteCashHelpful,
        evidenceIds.sameRouteWaitHelpful,
      ],
    },
    finding: 'COMMON_STATE_ARITHMETIC_INSUFFICIENT',
    missingTerm: 'POST_ACTION_BOARD_AND_REFILL_VALUE',
    interpretation: 'The proposed arithmetic is decisive when a ready route reaches the target, but no retained route or observed wait-through-cash package does so. Every pair therefore depends on the scoring opportunities created by the action-specific post-move board and refill path.',
    nonClaims: [
      'This artifact does not define a prospective metric or decision threshold.',
      'This artifact does not claim population generalization beyond the 14 retained LC-0012 pairs.',
      'This artifact does not authorize a policy or champion change.',
    ],
  });
}

function verifyTargetGapArtifact(artifact) {
  return verifyArtifactIdentity(artifact)
    && artifact.source.sha256 === EXPECTED_RAW_SHA256
    && artifact.source.artifactIdentity === EXPECTED_RAW_IDENTITY
    && artifact.rows.length === 14;
}

function parseArgs(argv) {
  let out = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out' && argv[index + 1]) {
      out = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`unknown or incomplete argument: ${argv[index]}`);
    }
  }
  if (!out) throw new Error('usage: node tools/diagnose-lc0013-target-gap-arithmetic.js --out <artifact.json>');
  return { out };
}

function main(argv) {
  const { out } = parseArgs(argv);
  if (sha256File(RAW_PATH) !== EXPECTED_RAW_SHA256) throw new Error('LC-0012 raw file hash mismatch');
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  const artifact = deriveTargetGapArtifact(raw);
  writeJsonOnce(path.resolve(out), artifact);
  process.stdout.write(`${JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    finding: artifact.finding,
    summary: artifact.summary,
    replayEvidence: artifact.replayEvidence,
  }, null, 2)}\n`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = {
  EXPECTED_RAW_IDENTITY,
  EXPECTED_RAW_SHA256,
  deriveTargetGapArtifact,
  verifyTargetGapArtifact,
};
