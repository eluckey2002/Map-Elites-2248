#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  RESULT,
  SUBJECTS,
  objectIdentity,
  writeNew,
} = require('./run');
const {
  readArtifact,
  validateArtifact,
} = require('./verify');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mean(values) {
  assert(values.length > 0, 'cannot average an empty set');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fileIdentity(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function countBy(values) {
  const counts = {};
  for (const value of values) counts[value] = (counts[value] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

function subjectMeans(cells) {
  const bySubject = new Map(SUBJECTS.map(({ id }) => [id, []]));
  for (const cell of cells) {
    assert(bySubject.has(cell.subjectId), `unknown subject ${cell.subjectId}`);
    bySubject.get(cell.subjectId).push(cell);
  }
  return SUBJECTS.map((subject) => {
    const rows = bySubject.get(subject.id);
    assert(rows.length > 0, `no cells for subject ${subject.id}`);
    return {
      ...subject,
      halfScoreMove: mean(rows.map((cell) => cell.halfScoreMove)),
      meanBeamGreedRatio: mean(rows.map((cell) => cell.meanBeamGreedRatio)),
      winRate: mean(rows.map((cell) => (cell.outcome === 'win' ? 1 : 0))),
    };
  });
}

function conditionalSlices(rows, fixedField, fixedValues, orderedField, orderedValues, descriptor) {
  return fixedValues.map((fixedValue) => {
    const values = orderedValues.map((orderedValue) => {
      const row = rows.find((candidate) => (
        candidate[fixedField] === fixedValue && candidate[orderedField] === orderedValue
      ));
      assert(row, `missing policy ${fixedField}=${fixedValue} ${orderedField}=${orderedValue}`);
      return row[descriptor];
    });
    return {
      fixedValue,
      values,
      span: values.at(-1) - values[0],
      monotonic: values.slice(1).every((value, index) => value > values[index]),
    };
  });
}

function sliceSummary(slices) {
  return {
    totalSlices: slices.length,
    monotonicSlices: slices.filter(({ monotonic }) => monotonic).length,
    minimumSpan: Math.min(...slices.map(({ span }) => span)),
    slices,
  };
}

function factorMetrics(cells) {
  assert(Array.isArray(cells) && cells.length > 0, 'factor metrics require cells');
  const means = subjectMeans(cells);
  const greedCenters = [...new Set(SUBJECTS.map(({ greedCenter }) => greedCenter))];
  const timingSlopes = [...new Set(SUBJECTS.map(({ timingSlope }) => timingSlope))];
  return {
    cells: cells.length,
    policies: SUBJECTS.length,
    outcomes: countBy(cells.map(({ outcome }) => outcome)),
    terminalReasons: countBy(cells.map(({ reason }) => reason)),
    greed: sliceSummary(conditionalSlices(
      means,
      'timingSlope',
      timingSlopes,
      'greedCenter',
      greedCenters,
      'meanBeamGreedRatio',
    )),
    timing: sliceSummary(conditionalSlices(
      means,
      'greedCenter',
      greedCenters,
      'timingSlope',
      timingSlopes,
      'halfScoreMove',
    )),
    subjectMeans: means,
  };
}

function aggregateSubjectLevels(cells) {
  assert(Array.isArray(cells) && cells.length > 0, 'prediction metrics require cells');
  const subjectOrder = new Map(SUBJECTS.map(({ id }, index) => [id, index]));
  const groups = new Map();
  for (const cell of cells) {
    assert(subjectOrder.has(cell.subjectId), `unknown subject ${cell.subjectId}`);
    const key = `${cell.level}:${cell.subjectId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cell);
  }
  const levels = [...new Set(cells.map(({ level }) => level))].sort((a, b) => a - b);
  assert(levels.length >= 3, 'leave-one-level-out analysis requires at least three levels');
  assert(groups.size === levels.length * SUBJECTS.length, 'analysis lacks full level/policy coverage');
  const rows = [...groups.values()].map((group) => ({
    level: group[0].level,
    subjectId: group[0].subjectId,
    halfScoreMove: mean(group.map((cell) => cell.halfScoreMove)),
    meanBeamGreedRatio: mean(group.map((cell) => cell.meanBeamGreedRatio)),
    winRate: mean(group.map((cell) => (cell.outcome === 'win' ? 1 : 0))),
  }));
  rows.sort((a, b) => a.level - b.level || subjectOrder.get(a.subjectId) - subjectOrder.get(b.subjectId));
  return { levels, rows };
}

function modelPredictions(train, test, features, k) {
  const centers = Object.fromEntries(features.map((feature) => [
    feature,
    mean(train.map((row) => row[feature])),
  ]));
  const scales = Object.fromEntries(features.map((feature) => {
    const variance = mean(train.map((row) => (row[feature] - centers[feature]) ** 2));
    return [feature, Math.sqrt(variance)];
  }));
  const zeroVariance = features.filter((feature) => scales[feature] === 0);
  if (zeroVariance.length) return { valid: false, zeroVariance, predictions: null };
  const predictions = test.map((row) => {
    const neighbors = train.map((candidate) => ({
      subjectId: candidate.subjectId,
      level: candidate.level,
      winRate: candidate.winRate,
      distance: features.reduce((sum, feature) => (
        sum + (((row[feature] - candidate[feature]) / scales[feature]) ** 2)
      ), 0),
    })).sort((a, b) => (
      a.distance - b.distance
      || a.subjectId.localeCompare(b.subjectId)
      || a.level - b.level
    ));
    return mean(neighbors.slice(0, k).map(({ winRate }) => winRate));
  });
  return { valid: true, zeroVariance: [], predictions };
}

function brier(rows, predictions) {
  return mean(rows.map((row, index) => (predictions[index] - row.winRate) ** 2));
}

function groupedMeans(rows, field) {
  return [...new Set(rows.map((row) => row[field]))].sort((a, b) => (
    typeof a === 'number' ? a - b : a.localeCompare(b)
  )).map((value) => {
    const group = rows.filter((row) => row[field] === value);
    return {
      [field]: value,
      observations: group.length,
      halfScoreMove: mean(group.map((row) => row.halfScoreMove)),
      meanBeamGreedRatio: mean(group.map((row) => row.meanBeamGreedRatio)),
      winRate: mean(group.map((row) => row.winRate)),
    };
  });
}

function predictionMetrics(cells, requestedK = 5) {
  const { levels, rows } = aggregateSubjectLevels(cells);
  assert(Number.isSafeInteger(requestedK) && requestedK > 0, 'k must be a positive integer');
  const modelFeatures = {
    halfScoreMove: ['halfScoreMove'],
    meanBeamGreedRatio: ['meanBeamGreedRatio'],
    joint: ['halfScoreMove', 'meanBeamGreedRatio'],
  };
  const perLevel = [];
  const scoreSets = { baseRate: [], halfScoreMove: [], meanBeamGreedRatio: [], joint: [] };
  const invalidFolds = { halfScoreMove: [], meanBeamGreedRatio: [], joint: [] };
  let effectiveK = null;

  for (const level of levels) {
    const train = rows.filter((row) => row.level !== level);
    const test = rows.filter((row) => row.level === level);
    const k = Math.min(requestedK, train.length);
    effectiveK = effectiveK === null ? k : Math.min(effectiveK, k);
    const fold = {
      level,
      brier: {
        baseRate: brier(test, test.map(() => mean(train.map(({ winRate }) => winRate)))),
      },
    };
    scoreSets.baseRate.push(fold.brier.baseRate);
    for (const [name, features] of Object.entries(modelFeatures)) {
      const model = modelPredictions(train, test, features, k);
      if (!model.valid) {
        fold.brier[name] = null;
        invalidFolds[name].push({ level, zeroVariance: model.zeroVariance });
      } else {
        fold.brier[name] = brier(test, model.predictions);
        scoreSets[name].push(fold.brier[name]);
      }
    }
    perLevel.push(fold);
  }

  const overall = Object.fromEntries(Object.entries(scoreSets).map(([name, values]) => [
    name,
    name !== 'baseRate' && invalidFolds[name].length ? null : mean(values),
  ]));
  const allPredictorsValid = Object.values(invalidFolds).every((folds) => folds.length === 0);
  const levelWins = allPredictorsValid
    ? perLevel.filter(({ brier: scores }) => (
      scores.joint < Math.min(scores.halfScoreMove, scores.meanBeamGreedRatio)
    )).length
    : null;
  const outcomesByLevel = levels.map((level) => {
    const levelCells = cells.filter((cell) => cell.level === level);
    return {
      level,
      outcomes: countBy(levelCells.map(({ outcome }) => outcome)),
      mixed: new Set(levelCells.map(({ outcome }) => outcome)).size === 2,
    };
  });
  const wins = cells.filter(({ outcome }) => outcome === 'win').length;

  return {
    cells: cells.length,
    levels: levels.length,
    observations: rows.length,
    k: effectiveK,
    brier: overall,
    gains: allPredictorsValid ? {
      jointVsBaseRate: overall.baseRate - overall.joint,
      jointVsBestSingle: Math.min(overall.halfScoreMove, overall.meanBeamGreedRatio) - overall.joint,
    } : null,
    jointLevelWins: levelWins,
    invalidFolds,
    outcomeSupport: {
      wins,
      losses: cells.length - wins,
      winFraction: wins / cells.length,
      mixedLevels: outcomesByLevel.filter(({ mixed }) => mixed).length,
      byLevel: outcomesByLevel,
    },
    descriptorRanges: {
      halfScoreMove: [
        Math.min(...rows.map((row) => row.halfScoreMove)),
        Math.max(...rows.map((row) => row.halfScoreMove)),
      ],
      meanBeamGreedRatio: [
        Math.min(...rows.map((row) => row.meanBeamGreedRatio)),
        Math.max(...rows.map((row) => row.meanBeamGreedRatio)),
      ],
    },
    perLevel,
    perPolicy: groupedMeans(rows, 'subjectId'),
    levelMeans: groupedMeans(rows, 'level'),
    terminalReasons: countBy(cells.map(({ reason }) => reason)),
  };
}

function analyzeArtifact(artifact, kind) {
  validateArtifact(artifact);
  assert(['controls', 'confirmation'].includes(kind), 'analysis kind must be controls or confirmation');
  assert(artifact.kind === kind, `artifact kind ${artifact.kind} does not match ${kind}`);
  const body = {
    schemaVersion: 1,
    result: RESULT,
    kind: `${kind}-analysis`,
    inputArtifactIdentity: artifact.artifactIdentity,
    protocolCommit: artifact.registration.protocolCommit,
    analyzerIdentity: fileIdentity(__filename),
    metrics: kind === 'controls'
      ? factorMetrics(artifact.cells)
      : predictionMetrics(artifact.cells),
  };
  return { ...body, analysisIdentity: objectIdentity(body) };
}

function flag(argv, name) {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? null : argv[index + 1];
}

function main(argv = process.argv.slice(2)) {
  const kind = argv[0];
  const input = flag(argv, 'artifact');
  const output = flag(argv, 'out');
  if (!['controls', 'confirmation'].includes(kind) || !input || !output) {
    throw new Error('usage: analyze.js controls|confirmation --artifact <path> --out <path>');
  }
  const analysis = analyzeArtifact(readArtifact(path.resolve(input)), kind);
  writeNew(path.resolve(output), analysis);
  console.log(`WROTE ${analysis.kind} ${analysis.analysisIdentity}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  analyzeArtifact,
  factorMetrics,
  predictionMetrics,
};
