const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { valueIdentity } = require('../../solver/benchmark-inputs');
const { assessPuzzle, verifyWitness } = require('../../solver/oracle/verify');
const { addedIn } = require('../../tools/verify-experiments');
const {
  BUDGET_MS, REGISTERED_CHALLENGE_IDENTITY, RESULT, ROOT, baselineWitness, challengeRows,
  fileHash, recordingWitness, seal, sourceHashes,
} = require('./subject');
const { deriveOutcome, verifyReport } = require('./verify');

function calibration() {
  const rows = challengeRows().map(row => {
    const baseline = baselineWitness(row);
    const human = recordingWitness(row);
    const best = human.movesUsed <= baseline.movesUsed ? human : baseline;
    const result = { baseline, best, searchMs: 1, standing: 'calibration' };
    return {
      boardId: row.boardId, level: row.levelNumber, seed: row.seed, puzzleIdentity: row.puzzleIdentity,
      human: {
        outcome: row.humanReplay.outcome, reason: row.humanReplay.reason, moves: row.humanReplay.moves,
        score: row.humanReplay.score, captureFile: row.capture.file, captureIdentity: row.capture.fileIdentity,
      },
      oracle: { result }, assessment: assessPuzzle(row, result), integrity: 'PASS',
    };
  });
  const qualificationBody = {
    schemaVersion: 1, result: RESULT, verdict: 'PASS', attempt: 'test-fixture',
    challengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
    captureManifestIdentity: fileHash('experiments/RESULT-0040/captures.json'), sources: sourceHashes(),
  };
  const qualification = { ...qualificationBody, qualificationIdentity: valueIdentity(qualificationBody) };
  const body = {
    schemaVersion: 1, result: RESULT, challengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
    captureManifestIdentity: fileHash('experiments/RESULT-0040/captures.json'),
    qualificationIdentity: qualification.qualificationIdentity, sources: sourceHashes(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    budgetMs: BUDGET_MS, attemptsPerBoard: 1, complete: true, rows,
    outcome: deriveOutcome(rows),
    registration: { exploratory: false, protocol: RESULT, protocolCommit: addedIn(`experiments/${RESULT}/protocol.md`, ROOT) },
  };
  return { report: seal(body), qualification };
}

function runCli(dir, report, qualification, expectedChallenge = REGISTERED_CHALLENGE_IDENTITY) {
  const reportFile = path.join(dir, 'report.json');
  const qualificationFile = path.join(dir, 'qualification.json');
  fs.writeFileSync(reportFile, JSON.stringify(report));
  fs.writeFileSync(qualificationFile, JSON.stringify(qualification));
  return spawnSync(process.execPath, [
    'experiments/RESULT-0040/verify.js', reportFile,
    '--qualification-file', qualificationFile,
    '--expected-qualification', qualification.qualificationIdentity,
    '--expected-challenge', expectedChallenge,
  ], { cwd: ROOT, encoding: 'utf8' });
}

test('real captures and calibration witnesses replay through independent production checks', () => {
  for (const row of challengeRows()) {
    assert.equal(row.humanReplay.validity, 'valid');
    assert.equal(verifyWitness(row.input, recordingWitness(row)).outcome, 'win');
    assert.doesNotThrow(() => verifyWitness(row.input, baselineWitness(row), { baselinePolicy: true }));
  }
});

test('public report-file path passes a known-good complete calibration', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0040-good-'));
  try {
    const { report, qualification } = calibration();
    const result = runCli(dir, report, qualification);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /PASS/);
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('public report-file path reads and rejects a planted false comparison', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0040-bad-'));
  try {
    const { report, qualification } = calibration();
    report.rows[0].assessment.oracleMoves = 999;
    const { artifactIdentity, ...body } = report;
    const broken = seal(body);
    const planted = path.join(dir, 'planted.json');
    fs.writeFileSync(planted, JSON.stringify(broken));
    assert.equal(JSON.parse(fs.readFileSync(planted)).rows[0].assessment.oracleMoves, 999);
    const result = runCli(dir, broken, qualification);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /comparison mismatch/);
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('externally anchored challenge identity rejects coherent substitution', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0040-substitution-'));
  try {
    const { report, qualification } = calibration();
    const substitutedChallenge = `${REGISTERED_CHALLENGE_IDENTITY.slice(0, -1)}0`;
    report.challengeIdentity = substitutedChallenge;
    qualification.challengeIdentity = substitutedChallenge;
    const { qualificationIdentity, ...qualificationBody } = qualification;
    qualification.qualificationIdentity = valueIdentity(qualificationBody);
    report.qualificationIdentity = qualification.qualificationIdentity;
    const { artifactIdentity, ...body } = report;
    const substitutedReport = seal(body);
    const result = runCli(dir, substitutedReport, qualification, REGISTERED_CHALLENGE_IDENTITY);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /qualification challenge mismatch/);
  } finally { fs.rmSync(dir, { recursive: true }); }
});

test('missing and duplicate rows are rejected instead of changing the panel', () => {
  for (const mutate of [
    report => report.rows.pop(),
    report => { report.rows[1] = structuredClone(report.rows[0]); },
  ]) {
    const { report, qualification } = calibration();
    mutate(report);
    const { artifactIdentity, ...body } = report;
    assert.throws(() => verifyReport(seal(body), {
      expectedChallengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
      expectedQualificationIdentity: qualification.qualificationIdentity,
      qualification,
    }), /missing challenge rows|duplicate challenge rows/);
  }
});
