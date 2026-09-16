#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../src/game');
const { DEFAULT_PARAMS } = require('./bot');
const {
  applyGravity,
  checkBombs,
  createLevelState,
  executeChain,
  findGreedyChains,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('./engine');
const { captureGameMove, summarizeGameTrace } = require('./behavior-descriptors');
const { exactGreedDenominator } = require('./exact-greed-denominator');

const DEFAULT_LEVELS = Object.freeze([10, 31, 53, 54]);
const DEFAULT_PERCENTILES = Object.freeze([0.25, 0.5, 0.75, 1]);
const DEFAULT_SEED_START = 33100000;
const DEFAULT_SEED_COUNT = 64;
const CELL_NAMES = Object.freeze({
  '2,0': 'Patient Hoarder',
  '2,1': 'Builder',
  '2,2': 'Late Sprinter',
  '1,0': 'Wanderer',
  '1,1': 'Balanced',
  '1,2': 'Steady Maximizer',
  '0,0': 'Dawdler',
  '0,1': 'Opportunist',
  '0,2': 'Greedy Sprinter',
});

function strongCandidates(state, limit = DEFAULT_PARAMS.width) {
  return findGreedyChains(state, {
    limit,
    preferMergeableSum: false,
    tieBreak: DEFAULT_PARAMS.tieBreak,
    pathWidth: DEFAULT_PARAMS.pathWidth,
  });
}

function choosePercentileCandidate(candidates, percentile) {
  if (!candidates.length) return null;
  if (!Number.isFinite(percentile) || percentile < 0 || percentile > 1) {
    throw new Error('percentile must be between 0 and 1');
  }
  const target = candidates[0].points * percentile;
  return candidates.reduce((best, candidate) => {
    const distance = Math.abs(candidate.points - target);
    const bestDistance = Math.abs(best.points - target);
    if (distance !== bestDistance) return distance < bestDistance ? candidate : best;
    return candidate.points > best.points ? candidate : best;
  });
}

function descriptorCell({ halfScoreMove, greedRatio }) {
  if (!Number.isFinite(halfScoreMove) || !Number.isFinite(greedRatio)) return null;
  const timing = halfScoreMove < 0.45 ? 0 : halfScoreMove < 0.70 ? 1 : 2;
  const greed = greedRatio < 0.45 ? 0 : greedRatio < 0.75 ? 1 : 2;
  const key = `${timing},${greed}`;
  return { timing, greed, key, name: CELL_NAMES[key] };
}

function playPercentile(levelData, seed, percentile, {
  denominator = 'strong-greedy',
  exactTimeoutMs = 2000,
} = {}) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const trace = [];
  let reachedTarget = null;
  let terminal = 'moves';
  const denominatorObservations = [];
  while (state.moves < state.maxMoves) {
    const candidates = strongCandidates(state);
    const selected = choosePercentileCandidate(candidates, percentile);
    if (!selected) {
      terminal = 'no-move';
      break;
    }
    const scoreBefore = state.score;
    const denominatorObservation = denominator === 'exact'
      ? exactGreedDenominator(state, { timeoutMs: exactTimeoutMs })
      : {
        standing: 'bounded_strong_greedy_proxy',
        points: candidates[0].points,
      };
    denominatorObservations.push(denominatorObservation);
    executeChain(state, selected.chain);
    trace.push(captureGameMove({
      moveNumber: state.moves,
      scoreGain: state.score - scoreBefore,
      strongestGreedyPoints: denominatorObservation.standing === 'exact_result'
        || denominatorObservation.standing === 'bounded_strong_greedy_proxy'
        ? denominatorObservation.points
        : null,
    }));
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) {
      terminal = 'bomb';
      break;
    }
    if (reachedTarget === null && state.score >= state.targetScore) reachedTarget = state.moves;
  }
  const descriptors = summarizeGameTrace(trace);
  return {
    level: levelData.level,
    seed,
    percentile,
    score: state.score,
    win: reachedTarget !== null,
    movesToTarget: reachedTarget,
    moves: state.moves,
    terminal,
    denominator,
    denominatorObservations,
    exactComplete: denominator === 'exact'
      ? denominatorObservations.every(({ standing }) => standing === 'exact_result')
      : null,
    descriptors,
    cell: descriptorCell(descriptors),
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearson(rows, x, y) {
  const usable = rows.filter((row) => Number.isFinite(x(row)) && Number.isFinite(y(row)));
  if (usable.length < 2) return null;
  const xs = usable.map(x);
  const ys = usable.map(y);
  const mx = mean(xs);
  const my = mean(ys);
  const numerator = usable.reduce((sum, _, index) => sum + (xs[index] - mx) * (ys[index] - my), 0);
  const dx = Math.sqrt(xs.reduce((sum, value) => sum + (value - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((sum, value) => sum + (value - my) ** 2, 0));
  return dx && dy ? numerator / (dx * dy) : null;
}

function modalCell(rows) {
  const counts = new Map();
  for (const { cell } of rows) {
    if (!cell) continue;
    counts.set(cell.key, (counts.get(cell.key) || 0) + 1);
  }
  return [...counts.entries()].sort(([aKey, aCount], [bKey, bCount]) => (
    bCount - aCount || aKey.localeCompare(bKey)
  ))[0]?.[0] || null;
}

function adjacentRate(rows, referenceKey) {
  if (!referenceKey) return null;
  const [timing, greed] = referenceKey.split(',').map(Number);
  const classified = rows.filter(({ cell }) => cell);
  return classified.length ? classified.filter(({ cell }) => (
    Math.abs(cell.timing - timing) + Math.abs(cell.greed - greed) <= 1
  )).length / classified.length : null;
}

function summarize(rows, percentiles = DEFAULT_PERCENTILES) {
  const policies = percentiles.map((percentile) => {
    const games = rows.filter((row) => row.percentile === percentile);
    const measuredGreed = games.filter(({ descriptors }) => Number.isFinite(descriptors.greedRatio));
    const referenceCell = modalCell(measuredGreed);
    return {
      percentile,
      games: games.length,
      greedMeasuredGames: measuredGreed.length,
      greedCompleteness: measuredGreed.length / games.length,
      wins: games.filter(({ win }) => win).length,
      winRate: mean(games.map(({ win }) => Number(win))),
      meanScore: mean(games.map(({ score }) => score)),
      meanHalfScoreMove: mean(games.map(({ descriptors }) => descriptors.halfScoreMove)),
      meanGreedRatio: measuredGreed.length
        ? mean(measuredGreed.map(({ descriptors }) => descriptors.greedRatio))
        : null,
      modalCell: referenceCell,
      sameOrAdjacentRate: adjacentRate(measuredGreed, referenceCell),
    };
  });
  const occupiedCells = new Set(rows.filter(({ cell }) => cell).map(({ cell }) => cell.key));
  const timingBins = new Set(rows.filter(({ cell }) => cell).map(({ cell }) => cell.timing));
  const greedBins = new Set(rows.filter(({ cell }) => cell).map(({ cell }) => cell.greed));
  const greedMeans = policies.map(({ meanGreedRatio }) => meanGreedRatio);
  const timingMeans = policies.map(({ meanHalfScoreMove }) => meanHalfScoreMove);
  const orderedGreed = greedMeans.every((value, index) => (
    Number.isFinite(value) && (index === 0 || value > greedMeans[index - 1])
  ));
  const policyWinGreedCorrelation = pearson(policies, (row) => row.meanGreedRatio, (row) => row.winRate);
  const scoreGreedCorrelation = pearson(rows, (row) => row.descriptors.greedRatio, (row) => row.score);
  const scoreTimingCorrelation = pearson(rows, (row) => row.descriptors.halfScoreMove, (row) => row.score);
  const stabilityRates = policies.map(({ sameOrAdjacentRate }) => sameOrAdjacentRate)
    .filter(Number.isFinite);
  const minimumStability = stabilityRates.length === policies.length
    ? Math.min(...stabilityRates)
    : null;
  const finiteGreedMeans = greedMeans.filter(Number.isFinite);
  const greedMeanRange = finiteGreedMeans.length
    ? Math.max(...finiteGreedMeans) - Math.min(...finiteGreedMeans)
    : null;
  const screenChecks = {
    controlledGreedRange: orderedGreed && greedMeanRange >= 0.30,
    expressiveRange: timingBins.size === 3 && greedBins.size === 3 && occupiedCells.size >= 5,
    lowFitnessCorrelation: Math.abs(scoreGreedCorrelation) < 0.70,
    seedStability: minimumStability !== null && minimumStability >= 0.80,
    outcomeTracksGreed: policyWinGreedCorrelation !== null && Math.abs(policyWinGreedCorrelation) >= 0.50,
  };
  return {
    policies,
    diagnostics: {
      greedMeanRange,
      timingMeanRange: Math.max(...timingMeans) - Math.min(...timingMeans),
      occupiedCells: [...occupiedCells].sort(),
      timingBins: [...timingBins].sort(),
      greedBins: [...greedBins].sort(),
      scoreGreedCorrelation,
      scoreTimingCorrelation,
      policyWinGreedCorrelation,
      minimumStability,
    },
    screenChecks,
    nextStep: Object.values(screenChecks).every(Boolean)
      ? 'QUALIFY_EXACT_DENOMINATOR'
      : 'STOP_AFTER_SCREEN',
  };
}

function runScreen({
  levelNumbers = DEFAULT_LEVELS,
  percentiles = DEFAULT_PERCENTILES,
  seedStart = DEFAULT_SEED_START,
  seedCount = DEFAULT_SEED_COUNT,
} = {}) {
  const levels = levelNumbers.map((number) => {
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`unknown level ${number}`);
    return level;
  });
  const seeds = Array.from({ length: seedCount }, (_, index) => seedStart + index);
  const rows = [];
  for (const percentile of percentiles) {
    for (const level of levels) {
      for (const seed of seeds) rows.push(playPercentile(level, seed, percentile));
    }
  }
  return {
    schemaVersion: 1,
    exploratory: true,
    denominator: {
      kind: 'strong-settings greedy search plus the played move',
      tieBreak: DEFAULT_PARAMS.tieBreak,
      pathWidth: DEFAULT_PARAMS.pathWidth,
      candidateLimit: DEFAULT_PARAMS.width,
      exact: false,
    },
    panel: { levelNumbers, percentiles, seedStart, seedCount, seeds },
    bins: {
      halfScoreMove: { early: '<0.45', steady: '0.45..<0.70', late: '>=0.70' },
      greedRatio: { low: '<0.45', mid: '0.45..<0.75', high: '>=0.75' },
    },
    rows,
    summary: summarize(rows, percentiles),
  };
}

function parseArgs(argv) {
  const value = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index === -1 ? fallback : Number(argv[index + 1]);
  };
  const outputIndex = argv.indexOf('--out');
  return {
    seedStart: value('seed-start', DEFAULT_SEED_START),
    seedCount: value('seeds', DEFAULT_SEED_COUNT),
    out: outputIndex === -1 ? null : argv[outputIndex + 1],
  };
}

function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (!options.out) throw new Error('usage: greed-descriptor-screen.js --out <path> [--seed-start N] [--seeds N]');
  const destination = path.resolve(options.out);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${options.out}`);
  const artifact = runScreen(options);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(artifact)}\n`);
  process.stdout.write(`${JSON.stringify(artifact.summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = {
  CELL_NAMES,
  adjacentRate,
  choosePercentileCandidate,
  descriptorCell,
  pearson,
  playPercentile,
  runScreen,
  strongCandidates,
  summarize,
};
