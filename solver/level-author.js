const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
} = require('./engine');
const { chooseMove } = require('./calibrations/calib-1');
const { calibrationStamp } = require('./calibration');

const LOOKAHEAD_BASE = 987654321;
const FIT_SEEDS = Object.freeze({ start: 0, count: 150 });
const HOLDOUT_SEEDS = Object.freeze({ start: 100000, count: 300 });
const DEFAULT_GATES = Object.freeze({ minWinRate: 0.20, maxBombRate: 0.05, requireZeroLockouts: true });
const ROOT = path.join(__dirname, '..');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');
}

function fileIdentity(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function defaultInputIdentities() {
  return {
    engine: fileIdentity(path.join(__dirname, 'engine.js')),
    levelAuthor: fileIdentity(__filename),
  };
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

function validateShape(shape) {
  if (!shape || typeof shape !== 'object' || Array.isArray(shape)) throw new Error('shape must be an object');
  if (Object.hasOwn(shape, 'target')) throw new Error('target is a forbidden shape control');
  if (Object.hasOwn(shape, 'tileScale')) throw new Error('tileScale is a forbidden shape control');
  if (shape.schemaVersion !== 1) throw new Error('schemaVersion must be 1');
  if (typeof shape.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(shape.name)) {
    throw new Error('name must be a non-empty kebab-case identifier');
  }
  requireInteger(shape.level, 'level', 1, 9999);
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

function validateCandidate(candidate) {
  if (!candidate || typeof candidate !== 'object') throw new Error('candidate must be an object');
  if (candidate.schemaVersion !== 1) throw new Error('candidate schemaVersion must be 1');
  if (typeof candidate.name !== 'string' || candidate.name.length === 0) throw new Error('candidate name is required');
  requireInteger(candidate.level, 'candidate level', 1, 9999);
  requireInteger(candidate.target, 'candidate target', 1, Number.MAX_SAFE_INTEGER);
  requireInteger(candidate.tileScale, 'candidate tileScale', 1, Number.MAX_SAFE_INTEGER);
  requireInteger(candidate.moves, 'candidate moves', 1, 999);
  requireInteger(candidate.minChain, 'candidate minChain', 2, 20);
  requireInteger(candidate.gridW, 'candidate gridW', 2, 12);
  requireInteger(candidate.gridH, 'candidate gridH', 2, 12);
  if (!Array.isArray(candidate.blockers)) throw new Error('candidate blockers must be an array');
  candidate.blockers.forEach((blocker) => validateBlocker(blocker, candidate));
  if (!/^[a-f0-9]{64}$/.test(candidate.sourceShapeIdentity || '')) {
    throw new Error('candidate sourceShapeIdentity is required');
  }
  return candidate;
}

function tileScaleForLevel(level) {
  return 2 ** Math.floor((level - 1) / 10);
}

function roundTarget(value) {
  const step = value >= 100000 ? 1000 : value >= 10000 ? 100 : value >= 1000 ? 50 : 10;
  return Math.max(step, Math.floor(value / step) * step);
}

function quantile(sorted, q) {
  return sorted[Math.min(Math.floor(sorted.length * q), sorted.length - 1)];
}

function playMeasured(level, seed) {
  const rng = makeRng(seed);
  const state = createLevelState(level, rng);
  const hardCap = level.moves + 5;

  for (let moveIndex = 0; moveIndex < hardCap; moveIndex++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
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

function measure(level, seedRange, play, label) {
  const scores = [];
  const terminalCounts = { win: 0, noValidMoves: 0, bombExploded: 0, outOfMoves: 0, incomplete: 0, total: 0 };
  for (let offset = 0; offset < seedRange.count; offset++) {
    const seed = seedRange.start + offset;
    const outcome = play(level, seed);
    if (!outcome || !Number.isFinite(outcome.score)) throw new Error(`incomplete run at seed ${seed}`);
    scores.push(outcome.score);
    const terminal = terminalKey(outcome);
    if (terminal === 'incomplete') throw new Error(`incomplete ${label} run at seed ${seed}`);
    terminalCounts[terminal] += 1;
    terminalCounts.total += 1;
  }
  scores.sort((a, b) => a - b);
  return {
    seedRange: { ...seedRange },
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

function deriveCandidate(shapeInput, options = {}) {
  const shape = validateShape(shapeInput);
  const play = options.play || playMeasured;
  const inputIdentities = options.inputIdentities || defaultInputIdentities();
  const shapeIdentity = identity(shape);
  const tileScale = tileScaleForLevel(shape.level);
  const levelForFit = {
    level: shape.level,
    target: Infinity,
    tileScale,
    moves: shape.moves,
    minChain: shape.minChain,
    gridW: shape.gridW,
    gridH: shape.gridH,
    blockers: shape.blockers,
  };
  const fitting = measure(levelForFit, FIT_SEEDS, play, 'fitting');
  const target = roundTarget(fitting.scoreQuantiles.median * shape.demand);
  const candidate = {
    schemaVersion: 1,
    name: shape.name,
    level: shape.level,
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
  const holdout = measure(candidate, HOLDOUT_SEEDS, play, 'holdout');
  const receipt = withReceiptIdentity({
    schemaVersion: 1,
    shapeName: shape.name,
    shapeIdentity,
    candidateIdentity,
    inputIdentities,
    calibration: calibrationStamp(),
    fitting,
    targetDerivation: {
      policy: 'median-times-demand-rounded-down',
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

function assertSeedRanges(receipt) {
  const fit = receipt.fitting && receipt.fitting.seedRange;
  const holdout = receipt.holdout && receipt.holdout.seedRange;
  if (!fit || !holdout) throw new Error('seed ranges are missing');
  if (fit.start + fit.count > holdout.start && holdout.start + holdout.count > fit.start) throw new Error('fitting and holdout seed ranges overlap');
  if (!fit || fit.start !== FIT_SEEDS.start || fit.count !== FIT_SEEDS.count) throw new Error('fitting seed range is invalid');
  if (!holdout || holdout.start !== HOLDOUT_SEEDS.start || holdout.count !== HOLDOUT_SEEDS.count) throw new Error('holdout seed range is invalid');
}

function assertTerminalTotals(measurement, expected) {
  const counts = measurement && measurement.terminalCounts;
  if (!counts) throw new Error('terminal counts are missing');
  const sum = counts.win + counts.noValidMoves + counts.bombExploded + counts.outOfMoves + counts.incomplete;
  if (counts.total !== expected || sum !== expected) throw new Error(`terminal total must equal ${expected}`);
  if (counts.incomplete !== 0) throw new Error('incomplete terminal runs are forbidden');
}

function verifyCandidate(store, receipt, options = {}) {
  if (!store || store.schemaVersion !== 1 || !Array.isArray(store.candidates) || store.candidates.length !== 1) {
    throw new Error('candidate store must contain exactly one schemaVersion 1 candidate');
  }
  const candidate = validateCandidate(store.candidates[0]);
  if (!receipt || receipt.schemaVersion !== 1) throw new Error('receipt schemaVersion must be 1');
  const unsigned = { ...receipt };
  delete unsigned.receiptIdentity;
  if (identity(unsigned) !== receipt.receiptIdentity) throw new Error('receipt identity mismatch');
  if (identity(candidate) !== receipt.candidateIdentity) throw new Error('candidate identity mismatch');
  if (candidate.sourceShapeIdentity !== receipt.shapeIdentity) throw new Error('shape identity mismatch');
  if (canonicalJson(receipt.calibration) !== canonicalJson(calibrationStamp())) {
    throw new Error('calibration stamp mismatch');
  }
  const inputIdentities = options.inputIdentities || defaultInputIdentities();
  if (canonicalJson(inputIdentities) !== canonicalJson(receipt.inputIdentities)) throw new Error('code/input identity mismatch');
  assertSeedRanges(receipt);
  assertTerminalTotals(receipt.fitting, FIT_SEEDS.count);
  assertTerminalTotals(receipt.holdout, HOLDOUT_SEEDS.count);

  const targetDerivation = receipt.targetDerivation;
  if (!targetDerivation || typeof targetDerivation !== 'object') throw new Error('target derivation is missing');
  if (targetDerivation.policy !== 'median-times-demand-rounded-down') throw new Error('target derivation policy is invalid');
  if (targetDerivation.tileScalePolicy !== '2 ** floor((level - 1) / 10)') throw new Error('tile scale policy is invalid');
  const expectedTileScale = tileScaleForLevel(candidate.level);
  if (candidate.tileScale !== expectedTileScale || targetDerivation.tileScale !== expectedTileScale) {
    throw new Error(`tile scale must equal level-derived policy value ${expectedTileScale}`);
  }

  const sourceShape = validateShape({
    schemaVersion: 1,
    name: receipt.shapeName,
    level: candidate.level,
    demand: targetDerivation.demand,
    demandStatus: targetDerivation.demandStatus,
    moves: candidate.moves,
    minChain: candidate.minChain,
    gridW: candidate.gridW,
    gridH: candidate.gridH,
    blockers: candidate.blockers,
  });
  if (sourceShape.name !== candidate.name || identity(sourceShape) !== receipt.shapeIdentity) {
    throw new Error('source shape identity mismatch');
  }

  const play = options.play || playMeasured;
  const fittingLevel = { ...candidate, target: Infinity };
  const measuredFitting = measure(fittingLevel, FIT_SEEDS, play, 'fitting');
  if (canonicalJson(measuredFitting) !== canonicalJson(receipt.fitting)) throw new Error('fitting measurement mismatch');
  if (targetDerivation.measuredMedian !== measuredFitting.scoreQuantiles.median) {
    throw new Error('target derivation measured median mismatch');
  }
  const expectedTarget = roundTarget(measuredFitting.scoreQuantiles.median * sourceShape.demand);
  if (candidate.target !== expectedTarget || targetDerivation.roundedTarget !== expectedTarget) {
    throw new Error(`rounded target must equal measured derivation ${expectedTarget}`);
  }

  const measured = measure(candidate, HOLDOUT_SEEDS, play, 'holdout');
  if (canonicalJson(measured) !== canonicalJson(receipt.holdout)) throw new Error('holdout measurement mismatch');
  const gates = { ...DEFAULT_GATES, ...(options.gates || {}) };
  const counts = measured.terminalCounts;
  const winRate = counts.win / counts.total;
  const bombRate = counts.bombExploded / counts.total;
  if (gates.requireZeroLockouts && counts.noValidMoves !== 0) throw new Error(`holdout has ${counts.noValidMoves} lockouts`);
  if (bombRate > gates.maxBombRate) throw new Error(`holdout bomb rate ${bombRate} exceeds ${gates.maxBombRate}`);
  if (winRate < gates.minWinRate) throw new Error(`holdout win rate ${winRate} is below ${gates.minWinRate}`);
  return { status: 'PASS', candidateIdentity: receipt.candidateIdentity, winRate, bombRate, terminalCounts: counts };
}

function serialize(value) {
  return `${JSON.stringify(JSON.parse(canonicalJson(value)), null, 2)}\n`;
}

module.exports = {
  DEFAULT_GATES,
  FIT_SEEDS,
  HOLDOUT_SEEDS,
  canonicalJson,
  defaultInputIdentities,
  deriveCandidate,
  identity,
  playMeasured,
  roundTarget,
  serialize,
  tileScaleForLevel,
  validateCandidate,
  validateShape,
  verifyCandidate,
};
