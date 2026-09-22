#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { ROOT } = require('./subject');

const REQUIRED = Object.freeze({
  P1: 'SUPPORTED at a complete 128-game matrix, >=25% exact-complete games, >=12.5% in every percentile, and at least one exact game in every percentile/level cell; FALSIFIED below 10% overall, an incomplete matrix, or a percentile with no exact games',
  P2: 'SUPPORTED when exact mean greed rises strictly with scripted percentile and spans >=0.30; FALSIFIED when unordered, missing, or spanning <0.15',
  P3: 'SUPPORTED when policy-level all-game win rate and exact mean greed have Pearson r >=0.50; FALSIFIED at r <=0',
  P4: 'SUPPORTED when per-game score and exact greed have |r| <0.70; FALSIFIED at |r| >=0.85',
  P5: 'SUPPORTED when every percentile places >=80% of exact-complete games in its exact modal greed bin; FALSIFIED below 60%',
});

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearson(xs, ys) {
  if (xs.length < 2 || xs.length !== ys.length) return null;
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((sum, value, index) => sum + (value - xMean) * (ys[index] - yMean), 0);
  const xDenominator = Math.sqrt(xs.reduce((sum, value) => sum + (value - xMean) ** 2, 0));
  const yDenominator = Math.sqrt(ys.reduce((sum, value) => sum + (value - yMean) ** 2, 0));
  return xDenominator && yDenominator ? numerator / (xDenominator * yDenominator) : null;
}

function classify(supported, falsified) {
  return supported ? 'SUPPORTED' : falsified ? 'FALSIFIED' : 'INCONCLUSIVE';
}

function reduceCorpus(corpus) {
  const { rows } = corpus;
  const percentiles = corpus.panel.percentiles;
  const exactRows = rows.filter(({ exactComplete }) => exactComplete);
  const exactCompleteness = exactRows.length / rows.length;
  const policies = percentiles.map((percentile) => {
    const games = rows.filter((row) => row.percentile === percentile);
    const exactGames = games.filter(({ exactComplete }) => exactComplete);
    const bins = exactGames.map(({ cell }) => cell?.greed).filter(Number.isInteger);
    const counts = new Map();
    for (const bin of bins) counts.set(bin, (counts.get(bin) || 0) + 1);
    const modalGreedBin = bins.length
      ? [...counts.entries()].sort(([aBin, aCount], [bBin, bCount]) => bCount - aCount || aBin - bBin)[0][0]
      : null;
    return {
      percentile,
      games: games.length,
      exactGames: exactGames.length,
      exactCompleteness: exactGames.length / games.length,
      winRate: mean(games.map(({ win }) => Number(win))),
      meanExactGreed: exactGames.length
        ? mean(exactGames.map(({ descriptors }) => descriptors.greedRatio))
        : null,
      modalGreedBin,
      exactModalGreedRate: bins.length
        ? bins.filter((bin) => bin === modalGreedBin).length / bins.length
        : null,
    };
  });
  const cells = new Map();
  for (const row of rows) {
    const key = `${row.percentile}/${row.level}`;
    const value = cells.get(key) || { games: 0, exactGames: 0 };
    value.games += 1;
    if (row.exactComplete) value.exactGames += 1;
    cells.set(key, value);
  }
  const exactCells = Object.fromEntries([...cells.entries()].map(([key, value]) => [key, {
    ...value,
    exactCompleteness: value.exactGames / value.games,
  }]));
  const minimumPolicyCompleteness = Math.min(...policies.map(({ exactCompleteness: rate }) => rate));
  const allCellsRepresented = Object.values(exactCells).every(({ exactGames }) => exactGames > 0);
  const greedMeans = policies.map(({ meanExactGreed }) => meanExactGreed);
  const orderedGreed = greedMeans.every((value, index) => (
    Number.isFinite(value) && (index === 0 || value > greedMeans[index - 1])
  ));
  const greedMeanRange = Number.isFinite(greedMeans[0])
    ? Math.max(...greedMeans) - Math.min(...greedMeans)
    : null;
  const winGreed = pearson(greedMeans, policies.map(({ winRate }) => winRate));
  const scoreGreed = pearson(
    exactRows.map(({ descriptors }) => descriptors.greedRatio),
    exactRows.map(({ score }) => score),
  );
  const minimumExactModalGreedRate = Math.min(...policies.map(({ exactModalGreedRate }) => (
    Number.isFinite(exactModalGreedRate) ? exactModalGreedRate : -Infinity
  )));
  const timingMeans = policies.map(({ percentile }) => mean(rows
    .filter((row) => row.percentile === percentile)
    .map(({ descriptors }) => descriptors.halfScoreMove)));
  const timingBins = [...new Set(rows.filter(({ cell }) => cell).map(({ cell }) => cell.timing))].sort();
  const scoreTimingCorrelation = pearson(
    rows.map(({ descriptors }) => descriptors.halfScoreMove),
    rows.map(({ score }) => score),
  );
  const p1 = classify(
    rows.length === corpus.panel.expectedGames && exactCompleteness >= 0.25
      && minimumPolicyCompleteness >= 0.125 && allCellsRepresented,
    rows.length !== corpus.panel.expectedGames || exactCompleteness < 0.10
      || policies.some(({ exactGames }) => exactGames === 0),
  );
  const p2 = classify(
    orderedGreed && greedMeanRange >= 0.30,
    !orderedGreed || greedMeanRange === null || greedMeanRange < 0.15,
  );
  const p3 = classify(winGreed !== null && winGreed >= 0.50, winGreed !== null && winGreed <= 0);
  const p4 = classify(
    scoreGreed !== null && Math.abs(scoreGreed) < 0.70,
    scoreGreed !== null && Math.abs(scoreGreed) >= 0.85,
  );
  const p5 = classify(minimumExactModalGreedRate >= 0.80, minimumExactModalGreedRate < 0.60);
  const outcomes = [p1, p2, p3, p4, p5];

  return {
    exact: {
      completeGames: exactRows.length,
      totalGames: rows.length,
      exactCompleteness,
      minimumPolicyCompleteness,
      allCellsRepresented,
      cells: exactCells,
    },
    policies,
    diagnostics: {
      greedMeanRange,
      policyWinGreedCorrelation: winGreed,
      scoreGreedCorrelation: scoreGreed,
      minimumExactModalGreedRate,
      halfScoreMove: {
        timingBins,
        timingMeanRange: Math.max(...timingMeans) - Math.min(...timingMeans),
        scoreTimingCorrelation,
      },
    },
    P1: { outcome: p1, required: REQUIRED.P1 },
    P2: { outcome: p2, required: REQUIRED.P2 },
    P3: { outcome: p3, required: REQUIRED.P3 },
    P4: { outcome: p4, required: REQUIRED.P4 },
    P5: { outcome: p5, required: REQUIRED.P5 },
    primaryOutcome: outcomes.every((outcome) => outcome === 'SUPPORTED')
      ? 'SUPPORTED'
      : outcomes.includes('FALSIFIED') ? 'FALSIFIED' : 'INCONCLUSIVE',
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function main(argv = process.argv.slice(2)) {
  const input = flag(argv, '--corpus');
  const output = flag(argv, '--out');
  if (!input) throw new Error('usage: recompute.js --corpus <corpus.json> [--out <path>]');
  const corpus = JSON.parse(fs.readFileSync(path.resolve(ROOT, input), 'utf8'));
  const serialized = `${JSON.stringify(reduceCorpus(corpus))}\n`;
  if (output) fs.writeFileSync(path.resolve(ROOT, output), serialized);
  else process.stdout.write(serialized);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { reduceCorpus };
