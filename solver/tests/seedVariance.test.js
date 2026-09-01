const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { LEVELS } = require('../../src/game');
const { playMeasured } = require('../level-author');
const {
  analyzeArtifact,
  buildChallengeReceipt,
  createArtifact,
  createBrokenTwin,
  issueEntitlement,
  measureSubject,
  sourceIdentities,
  verifyChallengeReceipt,
  verifyEntitlement,
} = require('../seed-variance');

const PROTOCOL_IDENTITY = 'a'.repeat(64);
const DECISION_RULE = Object.freeze({
  stablePearson: 0.95,
  unstablePearson: 0.80,
  sufficientSingleSeedReliability: 0.80,
  insufficientSingleSeedReliability: 0.50,
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
      scores[candidate.name][sample].forEach((score, offset) => {
        measurements.push({
          candidateIdentity: candidate.identity,
          candidateName: candidate.name,
          sample,
          seed: (sample === 'a' ? 1000 : 2000) + offset,
          score,
        });
      });
    }
  }
  return createArtifact({
    claim: 'structural candidate ranking is stable across the declared disjoint seed samples',
    candidates,
    samples: {
      a: { start: 1000, count: 3 },
      b: { start: 2000, count: 3 },
    },
    metric: 'terminal achievable score before target stopping',
    executionSeam: 'solver/level-author.js#playMeasured',
    coveredIdentities,
    measurements,
  });
}

function issue(artifact, coveredIdentities = sourceIdentities()) {
  return issueEntitlement(artifact, {
    protocolIdentity: PROTOCOL_IDENTITY,
    decisionRule: DECISION_RULE,
    coveredIdentities,
  });
}

test('measurement reaches the real playMeasured evaluator seam', () => {
  const artifact = measureSubject({
    claim: 'bounded real-seam probe',
    candidates: LEVELS.slice(0, 2),
    samples: {
      a: { start: 9100000, count: 1 },
      b: { start: 9200000, count: 1 },
    },
    play: playMeasured,
    coveredIdentities: sourceIdentities(),
  });

  assert.equal(artifact.executionSeam, 'solver/level-author.js#playMeasured');
  assert.equal(artifact.measurements.length, 4);
  assert.ok(artifact.measurements.every((row) => Number.isFinite(row.score) && row.score > 0));
});

test('the same verifier passes the valid subject and fails a statistically broken twin', () => {
  const valid = syntheticArtifact();
  const broken = createBrokenTwin(valid);
  const validEntitlement = issue(valid);
  const brokenEntitlement = issue(broken);

  assert.equal(validEntitlement.check.status, 'PASS');
  assert.equal(validEntitlement.check.humanSeedVerdict, 'NOT_SUPPORTED_AS_NECESSARY_FOR_SEED_CONTROL');
  assert.equal(brokenEntitlement.check.status, 'FAIL');
  assert.equal(brokenEntitlement.check.humanSeedVerdict, 'REPEATED_HUMAN_SEEDS_REQUIRED_FOR_SEED_CONTROL');
  assert.ok(analyzeArtifact(valid).pearson > 0.99);
  assert.ok(analyzeArtifact(broken).pearson < 0);
});

test('missing, malformed, failed, and identity-stale entitlements fail closed', () => {
  const identities = sourceIdentities();
  const valid = issue(syntheticArtifact(identities), identities);
  const broken = issue(createBrokenTwin(syntheticArtifact(identities)), identities);

  assert.throws(() => verifyEntitlement(null, { currentIdentities: identities }), /entitlement is required/);
  assert.throws(() => verifyEntitlement({}, { currentIdentities: identities }), /schemaVersion/);
  assert.throws(() => verifyEntitlement(broken, { currentIdentities: identities }), /check did not pass/);
  assert.throws(
    () => verifyEntitlement(valid, { currentIdentities: { ...identities, evaluator: 'f'.repeat(64) } }),
    /covered identity mismatch/,
  );
  assert.equal(verifyEntitlement(valid, { currentIdentities: identities }).status, 'PASS');
});

