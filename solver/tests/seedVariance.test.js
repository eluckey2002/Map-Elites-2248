const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { LEVELS } = require('../../src/game');
const { playMeasured } = require('../level-author');
const {
  analyzeArtifact,
  buildChallengeBundle,
  buildChallengeReceipt,
  committedProtocol,
  createArtifact,
  createBrokenTwin,
  EXECUTION_PATH,
  identity,
  issueEntitlement,
  measureSubject,
  sourceIdentities,
  verifyChallengeBundle,
  verifyChallengeReceipt,
  verifyEntitlement,
} = require('../seed-variance');
const { observeShortlist } = require('../generate-levels');

const ROOT = path.join(__dirname, '../..');
const PROTOCOL_PATH = path.join(ROOT, 'experiments/RESULT-0020/protocol.md');
const PROTOCOL = committedProtocol(PROTOCOL_PATH);
const DECISION_RULE = Object.freeze({
  stablePearson: 0.95,
  unstablePearson: 0.80,
  sufficientSingleSeedReliability: 0.80,
  insufficientSingleSeedReliability: 0.50,
});
const REAL_FIXTURE_RULE = Object.freeze({
  stablePearson: 0.99,
  unstablePearson: 0.95,
  sufficientSingleSeedReliability: 0.98,
  insufficientSingleSeedReliability: 0.95,
});

function syntheticArtifact(coveredIdentities = sourceIdentities()) {
  const candidates = [
    { name: 'low', identity: '1'.repeat(64) },
    { name: 'middle', identity: '2'.repeat(64) },
    { name: 'high', identity: '3'.repeat(64) },
  ];
  const scores = {
    low: { a: [9, 10, 11], b: [10, 11, 12] },
    middle: { a: [19, 20, 21], b: [20, 21, 22] },
    high: { a: [29, 30, 31], b: [30, 31, 32] },
  };
  const measurements = [];
  for (const candidate of candidates) {
    for (const sample of ['a', 'b']) {
      scores[candidate.name][sample].forEach((score, offset) => measurements.push({
        candidateIdentity: candidate.identity,
        candidateName: candidate.name,
        sample,
        seed: (sample === 'a' ? 1000 : 2000) + offset,
        score,
      }));
    }
  }
  return createArtifact({
    claim: 'structural candidate ranking is stable across the declared disjoint seed samples',
    candidates,
    samples: { a: { start: 1000, count: 3 }, b: { start: 2000, count: 3 } },
    metric: 'terminal achievable score before target stopping',
    executionSeam: 'solver/level-author.js#playMeasured',
    protocol: PROTOCOL,
    coveredIdentities,
    measurements,
  });
}

function issue(artifact, coveredIdentities = sourceIdentities(), decisionRule = DECISION_RULE) {
  return issueEntitlement(artifact, { decisionRule, coveredIdentities });
}

function batchFixture() {
  return { schemaVersion: 1, results: [
    { shape: { name: 'easy' }, verdict: { pass: true, winRate: 1 } },
    { shape: { name: 'hardest' }, verdict: { pass: true, winRate: 0.4 } },
    { shape: { name: 'failed' }, verdict: { pass: false, winRate: 0.1 } },
  ] };
}

function consumerSubject(batchPath, batch) {
  return {
    path: path.relative(ROOT, batchPath),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(batchPath)).digest('hex'),
    batchIdentity: identity(batch),
  };
}

function challengeFixture(batchPath, batch, coveredIdentities = sourceIdentities()) {
  const validArtifact = syntheticArtifact(coveredIdentities);
  const brokenArtifact = createBrokenTwin(validArtifact);
  const validEntitlement = issue(validArtifact, coveredIdentities);
  const brokenEntitlement = issue(brokenArtifact, coveredIdentities);
  const subject = consumerSubject(batchPath, batch);
  const observation = {
    valid: observeShortlist(batch.results, validEntitlement, subject.batchIdentity),
    broken: observeShortlist(batch.results, brokenEntitlement, subject.batchIdentity),
  };
  const receipt = buildChallengeReceipt({
    exactClaim: validArtifact.claim,
    validArtifact,
    brokenArtifact,
    validEntitlement,
    brokenEntitlement,
    currentIdentities: coveredIdentities,
    executionPath: EXECUTION_PATH,
    consumerSubject: subject,
    consumerObservation: observation,
    identityMutationObservation: { status: 'FAIL', changedIdentity: 'evaluator', error: 'covered identity mismatch' },
  });
  const bundle = buildChallengeBundle({ validArtifact, brokenArtifact, validEntitlement, brokenEntitlement, receipt });
  return { bundle, subject, observation };
}

