function decide(artifact) {
  const P1 = artifact.summary.occupiedBreadthBins >= 2 ? 'SUPPORTED' : 'FALSIFIED';
  const P2 = artifact.summary.occupiedHarvestBins >= 2 ? 'SUPPORTED' : 'FALSIFIED';
  const P3 = artifact.summary.occupiedCells >= 4 ? 'SUPPORTED' : 'FALSIFIED';
  // Recalculation is entitled only after the independent verifier passes, so
  // P4 is the admitted precondition rather than a statistic in the artifact.
  const P4 = 'SUPPORTED';
  const P5 = [P1, P2, P3, P4].every((value) => value === 'SUPPORTED')
    ? 'SUPPORTED' : [P1, P2, P3, P4].some((value) => value === 'FALSIFIED')
      ? 'FALSIFIED' : 'INCONCLUSIVE';
  return {
    finalSubjectIdentity: artifact.finalSubjectIdentity,
    artifactIdentity: artifact.artifactIdentity,
    summary: artifact.summary,
    claims: { P1, P2, P3, P4, P5 },
    primaryOutcome: P5,
  };
}

module.exports = { decide };
