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

// Edit one `- **field:** value` line of a live legacy record, as a real ledger edit would.
function edited(id, field, value) {
  const text = require('node:fs').readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8');
  const start = text.indexOf(`### ${id} — `);
  const end = text.indexOf('\n### ', start + 1);
  const block = text.slice(start, end).replace(new RegExp(`^- \\*\\*${field}:\\*\\*.*$`, 'm'), `- **${field}:** ${value}`);
  return parseLedgerRecords(block)[0];
}

test('an unchanged legacy record stays exempt', () => {
  assert.deepEqual(assessAuthorship([liveRecord('RESULT-0001')]), []);
});

for (const [field, value] of [
  ['statement', 'A different claim.'],
  ['evidence', 'a different receipt'],
  ['as_of', '2026-09-25'],
  ['reverify', 'Run `node other.js`.'],
]) {
  test(`a legacy record whose ${field} changed loses its exemption`, () => {
    assert.match(assessAuthorship([edited('RESULT-0001', field, value)]).join('\n'), /no written_by/);
  });
}

test('a line added to a legacy record removes its exemption', () => {
  const record = liveRecord('RESULT-0001');
  const added = parseLedgerRecords([`### RESULT-0001 — ${record.title}`, ...record.lines, '- **notes:** an added note'].join('\n'))[0];
  assert.match(assessAuthorship([added]).join('\n'), /no written_by/);
});

test('a legacy record restamped with a new updated date loses its exemption', () => {
  assert.match(assessAuthorship([edited('RESULT-0001', 'updated', '2026-09-25')]).join('\n'), /no written_by/);
});

test('an accepted legacy record newly narrowed needs a checker', () => {
  assert.match(assessAuthorship([edited('RESULT-0001', 'status', 'narrowed')]).join('\n'), /no checked_by/);
});

test('retiring a legacy record through a correction keeps its exemption', () => {
  const text = require('node:fs').readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8');
  const start = text.indexOf('### RESULT-0001 — ');
  const block = text.slice(start, text.indexOf('\n### ', start + 1))
    .replace(/^- \*\*status:\*\*.*$/m, '- **status:** superseded')
    .replace(/^- \*\*superseded_by:\*\*.*$/m, '- **superseded_by:** [CORRECTION-0010]')
    .replace(/^- \*\*updated:\*\*.*$/m, '- **updated:** 2026-09-26');
  const correction = record('CORRECTION-0010', {
    status: 'accepted', written_by: 'agent-a', checked_by: 'agent-b', supersedes: '[RESULT-0001]',
  });
  const noBacklink = record('CORRECTION-0010', {
    status: 'accepted', written_by: 'agent-a', checked_by: 'agent-b', supersedes: '[]',
  });
  // Real correction that names RESULT-0001 back: the retirement stays exempt.
  assert.deepEqual(assessAuthorship(parseLedgerRecords(`${block}\n${correction}`)), []);
  // Correction missing, or not naming it back: the status edit is new work.
  assert.match(assessAuthorship(parseLedgerRecords(block)).join('\n'), /RESULT-0001: no written_by/);
  assert.match(assessAuthorship(parseLedgerRecords(`${block}\n${noBacklink}`)).join('\n'), /RESULT-0001: no written_by/);
});

test('removing a legacy record fails the gate', () => {
  const { assessRemovals } = require('../../tools/verify-ledger-authorship.js');
  const text = require('node:fs').readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8');
  const all = parseLedgerRecords(text);
  assert.deepEqual(assessRemovals(all), []);
  assert.match(assessRemovals(all.filter((r) => r.id !== 'RESULT-0001')).join('\n'), /RESULT-0001: was removed/);
});
