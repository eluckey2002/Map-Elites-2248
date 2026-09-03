#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { playMeasured } = require('./level-author');

const ROOT = path.join(__dirname, '..');
const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT_IDENTITY = /^[a-f0-9]{40,64}$/;
const EXECUTION_PATH = 'solver/seed-variance.js#measureSubject -> solver/level-author.js#playMeasured; solver/generate-levels.js#main -> selectShortlist -> rankShortlist';

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  const bytes = typeof value === 'string' ? value : canonicalJson(value);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fileIdentity(relativePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relativePath))).digest('hex');
}

function absoluteFileIdentity(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function git(args) {
  const run = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  if (run.status !== 0) throw new Error((run.stderr || run.stdout).trim() || `git ${args.join(' ')} failed`);
  return run.stdout.trim();
}

function validateProtocol(protocol) {
  if (!protocol || typeof protocol.path !== 'string' || !protocol.path) throw new Error('artifact protocol binding is required');
  if (!SHA256.test(protocol.identity || '')) throw new Error('protocol identity must be SHA-256');
  if (!COMMIT_IDENTITY.test(protocol.protocolCommit || '') || !COMMIT_IDENTITY.test(protocol.measurementCommit || '')) {
    throw new Error('protocol and measurement commits must be full commit identities');
  }
  if (protocol.protocolCommit === protocol.measurementCommit || protocol.ordering !== 'STRICT_ANCESTOR') {
    throw new Error('protocol commit must strictly precede measurement commit');
  }
}

function committedProtocol(file) {
  const absolute = path.resolve(file);
  const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
  if (!relative || relative.startsWith('../') || path.isAbsolute(relative)) throw new Error('protocol must be inside the repository');
  if (git(['status', '--porcelain', '--', relative])) throw new Error('protocol must be tracked and unmodified');
  git(['ls-files', '--error-unmatch', '--', relative]);
  const protocolCommit = git(['log', '-1', '--format=%H', '--', relative]);
  const measurementCommit = git(['rev-parse', 'HEAD']);
  if (!protocolCommit || protocolCommit === measurementCommit) throw new Error('protocol commit must strictly precede measurement commit');
  const ancestry = spawnSync('git', ['merge-base', '--is-ancestor', protocolCommit, measurementCommit], { cwd: ROOT });
  if (ancestry.status !== 0) throw new Error('protocol commit is not an ancestor of measurement commit');
  const protocol = {
    path: relative,
    identity: absoluteFileIdentity(absolute),
    protocolCommit,
    measurementCommit,
    ordering: 'STRICT_ANCESTOR',
  };
  validateProtocol(protocol);
  return protocol;
}

function sourceIdentities() {
  return {
    levels: fileIdentity('src/game.js'),
    engine: fileIdentity('solver/engine.js'),
    calibration: fileIdentity('solver/calibration.js'),
    calibrationSolver: fileIdentity('solver/calibrations/calib-1.js'),
    evaluator: fileIdentity('solver/level-author.js'),
    selector: fileIdentity('solver/generate-levels.js'),
    check: fileIdentity('solver/seed-variance.js'),
  };
}

function assertIdentityMap(actual, expected) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error('covered identity mismatch');
}

function validateSamples(samples) {
  if (!samples || !samples.a || !samples.b) throw new Error('two samples are required');
  for (const name of ['a', 'b']) {
    const sample = samples[name];
    if (!Number.isInteger(sample.start) || !Number.isInteger(sample.count) || sample.count < 1) {
      throw new Error(`sample ${name} must have integer start and positive count`);
    }
  }
  const aEnd = samples.a.start + samples.a.count;
  const bEnd = samples.b.start + samples.b.count;
  if (aEnd > samples.b.start && bEnd > samples.a.start) throw new Error('sample seed ranges overlap');
}

function candidateDescriptor(level) {
  const descriptor = {
    level: level.level,
    target: level.target,
    tileScale: level.tileScale,
    moves: level.moves,
    minChain: level.minChain,
    gridW: level.gridW,
    gridH: level.gridH,
    blockers: level.blockers,
  };
  return {
    name: level.name || `level-${level.level}`,
    identity: identity(descriptor),
    descriptor,
  };
}

