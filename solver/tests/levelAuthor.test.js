const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  FIT_SEEDS,
  HOLDOUT_SEEDS,
  deriveCandidate,
  identity,
  playMeasured,
  verifyCandidate,
  validateShape,
} = require('../level-author');
const { CALIBRATION_PARAMS, calibrationStamp } = require('../calibration');
const { DEFAULT_PARAMS } = require('../bot');

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
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
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
  assert.deepEqual(receipt.targetDerivation.calibration, calibrationStamp());
  assert.equal(receipt.holdout.terminalCounts.total, 300);
  assert.equal(receipt.holdout.terminalCounts.win, 1);
  assert.equal(receipt.holdout.terminalCounts.bombExploded, 1);
  assert.equal(receipt.holdout.terminalCounts.incomplete, 0);
  assert.match(receipt.shapeIdentity, /^[a-f0-9]{64}$/);
  assert.match(receipt.candidateIdentity, /^[a-f0-9]{64}$/);
  assert.match(receipt.receiptIdentity, /^[a-f0-9]{64}$/);
});

test('playMeasured supplies the complete frozen calibration even when live bot defaults move', () => {
  const level = {
    level: 1,
    target: 1000,
    tileScale: 1,
    moves: 1,
    minChain: 2,
    gridW: 2,
    gridH: 2,
    blockers: [],
  };
  const observed = [];
  const originalPathWidth = DEFAULT_PARAMS.pathWidth;
  DEFAULT_PARAMS.pathWidth = originalPathWidth + 99;

  try {
    playMeasured(level, 0, {
      chooseMove: (_state, options) => {
        observed.push(options);
        return null;
      },
    });
  } finally {
    DEFAULT_PARAMS.pathWidth = originalPathWidth;
  }

  assert.equal(observed.length, 1, 'the test seam must observe the move-selection call');
  assert.deepEqual(observed[0].params, CALIBRATION_PARAMS);
  assert.notEqual(
    observed[0].params.pathWidth,
    originalPathWidth + 99,
    'candidate measurement must not inherit a changed live default',
  );
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
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
  });
  const permissive = { minWinRate: 0, maxBombRate: 1, requireZeroLockouts: true };

  assert.equal(verifyCandidate(authored.store, authored.receipt, {
    play: measuredOutcome,
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
    gates: permissive,
  }).status, 'PASS');

  assert.throws(() => verifyCandidate(authored.store, { ...authored.receipt, shapeIdentity: '0'.repeat(64) }, {
    play: measuredOutcome,
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
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
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
  }), /overlap/);

  let incomplete = structuredClone(authored.receipt);
  incomplete.holdout.terminalCounts.total = 299;
  incomplete = resign(incomplete);
  assert.throws(() => verifyCandidate(authored.store, incomplete, {
    play: measuredOutcome,
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
  }), /terminal total/);
});

test('verifyCandidate remeasures fitting evidence and enforces target and tile-scale derivation', () => {
  const authored = deriveCandidate(SHAPE, {
    play: measuredOutcome,
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
  });
  const options = {
    play: measuredOutcome,
    inputIdentities: { levelAuthor: 'a', engine: 'b', bot: 'c' },
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
