#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '../..');
const {
  canonicalJson,
  EXECUTION_PATH,
  identity,
  sourceIdentities,
  verifyArtifact,
  verifyChallengeBundle,
} = require('../../solver/seed-variance');
const { observeShortlist } = require('../../solver/generate-levels');

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
}

function sha(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function git(args) {
  const run = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (run.status !== 0) throw new Error((run.stderr || run.stdout).trim() || `git ${args.join(' ')} failed`);
  return run.stdout.trim();
}

function verify() {
  const measurementPath = 'experiments/RESULT-0021/measurement.json';
  const bundlePath = 'experiments/RESULT-0021/evidence/challenge-bundle.json';
  const decisionPath = 'experiments/RESULT-0021/decision-rule.json';
  const admissionPath = 'experiments/RESULT-0021/admission.json';
  const batchPath = 'solver/generated-batch-04.json';
  const protocolPath = 'experiments/RESULT-0021/protocol.md';

  const measurement = read(measurementPath);
  const bundle = read(bundlePath);
  const decisionRule = read(decisionPath);
  const admission = read(admissionPath);
  const batch = read(batchPath);
  const currentIdentities = sourceIdentities();

  verifyArtifact(measurement);
  assert(measurement.artifactIdentity === bundle.validArtifact.artifactIdentity, 'bundle does not contain the cited measurement');
  assert(canonicalJson(measurement) === canonicalJson(bundle.validArtifact), 'bundle measurement bytes disagree');
  assert(canonicalJson(bundle.validEntitlement.decisionRule) === canonicalJson(decisionRule), 'decision rule mismatch');
  assert(sha(protocolPath) === measurement.protocol.identity, 'protocol identity mismatch');
  assert(measurement.protocol.path === protocolPath, 'protocol path mismatch');
  git(['cat-file', '-e', `${measurement.protocol.protocolCommit}:${protocolPath}`]);
  git(['merge-base', '--is-ancestor', measurement.protocol.protocolCommit, measurement.protocol.measurementCommit]);
  git(['merge-base', '--is-ancestor', measurement.protocol.measurementCommit, 'HEAD']);

  const batchBytes = fs.readFileSync(path.join(ROOT, batchPath));
  const consumerSubject = {
    path: batchPath,
    sha256: crypto.createHash('sha256').update(batchBytes).digest('hex'),
    batchIdentity: identity(batch),
  };
  const consumerObservation = {
    valid: observeShortlist(batch.results, bundle.validEntitlement, consumerSubject.batchIdentity),
    broken: observeShortlist(batch.results, bundle.brokenEntitlement, consumerSubject.batchIdentity),
  };
  verifyChallengeBundle(bundle, { currentIdentities, executionPath: EXECUTION_PATH, consumerSubject, consumerObservation });

  const selection = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-bundle', bundlePath,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert(selection.status === 0, selection.stderr || 'production selector rejected valid bundle');
  assert(selection.stdout.startsWith(`SELECTED ${bundle.receipt.consumerObservation.valid.selected.join(',')}`), 'production selection replay mismatch');

  let mutationFailed = false;
  try {
    verifyChallengeBundle(bundle, {
      currentIdentities: { ...currentIdentities, evaluator: '0'.repeat(64) },
      executionPath: EXECUTION_PATH,
      consumerSubject,
      consumerObservation,
    });
  } catch {
    mutationFailed = true;
  }
  assert(mutationFailed, 'covered evaluator identity mutation did not invalidate bundle');

  assert(admission.evidence.measurement.sha256 === sha(measurementPath), 'admission measurement hash mismatch');
  assert(admission.evidence.challengeBundle.sha256 === sha(bundlePath), 'admission bundle hash mismatch');
  assert(admission.evidence.decisionRule.sha256 === sha(decisionPath), 'admission decision-rule hash mismatch');
  assert(admission.evidence.measurement.artifactIdentity === measurement.artifactIdentity, 'admission artifact identity mismatch');
  assert(admission.evidence.challengeBundle.bundleIdentity === bundle.bundleIdentity, 'admission bundle identity mismatch');
  assert(admission.evidence.challengeBundle.receiptIdentity === bundle.receipt.receiptIdentity, 'admission receipt identity mismatch');
  assert(canonicalJson(admission.sources) === canonicalJson(currentIdentities), 'admission source identity mismatch');
  const { artifactIdentity, registration, ...admissionBody } = admission;
  assert(identity(admissionBody) === artifactIdentity, 'admission artifact identity mismatch');
  assert(registration.protocolCommit === measurement.protocol.protocolCommit, 'admission protocol commit mismatch');

  process.stdout.write(`RESULT-0021 CHALLENGE PASS ${bundle.receipt.receiptIdentity}\n`);
}

try {
  verify();
} catch (error) {
  process.stderr.write(`FAIL: ${error.message}\n`);
  process.exitCode = 1;
}
