#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { runPuzzle } = require('../../solver/oracle/cli');
const { assessPuzzle } = require('../../solver/oracle/verify');
const {
  BUDGET_MS, REGISTERED_CHALLENGE_IDENTITY, RESULT, ROOT, challengeRows, fileHash, seal, sourceHashes,
} = require('./subject');
const { deriveOutcome, verifyQualification, verifyReport } = require('./verify');

function option(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1 || !argv[index + 1] || argv[index + 1].startsWith('--')) throw new Error(`${name} requires a value`);
  return argv[index + 1];
}

function writeExclusive(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value)}\n`, { flag: 'wx' });
}

async function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('challenge runner refuses --exploratory');
  const reportRelative = option(argv, '--out');
  const attemptRelative = option(argv, '--attempt');
  const qualificationRelative = option(argv, '--qualification-file');
  const expectedQualificationIdentity = option(argv, '--expected-qualification');
  const expectedChallengeIdentity = option(argv, '--expected-challenge');
  const reportFile = path.resolve(ROOT, reportRelative);
  const attemptFile = path.resolve(ROOT, attemptRelative);
  if (fs.existsSync(reportFile)) throw new Error(`refusing to overwrite ${reportRelative}`);
  if (fs.existsSync(attemptFile)) throw new Error(`refusing to repeat challenge attempt ${attemptRelative}`);
  const qualification = JSON.parse(fs.readFileSync(path.resolve(ROOT, qualificationRelative), 'utf8'));
  verifyQualification(qualification, expectedQualificationIdentity);
  if (expectedChallengeIdentity !== REGISTERED_CHALLENGE_IDENTITY) throw new Error('external challenge identity mismatch');
  const rows = challengeRows();
  const attempt = {
    schemaVersion: 1, result: RESULT, state: 'STARTED', startedAt: new Date().toISOString(),
    challengeIdentity: expectedChallengeIdentity, qualificationIdentity: expectedQualificationIdentity,
    budgetMs: BUDGET_MS, plannedRows: rows.map(({ boardId, levelNumber, seed }) => ({ boardId, level: levelNumber, seed })),
    completedRows: [],
  };
  writeExclusive(attemptFile, attempt);

  const reportRows = [];
  for (const row of rows) {
    const result = await runPuzzle({ level: row.input.level, seed: row.seed }, BUDGET_MS);
    const assessment = assessPuzzle(row, result);
    const reportRow = {
      boardId: row.boardId, level: row.levelNumber, seed: row.seed, puzzleIdentity: row.puzzleIdentity,
      human: {
        outcome: row.humanReplay.outcome, reason: row.humanReplay.reason, moves: row.humanReplay.moves,
        score: row.humanReplay.score, captureFile: row.capture.file, captureIdentity: row.capture.fileIdentity,
      },
      oracle: { result }, assessment, integrity: 'PASS',
    };
    reportRows.push(reportRow);
    attempt.completedRows.push({ boardId: row.boardId, finishedAt: new Date().toISOString(), result, assessment });
    fs.writeFileSync(attemptFile, `${JSON.stringify(attempt)}\n`);
    process.stdout.write(`${row.boardId}: human ${row.humanReplay.moves} moves; oracle ${assessment.oracleMoves ?? 'no win'} moves\n`);
  }

  attempt.state = 'COMPLETE';
  attempt.finishedAt = new Date().toISOString();
  fs.writeFileSync(attemptFile, `${JSON.stringify(attempt)}\n`);
  const body = {
    schemaVersion: 1, result: RESULT, challengeIdentity: expectedChallengeIdentity,
    captureManifestIdentity: fileHash('experiments/RESULT-0040/captures.json'),
    qualificationIdentity: expectedQualificationIdentity, sources: sourceHashes(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    budgetMs: BUDGET_MS, attemptsPerBoard: 1, complete: true, rows: reportRows,
    outcome: deriveOutcome(reportRows), registration: registrationStamp(registration),
  };
  const report = seal(body);
  writeExclusive(reportFile, report);
  const checked = verifyReport(report, { expectedChallengeIdentity, expectedQualificationIdentity, qualification });
  process.stdout.write(`${JSON.stringify(checked)}\n`);
}

if (require.main === module) {
  main().catch(error => { console.error(`FAIL: ${error.stack}`); process.exitCode = 1; });
}

module.exports = { main };