function createArtifact(input) {
  validateSamples(input.samples);
  validateProtocol(input.protocol);
  if (!Array.isArray(input.candidates) || input.candidates.length < 2) throw new Error('at least two candidates are required');
  if (!Array.isArray(input.measurements)) throw new Error('measurements are required');
  const candidateIds = new Set(input.candidates.map((candidate) => candidate.identity));
  if (candidateIds.size !== input.candidates.length) throw new Error('candidate identities must be unique');
  const expected = input.candidates.length * (input.samples.a.count + input.samples.b.count);
  if (input.measurements.length !== expected) throw new Error(`measurement count must equal ${expected}`);
  const seen = new Set();
  for (const row of input.measurements) {
    if (!candidateIds.has(row.candidateIdentity)) throw new Error('measurement candidate is not declared');
    if (!['a', 'b'].includes(row.sample)) throw new Error('measurement sample must be a or b');
    const range = input.samples[row.sample];
    if (!Number.isInteger(row.seed) || row.seed < range.start || row.seed >= range.start + range.count) {
      throw new Error('measurement seed is outside its declared range');
    }
    if (!Number.isFinite(row.score) || row.score < 0) throw new Error('measurement score must be finite and nonnegative');
    const key = `${row.candidateIdentity}:${row.sample}:${row.seed}`;
    if (seen.has(key)) throw new Error('duplicate measurement');
    seen.add(key);
  }
  const unsigned = {
    schemaVersion: 1,
    claim: input.claim,
    candidates: input.candidates,
    samples: input.samples,
    metric: input.metric,
    executionSeam: input.executionSeam,
    protocol: input.protocol,
    coveredIdentities: input.coveredIdentities,
    measurements: input.measurements,
  };
  return { ...unsigned, artifactIdentity: identity(unsigned) };
}

function verifyArtifact(artifact) {
  if (!artifact || artifact.schemaVersion !== 1) throw new Error('artifact schemaVersion must be 1');
  const unsigned = { ...artifact };
  delete unsigned.artifactIdentity;
  const rebuilt = createArtifact(unsigned);
  if (rebuilt.artifactIdentity !== artifact.artifactIdentity) throw new Error('artifact identity mismatch');
  return { status: 'PASS', artifactIdentity: artifact.artifactIdentity };
}

function measureSubject({ claim, candidates, samples, protocol, play = playMeasured, coveredIdentities = sourceIdentities() }) {
  validateSamples(samples);
  const declared = candidates.map(candidateDescriptor);
  const measurements = [];
  for (let i = 0; i < candidates.length; i++) {
    const level = { ...candidates[i], target: Infinity };
    for (const sample of ['a', 'b']) {
      const range = samples[sample];
      for (let offset = 0; offset < range.count; offset++) {
        const seed = range.start + offset;
        const outcome = play(level, seed);
        if (!outcome || !Number.isFinite(outcome.score)) throw new Error(`incomplete measurement at seed ${seed}`);
        measurements.push({
          candidateIdentity: declared[i].identity,
          candidateName: declared[i].name,
          sample,
          seed,
          score: outcome.score,
        });
      }
    }
  }
  return createArtifact({
    claim,
    candidates: declared,
    samples,
    metric: 'terminal achievable score before target stopping',
    executionSeam: 'solver/level-author.js#playMeasured',
    protocol,
    coveredIdentities,
    measurements,
  });
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values, center = mean(values)) {
  if (values.length < 2) return 0;
  return values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1);
}

function pearson(xs, ys) {
  const xMean = mean(xs);
  const yMean = mean(ys);
  let numerator = 0;
  let xSquares = 0;
  let ySquares = 0;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] - xMean;
    const y = ys[i] - yMean;
    numerator += x * y;
    xSquares += x * x;
    ySquares += y * y;
  }
  if (xSquares === 0 || ySquares === 0) return 0;
  return numerator / Math.sqrt(xSquares * ySquares);
}

