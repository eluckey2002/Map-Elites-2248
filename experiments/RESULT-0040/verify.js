#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { valueIdentity } = require('../../solver/benchmark-inputs');
const { replayRecording } = require('../../solver/benchmark-replay');
const { assessPuzzle } = require('../../solver/oracle/verify');
const { addedIn } = require('../../tools/verify-experiments');
const {
  BUDGET_MS, REGISTERED_CHALLENGE_IDENTITY, RESULT, ROOT, challengeRows, fileHash, sourceHashes,
} = require('./subject');

function same(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
}

function verifyQualification(qualification, expectedIdentity) {
  const { qualificationIdentity, ...body } = qualification;
  assert.equal(valueIdentity(body), qualificationIdentity, 'qualification identity mismatch');
  assert.equal(qualificationIdentity, expectedIdentity, 'qualification differs from externally supplied identity');
  assert.equal(qualification.verdict, 'PASS', 'harness qualification did not pass');
  assert.equal(qualification.challengeIdentity, REGISTERED_CHALLENGE_IDENTITY, 'qualification challenge mismatch');
  same(qualification.sources, sourceHashes(), 'qualified source identity closure mismatch');
  return qualification;
}

function verifyRegistration(report) {
  const protocolPath = `experiments/${RESULT}/protocol.md`;
  const registeredCommit = addedIn(protocolPath, ROOT);
  assert.ok(registeredCommit, 'registered protocol commit missing');
  assert.deepEqual(report.registration, {
    exploratory: false, protocol: RESULT, protocolCommit: registeredCommit,
  }, 'report registration mismatch');
  execFileSync('git', ['cat-file', '-e', `${registeredCommit}:${protocolPath}`], { cwd: ROOT, stdio: 'ignore' });
  execFileSync('git', ['merge-base', '--is-ancestor', registeredCommit, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
}

function deriveOutcome(rows) {
  if (rows.some(row => row.integrity !== 'PASS')) return 'INCONCLUSIVE';
  return rows.every(row => row.assessment.pass) ? 'SUPPORTED' : 'FALSIFIED';
}

function verifyReport(report, { expectedChallengeIdentity, expectedQualificationIdentity, qualification }) {
  assert.equal(expectedChallengeIdentity, REGISTERED_CHALLENGE_IDENTITY, 'external challenge identity is not registered');
  verifyQualification(qualification, expectedQualificationIdentity);
  const { artifactIdentity, ...body } = report;
  assert.equal(valueIdentity(body), artifactIdentity, 'report identity mismatch');
  assert.equal(report.challengeIdentity, expectedChallengeIdentity, 'report challenge identity mismatch');
  assert.equal(report.qualificationIdentity, expectedQualificationIdentity, 'report qualification identity mismatch');
  assert.equal(report.captureManifestIdentity, fileHash('experiments/RESULT-0040/captures.json'), 'capture manifest identity mismatch');
  assert.equal(report.budgetMs, BUDGET_MS, 'oracle budget mismatch');
  assert.equal(report.attemptsPerBoard, 1, 'oracle attempt count mismatch');
  assert.equal(report.complete, true, 'report is not complete');
  same(report.sources, sourceHashes(), 'report source identity closure mismatch');
  verifyRegistration(report);

  const expectedRows = challengeRows();
  assert.equal(report.rows.length, expectedRows.length, 'missing challenge rows');
  assert.equal(new Set(report.rows.map(row => row.boardId)).size, expectedRows.length, 'duplicate challenge rows');
  for (const expected of expectedRows) {
    const row = report.rows.find(candidate => candidate.boardId === expected.boardId);
    assert.ok(row, `missing ${expected.boardId}`);
    assert.equal(row.level, expected.levelNumber, `${expected.boardId} level mismatch`);
    assert.equal(row.seed, expected.seed, `${expected.boardId} seed mismatch`);
    assert.equal(row.puzzleIdentity, expected.puzzleIdentity, `${expected.boardId} puzzle identity mismatch`);
    const replay = replayRecording(expected.input.level, expected.recording, { expectedSeed: expected.seed });
    same(row.human, {
      outcome: replay.outcome, reason: replay.reason, moves: replay.moves, score: replay.score,
      captureFile: expected.capture.file, captureIdentity: expected.capture.fileIdentity,
    }, `${expected.boardId} human result mismatch`);
    assert.ok(row.oracle.result.searchMs <= BUDGET_MS, `${expected.boardId} search budget exceeded`);
    const assessment = assessPuzzle(expected, row.oracle.result);
    same(row.assessment, assessment, `${expected.boardId} comparison mismatch`);
    assert.equal(row.integrity, 'PASS', `${expected.boardId} integrity status mismatch`);
  }
  assert.equal(report.outcome, deriveOutcome(report.rows), 'panel outcome mismatch');
  return { verdict: 'PASS', artifactIdentity, outcome: report.outcome, rows: report.rows.length };
}

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1 || !argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`${name} requires a value`);
  return argv[index + 1];
}

function main(argv = process.argv.slice(2)) {
  const reportFile = argv[0];
  if (!reportFile) throw new Error('usage: verify.js <report.json> --qualification-file <file> --expected-qualification <sha256> --expected-challenge <sha256>');
  const qualificationFile = option(argv, '--qualification-file');
  const checked = verifyReport(
    JSON.parse(fs.readFileSync(path.resolve(ROOT, reportFile), 'utf8')),
    {
      qualification: JSON.parse(fs.readFileSync(path.resolve(ROOT, qualificationFile), 'utf8')),
      expectedQualificationIdentity: option(argv, '--expected-qualification'),
      expectedChallengeIdentity: option(argv, '--expected-challenge'),
    },
  );
  process.stdout.write(`PASS ${JSON.stringify(checked)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { deriveOutcome, verifyQualification, verifyReport };
