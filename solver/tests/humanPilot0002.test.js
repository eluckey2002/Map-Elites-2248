// HUMAN-PILOT-0002 replay qualification: the committed receipts must be
// reproducible, the real subject must PASS, and a broken twin must FAIL through
// the same predicate. Every check here reads the real pilot directory.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const DIR = path.join(ROOT, 'pilots', 'HUMAN-PILOT-0002');
const q = require(path.join(DIR, 'qualify.js'));
const { replay } = require('../recording-replay');
const { serialize } = require('../level-author');

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

test('the real subject binds one candidate, one seed, and one content-named recording', () => {
  const subject = q.loadSubject(DIR);
  assert.deepEqual(subject.problems, []);
  assert.equal(subject.candidateIdentity, '0d7604e7b6d6142dce6ad8c6f4d1a2a62b2ea1031b5e3ccf3fd93643799585f4');
  assert.equal(subject.recording.seed, 424242);
});

test('the real recording replays exactly: 140,544 points in 20 moves', () => {
  const subject = q.loadSubject(DIR);
  const result = replay(subject.candidate, subject.recording);
  assert.deepEqual(result, { problems: [], score: 140544, moves: 20 });
});

test('a broken twin fails through the same predicate, and so does a tampered move', () => {
  const subject = q.loadSubject(DIR);
  const twin = { ...subject.recording, score: subject.recording.score + 1 };
  assert.match(replay(subject.candidate, twin).problems.join('\n'), /final score 140544, recording claims 140545/);
  const tampered = JSON.parse(JSON.stringify(subject.recording));
  tampered.chains[5].tiles[0].value *= 2;
  assert.ok(replay(subject.candidate, tampered).problems.length > 0);
});

test('committed challenge and execution receipt reproduce and verify PASS', () => {
  const challenge = q.buildChallenge(DIR);
  assert.equal(serialize(challenge), serialize(readJson(path.join(DIR, 'replay-challenge.json'))));
  assert.equal(challenge.brokenTwin.verdict, 'FAIL');
  assert.equal(challenge.validObservation.verdict, 'PASS');
  const receipt = readJson(path.join(DIR, 'execution-receipt.json'));
  assert.deepEqual(q.verifyExecution(receipt, DIR), { status: 'PASS', problems: [] });
});

test('the receipt is invalidated by a changed recording, a changed checker identity, or a forged verdict', () => {
  const receipt = readJson(path.join(DIR, 'execution-receipt.json'));
  const subject = q.loadSubject(DIR);
  const altered = path.join(fs.mkdtempSync(path.join(os.tmpdir(), '2248-pilot2-')), 'altered.json');
  fs.writeFileSync(altered, serialize({ ...subject.recording, movesUsed: subject.recording.movesUsed }));
  // Same content, different bytes: the file identity changes and the receipt must not verify.
  const byFile = q.verifyExecution(receipt, DIR, { recordingFile: altered });
  assert.equal(byFile.status, 'FAIL');
  const byChecker = q.verifyExecution(receipt, DIR, { checkerIdentity: '0'.repeat(64) });
  assert.equal(byChecker.status, 'FAIL');
  const forged = { ...receipt, verdict: 'PASS', replay: { ...receipt.replay, score: 1 } };
  assert.equal(q.verifyExecution(forged, DIR).status, 'FAIL');
  assert.ok(q.verifyExecution(forged, DIR).problems.includes('execution receipt identity mismatch'));
});
