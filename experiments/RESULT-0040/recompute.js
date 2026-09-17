#!/usr/bin/env node

const fs = require('node:fs');

const { verifyReport } = require('./verify');
const { REGISTERED_CHALLENGE_IDENTITY, ROOT } = require('./subject');

const QUALIFICATION_IDENTITY = '676bc91e007f838edab4eeed70326ec0ddeede3ee97a142c9308585621d40eba';

const report = JSON.parse(fs.readFileSync(`${ROOT}/experiments/RESULT-0040/oracle-challenge-report.json`, 'utf8'));
const qualification = JSON.parse(fs.readFileSync(`${ROOT}/experiments/RESULT-0040/qualification.json`, 'utf8'));
verifyReport(report, {
  expectedChallengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
  expectedQualificationIdentity: QUALIFICATION_IDENTITY,
  qualification,
});

const rows = report.rows.map(row => ({
  boardId: row.boardId,
  level: row.level,
  seed: row.seed,
  humanOutcome: row.human.outcome,
  humanMoves: row.human.moves,
  oracleOutcome: row.assessment.oracleMoves === null ? 'no-win' : 'win',
  oracleMoves: row.assessment.oracleMoves,
  humanMinusOracleMoves: row.assessment.movesSaved,
  relationship: row.assessment.pass ? (row.assessment.movesSaved === 0 ? 'TIED' : 'ORACLE_FASTER') : 'ORACLE_SLOWER',
}));
const outcome = rows.every(row => row.oracleOutcome === 'win' && row.humanMinusOracleMoves >= 0)
  ? 'SUPPORTED' : 'FALSIFIED';

process.stdout.write(`${JSON.stringify({
  schemaVersion: 1,
  result: 'RESULT-0040',
  challengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
  reportIdentity: report.artifactIdentity,
  rows,
  outcome,
})}\n`);
