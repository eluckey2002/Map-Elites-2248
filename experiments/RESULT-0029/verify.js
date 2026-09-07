#!/usr/bin/env node

const fs = require('node:fs');

const { LEVELS } = require('../../src/game');

const {
  RESULT,
  SUBJECTS,
  canonicalJson,
  objectIdentity,
  sourceHashes,
  summarizeEpisode,
} = require('./run');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameValue(actual, expected, label) {
  assert(Math.abs(actual - expected) <= 1e-12, `${label} mismatch: ${actual} != ${expected}`);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeSubjectDescriptors(cells) {
  const bySubject = new Map(SUBJECTS.map(({ id }) => [id, []]));
  for (const cell of cells) {
    assert(bySubject.has(cell.subjectId), `analysis cell has unknown subject ${cell.subjectId}`);
    assert(Number.isFinite(cell.halfScoreMove), 'analysis cell has invalid half-score move');
    assert(Number.isFinite(cell.meanBeamGreedRatio), 'analysis cell has invalid beam greed ratio');
    bySubject.get(cell.subjectId).push(cell);
  }
  return SUBJECTS.map((subject) => {
    const rows = bySubject.get(subject.id);
    assert(rows.length > 0, `analysis has no cells for subject ${subject.id}`);
    return {
      ...subject,
      halfScoreMove: mean(rows.map((cell) => cell.halfScoreMove)),
      meanBeamGreedRatio: mean(rows.map((cell) => cell.meanBeamGreedRatio)),
    };
  });
}

function conditionalSpans(rows, fixedField, fixedValues, orderedField, orderedValues, descriptor) {
  return fixedValues.map((fixedValue) => {
    const values = orderedValues.map((orderedValue) => {
      const row = rows.find((candidate) => (
        candidate[fixedField] === fixedValue && candidate[orderedField] === orderedValue
      ));
      assert(row, `missing factorial policy ${fixedField}=${fixedValue} ${orderedField}=${orderedValue}`);
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

function factorDiagnostics(cells) {
  assert(Array.isArray(cells) && cells.length > 0, 'factor diagnostics require cells');
  const rows = summarizeSubjectDescriptors(cells);
  const greedSlices = conditionalSpans(
    rows,
    'timingSlope',
    [...new Set(SUBJECTS.map(({ timingSlope }) => timingSlope))],
    'greedCenter',
    [...new Set(SUBJECTS.map(({ greedCenter }) => greedCenter))],
    'meanBeamGreedRatio',
  );
  const timingSlices = conditionalSpans(
    rows,
    'greedCenter',
    [...new Set(SUBJECTS.map(({ greedCenter }) => greedCenter))],
    'timingSlope',
    [...new Set(SUBJECTS.map(({ timingSlope }) => timingSlope))],
    'halfScoreMove',
  );
  const outcomes = { win: 0, lose: 0 };
  for (const cell of cells) {
    assert(Object.hasOwn(outcomes, cell.outcome), `analysis cell has invalid outcome ${cell.outcome}`);
    outcomes[cell.outcome] += 1;
  }
  const summarizeSlices = (slices) => ({
    totalSlices: slices.length,
    monotonicSlices: slices.filter(({ monotonic }) => monotonic).length,
    minimumSpan: Math.min(...slices.map(({ span }) => span)),
    slices,
  });
  return {
    policies: SUBJECTS.length,
    outcomes,
    greed: summarizeSlices(greedSlices),
    timing: summarizeSlices(timingSlices),
    subjectMeans: rows,
  };
}

function aggregateSubjectLevels(cells) {
  assert(Array.isArray(cells) && cells.length > 0, 'prediction analysis requires cells');
  const subjectOrder = new Map(SUBJECTS.map(({ id }, index) => [id, index]));
  const groups = new Map();
  for (const cell of cells) {
    assert(subjectOrder.has(cell.subjectId), `analysis cell has unknown subject ${cell.subjectId}`);
    assert(Number.isSafeInteger(cell.level), 'analysis cell has invalid level');
    assert(Number.isFinite(cell.halfScoreMove), 'analysis cell has invalid half-score move');
    assert(Number.isFinite(cell.meanBeamGreedRatio), 'analysis cell has invalid beam greed ratio');
    assert(['win', 'lose'].includes(cell.outcome), `analysis cell has invalid outcome ${cell.outcome}`);
    const key = `${cell.level}:${cell.subjectId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(cell);
  }
  const levels = [...new Set(cells.map(({ level }) => level))].sort((a, b) => a - b);
  assert(levels.length >= 3, 'leave-one-level-out analysis requires at least three levels');
  assert(groups.size === levels.length * SUBJECTS.length, 'prediction analysis lacks full level/policy coverage');
  const rows = [...groups.entries()].map(([key, group]) => ({
    key,
    level: group[0].level,
    subjectId: group[0].subjectId,
    halfScoreMove: mean(group.map((cell) => cell.halfScoreMove)),
    meanBeamGreedRatio: mean(group.map((cell) => cell.meanBeamGreedRatio)),
    winRate: mean(group.map((cell) => (cell.outcome === 'win' ? 1 : 0))),
  }));
  rows.sort((a, b) => a.level - b.level || subjectOrder.get(a.subjectId) - subjectOrder.get(b.subjectId));
  return { levels, rows };
}

function knnPredictions(train, test, features, k) {
  const centers = Object.fromEntries(features.map((feature) => [
    feature,
    mean(train.map((row) => row[feature])),
  ]));
  const scales = Object.fromEntries(features.map((feature) => {
    const variance = mean(train.map((row) => (row[feature] - centers[feature]) ** 2));
    return [feature, Math.sqrt(variance) || 1];
  }));
  return test.map((row) => {
    const neighbors = train.map((candidate) => ({
      key: candidate.key,
      winRate: candidate.winRate,
      distance: features.reduce((sum, feature) => (
        sum + (((row[feature] - candidate[feature]) / scales[feature]) ** 2)
      ), 0),
    })).sort((a, b) => a.distance - b.distance || a.key.localeCompare(b.key));
    return mean(neighbors.slice(0, k).map(({ winRate }) => winRate));
  });
}

function brierScore(rows, predictions) {
  return mean(rows.map((row, index) => (predictions[index] - row.winRate) ** 2));
}

function leaveOneLevelOutBrier(cells, requestedK = 5) {
  const { levels, rows } = aggregateSubjectLevels(cells);
  assert(Number.isSafeInteger(requestedK) && requestedK > 0, 'k must be a positive integer');
  const scores = {
    baseRate: [],
    halfScoreMove: [],
    meanBeamGreedRatio: [],
    joint: [],
  };
  const perLevel = [];
  let effectiveK = null;
  for (const level of levels) {
    const train = rows.filter((row) => row.level !== level);
    const test = rows.filter((row) => row.level === level);
    const k = Math.min(requestedK, train.length);
    effectiveK = effectiveK === null ? k : Math.min(effectiveK, k);
    const predictions = {
      baseRate: test.map(() => mean(train.map(({ winRate }) => winRate))),
      halfScoreMove: knnPredictions(train, test, ['halfScoreMove'], k),
      meanBeamGreedRatio: knnPredictions(train, test, ['meanBeamGreedRatio'], k),
      joint: knnPredictions(train, test, ['halfScoreMove', 'meanBeamGreedRatio'], k),
    };
    const levelScores = Object.fromEntries(Object.entries(predictions).map(([name, values]) => [
      name,
      brierScore(test, values),
    ]));
    for (const name of Object.keys(scores)) scores[name].push(levelScores[name]);
    perLevel.push({ level, brier: levelScores });
  }
  const brier = Object.fromEntries(Object.entries(scores).map(([name, values]) => [name, mean(values)]));
  return {
    levels: levels.length,
    observations: rows.length,
    k: effectiveK,
    brier,
    improvement: {
      jointVsBaseRate: brier.baseRate - brier.joint,
      jointVsBestSingle: Math.min(brier.halfScoreMove, brier.meanBeamGreedRatio) - brier.joint,
    },
    perLevel,
  };
}

function validateRegistration(artifact) {
  if (artifact.kind === 'fixture') {
    assert(artifact.registration?.exploratory === true, 'fixture must be explicitly exploratory');
    return;
  }
  assert(artifact.registration?.exploratory === false, 'reportable artifact must not be exploratory');
  assert(artifact.registration.protocol === RESULT, `registration protocol must be ${RESULT}`);
  assert(/^[a-f0-9]{40}$/.test(artifact.registration.protocolCommit || ''), 'registration commit must be a full SHA');
}

function validateArtifact(artifact) {
  assert(artifact && typeof artifact === 'object' && !Array.isArray(artifact), 'artifact must be an object');
  const { artifactIdentity, registration, ...body } = artifact;
  assert(/^[a-f0-9]{64}$/.test(artifactIdentity || ''), 'artifact identity is missing or malformed');
  assert(objectIdentity(body) === artifactIdentity, 'artifact identity mismatch');
  assert(artifact.schemaVersion === 1, 'schemaVersion must be 1');
  assert(artifact.result === RESULT, `result must be ${RESULT}`);
  assert(['fixture', 'controls', 'confirmation'].includes(artifact.kind), 'artifact kind is invalid');
  validateRegistration({ ...artifact, registration });

  assert(canonicalJson(artifact.sources) === canonicalJson(sourceHashes()), 'source identity mismatch');
  assert(canonicalJson(artifact.subjects) === canonicalJson(SUBJECTS), 'policy factorial mismatch');
  assert(Array.isArray(artifact.levels) && artifact.levels.length > 0, 'levels must be non-empty');
  assert(Array.isArray(artifact.seeds) && artifact.seeds.length > 0, 'seeds must be non-empty');
  assert(new Set(artifact.levels).size === artifact.levels.length, 'levels contain duplicates');
  assert(new Set(artifact.seeds).size === artifact.seeds.length, 'seeds contain duplicates');
  assert(artifact.levels.every((level) => Number.isSafeInteger(level) && level >= 0), 'levels are invalid');
  assert(artifact.seeds.every((seed) => Number.isSafeInteger(seed) && seed >= 0), 'seeds are invalid');
  if (artifact.kind !== 'fixture') {
    const shippedLevels = new Set(LEVELS.map(({ level }) => level));
    assert(artifact.levels.every((level) => shippedLevels.has(level)), 'reportable artifact contains an unknown shipped level');
  }
  assert(Array.isArray(artifact.cells), 'cells must be an array');

  const expectedCount = SUBJECTS.length * artifact.levels.length * artifact.seeds.length;
  assert(artifact.cells.length === expectedCount, `cell coverage ${artifact.cells.length} != ${expectedCount}`);
  const seen = new Set();
  for (const cell of artifact.cells) {
    const key = `${cell.subjectId}:${cell.level}:${cell.seed}`;
    assert(!seen.has(key), `duplicate cell ${key}`);
    seen.add(key);
    assert(SUBJECTS.some(({ id }) => id === cell.subjectId), `${key}: unknown subject`);
    assert(artifact.levels.includes(cell.level), `${key}: undeclared level`);
    assert(artifact.seeds.includes(cell.seed), `${key}: undeclared seed`);
    assert(['win', 'lose'].includes(cell.outcome), `${key}: invalid outcome`);
    assert(['target reached', 'out of moves', 'no valid moves', 'bomb exploded'].includes(cell.reason), `${key}: invalid reason`);
    assert(Number.isFinite(cell.score) && cell.score >= 0, `${key}: invalid score`);
    assert(Number.isSafeInteger(cell.moves) && cell.moves >= 0, `${key}: invalid moves`);
    assert(Number.isSafeInteger(cell.moveBudget) && cell.moveBudget >= cell.moves && cell.moveBudget > 0, `${key}: invalid move budget`);
    assert(Array.isArray(cell.moveTrace) && cell.moveTrace.length === cell.moves, `${key}: move trace coverage mismatch`);
    for (const move of cell.moveTrace) {
      assert(Number.isFinite(move.points) && move.points >= 0, `${key}: invalid move points`);
      assert(Number.isFinite(move.beamMaxPoints) && move.beamMaxPoints >= move.points && move.beamMaxPoints > 0, `${key}: invalid beam maximum`);
      assert(Number.isFinite(move.beamGreedRatio) && move.beamGreedRatio >= 0 && move.beamGreedRatio <= 1, `${key}: invalid beam greed ratio`);
      assert(Number.isFinite(move.targetGreed) && move.targetGreed >= 0.05 && move.targetGreed <= 1, `${key}: invalid greed target`);
      sameValue(move.beamGreedRatio, move.points / move.beamMaxPoints, `${key}: beam greed ratio`);
    }
    const summary = summarizeEpisode(cell.moveTrace, cell.moveBudget);
    assert(summary.finalScore === cell.score, `${key}: score does not match trace`);
    sameValue(cell.halfScoreMove, summary.halfScoreMove, `${key}: half-score move`);
    sameValue(cell.meanBeamGreedRatio, summary.meanBeamGreedRatio, `${key}: mean beam greed ratio`);
    assert(cell.outcome !== 'win' || cell.reason === 'target reached', `${key}: win reason mismatch`);
  }

  for (const subject of SUBJECTS) {
    for (const level of artifact.levels) {
      for (const seed of artifact.seeds) {
        assert(seen.has(`${subject.id}:${level}:${seed}`), `missing cell ${subject.id}:${level}:${seed}`);
      }
    }
  }
  return {
    artifactIdentity,
    cells: artifact.cells.length,
    subjects: SUBJECTS.length,
    levels: artifact.levels.length,
    seeds: artifact.seeds.length,
  };
}

function readArtifact(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function analyzeArtifact(artifact) {
  const verification = validateArtifact(artifact);
  return {
    verification,
    analysis: {
      factor: factorDiagnostics(artifact.cells),
      prediction: leaveOneLevelOutBrier(artifact.cells),
    },
  };
}

function main(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--artifact');
  const file = index === -1 ? null : argv[index + 1];
  if (!file) throw new Error('usage: verify.js --artifact <path>');
  const artifact = readArtifact(file);
  if (argv.includes('--analysis')) {
    console.log(JSON.stringify(analyzeArtifact(artifact), null, 2));
    return;
  }
  const result = validateArtifact(artifact);
  console.log(`PASS ${result.artifactIdentity} ${result.cells} cells`);
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
  factorDiagnostics,
  leaveOneLevelOutBrier,
  readArtifact,
  validateArtifact,
};