function analyzeArtifact(artifact) {
  verifyArtifact(artifact);
  const byCandidate = new Map(artifact.candidates.map((candidate) => [candidate.identity, { a: [], b: [] }]));
  for (const row of artifact.measurements) byCandidate.get(row.candidateIdentity)[row.sample].push(row.score);
  const aMeans = [];
  const bMeans = [];
  const candidateMeans = [];
  let withinSquares = 0;
  let withinDegrees = 0;
  for (const candidate of artifact.candidates) {
    const groups = byCandidate.get(candidate.identity);
    const all = [...groups.a, ...groups.b];
    const center = mean(all);
    aMeans.push(mean(groups.a));
    bMeans.push(mean(groups.b));
    candidateMeans.push(center);
    withinSquares += all.reduce((sum, value) => sum + (value - center) ** 2, 0);
    withinDegrees += all.length - 1;
  }
  const withinLevelVariance = withinDegrees === 0 ? 0 : withinSquares / withinDegrees;
  const gamesPerCandidate = artifact.samples.a.count + artifact.samples.b.count;
  const betweenCandidateMeanVariance = variance(candidateMeans);
  const betweenMeanSquare = gamesPerCandidate * betweenCandidateMeanVariance;
  const betweenCandidateVariance = Math.max(0, (betweenMeanSquare - withinLevelVariance) / gamesPerCandidate);
  const total = betweenCandidateVariance + withinLevelVariance;
  return {
    pearson: pearson(aMeans, bMeans),
    withinLevelVariance,
    betweenCandidateVariance,
    betweenCandidateMeanVariance,
    betweenToWithinVarianceRatio: withinLevelVariance === 0 ? null : betweenCandidateVariance / withinLevelVariance,
    singleSeedReliability: total === 0 ? 0 : betweenCandidateVariance / total,
    candidateCount: artifact.candidates.length,
    gamesPerCandidate,
  };
}

function decide(stats, rule) {
  if (stats.pearson >= rule.stablePearson && stats.singleSeedReliability >= rule.sufficientSingleSeedReliability) {
    return { status: 'PASS', humanSeedVerdict: 'NOT_SUPPORTED_AS_NECESSARY_FOR_SEED_CONTROL' };
  }
  if (stats.pearson < rule.unstablePearson || stats.singleSeedReliability < rule.insufficientSingleSeedReliability) {
    return { status: 'FAIL', humanSeedVerdict: 'REPEATED_HUMAN_SEEDS_REQUIRED_FOR_SEED_CONTROL' };
  }
  return { status: 'FAIL', humanSeedVerdict: 'INCONCLUSIVE' };
}

function issueEntitlement(artifact, { decisionRule, coveredIdentities }) {
  verifyArtifact(artifact);
  assertIdentityMap(artifact.coveredIdentities, coveredIdentities);
  validateProtocol(artifact.protocol);
  const statistics = analyzeArtifact(artifact);
  const decision = decide(statistics, decisionRule);
  const unsigned = {
    schemaVersion: 1,
    artifactIdentity: artifact.artifactIdentity,
    protocol: artifact.protocol,
    decisionRule,
    coveredIdentities,
    check: { ...decision, statistics },
  };
  return { ...unsigned, entitlementIdentity: identity(unsigned) };
}

function validateEntitlement(entitlement, { currentIdentities, requirePass }) {
  if (!entitlement) throw new Error('seed-variance entitlement is required');
  if (entitlement.schemaVersion !== 1) throw new Error('entitlement schemaVersion must be 1');
  const unsigned = { ...entitlement };
  delete unsigned.entitlementIdentity;
  if (identity(unsigned) !== entitlement.entitlementIdentity) throw new Error('entitlement identity mismatch');
  validateProtocol(entitlement.protocol);
  assertIdentityMap(entitlement.coveredIdentities, currentIdentities);
  if (requirePass && entitlement.check.status !== 'PASS') throw new Error('seed-variance check did not pass');
  return { status: 'PASS', entitlementIdentity: entitlement.entitlementIdentity };
}

function verifyEntitlement(entitlement, { currentIdentities = sourceIdentities() } = {}) {
  return validateEntitlement(entitlement, { currentIdentities, requirePass: true });
}