test('the production CLI shortlist consumes the entitlement verdict', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-variance-selection-'));
  const batchPath = path.join(temp, 'batch.json');
  const validPath = path.join(temp, 'valid.json');
  const brokenPath = path.join(temp, 'broken.json');
  const stalePath = path.join(temp, 'stale.json');
  const identities = sourceIdentities();
  const valid = issue(syntheticArtifact(identities), identities);
  const broken = issue(createBrokenTwin(syntheticArtifact(identities)), identities);
  const batch = {
    schemaVersion: 1,
    results: [
      { shape: { name: 'easy' }, verdict: { pass: true, winRate: 1 } },
      { shape: { name: 'hardest' }, verdict: { pass: true, winRate: 0.4 } },
      { shape: { name: 'failed' }, verdict: { pass: false, winRate: 0.1 } },
    ],
  };
  fs.writeFileSync(batchPath, JSON.stringify(batch));
  fs.writeFileSync(validPath, JSON.stringify(valid));
  fs.writeFileSync(brokenPath, JSON.stringify(broken));
  const staleIdentities = { ...identities, evaluator: 'f'.repeat(64) };
  fs.writeFileSync(stalePath, JSON.stringify(issue(syntheticArtifact(staleIdentities), staleIdentities)));

  const command = ['solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-entitlement', validPath];
  const accepted = spawnSync(process.execPath, command, { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout, /SELECTED hardest,easy/);

  const withheld = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-entitlement', brokenPath,
  ], { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  assert.equal(withheld.status, 1);
  assert.match(withheld.stderr, /check did not pass/);

  const missing = spawnSync(process.execPath, ['solver/generate-levels.js', '--select-from', batchPath], {
    cwd: path.join(__dirname, '../..'), encoding: 'utf8',
  });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /entitlement is required/);

  const stale = spawnSync(process.execPath, [
    'solver/generate-levels.js', '--select-from', batchPath, '--seed-variance-entitlement', stalePath,
  ], { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /covered identity mismatch/);
});

test('the immutable challenge receipt records valid, broken, drift, and consumer observations', () => {
  const identities = sourceIdentities();
  const validArtifact = syntheticArtifact(identities);
  const brokenArtifact = createBrokenTwin(validArtifact);
  const validEntitlement = issue(validArtifact, identities);
  const brokenEntitlement = issue(brokenArtifact, identities);
  const receipt = buildChallengeReceipt({
    exactClaim: validArtifact.claim,
    validArtifact,
    brokenArtifact,
    validEntitlement,
    brokenEntitlement,
    currentIdentities: identities,
    executionPath: 'solver/generate-levels.js#main -> selectShortlist -> rankShortlist',
    consumerObservation: {
      valid: { status: 'PASS', selected: ['hardest', 'easy'] },
      broken: { status: 'FAIL', selected: [] },
    },
    identityMutationObservation: { status: 'FAIL', changedIdentity: 'evaluator' },
  });

  assert.equal(verifyChallengeReceipt(receipt, {
    validArtifact,
    brokenArtifact,
    validEntitlement,
    brokenEntitlement,
    currentIdentities: identities,
  }).status, 'PASS');
  assert.throws(
    () => verifyChallengeReceipt(receipt, {
      validArtifact,
      brokenArtifact,
      validEntitlement,
      brokenEntitlement,
      currentIdentities: { ...identities, selector: 'e'.repeat(64) },
    }),
    /covered identity mismatch/,
  );
});

test('the challenge CLI writes one receipt and the verifier replays its production observations', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-variance-challenge-'));
  const artifactPath = path.join(temp, 'artifact.json');
  const protocolPath = path.join(temp, 'protocol.md');
  const decisionPath = path.join(temp, 'decision-rule.json');
  const batchPath = path.join(temp, 'batch.json');
  const evidenceDir = path.join(temp, 'evidence');
  fs.writeFileSync(artifactPath, JSON.stringify(syntheticArtifact()));
  fs.writeFileSync(protocolPath, '# Frozen test protocol\n');
  fs.writeFileSync(decisionPath, JSON.stringify(DECISION_RULE));
  fs.writeFileSync(batchPath, JSON.stringify({
    schemaVersion: 1,
    results: [
      { shape: { name: 'easy' }, verdict: { pass: true, winRate: 1 } },
      { shape: { name: 'hardest' }, verdict: { pass: true, winRate: 0.4 } },
    ],
  }));

  const challenge = spawnSync(process.execPath, [
    'solver/seed-variance.js', 'challenge',
    '--artifact', artifactPath,
    '--protocol', protocolPath,
    '--decision-rule', decisionPath,
    '--batch', batchPath,
    '--out-dir', evidenceDir,
  ], { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  assert.equal(challenge.status, 0, challenge.stderr);
  assert.match(challenge.stdout, /CHALLENGE RECEIPT PASS/);

  const verify = spawnSync(process.execPath, [
    'solver/seed-variance.js', 'verify',
    '--artifact', artifactPath,
    '--protocol', protocolPath,
    '--decision-rule', decisionPath,
    '--batch', batchPath,
    '--evidence-dir', evidenceDir,
  ], { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  assert.equal(verify.status, 0, verify.stderr);
  assert.match(verify.stdout, /SEED VARIANCE CHALLENGE PASS/);
  assert.ok(fs.existsSync(path.join(evidenceDir, 'challenge-receipt.json')));
});
