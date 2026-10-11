#!/usr/bin/env node
// Post-run audit for RESULT-0084, added after Codex review on PR #72.
//
// solver/verify-board-map-elites.js is frozen into this result, so it cannot
// be edited without breaking the result's own source closure. This audit adds
// the two checks it lacks, against the same artifact:
//   1. the artifact's run parameters are exactly the registered command's;
//   2. every evaluated candidate was authored from the shape it sits beside.
//
//   node experiments/RESULT-0084/audit.js [archive.json]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { identity } = require('../../solver/level-author');

const ROOT = path.resolve(__dirname, '..', '..');
const PROTOCOL = 'experiments/RESULT-0084/protocol.md';
const REGISTRATION_COMMIT = '9abcd88fa37cc6939e3b4f5a59be7bee34b720f8';
const REGISTERED_COMMAND = 'node solver/board-map-elites.js --protocol RESULT-0084 --out experiments/RESULT-0084/output --count 48 --full 24 --sampler-seed 20261011 --level 56 --descriptor-seed-start 71000000 --descriptor-seeds 3';
const REGISTERED = Object.freeze({
  sampledShapes: 48,
  fullyEvaluatedLimit: 24,
  samplerSeed: 20261011,
  level: 56,
  descriptorSeeds: [71000000, 71000001, 71000002],
  oracleMaxExpandedStates: 600,
  oracleBudgetMs: 30000,
});

function registeredProtocolText() {
  return execFileSync('git', ['show', `${REGISTRATION_COMMIT}:${PROTOCOL}`], { cwd: ROOT, encoding: 'utf8' });
}

function auditParameters(artifact, protocolText = registeredProtocolText()) {
  assert.ok(protocolText.includes(REGISTERED_COMMAND), 'registered protocol does not contain the audited command');
  assert.equal(artifact.registration?.protocol, 'RESULT-0084', 'artifact is not stamped RESULT-0084');
  assert.equal(artifact.registration?.protocolCommit, REGISTRATION_COMMIT, 'artifact names a different registration commit');
  for (const [key, expected] of Object.entries(REGISTERED)) {
    assert.deepEqual(artifact.config[key], expected, `run parameter ${key} differs from the registered command`);
  }
}

function auditShapeBinding(artifact) {
  for (const [index, evaluation] of artifact.evaluations.entries()) {
    const expected = identity(evaluation.shape);
    assert.equal(evaluation.candidate.sourceShapeIdentity, expected, `evaluation ${index} candidate was not authored from its shape`);
    assert.equal(evaluation.receipt.shapeIdentity, expected, `evaluation ${index} receipt names a different shape`);
    assert.equal(evaluation.candidate.name, evaluation.shape.name, `evaluation ${index} candidate name differs from its shape`);
  }
}

function audit(artifact, options = {}) {
  auditParameters(artifact, options.protocolText);
  auditShapeBinding(artifact);
  return { verdict: 'PASS', artifactIdentity: artifact.artifactIdentity, evaluations: artifact.evaluations.length };
}

if (require.main === module) {
  try {
    const file = path.resolve(ROOT, process.argv[2] || 'experiments/RESULT-0084/output/archive.json');
    process.stdout.write(`${JSON.stringify(audit(JSON.parse(fs.readFileSync(file, 'utf8'))))}\n`);
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { REGISTERED, REGISTERED_COMMAND, audit, auditParameters, auditShapeBinding };
