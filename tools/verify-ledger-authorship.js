#!/usr/bin/env node
// Gate: an agent may propose a ledger record but may not accept its own.
//
// Every record created after this gate landed must name `written_by`. A record
// whose status is `accepted` or `narrowed` must also name `checked_by`, and the
// checker must not be the writer. A checker is an independent agent, a named
// script run, or the owner; it is never the session that wrote the record.
//
// Records that existed when the gate landed are exempt by exact ID: their
// authorship was never recorded and cannot be reconstructed honestly. The list
// is exact, not a numeric range, so an unused old number (RESULT-0019) or a
// date backdated in `updated` cannot claim the exemption, and a duplicate ID is
// rejected so a new record cannot borrow an old record's exemption.
// An exempt record that was not yet accepted when the gate landed loses its
// exemption once it is promoted: the promotion is new work and needs a checker.

const fs = require('node:fs');
const path = require('node:path');
const { parseLedgerRecords } = require('./ledger-index.js');

const LEDGER = path.join(__dirname, '..', 'EVIDENCE_LEDGER.md');

// Every record on origin/main when the gate landed (2026-09-25, 66 records).
// Accepted or narrowed then: exempt whatever their status now.
const ACCEPTED_AT_LANDING = new Set([
  'FACT-0001', 'FACT-0002', 'FACT-0005', 'FACT-0006', 'FACT-0007', 'RESULT-0001', 'RESULT-0002',
  'RESULT-0003', 'RESULT-0004', 'RESULT-0005', 'RESULT-0006', 'RESULT-0007', 'RESULT-0008',
  'RESULT-0009', 'RESULT-0010', 'RESULT-0011', 'RESULT-0012', 'RESULT-0013', 'RESULT-0014',
  'RESULT-0016', 'RESULT-0017', 'RESULT-0018', 'RESULT-0020', 'RESULT-0021', 'RESULT-0024',
  'RESULT-0025', 'RESULT-0026', 'RESULT-0027', 'RESULT-0028', 'RESULT-0031', 'RESULT-0032',
  'RESULT-0033', 'RESULT-0034', 'RESULT-0035', 'RESULT-0041', 'RESULT-0043', 'RESULT-0048',
  'DECISION-0002', 'DECISION-0003', 'DECISION-0004', 'DECISION-0005', 'DECISION-0006',
  'CORRECTION-0001', 'CORRECTION-0002', 'CORRECTION-0003', 'CORRECTION-0004', 'CORRECTION-0005',
  'CORRECTION-0006', 'CORRECTION-0007', 'CORRECTION-0008', 'CORRECTION-0009',
]);
// Superseded, provisional, or open then: exempt until promoted.
const UNACCEPTED_AT_LANDING = new Set([
  'FACT-0003', 'FACT-0004', 'RESULT-0015', 'RESULT-0029', 'RESULT-0030', 'RESULT-0036',
  'RESULT-0037', 'RESULT-0038', 'RESULT-0042', 'DECISION-0001', 'HYPOTHESIS-0001',
  'HYPOTHESIS-0002', 'QUESTION-0001', 'QUESTION-0002', 'QUESTION-0003',
]);
const NEEDS_CHECKER = ['accepted', 'narrowed'];

function isExempt(record) {
  if (ACCEPTED_AT_LANDING.has(record.id)) return true;
  return UNACCEPTED_AT_LANDING.has(record.id) && !NEEDS_CHECKER.includes(record.fields.status);
}

function normalized(name) {
  return String(name || '').replace(/`/g, '').trim().toLowerCase();
}

function assessAuthorship(records) {
  const problems = [];
  const seen = new Set();
  for (const r of records) {
    if (seen.has(r.id)) {
      problems.push(`${r.id}: appears more than once. IDs are never reused; give the new record the next free ID.`);
    }
    seen.add(r.id);
  }
  for (const r of records) {
    if (isExempt(r) && records.filter((x) => x.id === r.id).length === 1) continue;
    const writer = normalized(r.fields.written_by);
    const checker = normalized(r.fields.checked_by);
    if (!writer) {
      problems.push(`${r.id}: no written_by. Name the agent or person who wrote this record.`);
    }
    if (!NEEDS_CHECKER.includes(r.fields.status)) continue;
    if (!checker) {
      problems.push(`${r.id}: status ${r.fields.status} but no checked_by. Leave it provisional until an independent check is recorded.`);
    } else if (writer && checker === writer) {
      problems.push(`${r.id}: checked_by is the same as written_by (${writer}). A record may not be accepted by its own writer.`);
    }
  }
  return problems;
}

function main() {
  const problems = assessAuthorship(parseLedgerRecords(fs.readFileSync(LEDGER, 'utf8')));
  if (problems.length) {
    console.error('LEDGER AUTHORSHIP GATE FAILED');
    for (const p of problems) console.error(`- ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log('LEDGER AUTHORSHIP GATE PASS');
}

if (require.main === module) main();

module.exports = { ACCEPTED_AT_LANDING, UNACCEPTED_AT_LANDING, assessAuthorship, isExempt };
