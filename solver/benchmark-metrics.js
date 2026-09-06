function scoreDiagnostic(referenceScore, comparisonScore) {
  return {
    referenceScore,
    comparisonScore,
    rawDelta: comparisonScore - referenceScore,
    percentOfReference: referenceScore > 0
      ? ((comparisonScore - referenceScore) / referenceScore) * 100
      : null,
  };
}

function compareCases(cases) {
  if (cases.length === 0) {
    return {
      cases: [],
      ranking: { eligibility: 'EMPTY', verdict: 'EMPTY', convertedWins: null, meanMovesSaved: null },
      speedCounts: { faster: 0, slower: 0, tied: 0 },
    };
  }
  if (cases.some((entry) => entry.unresolved && entry.unresolved.length > 0)) {
    return {
      cases,
      ranking: { eligibility: 'UNRESOLVED', verdict: 'UNRESOLVED', convertedWins: null, meanMovesSaved: null },
      speedCounts: { faster: 0, slower: 0, tied: 0 },
    };
  }

  const normalized = cases.map((entry) => {
    if (!entry.comparisons.length) throw new Error(`${entry.caseKey} has no comparison attempts`);
    const comparisonWinFraction = entry.comparisons.filter((item) => item.outcome === 'win').length / entry.comparisons.length;
    const referenceWin = entry.reference.outcome === 'win';
    const lostReferenceWin = referenceWin && comparisonWinFraction < 1;
    const convertedWin = referenceWin ? 0 : comparisonWinFraction;
    const speed = referenceWin
      ? entry.comparisons.reduce((sum, item) => sum + (entry.reference.moves - item.moves), 0) / entry.comparisons.length
      : null;
    return { ...entry, comparisonWinFraction, referenceWin, lostReferenceWin, convertedWin, speed };
  });

  const convertedWins = normalized.reduce((sum, entry) => sum + entry.convertedWin, 0);
  const fixedSpeedSet = normalized.filter((entry) => entry.referenceWin);
  const meanMovesSaved = fixedSpeedSet.length
    ? fixedSpeedSet.reduce((sum, entry) => sum + entry.speed, 0) / fixedSpeedSet.length
    : null;
  const speedCounts = fixedSpeedSet.reduce((counts, entry) => {
    if (entry.speed > 0) counts.faster += 1;
    else if (entry.speed < 0) counts.slower += 1;
    else counts.tied += 1;
    return counts;
  }, { faster: 0, slower: 0, tied: 0 });

  let eligibility = 'ELIGIBLE';
  let verdict;
  if (normalized.some((entry) => entry.lostReferenceWin)) {
    eligibility = 'INELIGIBLE';
    verdict = 'INELIGIBLE';
  } else if (convertedWins > 0) verdict = 'BETTER_ON_THIS_SET_BY_WINS';
  else if (meanMovesSaved === null) verdict = 'NO_SUCCESS_OBSERVED';
  else if (meanMovesSaved > 0) verdict = 'FASTER_ON_THIS_SET';
  else if (meanMovesSaved < 0) verdict = 'SLOWER_ON_THIS_SET';
  else verdict = 'TIED_ON_THIS_SET';

  return {
    cases: normalized,
    ranking: { eligibility, verdict, convertedWins, meanMovesSaved },
    winRates: {
      reference: normalized.filter((entry) => entry.referenceWin).length / normalized.length,
      comparison: normalized.reduce((sum, entry) => sum + entry.comparisonWinFraction, 0) / normalized.length,
    },
    regressionAttempts: normalized.reduce((sum, entry) => sum + (entry.referenceWin
      ? entry.comparisons.filter((item) => item.outcome !== 'win').length : 0), 0),
    regressionCases: normalized.filter((entry) => entry.lostReferenceWin).length,
    speedCounts,
  };
}

module.exports = { compareCases, scoreDiagnostic };