function createBrokenTwin(artifact) {
  verifyArtifact(artifact);
  const reversed = [...artifact.candidates].reverse();
  const bScores = new Map();
  for (const candidate of artifact.candidates) {
    bScores.set(candidate.identity, artifact.measurements.filter((row) => row.candidateIdentity === candidate.identity && row.sample === 'b').map((row) => row.score));
  }
  const offsets = new Map();
  const measurements = artifact.measurements.map((row) => {
    if (row.sample !== 'b') return { ...row };
    const index = artifact.candidates.findIndex((candidate) => candidate.identity === row.candidateIdentity);
    const source = reversed[index];
    const offset = offsets.get(row.candidateIdentity) || 0;
    offsets.set(row.candidateIdentity, offset + 1);
    return { ...row, score: bScores.get(source.identity)[offset] };
  });
  const unsigned = { ...artifact, measurements };
  delete unsigned.artifactIdentity;
  return createArtifact(unsigned);
}

function buildChallengeReceipt(input) {
  verifyArtifact(input.validArtifact);
  verifyArtifact(input.brokenArtifact);
  validateEntitlement(input.validEntitlement, { currentIdentities: input.currentIdentities, requirePass: true });
  validateEntitlement(input.brokenEntitlement, { currentIdentities: input.currentIdentities, requirePass: false });
  if (input.brokenEntitlement.check.status !== 'FAIL') throw new Error('broken twin must fail the same check');
  if (input.consumerObservation.valid.status !== 'PASS' || input.consumerObservation.broken.status !== 'FAIL') {
    throw new Error('consumer observation must show valid PASS and broken FAIL');
  }
  if (input.identityMutationObservation.status !== 'FAIL') throw new Error('identity mutation must fail');
  const unsigned = {
    schemaVersion: 1,
    exactClaim: input.exactClaim,
    realSubject: {
      artifactIdentity: input.validArtifact.artifactIdentity,
      candidates: input.validArtifact.candidates,
      samples: input.validArtifact.samples,
      metric: input.validArtifact.metric,
      executionSeam: input.validArtifact.executionSeam,
      protocol: input.validArtifact.protocol,
      coveredIdentities: input.currentIdentities,
    },
    executionPath: input.executionPath,
    validChallenge: {
      status: input.validEntitlement.check.status,
      entitlementIdentity: input.validEntitlement.entitlementIdentity,
      protocol: input.validEntitlement.protocol,
      decisionRule: input.validEntitlement.decisionRule,
      statistics: input.validEntitlement.check.statistics,
      humanSeedVerdict: input.validEntitlement.check.humanSeedVerdict,
    },
    brokenTwinChallenge: {
      status: input.brokenEntitlement.check.status,
      artifactIdentity: input.brokenArtifact.artifactIdentity,
      entitlementIdentity: input.brokenEntitlement.entitlementIdentity,
      protocol: input.brokenEntitlement.protocol,
      decisionRule: input.brokenEntitlement.decisionRule,
      statistics: input.brokenEntitlement.check.statistics,
      humanSeedVerdict: input.brokenEntitlement.check.humanSeedVerdict,
    },
    consumerObservation: input.consumerObservation,
    consumerSubject: input.consumerSubject || null,
    identityMutationObservation: input.identityMutationObservation,
  };
  return { ...unsigned, receiptIdentity: identity(unsigned) };
}

