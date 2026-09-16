const CELL_KEYS = Object.freeze([
  'depth-1/compact',
  'depth-1/broad',
  'depth-2-plus/compact',
  'depth-2-plus/broad',
]);

function cellFor(descriptors, spreadCut = 0.82) {
  if (!descriptors || !Number.isInteger(descriptors.peakMergeDepth)
      || descriptors.peakMergeDepth < 1
      || !Number.isFinite(descriptors.meanNormalizedChainSpan)) {
    throw new Error('a MAP cell requires finite successful-witness descriptors');
  }
  const depth = descriptors.peakMergeDepth === 1 ? 'depth-1' : 'depth-2-plus';
  const spread = descriptors.meanNormalizedChainSpan < spreadCut ? 'compact' : 'broad';
  return `${depth}/${spread}`;
}

function archiveCandidate(row, spreadCut = 0.82) {
  if (row.shallow.standing === 'UNKNOWN' || row.deep.standing === 'UNKNOWN') return null;
  const shallowCell = cellFor(row.shallow.descriptors, spreadCut);
  const deepCell = cellFor(row.deep.descriptors, spreadCut);
  const spreadDelta = Math.abs(
    row.shallow.descriptors.meanNormalizedChainSpan
      - row.deep.descriptors.meanNormalizedChainSpan,
  );
  if (shallowCell !== deepCell || spreadDelta > 0.10) return null;
  return {
    cell: deepCell,
    level: row.level,
    dimensions: row.dimensions,
    seed: row.seed,
    puzzleIdentity: row.deep.puzzleIdentity,
    descriptors: row.deep.descriptors,
    stability: {
      shallowCell,
      deepCell,
      spreadDelta,
    },
  };
}

function compareCandidates(left, right, spreadCut = 0.82) {
  const delta = left.stability.spreadDelta - right.stability.spreadDelta;
  if (delta !== 0) return delta;
  const leftMargin = Math.abs(left.descriptors.meanNormalizedChainSpan - spreadCut);
  const rightMargin = Math.abs(right.descriptors.meanNormalizedChainSpan - spreadCut);
  if (leftMargin !== rightMargin) return rightMargin - leftMargin;
  return left.puzzleIdentity.localeCompare(right.puzzleIdentity);
}

function buildArchive(rows, { spreadCut = 0.82, capacity = 4 } = {}) {
  const candidates = rows.map((row) => archiveCandidate(row, spreadCut)).filter(Boolean);
  const cells = Object.fromEntries(CELL_KEYS.map((cell) => {
    const eligible = candidates
      .filter((candidate) => candidate.cell === cell)
      .sort((left, right) => compareCandidates(left, right, spreadCut));
    return [cell, {
      eligibleCount: eligible.length,
      retained: eligible.slice(0, capacity),
    }];
  }));
  return { spreadCut, capacity, cells };
}

function classify(supported, falsified) {
  if (supported) return 'SUPPORTED';
  if (falsified) return 'FALSIFIED';
  return 'INCONCLUSIVE';
}

function summarizeMap(rows, options = {}) {
  const archive = buildArchive(rows, options);
  const deepRows = rows.filter(({ deep }) => deep.standing !== 'UNKNOWN');
  const pairedRows = rows.filter(({ shallow, deep }) => (
    shallow.standing !== 'UNKNOWN' && deep.standing !== 'UNKNOWN'
  ));
  const stableRows = rows.map((row) => archiveCandidate(row, archive.spreadCut)).filter(Boolean);
  const coveredProfiles = new Set(deepRows.map(({ level }) => level)).size;
  const occupiedCells = CELL_KEYS.filter((key) => archive.cells[key].retained.length > 0).length;
  const fullCells = CELL_KEYS.filter(
    (key) => archive.cells[key].retained.length === archive.capacity,
  ).length;
  const stabilityRate = pairedRows.length ? stableRows.length / pairedRows.length : null;

  const p1Supported = deepRows.length >= 120 && coveredProfiles === 4;
  const p1Falsified = deepRows.length < 96 || coveredProfiles < 4;
  const p2Supported = fullCells === CELL_KEYS.length;
  const p2Falsified = occupiedCells <= 2;
  const p3Supported = pairedRows.length >= 112 && stabilityRate >= 0.75;
  const p3Falsified = pairedRows.length < 96 || (stabilityRate !== null && stabilityRate < 0.50);
  const outcomes = [
    classify(p1Supported, p1Falsified),
    classify(p2Supported, p2Falsified),
    classify(p3Supported, p3Falsified),
  ];
  const disposition = outcomes.every((outcome) => outcome === 'SUPPORTED')
    ? 'CANONICAL_MAP_CORPUS_READY'
    : outcomes.includes('FALSIFIED')
      ? 'MAP_CORPUS_NOT_SUPPORTED'
      : 'MAP_CORPUS_INCONCLUSIVE';

  return {
    archive,
    P1: {
      outcome: outcomes[0],
      deepWitnessRows: deepRows.length,
      coveredProfiles,
      required: 'SUPPORTED at >=120/128 deep witnesses across all profiles; FALSIFIED below 96 or any profile absent',
    },
    P2: {
      outcome: outcomes[1],
      occupiedCells,
      fullCells,
      eligibleCounts: Object.fromEntries(CELL_KEYS.map((key) => [key, archive.cells[key].eligibleCount])),
      required: 'SUPPORTED when all four cells retain four representatives; FALSIFIED when at most two cells are occupied',
    },
    P3: {
      outcome: outcomes[2],
      pairedRows: pairedRows.length,
      stableCellRows: stableRows.length,
      stabilityRate,
      required: 'SUPPORTED at >=112 paired witnesses and >=75% exact cell stability; FALSIFIED below 96 pairs or 50% stability',
    },
    disposition,
  };
}

module.exports = {
  CELL_KEYS,
  archiveCandidate,
  buildArchive,
  cellFor,
  compareCandidates,
  summarizeMap,
};
