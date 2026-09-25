const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { parseLedgerRecords, renderIndex, firstSentence } = require('../../tools/ledger-index.js');

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

test('headings with any dash are records', () => {
  for (const dash of ['—', '–', '-']) {
    assert.equal(parseLedgerRecords(`### FACT-0100 ${dash} t\n\n- **status:** accepted\n`).length, 1);
  }
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

test('the committed index matches the live ledger', () => {
  const out = execFileSync('node', ['tools/ledger-index.js', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER INDEX CURRENT/);
});
