const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  FIT_SEEDS,
  HOLDOUT_SEEDS,
  deriveCandidate,
  identity,
  verifyCandidate,
  validateShape,
} = require('../level-author');

const SHAPE = {
  schemaVersion: 1,
  name: 'level-51-split-channel',
  level: 51,
  demand: 0.70,
  demandStatus: 'provisional-proposal',
  moves: 24,
  minChain: 4,
  gridW: 5,
  gridH: 7,
  blockers: [],
};

function measuredOutcome(level, seed) {
  const fitting = seed < 100000;
  const score = fitting ? 1000 + seed : 800 + (seed - 100000);
  if (level.target === Infinity) return { score, result: 'lose', reason: 'out of moves', movesUsed: level.moves };
  if (seed === 100001) return { score: level.target, result: 'win', movesUsed: 12 };
  if (seed === 100002) return { score, result: 'lose', reason: 'bomb exploded', movesUsed: 8 };
  return { score, result: 'lose', reason: 'out of moves', movesUsed: level.moves };
}

function resign(receipt) {
  const unsigned = structuredClone(receipt);
  delete unsigned.receiptIdentity;
  return { ...unsigned, receiptIdentity: identity(unsigned) };
}

const TEST_INPUT_IDENTITIES = { levelAuthor: 'a', engine: 'b' };

test('validateShape accepts one named target-free proposal shape', () => {
  assert.deepEqual(validateShape(SHAPE), SHAPE);
});

test('validateShape forbids authored target and tile scale controls', () => {
  assert.throws(() => validateShape({ ...SHAPE, target: 50000 }), /target.*forbidden/i);
  assert.throws(() => validateShape({ ...SHAPE, tileScale: 32 }), /tileScale.*forbidden/i);
});

test('validateShape rejects malformed dimensions, blockers, and proposal labeling', () => {
  assert.throws(() => validateShape({ ...SHAPE, name: '' }), /name/);
  assert.throws(() => validateShape({ ...SHAPE, gridW: 0 }), /gridW/);
  assert.throws(() => validateShape({ ...SHAPE, blockers: [{ type: 'stone', x: 9, y: 0 }] }), /blocker/);
  assert.throws(() => validateShape({ ...SHAPE, demandStatus: 'accepted' }), /provisional-proposal/);
});

test('deriveCandidate uses fixed fitting and disjoint holdout seeds with measured target rounding', () => {
  const { store, receipt } = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  });
  const candidate = store.candidates[0];

  assert.equal(candidate.level, 51);
  assert.equal(candidate.tileScale, 32);
  assert.equal(candidate.target, 750);
  assert.equal(candidate.demand, undefined);
  assert.deepEqual(receipt.fitting.seedRange, FIT_SEEDS);
  assert.deepEqual(receipt.holdout.seedRange, HOLDOUT_SEEDS);
  assert.equal(receipt.fitting.scoreQuantiles.median, 1075);
  assert.equal(receipt.targetDerivation.measuredMedian, 1075);
  assert.equal(receipt.targetDerivation.demand, 0.70);
  assert.equal(receipt.targetDerivation.roundedTarget, 750);
  assert.equal(receipt.holdout.terminalCounts.total, 300);
  assert.equal(receipt.holdout.terminalCounts.win, 1);
  assert.equal(receipt.holdout.terminalCounts.bombExploded, 1);
  assert.equal(receipt.holdout.terminalCounts.incomplete, 0);
  assert.match(receipt.shapeIdentity, /^[a-f0-9]{64}$/);
  assert.match(receipt.candidateIdentity, /^[a-f0-9]{64}$/);
  assert.match(receipt.receiptIdentity, /^[a-f0-9]{64}$/);
  assert.deepEqual(receipt.calibration.params, {
    wRoll: 1, wPlace: 1, turnover: 40, width: 24, bombMax: 9, tieBreak: 'degree', wHarvest: 0,
  });
});

test('deriveCandidate refuses an incomplete fitting run', () => {
  const incomplete = (level, seed) => seed === 7
    ? { score: 1, result: 'lose', reason: 'hard cap exceeded (engine bug?)', movesUsed: 0 }
    : measuredOutcome(level, seed);
  assert.throws(() => deriveCandidate(SHAPE, { play: incomplete }), /incomplete fitting run.*seed 7/i);
});

