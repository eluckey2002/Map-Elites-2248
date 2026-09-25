#!/usr/bin/env node
// Gate: an agent may propose a ledger record but may not accept its own.
//
// Every record created after this gate landed must name `written_by`. A record
// whose status is `accepted` or `narrowed` must also name `checked_by`, and the
// checker must not be the writer. A checker is an independent agent, a named
// script run, or the owner; it is never the session that wrote the record.
//
// Records that existed when the gate landed (2026-09-25) are exempt, because
// their authorship was never recorded and cannot be reconstructed honestly.
// The exemption is pinned to each record exactly as it stood then: a hash of
// every line of the record except `status`, `superseded_by`, and `updated`,
// plus those three values themselves. A legacy record stays exempt only if
//   - it is byte-for-byte unchanged, or
//   - its content is unchanged and it moved to a retired status (superseded,
//     stale, rejected), which is what the append-only correction process does.
// Any other edit, including a restamped date, a status newly reaching
// `accepted` or `narrowed`, or a changed claim or evidence line, is new work
// and must carry `written_by` and `checked_by` like any new record. Duplicate
// IDs are rejected so a new record cannot borrow an old record's exemption.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { parseLedgerRecords } = require('./ledger-index.js');

const LEDGER = path.join(__dirname, '..', 'EVIDENCE_LEDGER.md');
const { records: LANDING } = require('./ledger-legacy-pins.json');

const NEEDS_CHECKER = ['accepted', 'narrowed'];
const RETIRED = ['superseded', 'stale', 'rejected'];
const MOVABLE = /^- \*\*(status|superseded_by|updated):\*\*/;

// Hash of the whole record except the three fields a correction may move.
function contentPin(record) {
  const body = record.lines.filter((l) => !MOVABLE.test(l)).map((l) => l.trimEnd());
  while (body.length && body[body.length - 1] === '') body.pop();
  return crypto.createHash('sha256').update(JSON.stringify([record.title, body])).digest('hex').slice(0, 16);
}

function landingEntry(record) {
  return {
    pin: contentPin(record),
    status: record.fields.status || '',
    superseded_by: record.fields.superseded_by || '',
    updated: record.fields.updated || '',
  };
}

function isExempt(record) {
  const then = LANDING[record.id];
  if (!then) return false;
  const now = landingEntry(record);
  if (now.pin !== then.pin) return false;
  if (now.status === then.status) {
    return now.superseded_by === then.superseded_by && now.updated === then.updated;
  }
  return RETIRED.includes(now.status);
}

function normalized(name) {
  return String(name || '').replace(/`/g, '').trim().toLowerCase();
}

function assessAuthorship(records) {
  const problems = [];
  const counts = new Map();
  for (const r of records) counts.set(r.id, (counts.get(r.id) || 0) + 1);
  for (const [id, n] of counts) {
    if (n > 1) problems.push(`${id}: appears more than once. IDs are never reused; give the new record the next free ID.`);
  }
  for (const r of records) {
    if (counts.get(r.id) === 1 && isExempt(r)) continue;
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

module.exports = { assessAuthorship, contentPin, isExempt, landingEntry };