function verifyChallengeReceipt(receipt, {
  validArtifact,
  brokenArtifact,
  validEntitlement,
  brokenEntitlement,
  currentIdentities,
  executionPath,
  consumerSubject,
  consumerObservation,
} = {}) {
  if (!receipt || receipt.schemaVersion !== 1) throw new Error('challenge receipt schemaVersion must be 1');
  const unsigned = { ...receipt };
  delete unsigned.receiptIdentity;
  if (identity(unsigned) !== receipt.receiptIdentity) throw new Error('challenge receipt identity mismatch');
  verifyArtifact(validArtifact);
  verifyArtifact(brokenArtifact);
  const expectedBroken = createBrokenTwin(validArtifact);
  if (expectedBroken.artifactIdentity !== brokenArtifact.artifactIdentity) throw new Error('broken artifact is not the controlled twin');
  if (receipt.realSubject.artifactIdentity !== validArtifact.artifactIdentity) throw new Error('valid artifact identity mismatch');
  if (receipt.brokenTwinChallenge.artifactIdentity !== brokenArtifact.artifactIdentity) throw new Error('broken artifact identity mismatch');
  if (receipt.exactClaim !== validArtifact.claim) throw new Error('exact claim mismatch');
  if (canonicalJson(receipt.realSubject.candidates) !== canonicalJson(validArtifact.candidates)) throw new Error('candidate subject mismatch');
  if (canonicalJson(receipt.realSubject.samples) !== canonicalJson(validArtifact.samples)) throw new Error('sample subject mismatch');
  if (receipt.realSubject.metric !== validArtifact.metric) throw new Error('metric subject mismatch');
  if (receipt.realSubject.executionSeam !== validArtifact.executionSeam) throw new Error('evaluator execution seam mismatch');
  if (canonicalJson(receipt.realSubject.protocol) !== canonicalJson(validArtifact.protocol)) throw new Error('artifact protocol mismatch');
  if (receipt.executionPath !== executionPath) throw new Error('execution path mismatch');
  assertIdentityMap(receipt.realSubject.coveredIdentities, currentIdentities);
  validateEntitlement(validEntitlement, { currentIdentities, requirePass: true });
  validateEntitlement(brokenEntitlement, { currentIdentities, requirePass: false });
  if (validEntitlement.entitlementIdentity !== receipt.validChallenge.entitlementIdentity) throw new Error('valid entitlement identity mismatch');
  if (validEntitlement.artifactIdentity !== validArtifact.artifactIdentity) throw new Error('valid entitlement artifact mismatch');
  if (brokenEntitlement.entitlementIdentity !== receipt.brokenTwinChallenge.entitlementIdentity) throw new Error('broken entitlement identity mismatch');
  if (brokenEntitlement.artifactIdentity !== brokenArtifact.artifactIdentity) throw new Error('broken entitlement artifact mismatch');
  if (brokenEntitlement.check.status !== 'FAIL') throw new Error('broken entitlement unexpectedly passed');
  for (const [label, challenge, entitlement] of [
    ['valid', receipt.validChallenge, validEntitlement],
    ['broken', receipt.brokenTwinChallenge, brokenEntitlement],
  ]) {
    if (canonicalJson(challenge.protocol) !== canonicalJson(entitlement.protocol)) throw new Error(`${label} protocol mismatch`);
    if (canonicalJson(challenge.decisionRule) !== canonicalJson(entitlement.decisionRule)) throw new Error(`${label} decision rule mismatch`);
    if (canonicalJson(challenge.statistics) !== canonicalJson(entitlement.check.statistics)) throw new Error(`${label} statistics mismatch`);
    if (challenge.humanSeedVerdict !== entitlement.check.humanSeedVerdict) throw new Error(`${label} verdict mismatch`);
  }
  if (canonicalJson(receipt.consumerSubject) !== canonicalJson(consumerSubject)) throw new Error('consumer subject identity mismatch');
  if (canonicalJson(receipt.consumerObservation) !== canonicalJson(consumerObservation)) throw new Error('consumer observation mismatch');
  if (receipt.validChallenge.status !== 'PASS' || receipt.brokenTwinChallenge.status !== 'FAIL') throw new Error('challenge outcomes are invalid');
  if (receipt.consumerObservation.valid.status !== 'PASS' || receipt.consumerObservation.broken.status !== 'FAIL') throw new Error('consumer observation is invalid');
  if (receipt.identityMutationObservation.status !== 'FAIL') throw new Error('identity mutation observation is invalid');
  return { status: 'PASS', receiptIdentity: receipt.receiptIdentity };
}

function buildChallengeBundle({ validArtifact, brokenArtifact, validEntitlement, brokenEntitlement, receipt }) {
  const unsigned = {
    schemaVersion: 1,
    validArtifact,
    brokenArtifact,
    validEntitlement,
    brokenEntitlement,
    receipt,
  };
  return { ...unsigned, bundleIdentity: identity(unsigned) };
}

