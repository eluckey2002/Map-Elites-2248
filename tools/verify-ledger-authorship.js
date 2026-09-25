#!/usr/bin/env node
// Gate: an agent may propose a ledger record but may not accept its own.
//
// Every record created after this gate landed must name `written_by`. A record
// whose status is `accepted` or `narrowed` must also name `checked_by`, and the
// checker must not be the writer. A checker is an independent agent, a named
// script run, or the owner; it is never the session that wrote the record.
//
// Records that existed when the gate landed are exempt by ID: their authorship
// was never recorded and cannot be reconstructed honestly. The exemption is by
// ID number, not by date, so it cannot be claimed by backdating `updated`.
// Known gap: an exempt record later moved from `provisional` to `accepted` is
// not caught here.

const fs = require('node:fs');
const path = require('node:path');
const { parseLedgerRecords } = require('./ledger-index.js');

const LEDGER = path.join(__dirname, '..', 'EVIDENCE_LEDGER.md');

// Highest ID per type in EVIDENCE_LEDGER.md when this gate landed (2026-09-25).
const EXEMPT_THROUGH = {
  FACT: 7, RESULT: 43, DECISION: 6, HYPOTHESIS: 2, QUESTION: 3, CORRECTION: 9,
};
const NEEDS_CHECKER = ['accepted', 'narrowed'];

function isExempt(record) {
  return record.number <= (EXEMPT_THROUGH[record.prefix] ?? 0);
}

function normalized(name) {
  return String(name || '').replace(/`/g, '').trim().toLowerCase();
}

function assessAuthorship(records) {
  const problems = [];
  for (const r of records) {
    if (isExempt(r)) continue;
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

module.exports = { EXEMPT_THROUGH, assessAuthorship, isExempt };
