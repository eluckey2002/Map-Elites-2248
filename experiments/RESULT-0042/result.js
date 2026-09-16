const { summarize } = require('../../solver/greed-descriptor-screen');

const REQUIREMENTS = Object.freeze({
  P1: 'SUPPORTED at a complete 128-game matrix, >=25% exact-complete games, >=12.5% in every percentile, and at least one exact game in every percentile/level cell; FALSIFIED below 10% overall, an incomplete matrix, or a percentile with no exact games',
  P2: 'SUPPORTED when exact mean greed rises strictly with scripted percentile and spans >=0.30; FALSIFIED when unordered, missing, or spanning <0.15',
  P3: 'SUPPORTED when policy-level all-game win rate and exact mean greed have Pearson r >=0.50; FALSIFIED at r <=0',
  P4: 'SUPPORTED when per-game score and exact greed have |r| <0.70; FALSIFIED at |r| >=0.85',
  P5: 'SUPPORTED when every percentile places >=80% of exact-complete games in its exact modal greed bin; FALSIFIED below 60%',
});

function classify(supported, falsified) {
  if (supported) return 'SUPPORTED';
  if (falsified) return 'FALSIFIED';
  return 'INCONCLUSIVE';
}

function greedBinStability(rows, percentile) {
  const bins = rows
    .filter((row) => row.percentile === percentile && row.exactComplete)
    .map((row) => row.cell?.greed)
    .filter(Number.isInteger);
  if (!bins.length) return { modalGreedBin: null, exactModalGreedRate: null };
  const counts = new Map();
  for (const bin of bins) counts.set(bin, (counts.get(bin) || 0) + 1);
  const modalGreedBin = [...counts.entries()]
    .sort(([aBin, aCount], [bBin, bCount]) => bCount - aCount || aBin - bBin)[0][0];
  return {
    modalGreedBin,
    exactModalGreedRate: bins.filter((bin) => bin === modalGreedBin).length / bins.length,
  };
}

function summarizeDeterministicGreed(rows, { expectedGames = 128, percentiles } = {}) {
  const base = summarize(rows, percentiles);
  const exactRows = rows.filter(({ exactComplete }) => exactComplete);
  const exactCompleteness = exactRows.length / rows.length;
  const policies = base.policies.map((policy) => ({
    percentile: policy.percentile,
    games: policy.games,
    exactGames: policy.greedMeasuredGames,
    exactCompleteness: policy.greedMeasuredGames / policy.games,
    winRate: policy.winRate,
    meanExactGreed: policy.meanGreedRatio,
    ...greedBinStability(rows, policy.percentile),
  }));
  const cells = new Map();
  for (const row of rows) {
    const key = `${row.percentile}/${row.level}`;
    const cell = cells.get(key) || { games: 0, exactGames: 0 };
    cell.games += 1;
    if (row.exactComplete) cell.exactGames += 1;
    cells.set(key, cell);
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
  const minimumExactModalGreedRate = Math.min(...policies.map(({ exactModalGreedRate }) => (
    Number.isFinite(exactModalGreedRate) ? exactModalGreedRate : -Infinity
  )));
  const p1 = classify(
    rows.length === expectedGames && exactCompleteness >= 0.25
      && minimumPolicyCompleteness >= 0.125 && allCellsRepresented,
    rows.length !== expectedGames || exactCompleteness < 0.10
      || policies.some(({ exactGames }) => exactGames === 0),
  );
  const p2 = classify(
    orderedGreed && greedMeanRange >= 0.30,
    !orderedGreed || greedMeanRange === null || greedMeanRange < 0.15,
  );
  const winGreed = base.diagnostics.policyWinGreedCorrelation;
  const p3 = classify(winGreed !== null && winGreed >= 0.50, winGreed !== null && winGreed <= 0);
  const scoreGreed = base.diagnostics.scoreGreedCorrelation;
  const p4 = classify(
    scoreGreed !== null && Math.abs(scoreGreed) < 0.70,
    scoreGreed !== null && Math.abs(scoreGreed) >= 0.85,
  );
  const p5 = classify(
    minimumExactModalGreedRate >= 0.80,
    minimumExactModalGreedRate < 0.60,
  );
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
        timingBins: base.diagnostics.timingBins,
        timingMeanRange: base.diagnostics.timingMeanRange,
        scoreTimingCorrelation: base.diagnostics.scoreTimingCorrelation,
      },
    },
    P1: { outcome: p1, required: REQUIREMENTS.P1 },
    P2: { outcome: p2, required: REQUIREMENTS.P2 },
    P3: { outcome: p3, required: REQUIREMENTS.P3 },
    P4: { outcome: p4, required: REQUIREMENTS.P4 },
    P5: { outcome: p5, required: REQUIREMENTS.P5 },
    primaryOutcome: outcomes.every((outcome) => outcome === 'SUPPORTED')
      ? 'SUPPORTED'
      : outcomes.includes('FALSIFIED') ? 'FALSIFIED' : 'INCONCLUSIVE',
  };
}

module.exports = { REQUIREMENTS, classify, greedBinStability, summarizeDeterministicGreed };
