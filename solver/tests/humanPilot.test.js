const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { identity, serialize } = require('../level-author');
const {
  artifactIdentity,
  buildChallenge,
  buildPilotArtifacts,
  challenge,
  executionReceipt,
  inspect,
  pilotPaths,
  prepare,
  verifyExecution,
} = require('../../tools/human-pilot');

const EXPECTED_CANDIDATE = '4db4d815f7f36f59b2710b195a56a1a36b35053a5c19ad283db679b6c4f7876d';

function tempPilot() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), '2248-human-pilot-'));
  prepare(dir);
  challenge(dir);
  return dir;
}

function fixtureRecording(file) {
  fs.writeFileSync(file, serialize({
    schemaVersion: 1,
    candidateIdentity: EXPECTED_CANDIDATE,
    candidateLevel: 53,
    seed: 424242,
    outcome: 'lose',
    reason: 'verifier fixture only',
    score: 0,
    movesUsed: 0,
    chains: [],
  }));
}

test('pilot artifacts bind the exact candidate, seed, batch, base, authority, and non-claims', () => {
  const artifacts = buildPilotArtifacts();
  assert.equal(identity(artifacts.store.candidates[0]), EXPECTED_CANDIDATE);
  assert.equal(artifacts.manifest.subject.seed, 424242);
  assert.equal(artifacts.manifest.source.batchIdentity, '5b0dd3bfd0d79a977d68f54ad1c59cc736b50c98459a3113e05f1ef2fa5a4c1f');
  assert.equal(artifacts.manifest.source.baseCommit, '5090098337be5e8cfd8f78ee6ee2971cd843cf52');
  assert.match(artifacts.manifest.selectionAuthority, /single exploratory owner pilot only/);
  assert.deepEqual(artifacts.manifest.nonClaims, [
    'historically measured', 'ranked correctly', 'representative', 'calibrated',
    'eligible', 'ready to ship', 'evidence about a human-performance distribution',
  ]);
  assert.deepEqual(artifacts.manifest.runtimeBundle.members.map((member) => member.path), [
    'src/game.js', 'solver/engine.js', 'solver/authoring-server.js',
    'solver/recording-replay.js', 'tools/human-pilot.js',
  ]);
  const runtimeDeclaration = { ...artifacts.manifest.runtimeBundle };
  delete runtimeDeclaration.identity;
  assert.equal(artifacts.manifest.runtimeBundle.identity, identity(runtimeDeclaration));
  assert.deepEqual(artifacts.manifest.sessionProtocol.declaration, {
    ownerCount: 1,
    ownerRole: 'project owner',
    subjectIdentity: artifacts.manifest.subject.subjectIdentity,
    terminalRecordingCount: 1,
    automatedPlayer: false,
    ownerAttestation: 'Owner identity and protocol compliance require later explicit owner attestation; file identity proves neither.',
  });
  assert.equal(
    artifacts.manifest.sessionProtocol.identity,
    identity(artifacts.manifest.sessionProtocol.declaration),
  );
  assert.equal(artifacts.manifest.artifactIdentity, artifactIdentity(artifacts.manifest));
});

test('focused inspection reads the durable pilot artifacts and refuses candidate drift', () => {
  const dir = tempPilot();
  assert.deepEqual(inspect(dir).problems, []);
  const paths = pilotPaths(dir);
  const store = JSON.parse(fs.readFileSync(paths.store, 'utf8'));
  store.candidates[0].target += 1;
  fs.writeFileSync(paths.store, serialize(store));
  assert.match(inspect(dir).problems.join('; '), /candidate identity mismatch|differ from pinned source/);
});

test('focused inspection refuses a controlled changed runtime file supplied beside the tree', () => {
  const dir = tempPilot();
  const changedGame = path.join(dir, 'changed-game.js');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'src', 'game.js'), changedGame);
  fs.appendFileSync(changedGame, '\n// controlled identity change\n');
  const result = inspect(dir, { runtimeFileOverrides: { 'src/game.js': changedGame } });
  assert.equal(result.status, 'FAIL');
  assert.match(result.problems.join('; '), /pilot artifacts differ from pinned source/);
});

test('challenge receipt is a fresh real recording PASS and same-predicate broken-twin FAIL', () => {
  const dir = tempPilot();
  const result = challenge(dir, false);
  assert.equal(result.status, 'PASS');
  assert.equal(result.validObservation.verdict, 'PASS');
  assert.equal(result.brokenTwin.verdict, 'FAIL');
  assert.match(result.brokenTwin.observedProblem, /final score .* recording claims/);
  assert.match(result.realSubject.recording, /^recordings\/[a-f0-9]{64}\.json$/);
});

