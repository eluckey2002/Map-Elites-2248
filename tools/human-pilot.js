#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createAuthoringServer } = require('../solver/authoring-server');
const { identity, serialize } = require('../solver/level-author');
const { candidateIndex, partition, readRecordings, replay } = require('../solver/recording-replay');

const ROOT = path.join(__dirname, '..');
const PILOT_DIR = path.join(ROOT, 'pilots', 'HUMAN-PILOT-0001');
const SOURCE_BATCH = path.join(ROOT, 'solver', 'generated-batch-04.json');
const RECORDINGS_DIR = path.join(ROOT, 'recordings');
const CANDIDATE_NAME = 'gen-0008';
const EXPECTED_CANDIDATE_IDENTITY = '4db4d815f7f36f59b2710b195a56a1a36b35053a5c19ad283db679b6c4f7876d';
const EXPECTED_BATCH_IDENTITY = '5b0dd3bfd0d79a977d68f54ad1c59cc736b50c98459a3113e05f1ef2fa5a4c1f';
const BASE_COMMIT = '5090098337be5e8cfd8f78ee6ee2971cd843cf52';
const PILOT_SEED = 424242;
const PORT = 2248;
const RUNTIME_FILES = [
  'src/game.js',
  'solver/engine.js',
  'solver/authoring-server.js',
  'solver/recording-replay.js',
  'tools/human-pilot.js',
];
const FORBIDDEN_AUTHORITY_CLAIMS = [
  'historically measured', 'ranked correctly', 'representative', 'calibrated',
  'eligible', 'ready to ship', 'evidence about a human-performance distribution',
];

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fileIdentity(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function artifactIdentity(value) {
  const unsigned = { ...value };
  delete unsigned.artifactIdentity;
  return identity(unsigned);
}

function buildRuntimeBundle(overrides = {}) {
  const members = RUNTIME_FILES.map((relativePath) => ({
    path: relativePath,
    identity: fileIdentity(overrides[relativePath] || path.join(ROOT, relativePath)),
  }));
  const declaration = { schemaVersion: 1, members };
  return { ...declaration, identity: identity(declaration) };
}

function buildSessionProtocol(subjectIdentity, override) {
  const declaration = override || {
    ownerCount: 1,
    ownerRole: 'project owner',
    subjectIdentity,
    terminalRecordingCount: 1,
    automatedPlayer: false,
    ownerAttestation: 'Owner identity and protocol compliance require later explicit owner attestation; file identity proves neither.',
  };
  return { declaration, identity: identity(declaration) };
}

function pilotPaths(dir = PILOT_DIR) {
  return {
    dir,
    manifest: path.join(dir, 'manifest.json'),
    store: path.join(dir, 'candidate.json'),
    receipt: path.join(dir, 'candidate.receipt.json'),
    challenge: path.join(dir, 'replay-challenge.json'),
    recordings: path.join(dir, 'recordings'),
    execution: path.join(dir, 'execution-receipt.json'),
  };
}

function sourceCandidate() {
  if (fileIdentity(SOURCE_BATCH) !== EXPECTED_BATCH_IDENTITY) throw new Error('source batch identity mismatch');
  const entry = readJson(SOURCE_BATCH).results.find((item) => item.candidate && item.candidate.name === CANDIDATE_NAME);
  if (!entry || identity(entry.candidate) !== EXPECTED_CANDIDATE_IDENTITY) throw new Error('exact candidate not found in source batch');
  return entry;
}

function buildPilotArtifacts(options = {}) {
  const entry = sourceCandidate();
  const subjectIdentity = identity({ candidateIdentity: EXPECTED_CANDIDATE_IDENTITY, seed: PILOT_SEED });
  const nonClaims = FORBIDDEN_AUTHORITY_CLAIMS;
  const runtimeBundle = buildRuntimeBundle(options.runtimeFileOverrides);
  const sessionProtocol = buildSessionProtocol(subjectIdentity, options.sessionProtocolDeclaration);
  const manifest = {
    schemaVersion: 1,
    pilot: 'HUMAN-PILOT-0001',
    subject: { candidateName: CANDIDATE_NAME, candidateIdentity: EXPECTED_CANDIDATE_IDENTITY, level: 53, seed: PILOT_SEED, subjectIdentity },
    source: { batch: 'solver/generated-batch-04.json', batchIdentity: EXPECTED_BATCH_IDENTITY, baseCommit: BASE_COMMIT },
    selectionAuthority: 'deterministic convenience for this single exploratory owner pilot only',
    nonClaims,
    runtimeBundle,
    sessionProtocol,
    recordingDestination: 'pilots/HUMAN-PILOT-0001/recordings/',
  };
  manifest.artifactIdentity = artifactIdentity(manifest);
  const receipt = {
    schemaVersion: 1,
    candidateIdentity: EXPECTED_CANDIDATE_IDENTITY,
    sourceBatchIdentity: EXPECTED_BATCH_IDENTITY,
    sourceReceiptIdentity: entry.receipt.receiptIdentity,
    manifestIdentity: manifest.artifactIdentity,
    runtimeBundleIdentity: runtimeBundle.identity,
    protocolIdentity: sessionProtocol.identity,
    authority: manifest.selectionAuthority,
    nonClaims,
  };
  receipt.artifactIdentity = artifactIdentity(receipt);
  return { manifest, store: { schemaVersion: 1, candidates: [entry.candidate] }, receipt };
}

function prepare(dir = PILOT_DIR) {
  const paths = pilotPaths(dir);
  const artifacts = buildPilotArtifacts();
  fs.mkdirSync(paths.recordings, { recursive: true });
  for (const [key, value] of [['manifest', artifacts.manifest], ['store', artifacts.store], ['receipt', artifacts.receipt]]) {
    const bytes = serialize(value);
    if (fs.existsSync(paths[key]) && fs.readFileSync(paths[key], 'utf8') !== bytes) throw new Error(`refusing to overwrite conflicting ${path.basename(paths[key])}`);
    fs.writeFileSync(paths[key], bytes, { flag: fs.existsSync(paths[key]) ? 'w' : 'wx' });
  }
  return inspect(dir);
}

function inspect(dir = PILOT_DIR, options = {}) {
  const paths = pilotPaths(dir);
  const manifest = readJson(paths.manifest);
  const store = readJson(paths.store);
  const receipt = readJson(paths.receipt);
  const candidate = store.candidates && store.candidates[0];
  const expected = buildPilotArtifacts(options);
  const problems = [];
  if (identity(candidate) !== EXPECTED_CANDIDATE_IDENTITY) problems.push('candidate identity mismatch');
  if (manifest.artifactIdentity !== artifactIdentity(manifest)) problems.push('manifest identity mismatch');
  if (receipt.artifactIdentity !== artifactIdentity(receipt)) problems.push('candidate receipt identity mismatch');
  if (serialize({ manifest, store, receipt }) !== serialize(expected)) problems.push('pilot artifacts differ from pinned source');
  return { status: problems.length ? 'FAIL' : 'PASS', problems, subject: manifest.subject, manifestIdentity: manifest.artifactIdentity };
}

function buildChallenge(options = {}) {
  const recordingsDir = options.recordingsDir || RECORDINGS_DIR;
  const index = options.index || candidateIndex();
  const { replayable } = partition(readRecordings(recordingsDir), index);
  if (replayable.length === 0) throw new Error('no real repository recording is replayable');
  const valid = replayable[0];
  const candidateIdentity = identity(valid.candidate);
  if (candidateIdentity !== valid.recording.candidateIdentity) {
    throw new Error('real candidate content identity does not match recording binding');
  }
  const validResult = replay(valid.candidate, valid.recording);
  if (validResult.problems.length) throw new Error(`real recording failed replay: ${validResult.problems.join('; ')}`);
  const broken = { ...valid.recording, score: valid.recording.score + 1 };
  const brokenPath = path.join(os.tmpdir(), `2248-broken-twin-${process.pid}.json`);
  fs.writeFileSync(brokenPath, serialize(broken), { flag: 'wx' });
  let brokenResult;
  try {
    brokenResult = replay(valid.candidate, readJson(brokenPath));
  } finally {
    fs.unlinkSync(brokenPath);
  }
  if (!brokenResult.problems.some((problem) => /final score .* recording claims/.test(problem))) {
    throw new Error('controlled broken twin did not fail through replay predicate');
  }
  const checker = path.join(ROOT, 'solver', 'recording-replay.js');
  const recordingPath = path.join(recordingsDir, valid.file);
  const recordingIdentity = identity(valid.recording);
  const recordingFileIdentity = fileIdentity(recordingPath);
  const checkerIdentity = fileIdentity(checker);
  const challenge = {
    schemaVersion: 1,
    claim: 'A browser-produced recording replays exactly against its content-bound candidate through the headless engine.',
    realSubject: {
      recording: `recordings/${valid.file}`,
      recordingIdentity,
      recordingFileIdentity,
      candidateIdentity,
      candidateSource: valid.source,
    },
    seam: 'src/game.js AuthoringCapture -> recording JSON -> solver/recording-replay.js -> solver/engine.js',
    validObservation: { verdict: 'PASS', problems: [] },
    brokenTwin: { mutation: 'recording.score + 1', location: 'temporary directory, removed after check', verdict: 'FAIL', observedProblem: brokenResult.problems.find((problem) => /final score .* recording claims/.test(problem)) },
    checker: { path: 'solver/recording-replay.js', identity: checkerIdentity },
    downstreamConsumer: {
      workflow: 'HUMAN-PILOT-0001 post-session qualification',
      technicalConsumer: 'tools/human-pilot.js executionReceipt',
      scope: 'binds replay qualification to the execution receipt; does not determine, verify, or record the separate owner-authored qualitative disposition',
    },
    invalidation: {
      realRecording: { recordingIdentity, recordingFileIdentity },
      realCandidate: { candidateIdentity, candidateSource: valid.source },
      checker: { path: 'solver/recording-replay.js', identity: checkerIdentity },
      challengeReceipt: { identityField: 'artifactIdentity', rule: 'sha256 canonical JSON excluding artifactIdentity' },
    },
    nonClaims: FORBIDDEN_AUTHORITY_CLAIMS,
  };
  challenge.artifactIdentity = artifactIdentity(challenge);
  return challenge;
}

function challenge(dir = PILOT_DIR, write = true) {
  const paths = pilotPaths(dir);
  const observed = buildChallenge();
  if (write) {
    const bytes = serialize(observed);
    if (fs.existsSync(paths.challenge) && fs.readFileSync(paths.challenge, 'utf8') !== bytes) throw new Error('existing challenge receipt is stale or conflicting');
    fs.writeFileSync(paths.challenge, bytes, { flag: fs.existsSync(paths.challenge) ? 'w' : 'wx' });
  } else if (serialize(readJson(paths.challenge)) !== serialize(observed)) {
    throw new Error('challenge receipt does not match fresh real-artifact challenge');
  }
  return { status: 'PASS', challengeIdentity: observed.artifactIdentity, ...observed };
}

function executionReceipt(recordingFile, dir = PILOT_DIR, options = {}) {
  const paths = pilotPaths(dir);
  const inspection = inspect(dir, options);
  if (inspection.status !== 'PASS') throw new Error(`pilot inspection failed: ${inspection.problems.join('; ')}`);
  challenge(dir, false);
  const manifest = readJson(paths.manifest);
  const store = readJson(paths.store);
  const challengeReceipt = readJson(paths.challenge);
  const recording = readJson(recordingFile);
  if (recording.candidateIdentity !== manifest.subject.candidateIdentity || recording.seed !== manifest.subject.seed) {
    throw new Error('recording is not the pinned pilot subject');
  }
  const result = options.replayResult || replay(store.candidates[0], recording);
  const checkerIdentity = options.checkerIdentity || fileIdentity(path.join(ROOT, 'solver', 'recording-replay.js'));
  const receipt = {
    schemaVersion: 1,
    subjectIdentity: manifest.subject.subjectIdentity,
    candidateIdentity: identity(store.candidates[0]),
    runtimeBundleIdentity: manifest.runtimeBundle.identity,
    protocolIdentity: manifest.sessionProtocol.identity,
    manifestIdentity: manifest.artifactIdentity,
    recordingIdentity: identity(recording),
    recordingFileIdentity: options.recordingFileIdentity || fileIdentity(recordingFile),
    checkerIdentity,
    challengeReceiptIdentity: options.challengeReceiptIdentity || challengeReceipt.artifactIdentity,
    verdict: result.problems.length ? 'FAIL' : 'PASS',
    replay: { score: result.score, moves: result.moves, problems: result.problems },
  };
  receipt.artifactIdentity = artifactIdentity(receipt);
  return receipt;
}

function verifyExecution(receipt, recordingFile, dir = PILOT_DIR, options = {}) {
  let expected;
  try {
    expected = executionReceipt(recordingFile, dir, options);
  } catch (error) {
    return { status: 'FAIL', problems: [error.message] };
  }
  const problems = [];
  if (receipt.artifactIdentity !== artifactIdentity(receipt)) problems.push('execution receipt identity mismatch');
  if (serialize(receipt) !== serialize(expected)) problems.push('execution receipt does not match current subject, recording, checker, or challenge');
  if (receipt.verdict !== 'PASS') problems.push('replay verdict is not PASS');
  return { status: problems.length ? 'FAIL' : 'PASS', problems };
}

function singleRecording(dir) {
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.json'));
  if (files.length !== 1) throw new Error(`expected exactly one recording in ${dir}, found ${files.length}`);
  return path.join(dir, files[0]);
}

function serve(dir = PILOT_DIR) {
  const paths = pilotPaths(dir);
  if (inspect(dir).status !== 'PASS') throw new Error('pilot artifacts fail inspection');
  const server = createAuthoringServer({ store: readJson(paths.store), receipt: readJson(paths.receipt), recordingsDir: paths.recordings, fixedSeed: PILOT_SEED });
  server.listen(PORT, '127.0.0.1', () => process.stdout.write(`Authoring URL: http://127.0.0.1:${PORT}/index.html?candidate=53&seed=${PILOT_SEED}\n`));
  return server;
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  let result;
  if (command === 'prepare') result = prepare();
  else if (command === 'inspect') result = inspect();
  else if (command === 'challenge') result = challenge();
  else if (command === 'serve') return serve();
  else if (command === 'execute') {
    const recordingFile = singleRecording(pilotPaths().recordings);
    const receipt = executionReceipt(recordingFile);
    fs.writeFileSync(pilotPaths().execution, serialize(receipt), { flag: fs.existsSync(pilotPaths().execution) ? 'w' : 'wx' });
    result = { receipt: pilotPaths().execution, verification: verifyExecution(receipt, recordingFile) };
  } else if (command === 'verify-execution') {
    const recordingFile = singleRecording(pilotPaths().recordings);
    result = verifyExecution(readJson(pilotPaths().execution), recordingFile);
  } else throw new Error('usage: human-pilot.js prepare|inspect|challenge|serve|execute|verify-execution');
  process.stdout.write(serialize(result));
  if (result.status === 'FAIL' || (result.verification && result.verification.status === 'FAIL')) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  artifactIdentity,
  buildChallenge,
  buildPilotArtifacts,
  buildRuntimeBundle,
  buildSessionProtocol,
  challenge,
  executionReceipt,
  inspect,
  pilotPaths,
  prepare,
  verifyExecution,
};
