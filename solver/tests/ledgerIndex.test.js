const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { parseLedgerRecords, renderIndex, firstSentence } = require('../../tools/ledger-index.js');
const { assessAuthorship } = require('../../tools/verify-ledger-authorship.js');

const ROOT = path.join(__dirname, '..', '..');

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
  assert.deepEqual(assessAuthorship(parseLedgerRecords(record('RESULT-0043', { status: 'accepted' }))), []);
});

test('a new record without written_by fails', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('RESULT-0044', { status: 'provisional' })));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /no written_by/);
});

test('a new provisional record with a writer and no checker passes', () => {
  assert.deepEqual(assessAuthorship(parseLedgerRecords(
    record('RESULT-0044', { status: 'provisional', written_by: 'agent-a' }))), []);
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
  const text = record('RESULT-0044', { status: 'accepted' }).replace(' — ', ' - ');
  assert.match(assessAuthorship(parseLedgerRecords(text)).join('\n'), /no written_by/);
});

test('a backticked status still requires a checker', () => {
  const problems = assessAuthorship(parseLedgerRecords(
    record('RESULT-0044', { status: '`Accepted`', written_by: 'agent-a' })));
  assert.match(problems.join('\n'), /no checked_by/);
});

test('an old provisional record promoted to accepted needs a writer and checker', () => {
  const problems = assessAuthorship(parseLedgerRecords(record('HYPOTHESIS-0001', { status: 'accepted' })));
  assert.match(problems.join('\n'), /no written_by/);
  assert.match(problems.join('\n'), /no checked_by/);
});

test('an old provisional record left provisional stays exempt', () => {
  assert.deepEqual(assessAuthorship(parseLedgerRecords(record('RESULT-0036', { status: 'provisional' }))), []);
});

test('the live ledger passes the authorship gate', () => {
  const out = execFileSync('node', ['tools/verify-ledger-authorship.js'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER AUTHORSHIP GATE PASS/);
});

test('the committed index matches the live ledger', () => {
  const out = execFileSync('node', ['tools/ledger-index.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER INDEX CURRENT/);
});