test('verifyCandidate passes a bound receipt and rejects tampering, invalid data, overlap, and incomplete totals', () => {
  const authored = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  });
  const permissive = { minWinRate: 0, maxBombRate: 1, requireZeroLockouts: true };

  assert.equal(verifyCandidate(authored.store, authored.receipt, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
    gates: permissive,
  }).status, 'PASS');

  assert.throws(() => verifyCandidate(authored.store, { ...authored.receipt, shapeIdentity: '0'.repeat(64) }, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
    gates: permissive,
  }), /receipt identity|shape identity/i);

  const invalidStore = structuredClone(authored.store);
  invalidStore.candidates[0].gridW = 0;
  assert.throws(() => verifyCandidate(invalidStore, authored.receipt, { play: measuredOutcome }), /gridW|candidate/i);

  let overlap = structuredClone(authored.receipt);
  overlap.holdout.seedRange = { start: 149, count: 300 };
  overlap = resign(overlap);
  assert.throws(() => verifyCandidate(authored.store, overlap, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  }), /overlap/);

  let incomplete = structuredClone(authored.receipt);
  incomplete.holdout.terminalCounts.total = 299;
  incomplete = resign(incomplete);
  assert.throws(() => verifyCandidate(authored.store, incomplete, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  }), /terminal total/);
});

test('verifyCandidate remeasures fitting evidence and enforces target and tile-scale derivation', () => {
  const authored = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  });
  const options = {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
    gates: { minWinRate: 0, maxBombRate: 1, requireZeroLockouts: true },
  };

  let falseFitting = structuredClone(authored.receipt);
  falseFitting.fitting.scoreQuantiles.median = 999999;
  falseFitting = resign(falseFitting);
  assert.throws(() => verifyCandidate(authored.store, falseFitting, options), /fitting measurement mismatch/i);

  let falseMedian = structuredClone(authored.receipt);
  falseMedian.targetDerivation.measuredMedian = 999999;
  falseMedian = resign(falseMedian);
  assert.throws(() => verifyCandidate(authored.store, falseMedian, options), /measured median/i);

  const falseTargetStore = structuredClone(authored.store);
  falseTargetStore.candidates[0].target += 10;
  let falseTarget = structuredClone(authored.receipt);
  falseTarget.candidateIdentity = identity(falseTargetStore.candidates[0]);
  falseTarget.targetDerivation.roundedTarget = falseTargetStore.candidates[0].target;
  falseTarget = resign(falseTarget);
  assert.throws(() => verifyCandidate(falseTargetStore, falseTarget, options), /rounded target/i);

  const falseScaleStore = structuredClone(authored.store);
  falseScaleStore.candidates[0].tileScale = 16;
  let falseScale = structuredClone(authored.receipt);
  falseScale.candidateIdentity = identity(falseScaleStore.candidates[0]);
  falseScale.targetDerivation.tileScale = 16;
  falseScale = resign(falseScale);
  assert.throws(() => verifyCandidate(falseScaleStore, falseScale, options), /tile scale/i);
});

test('authored receipts carry the exact frozen calibration stamp', () => {
  const { calibrationStamp } = require('../calibration');
  const authored = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  });
  assert.deepEqual(authored.receipt.calibration, calibrationStamp());
});

test('verification rejects missing or re-signed mismatched calibration stamps', () => {
  const authored = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
  });
  const options = {
    play: measuredOutcome,
    inputIdentities: TEST_INPUT_IDENTITIES,
    gates: { minWinRate: 0, maxBombRate: 1, requireZeroLockouts: true },
  };

  const missing = structuredClone(authored.receipt);
  delete missing.calibration;
  assert.throws(() => verifyCandidate(authored.store, resign(missing), options), /calibration/i);

  const wrongVersion = structuredClone(authored.receipt);
  wrongVersion.calibration.version = 'calib-other';
  assert.throws(() => verifyCandidate(authored.store, resign(wrongVersion), options), /calibration/i);

  const wrongParams = structuredClone(authored.receipt);
  wrongParams.calibration.params.width = 23;
  assert.throws(() => verifyCandidate(authored.store, resign(wrongParams), options), /calibration/i);

  const wrongIdentity = structuredClone(authored.receipt);
  wrongIdentity.calibration.solverIdentity = '0'.repeat(64);
  assert.throws(() => verifyCandidate(authored.store, resign(wrongIdentity), options), /calibration/i);
});
