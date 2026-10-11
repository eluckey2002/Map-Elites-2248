const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { audit, auditParameters, auditShapeBinding } = require('../../experiments/RESULT-0084/audit');

const ARCHIVE = path.join(__dirname, '..', '..', 'experiments', 'RESULT-0084', 'output', 'archive.json');
const artifact = JSON.parse(fs.readFileSync(ARCHIVE, 'utf8'));

test('the committed RESULT-0084 artifact passes the post-run audit', () => {
  assert.equal(audit(artifact).verdict, 'PASS');
});

test('a run with parameters other than the registered command is refused', () => {
  for (const [key, value] of [['sampledShapes', 60], ['fullyEvaluatedLimit', 30], ['samplerSeed', 1], ['descriptorSeeds', [71000000, 71000001]]]) {
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
