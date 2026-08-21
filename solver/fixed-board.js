#!/usr/bin/env node
// Authoring for levels that are ONE FIXED BOARD rather than a shape plus a
// random draw.
//
// Why this exists. `level-author.js` derives a target by playing 150 randomly
// seeded boards of the same shape and taking the median. That is the right
// thing to do when the player also draws a random board. It is the wrong thing
// once the board is fixed, because it averages over boards the player will
// never see. Measured: for one fixed shape, the number of distinct opening
// moves ranges from 124 to 1363 across seeds, while two genuinely different
// shapes sat at 536 and 467. The draw mattered about ten times more than the
// design, so a target fitted across draws is a target fitted to noise.
//
// The fix is to keep the fitting/holdout discipline and change what varies.
// The board is held still; the PLAYER varies. The bot's move choice depends on
// a lookahead RNG, so a different lookahead seed is a different player facing
// the same board - a real one, not a relabelling: on one board, 40 lookahead
// seeds produced 37 distinct scores spanning 59,904 to 136,576.
//
// Everything else is deliberately unchanged from `level-author.js`: the target
// is measured and never typed, tile scale is derived from the level number,
// the gates are the same three, and a receipt pins every input by hash. Fitting
// variants and holdout variants must not overlap, for the same reason fitting
// and holdout seeds must not.

const crypto = require('node:crypto');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');
const {
  DEFAULT_GATES,
  canonicalJson,
  defaultInputIdentities,
  identity,
  roundTarget,
  tileScaleForLevel,
} = require('./level-author');

// Player variants, not board seeds. Disjoint ranges, checked at verify time.
const FIT_VARIANTS = Object.freeze({ start: 1, count: 40 });
const HOLDOUT_VARIANTS = Object.freeze({ start: 10001, count: 60 });

// Spreads adjacent variant numbers far apart in the RNG's state space, so
// variant 1 and variant 2 are unrelated players rather than near-identical
// ones.
const VARIANT_STRIDE = 1000003;

function variantLookaheadBase(variant) {
  return (variant * VARIANT_STRIDE) >>> 0;
}