function verifyChallengeBundle(bundle, options) {
  if (!bundle || bundle.schemaVersion !== 1) throw new Error('challenge bundle schemaVersion must be 1');
  const unsigned = { ...bundle };
  delete unsigned.bundleIdentity;
  if (identity(unsigned) !== bundle.bundleIdentity) throw new Error('challenge bundle identity mismatch');
  return verifyChallengeReceipt(bundle.receipt, {
    validArtifact: bundle.validArtifact,
    brokenArtifact: bundle.brokenArtifact,
    validEntitlement: bundle.validEntitlement,
    brokenEntitlement: bundle.brokenEntitlement,
    ...options,
  });
}

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    if (!flag || !flag.startsWith('--') || argv[i + 1] === undefined) throw new Error(`invalid option ${flag || ''}`.trim());
    flags[flag.slice(2)] = argv[i + 1];
  }
  return flags;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function selectionObservation(batchPath, bundlePath) {
  const run = spawnSync(process.execPath, [
    'solver/generate-levels.js',
    '--select-from', batchPath,
    '--seed-variance-bundle', bundlePath,
  ], { cwd: ROOT, encoding: 'utf8' });
  const match = run.stdout.match(/^SELECTED (.*)$/m);
  return {
    status: run.status === 0 ? 'PASS' : 'FAIL',
    exitCode: run.status,
    selected: run.status === 0 && match && match[1] ? match[1].split(',') : [],
    output: run.status === 0 ? run.stdout.trim() : run.stderr.trim(),
  };
}

function challengeCommand(flags) {
  for (const name of ['artifact', 'protocol', 'decision-rule', 'batch', 'out-dir']) {
    if (!flags[name]) throw new Error(`--${name} is required`);
  }
  const validArtifact = readJson(flags.artifact);
  verifyArtifact(validArtifact);
  const currentIdentities = sourceIdentities();
  assertIdentityMap(validArtifact.coveredIdentities, currentIdentities);
  const protocol = committedProtocol(flags.protocol);
  if (canonicalJson(validArtifact.protocol) !== canonicalJson(protocol)) throw new Error('artifact protocol registration mismatch');
  const decisionRule = readJson(flags['decision-rule']);
  const brokenArtifact = createBrokenTwin(validArtifact);
  const validEntitlement = issueEntitlement(validArtifact, { decisionRule, coveredIdentities: currentIdentities });
  const brokenEntitlement = issueEntitlement(brokenArtifact, { decisionRule, coveredIdentities: currentIdentities });
  const outDir = path.resolve(flags['out-dir']);
  const batchPath = path.resolve(flags.batch);
  const batch = readJson(batchPath);
  if (!batch || !Array.isArray(batch.results)) throw new Error('selection input must contain results');
  const consumerSubject = {
    path: path.relative(ROOT, batchPath),
    sha256: absoluteFileIdentity(batchPath),
    batchIdentity: identity(batch),
  };
  const { observeShortlist } = require('./generate-levels');
  const consumerObservation = {
    valid: observeShortlist(batch.results, validEntitlement, consumerSubject.batchIdentity),
    broken: observeShortlist(batch.results, brokenEntitlement, consumerSubject.batchIdentity),
  };
  const mutatedIdentities = { ...currentIdentities, calibrationSolver: '0'.repeat(64) };
  let mutationError = null;
  try {
    verifyEntitlement(validEntitlement, { currentIdentities: mutatedIdentities });
  } catch (error) {
    mutationError = error.message;
  }
  const receipt = buildChallengeReceipt({
    exactClaim: validArtifact.claim,
    validArtifact,
    brokenArtifact,
    validEntitlement,
    brokenEntitlement,
    currentIdentities,
    executionPath: EXECUTION_PATH,
    consumerSubject,
    consumerObservation,
    identityMutationObservation: {
      status: mutationError ? 'FAIL' : 'PASS',
      changedIdentity: 'calibrationSolver',
      error: mutationError,
    },
  });
  const bundle = buildChallengeBundle({ validArtifact, brokenArtifact, validEntitlement, brokenEntitlement, receipt });
  verifyChallengeBundle(bundle, {
    currentIdentities,
    executionPath: EXECUTION_PATH,
    consumerSubject,
    consumerObservation,
  });
  writeJson(path.join(outDir, 'challenge-bundle.json'), bundle);
  process.stdout.write(`CHALLENGE RECEIPT PASS ${receipt.receiptIdentity}\n`);
}