function verifyOptions(fixture, currentIdentities = sourceIdentities()) {
  return {
    currentIdentities,
    executionPath: EXECUTION_PATH,
    consumerSubject: fixture.subject,
    consumerObservation: fixture.observation,
  };
}

function resignReceipt(receipt, mutate) {
  const changed = structuredClone(receipt);
  mutate(changed);
  delete changed.receiptIdentity;
  return { ...changed, receiptIdentity: identity(changed) };
}

test('a bounded artifact measured through real playMeasured reaches PASS and its broken twin reaches FAIL', () => {
  const artifact = measureSubject({
    claim: 'bounded real-seam fixture only',
    candidates: [LEVELS[0], LEVELS[14], LEVELS[25]],
    samples: { a: { start: 9100000, count: 2 }, b: { start: 9200000, count: 2 } },
    protocol: PROTOCOL,
    play: playMeasured,
    coveredIdentities: sourceIdentities(),
  });
  const valid = issue(artifact, sourceIdentities(), REAL_FIXTURE_RULE);
  const broken = issue(createBrokenTwin(artifact), sourceIdentities(), REAL_FIXTURE_RULE);
  assert.equal(artifact.executionSeam, 'solver/level-author.js#playMeasured');
  assert.equal(artifact.measurements.length, 12);
  assert.ok(analyzeArtifact(artifact).pearson > REAL_FIXTURE_RULE.stablePearson);
  assert.ok(analyzeArtifact(artifact).singleSeedReliability > REAL_FIXTURE_RULE.sufficientSingleSeedReliability);
  assert.equal(valid.check.status, 'PASS');
  assert.equal(broken.check.status, 'FAIL');
});

test('artifacts and issuance require a protocol committed before measurement', () => {
  assert.equal(PROTOCOL.path, 'experiments/RESULT-0020/protocol.md');
  assert.notEqual(PROTOCOL.protocolCommit, PROTOCOL.measurementCommit);
  assert.equal(PROTOCOL.ordering, 'STRICT_ANCESTOR');
  const artifact = syntheticArtifact();
  const detached = { ...artifact };
  delete detached.protocol;
  delete detached.artifactIdentity;
  detached.artifactIdentity = identity(detached);
  assert.throws(() => issue(detached), /protocol binding is required/);
  const untracked = path.join(os.tmpdir(), 'untracked-seed-variance-protocol.md');
  fs.writeFileSync(untracked, '# not registered\n');
  assert.throws(() => committedProtocol(untracked), /inside the repository/);
});

test('standalone, failed, malformed, and identity-stale materials fail closed', () => {
  const identities = sourceIdentities();
  const valid = issue(syntheticArtifact(identities), identities);
  const broken = issue(createBrokenTwin(syntheticArtifact(identities)), identities);
  assert.throws(() => verifyEntitlement(null, { currentIdentities: identities }), /entitlement is required/);
  assert.throws(() => verifyEntitlement({}, { currentIdentities: identities }), /schemaVersion/);
  assert.throws(() => verifyEntitlement(broken, { currentIdentities: identities }), /check did not pass/);
  assert.throws(() => verifyEntitlement(valid, {
    currentIdentities: { ...identities, evaluator: 'f'.repeat(64) },
  }), /covered identity mismatch/);
});

test('the production CLI selects only from a verified bundle bound to the exact batch', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-variance-selection-'));
  const batchPath = path.join(temp, 'batch.json');
  const bundlePath = path.join(temp, 'bundle.json');
  const entitlementPath = path.join(temp, 'entitlement.json');
  const batch = batchFixture();
  fs.writeFileSync(batchPath, JSON.stringify(batch));
  const fixture = challengeFixture(batchPath, batch);
  fs.writeFileSync(bundlePath, JSON.stringify(fixture.bundle));
  fs.writeFileSync(entitlementPath, JSON.stringify(fixture.bundle.validEntitlement));
  const accepted = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-bundle', bundlePath,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /SELECTED hardest,easy/);
  const standalone = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-entitlement', entitlementPath,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(standalone.status, 1);
  assert.match(standalone.stderr, /unknown option|bundle is required/);
  const missing = spawnSync(process.execPath, ['solver/generate-levels.js', '--select-from', batchPath], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /bundle is required/);
  fs.writeFileSync(batchPath, JSON.stringify({ ...batch, marker: 'different exact batch' }));
  const mismatched = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-bundle', bundlePath,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(mismatched.status, 1);
  assert.match(mismatched.stderr, /consumer subject identity mismatch/);
});

