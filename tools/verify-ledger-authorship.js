#!/usr/bin/env node
// Gate: an agent may propose a ledger record but may not accept its own, and
// the ledger is append-only.
//
// The gate compares EVIDENCE_LEDGER.md with the same file on the base branch
// (main). Only what the change touches needs anything:
//   - a record on the base that is missing now fails: retire it with a
//     correction instead of deleting it;
//   - an ID that appears more than once fails;
//   - a record that is new, or whose text differs from the base in any way,
//     must name `written_by`;
//   - such a record must also name a `checked_by` who is not the writer when it
//     is `accepted` or `narrowed` now, or was `accepted` or `narrowed` on the
//     base. So accepting a claim and retiring accepted evidence both need an
//     independent check.
// Records the change does not touch need nothing, so records written before
// this gate existed stay valid without authorship fields.
//
// The base is `git merge-base HEAD origin/main`; when HEAD is itself on main
// (a push to main), it is HEAD's first parent. Set LEDGER_BASE to override.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { parseLedgerRecords } = require('./ledger-index.js');

const ROOT = path.join(__dirname, '..');
const LEDGER = 'EVIDENCE_LEDGER.md';
const NEEDS_CHECKER = ['accepted', 'narrowed'];

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function baseCommit() {
  if (process.env.LEDGER_BASE) return git(['rev-parse', process.env.LEDGER_BASE]);
  const head = git(['rev-parse', 'HEAD']);
  const base = git(['merge-base', 'HEAD', 'origin/main']);
  return base === head ? git(['rev-parse', 'HEAD^1']) : base;
}

function text(record) {
  return [record.title, ...record.lines.map((l) => l.trimEnd())].join('\n').trimEnd();
}

function normalized(name) {
  return String(name || '').replace(/`/g, '').trim().toLowerCase();
}

function assessChanges(baseRecords, records) {
  const problems = [];
  const counts = new Map();
  for (const r of records) counts.set(r.id, (counts.get(r.id) || 0) + 1);
  for (const [id, n] of counts) {
    if (n > 1) problems.push(`${id}: appears more than once. IDs are never reused; give the new record the next free ID.`);
  }
  const base = new Map(baseRecords.map((r) => [r.id, r]));
  for (const id of base.keys()) {
    if (!counts.has(id)) problems.push(`${id}: was removed. The ledger is append-only; retire a record with a correction instead.`);
  }
  for (const r of records) {
    const before = base.get(r.id);
    if (before && counts.get(r.id) === 1 && text(before) === text(r)) continue;
    const writer = normalized(r.fields.written_by);
    const checker = normalized(r.fields.checked_by);
    const what = before ? 'changed' : 'new';
    if (!writer) problems.push(`${r.id}: ${what} record with no written_by. Name the agent or person who wrote it.`);
    const accepting = NEEDS_CHECKER.includes(r.fields.status);
    const touchesAccepted = NEEDS_CHECKER.includes(before?.fields.status);
    if (!accepting && !touchesAccepted) continue;
    const why = accepting ? `status ${r.fields.status}` : `it was ${before.fields.status} on the base`;
    if (!checker) {
      problems.push(`${r.id}: ${what} record, ${why}, but no checked_by. An independent check must be recorded first.`);
    } else if (writer && checker === writer) {
      problems.push(`${r.id}: checked_by is the same as written_by (${writer}). A record may not be checked by its own writer.`);
    }
  }
  return problems;
}

function main() {
  const commit = baseCommit();
  const baseText = git(['show', `${commit}:${LEDGER}`]);
  const records = parseLedgerRecords(fs.readFileSync(path.join(ROOT, LEDGER), 'utf8'));
  const problems = assessChanges(parseLedgerRecords(baseText), records);
  if (problems.length) {
    console.error(`LEDGER AUTHORSHIP GATE FAILED (base ${commit.slice(0, 8)})`);
    for (const p of problems) console.error(`- ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(`LEDGER AUTHORSHIP GATE PASS (base ${commit.slice(0, 8)})`);
}

if (require.main === module) main();

module.exports = { assessChanges };
