const { summarize } = require('./greed-descriptor-screen');

function classify(supported, falsified) {
  if (supported) return 'SUPPORTED';
  if (falsified) return 'FALSIFIED';
  return 'INCONCLUSIVE';
}

function summarizeRegistered(rows, { expectedGames = 128 } = {}) {
  const summary = summarize(rows);
  const exactRows = rows.filter(({ exactComplete }) => exactComplete);
  const exactCompleteness = exactRows.length / rows.length;
  const cells = new Map();
  for (const row of rows) {
    const key = `${row.percentile}/${row.level}`;
    const cell = cells.get(key) || { games: 0, complete: 0 };
    cell.games += 1;
    if (row.exactComplete) cell.complete += 1;
    cells.set(key, cell);
  }
  const exactCellCompleteness = Object.fromEntries([...cells.entries()].map(([key, value]) => [
    key,
    { ...value, rate: value.complete / value.games },
  ]));
  const minimumCellCompleteness = Math.min(...Object.values(exactCellCompleteness).map(({ rate }) => rate));
  const p1 = classify(
    rows.length === expectedGames && exactCompleteness >= 0.75 && minimumCellCompleteness >= 0.50,
    rows.length !== expectedGames || exactCompleteness < 0.50
      || summary.policies.some(({ greedMeasuredGames }) => greedMeasuredGames === 0),
  );
  const p2 = classify(
    summary.screenChecks.controlledGreedRange,
    !summary.policies.every(({ meanGreedRatio }) => Number.isFinite(meanGreedRatio))
      || summary.diagnostics.greedMeanRange < 0.15
      || summary.policies.some((policy, index, policies) => (
        index > 0 && policy.meanGreedRatio <= policies[index - 1].meanGreedRatio
      )),
  );
  const winGreed = summary.diagnostics.policyWinGreedCorrelation;
  const p3 = classify(winGreed !== null && winGreed >= 0.50, winGreed !== null && winGreed <= 0);
  const scoreGreed = summary.diagnostics.scoreGreedCorrelation;
  const p4 = classify(
    scoreGreed !== null && Math.abs(scoreGreed) < 0.70,
    scoreGreed !== null && Math.abs(scoreGreed) >= 0.85,
  );
  const stability = summary.diagnostics.minimumStability;
  const p5 = classify(stability !== null && stability >= 0.80, stability !== null && stability < 0.60);
  const { timingBins, greedBins, occupiedCells } = summary.diagnostics;
  const p6 = classify(
    timingBins.length === 3 && greedBins.length === 3 && occupiedCells.length >= 5,
    timingBins.length === 1 || greedBins.length < 2 || occupiedCells.length <= 3,
  );
  const outcomes = [p1, p2, p3, p4, p5, p6];
  const primaryOutcome = outcomes.every((outcome) => outcome === 'SUPPORTED')
    ? 'SUPPORTED'
    : outcomes.includes('FALSIFIED')
      ? 'FALSIFIED'
      : 'INCONCLUSIVE';

  return {
    exact: {
      completeGames: exactRows.length,
      totalGames: rows.length,
      exactCompleteness,
      minimumCellCompleteness,
      cells: exactCellCompleteness,
    },
    exploratoryComparability: summary,
    P1: {
      outcome: p1,
      required: 'SUPPORTED at the complete 128-game matrix, >=75% exact-complete games overall, and >=50% in every percentile/level cell; FALSIFIED below 50% overall, an incomplete matrix, or a percentile with no exact games',
    },
    P2: {
      outcome: p2,
      required: 'SUPPORTED when exact mean greed rises strictly with the scripted percentile and spans >=0.30; FALSIFIED when unordered, missing, or spanning <0.15',
    },
    P3: {
      outcome: p3,
      required: 'SUPPORTED when policy-level win rate and exact mean greed have Pearson r >=0.50; FALSIFIED at r <=0',
    },
    P4: {
      outcome: p4,
      required: 'SUPPORTED when per-game score and exact greed have |r| <0.70; FALSIFIED at |r| >=0.85',
    },
    P5: {
      outcome: p5,
      required: 'SUPPORTED when every percentile policy lands in its modal or edge-adjacent cell on >=80% of exact-complete games; FALSIFIED below 60%',
    },
    P6: {
      outcome: p6,
      required: 'SUPPORTED when both axes occupy all three frozen bins and at least five cells; FALSIFIED when timing occupies one bin, greed fewer than two, or at most three cells',
    },
    primaryOutcome,
  };
}

module.exports = { summarizeRegistered };
