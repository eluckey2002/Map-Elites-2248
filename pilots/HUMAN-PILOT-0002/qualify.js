#!/usr/bin/env node
// Replay qualification for HUMAN-PILOT-0002.
//
// The first pilot's qualifier (tools/human-pilot.js) is bound to that pilot's
// source batch and runtime bundle, so this exploratory subject carries its own
// thin qualifier over the SAME shared checker, solver/recording-replay.js. It
// answers one question only: does the browser-produced recording replay
// exactly, through the headless engine, against the content-bound candidate
// and seed the manifest names? It does not calibrate, rank, select, or ship,
// and it does not record the owner's qualitative disposition.
//
//   node pilots/HUMAN-PILOT-0002/qualify.js write    # write replay-challenge.json + execution-receipt.json
//   node pilots/HUMAN-PILOT-0002/qualify.js verify   # recompute both and compare to the committed copies
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const { identity, serialize } = require(path.join(ROOT, 'solver', 'level-author'));
const { replay } = require(path.join(ROOT, 'solver', 'recording-replay'));

const PILOT = 'HUMAN-PILOT-0002';
const CHECKER = 'solver/recording-replay.js';
const RUNTIME_FILES = ['src/game.js', 'solver/engine.js', CHECKER, 'pilots/HUMAN-PILOT-0002/qualify.js'];
const NON_CLAIMS = [
  'calibrated', 'representative', 'eligible', 'ready to ship', 'causal blocker-position effect',
  'evidence about a human-performance distribution', 'owner qualitative disposition',
];

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function fileIdentity(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function artifactIdentity(value) { const unsigned = { ...value }; delete unsigned.artifactIdentity; return identity(unsigned); }

function pilotPaths(dir = __dirname) {
  return {
    dir,
    manifest: path.join(dir, 'manifest.json'),
    store: path.join(dir, 'candidate.json'),
    binding: path.join(dir, 'subject-binding.json'),
    recordings: path.join(dir, 'recordings'),
    challenge: path.join(dir, 'replay-challenge.json'),
    receipt: path.join(dir, 'execution-receipt.json'),
  };
}

// The one recording, the one candidate, and every identity they must agree on.
function loadSubject(dir = __dirname, options = {}) {
  const paths = pilotPaths(dir);
  const manifest = readJson(paths.manifest);
  const store = readJson(paths.store);
  const binding = readJson(paths.binding);
  const candidate = store.candidates[0];
  const problems = [];
  const candidateIdentity = identity(candidate);
  if (candidateIdentity !== binding.candidateIdentity) problems.push('candidate content identity does not match subject binding');
  if (candidateIdentity !== manifest.subject.candidateIdentity) problems.push('candidate content identity does not match manifest subject');
  if (binding.seed !== manifest.subject.seed) problems.push('binding seed does not match manifest seed');
  const files = fs.readdirSync(paths.recordings).filter((f) => f.endsWith('.json'));
  if (files.length !== 1) problems.push(`expected exactly one terminal recording, found ${files.length}`);
  const recordingFile = options.recordingFile || path.join(paths.recordings, files[0]);
  const recording = readJson(recordingFile);
  if (recording.candidateIdentity !== candidateIdentity) problems.push('recording is bound to a different candidate identity');
  if (recording.seed !== manifest.subject.seed) problems.push('recording seed is not the pinned pilot seed');
  if (!options.recordingFile && identity(recording) !== path.basename(files[0], '.json')) problems.push('recording file name is not its content identity');
  return { paths, manifest, candidate, candidateIdentity, binding, recording, recordingFile, problems };
}

function runtimeBundle() {
  const members = RUNTIME_FILES.map((rel) => ({ path: rel, identity: fileIdentity(path.join(ROOT, rel)) }));
  return { members, identity: identity(members) };
}

// Real subject must PASS and a same-predicate broken twin must FAIL, both
// through the shared checker, before any receipt is written.
function buildChallenge(dir = __dirname, options = {}) {
  const subject = loadSubject(dir, options);
  if (subject.problems.length) throw new Error(`subject inspection failed: ${subject.problems.join('; ')}`);
  const validResult = replay(subject.candidate, subject.recording);
  if (validResult.problems.length) throw new Error(`real recording failed replay: ${validResult.problems.join('; ')}`);
  const broken = { ...subject.recording, score: subject.recording.score + 1 };
  const brokenPath = path.join(os.tmpdir(), `2248-pilot2-broken-twin-${process.pid}-${Date.now()}.json`);
  fs.writeFileSync(brokenPath, serialize(broken), { flag: 'wx' });
  let brokenResult;
  try { brokenResult = replay(subject.candidate, readJson(brokenPath)); } finally { fs.unlinkSync(brokenPath); }
  const observed = brokenResult.problems.find((p) => /final score .* recording claims/.test(p));
  if (!observed) throw new Error('controlled broken twin did not fail through the replay predicate');
  const checkerIdentity = options.checkerIdentity || fileIdentity(path.join(ROOT, CHECKER));
  const challenge = {
    schemaVersion: 1,
    pilot: PILOT,
    claim: 'The browser-produced recording replays exactly against its content-bound candidate and pinned seed through the headless engine.',
    realSubject: {
      recording: `recordings/${path.basename(subject.recordingFile)}`,
      recordingIdentity: identity(subject.recording),
      recordingFileIdentity: fileIdentity(subject.recordingFile),
      candidateIdentity: subject.candidateIdentity,
      subjectIdentity: subject.binding.subjectIdentity,
      seed: subject.manifest.subject.seed,
    },
    seam: 'src/game.js AuthoringCapture -> recording JSON -> solver/recording-replay.js -> solver/engine.js',
    validObservation: { verdict: 'PASS', problems: [], score: validResult.score, moves: validResult.moves },
    brokenTwin: { mutation: 'recording.score + 1', location: 'temporary directory, removed after check', verdict: 'FAIL', observedProblem: observed },
    checker: { path: CHECKER, identity: checkerIdentity },
    downstreamConsumer: {
      workflow: `${PILOT} post-session replay qualification`,
      technicalConsumer: 'pilots/HUMAN-PILOT-0002/qualify.js executionReceipt',
      scope: 'binds replay qualification to the execution receipt; does not determine, verify, or record any owner qualitative disposition',
    },
    nonClaims: NON_CLAIMS,
  };
  challenge.artifactIdentity = artifactIdentity(challenge);
  return challenge;
}

function executionReceipt(dir = __dirname, options = {}) {
  const subject = loadSubject(dir, options);
  if (subject.problems.length) throw new Error(`subject inspection failed: ${subject.problems.join('; ')}`);
  const challenge = buildChallenge(dir, options);
  const result = replay(subject.candidate, subject.recording);
  const receipt = {
    schemaVersion: 1,
    pilot: PILOT,
    subjectIdentity: subject.binding.subjectIdentity,
    candidateIdentity: subject.candidateIdentity,
    seed: subject.manifest.subject.seed,
    manifestIdentity: fileIdentity(subject.paths.manifest),
    manifestEvidenceStanding: subject.manifest.evidenceStanding,
    recordingIdentity: identity(subject.recording),
    recordingFileIdentity: fileIdentity(subject.recordingFile),
    checkerIdentity: challenge.checker.identity,
    challengeReceiptIdentity: challenge.artifactIdentity,
    runtimeBundleIdentity: runtimeBundle().identity,
    verdict: result.problems.length ? 'FAIL' : 'PASS',
    replay: { score: result.score, moves: result.moves, problems: result.problems },
    nonClaims: NON_CLAIMS,
  };
  receipt.artifactIdentity = artifactIdentity(receipt);
  return receipt;
}

function verifyExecution(receipt, dir = __dirname, options = {}) {
  let expected;
  try { expected = executionReceipt(dir, options); } catch (error) { return { status: 'FAIL', problems: [error.message] }; }
  const problems = [];
  if (receipt.artifactIdentity !== artifactIdentity(receipt)) problems.push('execution receipt identity mismatch');
  if (serialize(receipt) !== serialize(expected)) problems.push('execution receipt does not match current subject, recording, checker, runtime, or challenge');
  if (receipt.verdict !== 'PASS') problems.push('replay verdict is not PASS');
  return { status: problems.length ? 'FAIL' : 'PASS', problems };
}

function main(argv = process.argv.slice(2)) {
  const paths = pilotPaths();
  const command = argv[0];
  if (command === 'write') {
    const challenge = buildChallenge();
    fs.writeFileSync(paths.challenge, serialize(challenge));
    const receipt = executionReceipt();
    fs.writeFileSync(paths.receipt, serialize(receipt));
    process.stdout.write(`${receipt.verdict}: ${receipt.replay.score} points in ${receipt.replay.moves} moves; receipt ${receipt.artifactIdentity}\n`);
    return receipt.verdict === 'PASS' ? 0 : 1;
  }
  if (command === 'verify') {
    const committedChallenge = readJson(paths.challenge);
    const challenge = buildChallenge();
    const problems = [];
    if (serialize(committedChallenge) !== serialize(challenge)) problems.push('committed replay challenge does not match a fresh one');
    const verdict = verifyExecution(readJson(paths.receipt));
    problems.push(...verdict.problems);
    process.stdout.write(`${problems.length ? 'FAIL' : 'PASS'}${problems.length ? `: ${problems.join('; ')}` : ''}\n`);
    return problems.length ? 1 : 0;
  }
  process.stderr.write('usage: qualify.js write|verify\n');
  return 2;
}

module.exports = { artifactIdentity, buildChallenge, executionReceipt, loadSubject, pilotPaths, runtimeBundle, verifyExecution };
if (require.main === module) process.exit(main());