function requireInteger(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}`);
  }
}

function validateBlocker(blocker, shape) {
  if (!blocker || typeof blocker !== 'object' || !['stone', 'ice', 'bomb'].includes(blocker.type)) {
    throw new Error('blocker type must be stone, ice, or bomb');
  }
  requireInteger(blocker.x, 'blocker x', 0, shape.gridW - 1);
  requireInteger(blocker.y, 'blocker y', 0, shape.gridH - 1);
  if (blocker.type === 'ice') requireInteger(blocker.duration, 'ice duration', 1, 100);
  if (blocker.type === 'bomb') requireInteger(blocker.timer, 'bomb timer', 1, 100);
}

// A fixed-board shape is a shape plus the seed that fixes the board. Target and
// tileScale remain forbidden controls: the whole point is that they are derived
// from measurement rather than asserted.
function validateFixedShape(shape) {
  if (!shape || typeof shape !== 'object' || Array.isArray(shape)) throw new Error('shape must be an object');
  if (Object.hasOwn(shape, 'target')) throw new Error('target is a forbidden shape control');
  if (Object.hasOwn(shape, 'tileScale')) throw new Error('tileScale is a forbidden shape control');
  if (shape.schemaVersion !== 1) throw new Error('schemaVersion must be 1');
  if (typeof shape.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shape.name)) {
    throw new Error('name must be a non-empty kebab-case identifier');
  }
  requireInteger(shape.level, 'level', 1, 9999);
  requireInteger(shape.seed, 'seed', 0, 0xffffffff);
  if (!Number.isFinite(shape.demand) || shape.demand <= 0 || shape.demand > 2) {
    throw new Error('demand must be greater than 0 and at most 2');
  }
  if (shape.demandStatus !== 'provisional-proposal') {
    throw new Error('demandStatus must visibly be provisional-proposal');
  }
  requireInteger(shape.moves, 'moves', 1, 999);
  requireInteger(shape.minChain, 'minChain', 2, 20);
  requireInteger(shape.gridW, 'gridW', 2, 12);
  requireInteger(shape.gridH, 'gridH', 2, 12);
  if (!Array.isArray(shape.blockers)) throw new Error('blockers must be an array');
  shape.blockers.forEach((blocker) => validateBlocker(blocker, shape));
  const positions = new Set(shape.blockers.map(({ x, y }) => `${x},${y}`));
  if (positions.size !== shape.blockers.length) throw new Error('blocker positions must be unique');
  return shape;
}

// One bot playing one fixed board. The board seed drives tile layout and
// spawns; the variant drives only how the bot looks ahead, so two variants face
// exactly the same board and the same spawns for the same move sequence.
function playVariant(level, variant) {
  const rng = makeRng(level.seed);
  const state = createLevelState(level, rng);
  const lookaheadBase = variantLookaheadBase(variant);

  for (let moveIndex = 0; moveIndex < level.moves + 5; moveIndex++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(lookaheadBase + moveIndex) });
    if (!chain) return { score: state.score, result: 'lose', reason: 'no valid moves', movesUsed: state.moves };
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score, result: 'lose', reason: 'bomb exploded', movesUsed: state.moves };
    if (state.score >= state.targetScore) return { score: state.score, result: 'win', movesUsed: state.moves };
    if (state.moves >= state.maxMoves) return { score: state.score, result: 'lose', reason: 'out of moves', movesUsed: state.moves };
  }
  return { score: state.score, result: 'lose', reason: 'hard cap exceeded (engine bug?)', movesUsed: state.moves };
}

function terminalKey(outcome) {
  if (outcome.result === 'win') return 'win';
  if (outcome.reason === 'no valid moves') return 'noValidMoves';
  if (outcome.reason === 'bomb exploded') return 'bombExploded';
  if (outcome.reason === 'out of moves') return 'outOfMoves';
  return 'incomplete';
}

function quantile(sorted, q) {
  return sorted[Math.min(Math.floor(sorted.length * q), sorted.length - 1)];
}

function measure(level, variantRange, play, label) {
  const scores = [];
  const terminalCounts = { win: 0, noValidMoves: 0, bombExploded: 0, outOfMoves: 0, incomplete: 0, total: 0 };
  for (let offset = 0; offset < variantRange.count; offset++) {
    const variant = variantRange.start + offset;
    const outcome = play(level, variant);
    if (!outcome || !Number.isFinite(outcome.score)) throw new Error(`incomplete run at variant ${variant}`);
    const terminal = terminalKey(outcome);
    if (terminal === 'incomplete') throw new Error(`incomplete ${label} run at variant ${variant}`);
    scores.push(outcome.score);
    terminalCounts[terminal] += 1;
    terminalCounts.total += 1;
  }
  scores.sort((a, b) => a - b);
  return {
    variantRange: { ...variantRange },
    scoreQuantiles: {
      minimum: scores[0],
      p25: quantile(scores, 0.25),
      median: quantile(scores, 0.5),
      p75: quantile(scores, 0.75),
      maximum: scores[scores.length - 1],
    },
    terminalCounts,
  };
}

function withReceiptIdentity(receipt) {
  const unsigned = { ...receipt };
  delete unsigned.receiptIdentity;
  return { ...unsigned, receiptIdentity: identity(unsigned) };
}

function fixedInputIdentities() {
  return {
    ...defaultInputIdentities(),
    fixedBoard: crypto.createHash('sha256').update(require('node:fs').readFileSync(__filename)).digest('hex'),
  };
}

function deriveFixedCandidate(shapeInput, options = {}) {
  const shape = validateFixedShape(shapeInput);
  const play = options.play || playVariant;
  const inputIdentities = options.inputIdentities || fixedInputIdentities();
  const shapeIdentity = identity(shape);
  const tileScale = tileScaleForLevel(shape.level);

  const levelForFit = {
    level: shape.level,
    seed: shape.seed,
    target: Infinity,
    tileScale,
    moves: shape.moves,
    minChain: shape.minChain,
    gridW: shape.gridW,
    gridH: shape.gridH,
    blockers: shape.blockers,
  };
  const fitting = measure(levelForFit, FIT_VARIANTS, play, 'fitting');
  const target = roundTarget(fitting.scoreQuantiles.median * shape.demand);

  const candidate = {
    schemaVersion: 1,
    name: shape.name,
    level: shape.level,
    seed: shape.seed,
    target,
    tileScale,
    moves: shape.moves,
    minChain: shape.minChain,
    gridW: shape.gridW,
    gridH: shape.gridH,
    blockers: shape.blockers,
    sourceShapeIdentity: shapeIdentity,
  };
  const candidateIdentity = identity(candidate);
  const holdout = measure(candidate, HOLDOUT_VARIANTS, play, 'holdout');

  const receipt = withReceiptIdentity({
    schemaVersion: 1,
    boardModel: 'fixed-seed',
    shapeName: shape.name,
    shapeIdentity,
    candidateIdentity,
    inputIdentities,
    fitting,
    targetDerivation: {
      policy: 'median-times-demand-rounded-down',
      varying: 'player-lookahead',
      measuredMedian: fitting.scoreQuantiles.median,
      demand: shape.demand,
      demandStatus: shape.demandStatus,
      tileScalePolicy: '2 ** floor((level - 1) / 10)',
      tileScale,
      roundedTarget: target,
    },
    holdout,
  });

  return { store: { schemaVersion: 1, candidates: [candidate] }, receipt };
}

function assertVariantRanges(receipt) {
  const fit = receipt.fitting && receipt.fitting.variantRange;
  const holdout = receipt.holdout && receipt.holdout.variantRange;
  if (!fit || !holdout) throw new Error('variant ranges are missing');
  if (fit.start !== FIT_VARIANTS.start || fit.count !== FIT_VARIANTS.count) throw new Error('fitting variant range is invalid');
  if (holdout.start !== HOLDOUT_VARIANTS.start || holdout.count !== HOLDOUT_VARIANTS.count) throw new Error('holdout variant range is invalid');
  if (fit.start + fit.count > holdout.start && holdout.start + holdout.count > fit.start) {
    throw new Error('fitting and holdout variant ranges overlap');
  }
}

function verifyFixedCandidate(store, receipt, options = {}) {
  if (!store || store.schemaVersion !== 1 || !Array.isArray(store.candidates) || store.candidates.length !== 1) {
    throw new Error('candidate store must contain exactly one schemaVersion 1 candidate');
  }
  if (!receipt || receipt.schemaVersion !== 1) throw new Error('receipt schemaVersion must be 1');
  if (receipt.boardModel !== 'fixed-seed') throw new Error('receipt is not a fixed-board receipt');
  const candidate = store.candidates[0];
  requireInteger(candidate.seed, 'candidate seed', 0, 0xffffffff);

  const unsigned = { ...receipt };
  delete unsigned.receiptIdentity;
  if (identity(unsigned) !== receipt.receiptIdentity) throw new Error('receipt identity mismatch');
  if (identity(candidate) !== receipt.candidateIdentity) throw new Error('candidate identity mismatch');
  if (candidate.sourceShapeIdentity !== receipt.shapeIdentity) throw new Error('shape identity mismatch');

  const inputIdentities = options.inputIdentities || fixedInputIdentities();
  if (canonicalJson(inputIdentities) !== canonicalJson(receipt.inputIdentities)) throw new Error('code/input identity mismatch');

  assertVariantRanges(receipt);

  const expectedTileScale = tileScaleForLevel(candidate.level);
  if (candidate.tileScale !== expectedTileScale) {
    throw new Error(`tile scale must equal level-derived policy value ${expectedTileScale}`);
  }

  const play = options.play || playVariant;
  const levelForFit = { ...candidate, target: Infinity };
  const measuredFitting = measure(levelForFit, FIT_VARIANTS, play, 'fitting');
  if (canonicalJson(measuredFitting) !== canonicalJson(receipt.fitting)) throw new Error('fitting measurement mismatch');

  const derivation = receipt.targetDerivation;
  if (!derivation || derivation.policy !== 'median-times-demand-rounded-down') throw new Error('target derivation policy is invalid');
  if (derivation.varying !== 'player-lookahead') throw new Error('target derivation must vary the player, not the board');
  if (derivation.measuredMedian !== measuredFitting.scoreQuantiles.median) throw new Error('target derivation measured median mismatch');
  const expectedTarget = roundTarget(measuredFitting.scoreQuantiles.median * derivation.demand);
  if (candidate.target !== expectedTarget || derivation.roundedTarget !== expectedTarget) {
    throw new Error(`rounded target must equal measured derivation ${expectedTarget}`);
  }

  const measuredHoldout = measure(candidate, HOLDOUT_VARIANTS, play, 'holdout');
  if (canonicalJson(measuredHoldout) !== canonicalJson(receipt.holdout)) throw new Error('holdout measurement mismatch');

  const gates = { ...DEFAULT_GATES, ...(options.gates || {}) };
  const counts = measuredHoldout.terminalCounts;
  const winRate = counts.win / counts.total;
  const bombRate = counts.bombExploded / counts.total;
  if (gates.requireZeroLockouts && counts.noValidMoves !== 0) throw new Error(`holdout has ${counts.noValidMoves} lockouts`);
  if (bombRate > gates.maxBombRate) throw new Error(`holdout bomb rate ${bombRate} exceeds ${gates.maxBombRate}`);
  if (winRate < gates.minWinRate) throw new Error(`holdout win rate ${winRate} is below ${gates.minWinRate}`);
  return { status: 'PASS', candidateIdentity: receipt.candidateIdentity, winRate, bombRate, terminalCounts: counts };
}

module.exports = {
  FIT_VARIANTS,
  HOLDOUT_VARIANTS,
  VARIANT_STRIDE,
  variantLookaheadBase,
  validateFixedShape,
  playVariant,
  deriveFixedCandidate,
  verifyFixedCandidate,
};