test('receipt verifier cross-binds claim, subjects, protocol, execution path, and actual selections', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-variance-receipt-'));
  const batchPath = path.join(temp, 'batch.json');
  const batch = batchFixture();
  fs.writeFileSync(batchPath, JSON.stringify(batch));
  const fixture = challengeFixture(batchPath, batch);
  const { bundle } = fixture;
  const args = {
    validArtifact: bundle.validArtifact,
    brokenArtifact: bundle.brokenArtifact,
    validEntitlement: bundle.validEntitlement,
    brokenEntitlement: bundle.brokenEntitlement,
    ...verifyOptions(fixture),
  };
  assert.equal(verifyChallengeReceipt(bundle.receipt, args).status, 'PASS');
  const mutations = [
    [(r) => { r.exactClaim = 'different claim'; }, /exact claim mismatch/],
    [(r) => { r.realSubject.candidates = r.realSubject.candidates.slice(1); }, /candidate subject mismatch/],
    [(r) => { r.realSubject.samples.a.count += 1; }, /sample subject mismatch/],
    [(r) => { r.realSubject.metric = 'different metric'; }, /metric subject mismatch/],
    [(r) => { r.realSubject.executionSeam = 'different seam'; }, /evaluator execution seam mismatch/],
    [(r) => { r.realSubject.protocol.identity = 'f'.repeat(64); }, /artifact protocol mismatch/],
    [(r) => { r.executionPath = 'different path'; }, /execution path mismatch/],
    [(r) => { r.consumerSubject.batchIdentity = 'f'.repeat(64); }, /consumer subject identity mismatch/],
    [(r) => { r.consumerObservation.valid.selected = ['easy']; }, /consumer observation mismatch/],
  ];
  for (const [mutate, pattern] of mutations) {
    assert.throws(() => verifyChallengeReceipt(resignReceipt(bundle.receipt, mutate), args), pattern);
  }
  assert.throws(() => verifyChallengeBundle(bundle, verifyOptions(fixture, {
    ...sourceIdentities(), selector: 'e'.repeat(64),
  })), /covered identity mismatch/);
});

test('challenge writes only a verified bundle and verifier replays the real consumer', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-variance-challenge-'));
  const artifactPath = path.join(temp, 'artifact.json');
  const decisionPath = path.join(temp, 'decision-rule.json');
  const batchPath = path.join(temp, 'batch.json');
  const evidenceDir = path.join(temp, 'evidence');
  const batch = batchFixture();
  fs.writeFileSync(artifactPath, JSON.stringify(syntheticArtifact()));
  fs.writeFileSync(decisionPath, JSON.stringify(DECISION_RULE));
  fs.writeFileSync(batchPath, JSON.stringify(batch));
  const challenge = spawnSync(process.execPath, [
    'solver/seed-variance.js', 'challenge', '--artifact', artifactPath,
    '--protocol', PROTOCOL_PATH, '--decision-rule', decisionPath,
    '--batch', batchPath, '--out-dir', evidenceDir,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(challenge.status, 0, challenge.stderr);
  assert.match(challenge.stdout, /CHALLENGE RECEIPT PASS/);
  assert.deepEqual(fs.readdirSync(evidenceDir), ['challenge-bundle.json']);
  const verify = spawnSync(process.execPath, [
    'solver/seed-variance.js', 'verify', '--artifact', artifactPath,
    '--protocol', PROTOCOL_PATH, '--decision-rule', decisionPath,
    '--batch', batchPath, '--evidence-dir', evidenceDir,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(verify.status, 0, verify.stderr);
  assert.match(verify.stdout, /SEED VARIANCE CHALLENGE PASS/);

  const differentArtifact = syntheticArtifact();
  const changedUnsigned = { ...differentArtifact, claim: 'different measured subject' };
  delete changedUnsigned.artifactIdentity;
  fs.writeFileSync(artifactPath, JSON.stringify(createArtifact(changedUnsigned)));
  const mismatchedArtifact = spawnSync(process.execPath, [
    'solver/seed-variance.js', 'verify', '--artifact', artifactPath,
    '--protocol', PROTOCOL_PATH, '--decision-rule', decisionPath,
    '--batch', batchPath, '--evidence-dir', evidenceDir,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(mismatchedArtifact.status, 1);
  assert.match(mismatchedArtifact.stderr, /supplied artifact identity mismatch/);

  const selected = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath,
    '--seed-variance-bundle', path.join(evidenceDir, 'challenge-bundle.json'),
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(selected.status, 0, selected.stderr);
  assert.match(selected.stdout, /SELECTED hardest,easy/);
});
