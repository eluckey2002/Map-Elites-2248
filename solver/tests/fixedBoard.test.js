const { test } = require('node:test');
const assert = require('node:assert/strict');

const { identity } = require('../level-author');
const {
  FIT_VARIANTS,
  HOLDOUT_VARIANTS,
  variantLookaheadBase,
  validateFixedShape,
  playVariant,
  deriveFixedCandidate,
  verifyFixedCandidate,
} = require('../fixed-board');

const SHAPE = {
  schemaVersion: 1,
  name: 'fixed-demo',
  level: 52,
  seed: 777,
  demand: 0.9,
  demandStatus: 'provisional-proposal',
  moves: 16,
  minChain: 3,
  gridW: 4,
  gridH: 7,
  blockers: [],
};

// A stand-in player: score depends on the variant, so fitting and holdout are
// distinguishable and the target derivation is exactly predictable.
function fakePlay(level, variant) {
  const fitting = variant < HOLDOUT_VARIANTS.start;
  const score = fitting ? 1000 + variant : 900 + (variant - HOLDOUT_VARIANTS.start);
  if (level.target === Infinity) return { score, result: 'lose', reason: 'out of moves', movesUsed: level.moves };
  if (score >= level.target) return { score, result: 'win', movesUsed: 5 };
  return { score, result: 'lose', reason: 'out of moves', movesUsed: level.moves };
}

const fakeIdentities = { bot: 'a'.repeat(64), engine: 'b'.repeat(64), levelAuthor: 'c'.repeat(64), fixedBoard: 'd'.repeat(64) };
const authored = () => deriveFixedCandidate(SHAPE, { play: fakePlay, inputIdentities: fakeIdentities });

test('a fixed-board shape must name the seed that fixes the board', () => {
  const { seed, ...noSeed } = SHAPE;
  assert.throws(() => validateFixedShape(noSeed), /seed must be an integer/);
  assert.throws(() => validateFixedShape({ ...SHAPE, seed: -1 }), /seed must be an integer/);
  assert.doesNotThrow(() => validateFixedShape({ ...SHAPE, seed: 0 }), 'seed 0 is a real board, not a missing one');
});

// The point of the whole module: the target must never be asserted by hand,
// exactly as in the random-board pipeline it replaces.
test('target and tileScale remain forbidden shape controls', () => {
  assert.throws(() => validateFixedShape({ ...SHAPE, target: 1000 }), /forbidden/);
  assert.throws(() => validateFixedShape({ ...SHAPE, tileScale: 4 }), /forbidden/);
});

test('fitting and holdout use disjoint player variants', () => {
  const fitEnd = FIT_VARIANTS.start + FIT_VARIANTS.count;
  assert.ok(fitEnd <= HOLDOUT_VARIANTS.start, `fitting ends at ${fitEnd}, holdout starts at ${HOLDOUT_VARIANTS.start}`);
});

// Adjacent variants must be genuinely different players. A stride of 1 would
// make variant 1 and variant 2 near-identical lookaheads and the "distribution"
// would be one player measured a hundred times.
test('adjacent variants map to far-apart lookahead seeds', () => {
  const gap = Math.abs(variantLookaheadBase(2) - variantLookaheadBase(1));
  assert.ok(gap > 100000, `adjacent variant lookahead bases differ by only ${gap}`);
});

test('the target is the fitted median times demand, rounded down', () => {
  const { store, receipt } = authored();
  const candidate = store.candidates[0];
  const median = receipt.fitting.scoreQuantiles.median;
  assert.equal(receipt.targetDerivation.measuredMedian, median);
  assert.equal(receipt.targetDerivation.demand, SHAPE.demand);
  assert.equal(candidate.target, receipt.targetDerivation.roundedTarget);
  assert.ok(candidate.target <= median * SHAPE.demand, 'rounding must never round the target up');
});

test('the candidate carries the seed, so the board is part of the level', () => {
  const candidate = authored().store.candidates[0];
  assert.equal(candidate.seed, SHAPE.seed);
});

test('a freshly derived candidate verifies against its own receipt', () => {
  const { store, receipt } = authored();
  const result = verifyFixedCandidate(store, receipt, { play: fakePlay, inputIdentities: fakeIdentities });
  assert.equal(result.status, 'PASS');
});

test('the receipt is rejected when the candidate is edited underneath it', () => {
  const { store, receipt } = authored();
  const tampered = { schemaVersion: 1, candidates: [{ ...store.candidates[0], target: 1 }] };
  assert.throws(
    () => verifyFixedCandidate(tampered, receipt, { play: fakePlay, inputIdentities: fakeIdentities }),
    /candidate identity mismatch/,
  );
});

// Changing which board the level is means changing the level. The seed is part
// of the candidate identity, so it cannot be swapped while keeping the receipt.
test('swapping the board invalidates the receipt', () => {
  const { store, receipt } = authored();
  const moved = { schemaVersion: 1, candidates: [{ ...store.candidates[0], seed: 778 }] };
  assert.throws(
    () => verifyFixedCandidate(moved, receipt, { play: fakePlay, inputIdentities: fakeIdentities }),
    /candidate identity mismatch/,
  );
});

test('a receipt from the random-board pipeline is refused outright', () => {
  const { store, receipt } = authored();
  const wrongModel = { ...receipt, boardModel: 'random-seeds' };
  assert.throws(
    () => verifyFixedCandidate(store, wrongModel, { play: fakePlay, inputIdentities: fakeIdentities }),
    /not a fixed-board receipt/,
  );
});

// Re-signed on purpose. An unsigned edit is already caught by the identity
// check, which would leave this guard untested — the case that matters is a
// receipt that is internally consistent and still declares the wrong axis.
test('a correctly signed receipt that fitted across boards is still refused', () => {
  const { store, receipt } = authored();
  const wrongAxis = {
    ...receipt,
    targetDerivation: { ...receipt.targetDerivation, varying: 'board-seeds' },
  };
  delete wrongAxis.receiptIdentity;
  const resigned = { ...wrongAxis, receiptIdentity: identity(wrongAxis) };
  assert.throws(
    () => verifyFixedCandidate(store, resigned, { play: fakePlay, inputIdentities: fakeIdentities }),
    /vary the player/,
  );
});

// The real bot on the real engine: the same board with different players must
// actually produce different games, or the whole calibration is one sample.
test('the same fixed board yields a real spread of scores across players', () => {
  const level = { ...SHAPE, target: Infinity, tileScale: 1 };
  const scores = new Set();
  for (let variant = FIT_VARIANTS.start; variant < FIT_VARIANTS.start + 12; variant++) {
    scores.add(playVariant(level, variant).score);
  }
  assert.ok(scores.size > 6, `only ${scores.size} distinct scores from 12 players — the board may be forcing one line`);
});

test('the same board and the same player replay identically', () => {
  const level = { ...SHAPE, target: Infinity, tileScale: 1 };
  assert.deepEqual(playVariant(level, 7), playVariant(level, 7));
});
