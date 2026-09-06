function scoreDiagnostic(referenceScore, comparisonScore, options = {}) {
  const { referenceHorizon, comparisonHorizon } = options;
  const unequalHorizon = referenceHorizon !== undefined && comparisonHorizon !== undefined
    && referenceHorizon !== comparisonHorizon;
  return {
    referenceScore,
    comparisonScore,
    rawDelta: comparisonScore - referenceScore,
    percentOfReference: !unequalHorizon && referenceScore > 0
      ? ((comparisonScore - referenceScore) / referenceScore) * 100
      : null,
    ...(referenceHorizon === undefined ? {} : { referenceHorizon }),
    ...(comparisonHorizon === undefined ? {} : { comparisonHorizon }),
    ...(referenceHorizon === undefined || comparisonHorizon === undefined ? {} : {
      comparability: unequalHorizon ? 'unequal-horizon-no-inference' : 'matched-horizon diagnostic',
    }),
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
    const speed = referenceWin && !lostReferenceWin
      ? entry.comparisons.reduce((sum, item) => sum + (entry.reference.moves - item.moves), 0) / entry.comparisons.length
      : null;
    return { ...entry, comparisonWinFraction, referenceWin, lostReferenceWin, convertedWin, speed };
  });

  const convertedWins = normalized.reduce((sum, entry) => sum + entry.convertedWin, 0);
  const fixedSpeedSet = normalized.filter((entry) => entry.referenceWin);
  const eligible = !normalized.some((entry) => entry.lostReferenceWin);
  const meanMovesSaved = eligible && fixedSpeedSet.length
    ? fixedSpeedSet.reduce((sum, entry) => sum + entry.speed, 0) / fixedSpeedSet.length
    : null;
  const speedCounts = fixedSpeedSet.reduce((counts, entry) => {
    if (entry.speed === null) return counts;
    if (entry.speed > 0) counts.faster += 1;
    else if (entry.speed < 0) counts.slower += 1;
    else counts.tied += 1;
    return counts;
  }, { faster: 0, slower: 0, tied: 0 });

  let eligibility = 'ELIGIBLE';
  let verdict;
  if (!eligible) {
    eligibility = 'INELIGIBLE';
    verdict = 'INELIGIBLE';
  } else if (convertedWins > 0) verdict = 'BETTER_ON_THIS_SET_BY_WINS';
  else if (meanMovesSaved === null) verdict = 'NO_SUCCESS_OBSERVED';
  else if (meanMovesSaved > 0) verdict = 'FASTER_ON_THIS_SET';
  else if (meanMovesSaved < 0) verdict = 'SLOWER_ON_THIS_SET';
  else verdict = 'TIED_ON_THIS_SET';

  const jointWins = normalized.flatMap((entry) => entry.referenceWin
    ? entry.comparisons.filter((item) => item.outcome === 'win').map((item) => ({
      caseKey: entry.caseKey,
      movesSaved: entry.reference.moves - item.moves,
    })) : []);
  const jointWinCases = new Set(jointWins.map((item) => item.caseKey));

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
    jointWinDiagnostic: {
      label: 'joint-win diagnostic; cannot rescue eligibility or replace D',
      meanMovesSaved: jointWins.length
        ? jointWins.reduce((sum, item) => sum + item.movesSaved, 0) / jointWins.length
        : null,
      jointWinAttempts: jointWins.length,
      totalAttempts: normalized.reduce((sum, entry) => sum + entry.comparisons.length, 0),
      affectedCases: jointWinCases.size,
      totalCases: normalized.length,
    },
  };
}

module.exports = { compareCases, scoreDiagnostic };
