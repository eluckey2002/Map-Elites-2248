const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { parseLedgerRecords, renderIndex, firstSentence } = require('../../tools/ledger-index.js');
const { assessAuthorship } = require('../../tools/verify-ledger-authorship.js');

const ROOT = path.join(__dirname, '..', '..');

// Legacy exemptions are pinned to real content, so exemption tests use the live ledger.
function liveRecord(id) {
  const text = require('node:fs').readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8');
  return parseLedgerRecords(text).find((r) => r.id === id);
}

function record(id, fields) {
  return [`### ${id} — a title`, '', ...Object.entries(fields).map(([k, v]) => `- **${k}:** ${v}`), ''].join('\n');
}

test('records are parsed with their fields and a non-record heading ends one', () => {
  const records = parseLedgerRecords([
    record('RESULT-0100', { status: 'accepted', statement: 'One. Two.' }),
    '## Assembly cut log',
    '- **status:** rejected',
  ].join('\n'));
  assert.equal(records.length, 1);
  assert.equal(records[0].fields.status, 'accepted');
  assert.equal(firstSentence(records[0].fields.statement), 'One.');
});

test('CRLF ledgers parse the same as LF ledgers', () => {
  const lf = record('FACT-0100', { status: 'accepted', statement: 'A rule.' });
  assert.deepEqual(parseLedgerRecords(lf.replace(/\n/g, '\r\n')), parseLedgerRecords(lf));
});

test('superseded records leave the current table', () => {
  const text = renderIndex(parseLedgerRecords([
    record('FACT-0100', { status: 'accepted', statement: 'Kept.' }),
    record('FACT-0101', { status: 'superseded', statement: 'Gone.', superseded_by: '[CORRECTION-0100]' }),
  ].join('\n')));
  const [current, retired] = text.split('## Superseded or rejected records');
  assert.match(current, /FACT-0100/);
  assert.doesNotMatch(current, /FACT-0101/);
  assert.match(retired, /FACT-0101.*CORRECTION-0100/);
});

test('an exempt record needs no authorship', () => {
  assert.deepEqual(assessAuthorship([liveRecord('RESULT-0048')]), []);
});

test('a new record without written_by fails', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('RESULT-0049', { status: 'provisional' })));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no written_by/);
});

test('a new provisional record with a writer and no checker passes', () => {
  assert.deepEqual(assessAuthorship(parseLedgerRecords(
    record('RESULT-0049', { status: 'provisional', written_by: 'agent-a' }))), []);
});

test('a new accepted record without a checker fails', () => {
  const problems = assessAuthorship(parseLedgerRecords(
    record('FACT-0008', { status: 'accepted', written_by: 'agent-a' })));
  assert.match(problems.join('\n'), /no checked_by/);
});

test('a record accepted by its own writer fails, ignoring case and backticks', () => {
  const problems = assessAuthorship(parseLedgerRecords(
    record('CORRECTION-0010', { status: 'narrowed', written_by: '`Agent-A`', checked_by: 'agent-a' })));
  assert.match(problems.join('\n'), /same as written_by/);
});

test('a record accepted by a different checker passes', () => {
  assert.deepEqual(assessAuthorship(parseLedgerRecords(
    record('DECISION-0007', { status: 'accepted', written_by: 'agent-a', checked_by: 'owner' }))), []);
});

test('a heading with a plain hyphen is still a record the gate sees', () => {
  const text = record('RESULT-0049', { status: 'accepted' }).replace(' — ', ' - ');
  assert.match(assessAuthorship(parseLedgerRecords(text)).join('\n'), /no written_by/);
});

test('a backticked status still requires a checker', () => {
  const problems = assessAuthorship(parseLedgerRecords(
    record('RESULT-0049', { status: '`Accepted`', written_by: 'agent-a' })));
  assert.match(problems.join('\n'), /no checked_by/);
});

test('an old provisional record promoted to accepted needs a writer and checker', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('HYPOTHESIS-0001', { status: 'accepted' })));
  assert.match(problems.join('\n'), /no written_by/);
  assert.match(problems.join('\n'), /no checked_by/);
});

test('an old superseded record flipped to accepted needs a checker', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('DECISION-0001', { status: 'accepted' })));
  assert.match(problems.join('\n'), /no checked_by/);
});

test('an old provisional record left provisional stays exempt', () => {
  assert.deepEqual(assessAuthorship([liveRecord('RESULT-0036')]), []);
});

test('an unused old ID number gets no exemption', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('RESULT-0019', { status: 'accepted' })));
  assert.match(problems.join('\n'), /no written_by/);
});

test('reusing an existing ID is rejected and removes the exemption', () => {
  const problems = assessAuthorship(parseLedgerRecords([
    record('RESULT-0001', { status: 'accepted' }),
    record('RESULT-0001', { status: 'accepted' }),
  ].join('\n')));
  assert.match(problems.join('\n'), /appears more than once/);
  assert.match(problems.join('\n'), /no checked_by/);
});

test('the live ledger passes the authorship gate', () => {
  const out = execFileSync('node', ['tools/verify-ledger-authorship.js'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER AUTHORSHIP GATE PASS/);
});

test('the committed index matches the live ledger', () => {
  const out = execFileSync('node', ['tools/ledger-index.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER INDEX CURRENT/);
});

test('a legacy record whose claim was rewritten loses its exemption', () => {
  const fs = require('node:fs');
  const live = parseLedgerRecords(fs.readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8'));
  const original = live.find((r) => r.id === 'RESULT-0001');
  assert.deepEqual(assessAuthorship([original]), []);
  const rewritten = { ...original, fields: { ...original.fields, statement: 'A different claim.' } };
  assert.match(assessAuthorship([rewritten]).join('\n'), /no written_by/);
  const reevidenced = { ...original, fields: { ...original.fields, evidence: 'a different receipt' } };
  assert.match(assessAuthorship([reevidenced]).join('\n'), /no written_by/);
  const restatused = { ...original, fields: { ...original.fields, status: 'superseded', superseded_by: '[CORRECTION-0010]' } };
  assert.deepEqual(assessAuthorship([restatused]), []);
});