function verifyCommand(flags) {
  for (const name of ['artifact', 'protocol', 'decision-rule', 'batch', 'evidence-dir']) {
    if (!flags[name]) throw new Error(`--${name} is required`);
  }
  const evidenceDir = path.resolve(flags['evidence-dir']);
  const bundlePath = path.join(evidenceDir, 'challenge-bundle.json');
  const bundle = readJson(bundlePath);
  const { validArtifact, validEntitlement, brokenEntitlement, receipt } = bundle;
  const suppliedArtifact = readJson(flags.artifact);
  verifyArtifact(suppliedArtifact);
  if (suppliedArtifact.artifactIdentity !== validArtifact.artifactIdentity) throw new Error('supplied artifact identity mismatch');
  const currentIdentities = sourceIdentities();
  const protocol = committedProtocol(flags.protocol);
  if (canonicalJson(validArtifact.protocol) !== canonicalJson(protocol)) throw new Error('artifact protocol registration mismatch');
  if (canonicalJson(validEntitlement.decisionRule) !== canonicalJson(readJson(flags['decision-rule']))) {
    throw new Error('decision rule mismatch');
  }
  const batchPath = path.resolve(flags.batch);
  const batch = readJson(batchPath);
  const consumerSubject = { path: path.relative(ROOT, batchPath), sha256: absoluteFileIdentity(batchPath), batchIdentity: identity(batch) };
  const { observeShortlist } = require('./generate-levels');
  const consumerObservation = {
    valid: observeShortlist(batch.results, validEntitlement, consumerSubject.batchIdentity),
    broken: observeShortlist(batch.results, brokenEntitlement, consumerSubject.batchIdentity),
  };
  verifyChallengeBundle(bundle, { currentIdentities, executionPath: EXECUTION_PATH, consumerSubject, consumerObservation });
  const replay = selectionObservation(batchPath, bundlePath);
  if (replay.status !== 'PASS' || canonicalJson(replay.selected) !== canonicalJson(receipt.consumerObservation.valid.selected)) {
    throw new Error('valid consumer CLI replay mismatch');
  }
  const mutated = { ...currentIdentities, calibrationSolver: '0'.repeat(64) };
  let mutationFailed = false;
  try {
    verifyChallengeBundle(bundle, { currentIdentities: mutated, executionPath: EXECUTION_PATH, consumerSubject, consumerObservation });
  } catch {
    mutationFailed = true;
  }
  if (!mutationFailed) throw new Error('covered identity mutation did not invalidate entitlement');
  process.stdout.write(`SEED VARIANCE CHALLENGE PASS ${receipt.receiptIdentity}\n`);
}

function runCommand(flags) {
  for (const name of ['protocol', 'out', 'sample-a-start', 'sample-b-start', 'count']) {
    if (!flags[name]) throw new Error(`--${name} is required`);
  }
  const { LEVELS } = require('../src/game');
  const protocol = committedProtocol(flags.protocol);
  const count = Number(flags.count);
  const artifact = measureSubject({
    claim: 'structural candidate ranking is stable across two disjoint seed samples and single-seed reliability is sufficient for candidate differentiation',
    candidates: LEVELS,
    samples: {
      a: { start: Number(flags['sample-a-start']), count },
      b: { start: Number(flags['sample-b-start']), count },
    },
    protocol,
    coveredIdentities: sourceIdentities(),
  });
  writeJson(path.resolve(flags.out), artifact);
  process.stdout.write(`SEED VARIANCE ARTIFACT PASS ${artifact.artifactIdentity}\n`);
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const flags = parseFlags(argv.slice(1));
  if (command === 'run') return runCommand(flags);
  if (command === 'challenge') return challengeCommand(flags);
  if (command === 'verify') return verifyCommand(flags);
  throw new Error('command must be run, challenge, or verify');
}

module.exports = {
  analyzeArtifact,
  buildChallengeBundle,
  buildChallengeReceipt,
  canonicalJson,
  createArtifact,
  createBrokenTwin,
  committedProtocol,
  EXECUTION_PATH,
  identity,
  issueEntitlement,
  measureSubject,
  sourceIdentities,
  verifyArtifact,
  verifyChallengeBundle,
  verifyChallengeReceipt,
  verifyEntitlement,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}