test('challenge refuses replay-compatible candidate content with the wrong identity', () => {
  const sourceRecording = path.join(__dirname, '..', '..', 'recordings', '1352aa7a02cdf868c92b47ecb492528c699692699ecfd0da54b990836aef4aea.json');
  const recordingsDir = fs.mkdtempSync(path.join(os.tmpdir(), '2248-challenge-recording-'));
  const recording = JSON.parse(fs.readFileSync(sourceRecording, 'utf8'));
  fs.copyFileSync(sourceRecording, path.join(recordingsDir, path.basename(sourceRecording)));
  const candidate = require('../recording-replay').candidateIndex().get(recording.candidateIdentity).candidate;
  const wrongCandidate = { ...candidate, name: `${candidate.name}-wrong-twin` };
  const index = new Map([[recording.candidateIdentity, { candidate: wrongCandidate, source: 'wrong-twin.json' }]]);

  assert.throws(
    () => buildChallenge({ index, recordingsDir }),
    /candidate content identity does not match recording binding/,
  );
});

test('execution verifier invalidates candidate, recording, checker, and challenge identities', () => {
  const dir = tempPilot();
  const paths = pilotPaths(dir);
  const recordingFile = path.join(dir, 'fixture-recording.json');
  fixtureRecording(recordingFile);
  const replayResult = { problems: [], score: 0, moves: 0 };
  const receipt = executionReceipt(recordingFile, dir, { replayResult });
  assert.equal(receipt.verdict, 'PASS');
  const manifest = JSON.parse(fs.readFileSync(paths.manifest, 'utf8'));
  assert.equal(receipt.runtimeBundleIdentity, manifest.runtimeBundle.identity);
  assert.equal(receipt.protocolIdentity, manifest.sessionProtocol.identity);
  assert.equal(receipt.manifestIdentity, manifest.artifactIdentity);
  assert.deepEqual(verifyExecution(receipt, recordingFile, dir, { replayResult }), { status: 'PASS', problems: [] });

  const changedRuntime = path.join(dir, 'changed-runtime.js');
  fs.copyFileSync(path.join(__dirname, '..', '..', 'src', 'game.js'), changedRuntime);
  fs.appendFileSync(changedRuntime, '\n// controlled receipt invalidation\n');
  assert.equal(verifyExecution(receipt, recordingFile, dir, {
    replayResult,
    runtimeFileOverrides: { 'src/game.js': changedRuntime },
  }).status, 'FAIL');

  const changedProtocol = {
    ...manifest.sessionProtocol.declaration,
    terminalRecordingCount: 2,
  };
  assert.equal(verifyExecution(receipt, recordingFile, dir, {
    replayResult,
    sessionProtocolDeclaration: changedProtocol,
  }).status, 'FAIL');

  const changedRecording = JSON.parse(fs.readFileSync(recordingFile, 'utf8'));
  changedRecording.reason = 'changed';
  fs.writeFileSync(recordingFile, serialize(changedRecording));
  assert.equal(verifyExecution(receipt, recordingFile, dir, { replayResult }).status, 'FAIL');
  fixtureRecording(recordingFile);

  const checkerChanged = executionReceipt(recordingFile, dir, { replayResult, checkerIdentity: '0'.repeat(64) });
  assert.equal(verifyExecution(checkerChanged, recordingFile, dir, { replayResult }).status, 'FAIL');

  const candidateStore = JSON.parse(fs.readFileSync(paths.store, 'utf8'));
  candidateStore.candidates[0].target += 1;
  fs.writeFileSync(paths.store, serialize(candidateStore));
  assert.equal(verifyExecution(receipt, recordingFile, dir, { replayResult }).status, 'FAIL');
  fs.writeFileSync(paths.store, serialize(buildPilotArtifacts().store));

  const challengeReceipt = JSON.parse(fs.readFileSync(paths.challenge, 'utf8'));
  challengeReceipt.claim = 'changed';
  challengeReceipt.artifactIdentity = artifactIdentity(challengeReceipt);
  fs.writeFileSync(paths.challenge, serialize(challengeReceipt));
  assert.equal(verifyExecution(receipt, recordingFile, dir, { replayResult }).status, 'FAIL');
});
