const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit, auditExclusions, auditParameters, auditRouteBounds, auditShapeBinding } = require('../../experiments/RESULT-0084/audit');

const ARCHIVE = path.join(__dirname, '..', '..', 'experiments', 'RESULT-0084', 'output', 'archive.json');
const artifact = JSON.parse(fs.readFileSync(ARCHIVE, 'utf8'));

test('the committed RESULT-0084 artifact passes the post-run audit', () => {
  assert.equal(audit(artifact).verdict, 'PASS');
});

test('a run with parameters other than the registered command is refused', () => {
  for (const [key, value] of [['landmarkOptions', { ...artifact.config.landmarkOptions, maxMoves: 2 }], ['sampledShapes', 60], ['fullyEvaluatedLimit', 30], ['samplerSeed', 1], ['descriptorSeeds', [71000000, 71000001]]]) {
    const changed = structuredClone({ registration: artifact.registration, config: artifact.config });
    changed.config[key] = value;
    assert.throws(() => auditParameters(changed), new RegExp(`run parameter ${key}`));
  }
  const restamped = { registration: { ...artifact.registration, protocolCommit: 'f'.repeat(40) }, config: artifact.config };
  assert.throws(() => auditParameters(restamped), /different registration commit/);
});

test('an evaluation carrying another board beside its sampled shape is refused', () => {
  const swapped = structuredClone({ evaluations: artifact.evaluations.slice(0, 2) });
  [swapped.evaluations[0].candidate, swapped.evaluations[1].candidate] = [swapped.evaluations[1].candidate, swapped.evaluations[0].candidate];
  [swapped.evaluations[0].receipt, swapped.evaluations[1].receipt] = [swapped.evaluations[1].receipt, swapped.evaluations[0].receipt];
  assert.throws(() => auditShapeBinding(swapped), /not authored from its shape/);
});

test('a breadth route longer than the registered one-move bound is refused', () => {
  const index = artifact.evaluations.findIndex((e) => e.eligible && e.descriptors.breadth.rows.some((r) => r.routes.length));
  const changed = structuredClone({ evaluations: [artifact.evaluations[index]] });
  const route = changed.evaluations[0].descriptors.breadth.rows.find((r) => r.routes.length).routes[0];
  route.chains.push(route.chains[0]);
  route.moves = route.chains.length;
  assert.throws(() => auditRouteBounds(changed), /exceeds the registered 1-move bound/);
  route.moves = 1;
  assert.throws(() => auditRouteBounds(changed), /move count differs/);
});

test('a board marked ineligible that passes the authoring verifier is refused', () => {
  const eligible = structuredClone(artifact.evaluations.find((e) => e.eligible));
  Object.assign(eligible, { eligible: false, exclusion: 'authoring verifier: invented', quality: null, descriptors: null });
  assert.throws(() => auditExclusions({ evaluations: [eligible] }), /excluded but passes the authoring verifier/);
  const excluded = structuredClone(artifact.evaluations.find((e) => !e.eligible));
  excluded.exclusion = 'authoring verifier: some other reason';
  assert.throws(() => auditExclusions({ evaluations: [excluded] }), /exclusion reason differs/);
});
