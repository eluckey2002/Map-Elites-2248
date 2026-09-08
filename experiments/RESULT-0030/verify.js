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
    assert((cell.outcome === 'win') === (cell.reason === 'target reached'), `${key}: outcome/reason mismatch`);
    assert(cell.reason !== 'out of moves' || cell.moves === cell.moveBudget, `${key}: out-of-moves count mismatch`);
    assert(cell.reason !== 'no valid moves' || cell.moves < cell.moveBudget, `${key}: no-valid-moves count mismatch`);
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

function main(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--artifact');
  const file = index === -1 ? null : argv[index + 1];
  if (!file) throw new Error('usage: verify.js --artifact <path>');
  const result = validateArtifact(readArtifact(file));
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
  readArtifact,
  validateArtifact,
};
