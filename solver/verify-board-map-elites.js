#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const { makeRng } = require('./engine');
const { sampleShape, shapeSignature, screen, screenVerdict } = require('./generate-levels');
const { verifyCandidate } = require('./level-author');
const { initialPuzzle, replayLandmarkRoute } = require('./landmark-frontier');
const { verifyWitness } = require('./oracle/verify');
const { addedIn, parseFrontmatter, showAtCommit } = require('../tools/verify-experiments');
const {
  BREADTH_BINS,
  CELL_CAPACITY,
  GRID_SIZE,
  HARVEST_BINS,
  SOURCE_PATHS,
  boardIdentity,
  buildArchive,
  canonicalJson,
  identity,
  pairedHarvestAdvantage,
  renderMapHtml,
  summarizeBreadth,
} = require('./board-map-elites-core');

const ROOT = path.resolve(__dirname, '..');

function fileHash(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function verifyArtifactIdentity(artifact) {
  const { artifactIdentity, ...body } = artifact;
  assert.equal(identity(body), artifactIdentity, 'artifact identity mismatch');
}

function verifyRegistration(artifact) {
  const registration = artifact.registration;
  assert.ok(registration && registration.exploratory === false, 'artifact is not registered reportable evidence');
  assert.match(registration.protocol || '', /^RESULT-\d+$/, 'invalid protocol id');
  const relative = `experiments/${registration.protocol}/protocol.md`;
  const commit = addedIn(relative, ROOT);
  assert.ok(commit, 'protocol has no registration commit');
  assert.equal(registration.protocolCommit, commit, 'protocol commit mismatch');
  execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
  const protocol = parseFrontmatter(showAtCommit(commit, relative, ROOT));
  assert.ok(protocol?.version_freeze, 'registered protocol has no version freeze');
  return protocol.version_freeze;
}

function verifySourceClosure(artifact, frozen) {
  assert.deepEqual(Object.keys(artifact.sources).sort(), [...SOURCE_PATHS].sort(), 'source identity closure mismatch');
  for (const relative of SOURCE_PATHS) {
    const current = fileHash(relative);
    assert.equal(artifact.sources[relative], current, `source changed: ${relative}`);
    assert.equal(typeof frozen[relative], 'string', `protocol did not freeze ${relative}`);
    assert.ok(current.startsWith(frozen[relative]), `source is not covered by protocol freeze: ${relative}`);
  }
}

function verifyConfig(config) {
  assert.equal(config.gridSize, GRID_SIZE);
  assert.equal(config.cellCapacity, CELL_CAPACITY);
  assert.deepEqual(config.axes, { breadth: BREADTH_BINS, harvest: HARVEST_BINS });
  assert.equal(config.landmark, 2048);
  assert.equal(config.objective, 'first target crossing for both paired policies');
  assert.equal(config.descriptorSeeds.length, new Set(config.descriptorSeeds).size, 'duplicate descriptor seeds');
  assert.ok(config.descriptorSeeds.every(Number.isSafeInteger), 'descriptor seeds must be integers');
}

function verifyScreenPanel(artifact) {
  const rng = makeRng(artifact.config.samplerSeed);
  const expected = [];
  const seen = new Set();
  for (let index = 0; index < artifact.config.sampledShapes; index++) {
    const shape = sampleShape(rng, artifact.config.level, index);
    const signature = shapeSignature(shape);
    if (seen.has(signature)) continue;
    seen.add(signature);
    const result = screen(shape);
    expected.push({ shape, screen: result, rejection: screenVerdict(result) });
  }
  assert.equal(canonicalJson(artifact.screened), canonicalJson(expected), 'screened shape panel mismatch');
  const selected = expected.filter(({ rejection }) => !rejection)
    .slice(0, artifact.config.fullyEvaluatedLimit)
    .map(({ shape }) => shapeSignature(shape));
  assert.deepEqual(artifact.evaluations.map(({ shape }) => shapeSignature(shape)), selected, 'evaluated shape panel mismatch');
}

function verifyBreadth(evaluation, config) {
  const breadth = evaluation.descriptors?.breadth;
  assert.ok(breadth, 'missing breadth evidence');
  assert.deepEqual(breadth.rows.map(({ seed }) => seed), config.descriptorSeeds, 'breadth seed panel mismatch');
  for (const row of breadth.rows) {
    const puzzle = initialPuzzle(evaluation.candidate, row.seed);
    assert.equal(row.routes.length, row.distinctOutcomeCountLowerBound, 'breadth route count mismatch');
    assert.equal(new Set(row.routes.map(({ outcomeIdentity }) => outcomeIdentity)).size, row.routes.length, 'duplicate breadth outcome');
    for (const route of row.routes) replayLandmarkRoute({ ...puzzle, landmark: config.landmark }, route);
    assert.equal(row.standing, row.routes.length ? 'replayed_lower_bound' : 'UNKNOWN');
  }
  const recomputed = summarizeBreadth(breadth.rows);
  assert.equal(canonicalJson({ standing: breadth.standing, value: breadth.value, bin: breadth.bin }),
    canonicalJson({ standing: recomputed.standing, value: recomputed.value, bin: recomputed.bin }),
    'breadth summary mismatch');
}

function verifyHarvest(evaluation, config) {
  const harvest = evaluation.descriptors?.harvest;
  assert.ok(harvest, 'missing harvest evidence');
  const expected = config.descriptorSeeds.flatMap((seed) => [`${seed}/immediate`, `${seed}/harvest`]);
  assert.deepEqual(harvest.rows.map(({ seed, policy }) => `${seed}/${policy}`), expected, 'harvest pairing matrix mismatch');
  for (const row of harvest.rows) {
    assert.notEqual(row.terminationReason, 'time-budget', 'harvest row hit emergency time budget');
    assert.ok(row.expandedStates <= config.oracleMaxExpandedStates, 'harvest work cap exceeded');
    assert.equal(row.standing, row.witness ? 'replayed_win' : 'UNKNOWN');
    assert.equal(row.moves, row.witness?.movesUsed ?? null);
    if (row.witness) verifyWitness({ level: evaluation.candidate, seed: row.seed }, row.witness);
  }
  const recomputed = pairedHarvestAdvantage(harvest.rows, evaluation.candidate.moves);
  assert.equal(canonicalJson({ standing: harvest.standing, value: harvest.value, pairs: harvest.pairs, bin: harvest.bin }),
    canonicalJson({ standing: recomputed.standing, value: recomputed.value, pairs: recomputed.pairs, bin: recomputed.bin }),
    'harvest summary mismatch');
}

function verifyEvaluation(evaluation, config) {
  assert.equal(evaluation.boardIdentity, boardIdentity(evaluation.candidate), 'board identity mismatch');
  let verified;
  try {
    verified = verifyCandidate({ schemaVersion: 1, candidates: [evaluation.candidate] }, evaluation.receipt);
  } catch (error) {
    assert.equal(evaluation.eligible, false, 'eligible board failed the authoring verifier');
    assert.equal(evaluation.exclusion, `authoring verifier: ${error.message}`, 'authoring exclusion mismatch');
    return;
  }
  if (!evaluation.eligible) return;
  assert.equal(evaluation.exclusion, null);
  assert.equal(evaluation.quality.winRate, verified.winRate, 'quality win rate mismatch');
  assert.equal(evaluation.quality.bombRate, verified.bombRate, 'quality bomb rate mismatch');
  verifyBreadth(evaluation, config);
  verifyHarvest(evaluation, config);
}

function verifyArchive(artifact) {
  const expected = buildArchive(artifact.evaluations);
  assert.equal(canonicalJson(artifact.archive), canonicalJson(expected), 'archive selection mismatch');
  assert.ok(artifact.archive.every(({ elites }) => elites.length <= CELL_CAPACITY), 'cell has a fourth elite');
  const ids = artifact.archive.flatMap(({ elites }) => elites.map(({ boardIdentity: id }) => id));
  assert.equal(ids.length, new Set(ids).size, 'duplicate elite board');
}

function verifySummary(artifact) {
  const occupiedBreadthBins = new Set(artifact.archive.map(({ cell }) => cell.split(',')[0])).size;
  const occupiedHarvestBins = new Set(artifact.archive.map(({ cell }) => cell.split(',')[1])).size;
  const expected = {
    screened: artifact.screened.length,
    screenSurvivors: artifact.screened.filter(({ rejection }) => !rejection).length,
    evaluated: artifact.evaluations.length,
    eligible: artifact.evaluations.filter(({ eligible }) => eligible).length,
    occupiedCells: artifact.archive.length,
    occupiedBreadthBins,
    occupiedHarvestBins,
    premise: artifact.archive.length >= 4 && occupiedBreadthBins >= 2 && occupiedHarvestBins >= 2
      ? 'SUPPORTED_AT_BOUNDED_SCOPE' : 'DISCONFIRMED_AT_BOUNDED_SCOPE',
  };
  assert.deepEqual(artifact.summary, expected, 'summary mismatch');
}

function verifyArtifact(artifact, { verifyRegistrationFn = verifyRegistration, verifySources = true } = {}) {
  verifyArtifactIdentity(artifact);
  const frozen = verifyRegistrationFn(artifact);
  if (verifySources) verifySourceClosure(artifact, frozen);
  assert.equal(artifact.schemaVersion, 1);
  assert.equal(artifact.kind, 'board-map-elites');
  verifyConfig(artifact.config);
  verifyScreenPanel(artifact);
  artifact.evaluations.forEach((evaluation) => verifyEvaluation(evaluation, artifact.config));
  verifyArchive(artifact);
  verifySummary(artifact);
  return { verdict: 'PASS', artifactIdentity: artifact.artifactIdentity, ...artifact.summary };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 2) throw new Error('usage: verify-board-map-elites.js <archive.json> <map.html>');
  const artifactPath = path.resolve(ROOT, argv[0]);
  const mapPath = path.resolve(ROOT, argv[1]);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const result = verifyArtifact(artifact);
  assert.equal(fs.readFileSync(mapPath, 'utf8'), renderMapHtml(artifact), 'rendered map mismatch');
  process.stdout.write(`PASS ${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; }
}

module.exports = {
  verifyArchive,
  verifyArtifact,
  verifyArtifactIdentity,
  verifyBreadth,
  verifyConfig,
  verifyEvaluation,
  verifyHarvest,
  verifyRegistration,
  verifyScreenPanel,
  verifySourceClosure,
  verifySummary,
};
