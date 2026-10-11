const { before, test } = require('node:test');
const assert = require('node:assert/strict');

const { buildRun } = require('../board-map-elites');
const {
  verifyArchive,
  verifyArtifact,
  verifyArtifactIdentity,
  verifyBreadth,
  verifyEvaluation,
  verifyHarvest,
  verifySourceClosure,
} = require('../verify-board-map-elites');

let artifact;

before(() => {
  artifact = buildRun({
    count: 6,
    full: 2,
    samplerSeed: 20260917,
    level: 56,
    descriptorSeeds: [41500000],
  }, { exploratory: true });
});

test('the independent verifier accepts a real exploratory artifact through every production seam', () => {
  const result = verifyArtifact(artifact, {
    verifyRegistrationFn: () => ({}),
    verifySources: false,
  });
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.evaluated, 2);
});

test('a forged artifact or board identity is rejected', () => {
  const forgedArtifact = structuredClone(artifact);
  forgedArtifact.summary.eligible += 1;
  assert.throws(() => verifyArtifactIdentity(forgedArtifact), /artifact identity mismatch/);

  const forgedBoard = structuredClone(artifact.evaluations[0]);
  forgedBoard.boardIdentity = 'f'.repeat(64);
  assert.throws(() => verifyEvaluation(forgedBoard, artifact.config), /board identity mismatch/);
});

test('the provenance stamp rides outside artifact identity', () => {
  const restamped = structuredClone(artifact);
  restamped.registration = {
    exploratory: false,
    protocol: 'RESULT-9999',
    protocolCommit: 'f'.repeat(40),
  };
  assert.doesNotThrow(() => verifyArtifactIdentity(restamped));
});

test('the verifier accepts an exhausted empty breadth row as exact zero', () => {
  const evaluation = structuredClone(artifact.evaluations.find(({ eligible }) => eligible));
  evaluation.descriptors.breadth = {
    standing: 'exact_result',
    value: 0,
    aggregation: 'median distinct verified outcome lower bound across the fixed seed panel',
    bin: artifact.config.axes.breadth[0],
    landmark: artifact.config.landmark,
    rows: [{
      seed: artifact.config.descriptorSeeds[0],
      standing: 'exact_result',
      complete: true,
      distinctOutcomeCountLowerBound: 0,
      routes: [],
      diagnostics: {},
    }],
  };
  assert.doesNotThrow(() => verifyBreadth(evaluation, artifact.config));
});

test('an illegal landmark route is rejected by replay', () => {
  const evaluation = structuredClone(artifact.evaluations.find(({ descriptors }) => (
    descriptors?.breadth?.rows.some(({ routes }) => routes.length > 0)
  )));
  assert.ok(evaluation, 'development panel needs one found landmark route');
  const row = evaluation.descriptors.breadth.rows.find(({ routes }) => routes.length > 0);
  row.routes[0].chains[0][0].x = 99;
  assert.throws(() => verifyBreadth(evaluation, artifact.config), /unavailable tile/);
});

test('a wrong cell, fourth elite, or duplicate elite is rejected', () => {
  const wrongCell = structuredClone(artifact);
  wrongCell.archive[0].cell = '6,6';
  assert.throws(() => verifyArchive(wrongCell), /archive selection mismatch/);

  const fourth = structuredClone(artifact);
  fourth.archive[0].elites.push(structuredClone(fourth.archive[0].elites[0]));
  assert.throws(() => verifyArchive(fourth), /archive selection mismatch|fourth elite/);

  const duplicate = structuredClone(artifact);
  duplicate.archive.push(structuredClone(duplicate.archive[0]));
  assert.throws(() => verifyArchive(duplicate), /archive selection mismatch|duplicate elite/);
});

test('an unpaired harvesting comparison is rejected before interpretation', () => {
  const evaluation = structuredClone(artifact.evaluations[0]);
  evaluation.descriptors.harvest.rows.pop();
  assert.throws(() => verifyHarvest(evaluation, artifact.config), /pairing matrix mismatch/);
});

test('a changed source identity is rejected against current bytes and the frozen prefix', () => {
  const changed = structuredClone(artifact);
  const [first] = Object.keys(changed.sources);
  changed.sources[first] = '0'.repeat(64);
  const frozen = Object.fromEntries(Object.entries(artifact.sources).map(([file, hash]) => [file, hash.slice(0, 16)]));
  assert.throws(() => verifySourceClosure(changed, frozen), /source changed/);
});
