const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { parseLedgerRecords } = require('../../tools/ledger-index.js');
const { assessChanges } = require('../../tools/verify-ledger-authorship.js');

const ROOT = path.join(__dirname, '..', '..');

function record(id, fields) {
  return [`### ${id} — a title`, '', ...Object.entries(fields).map(([k, v]) => `- **${k}:** ${v}`), ''].join('\n');
}
const parse = (...blocks) => parseLedgerRecords(blocks.join('\n'));
const problems = (base, now) => assessChanges(parse(...base), parse(...now)).join('\n');

const OLD = record('RESULT-0001', { status: 'accepted', statement: 'Old claim.', evidence: 'receipt A' });

test('an untouched record needs no authorship, even without the fields', () => {
  assert.equal(problems([OLD], [OLD]), '');
});

test('a new provisional record needs a writer only', () => {
  assert.match(problems([OLD], [OLD, record('RESULT-0002', { status: 'provisional' })]), /RESULT-0002: new record with no written_by/);
  assert.equal(problems([OLD], [OLD, record('RESULT-0002', { status: 'provisional', written_by: 'a' })]), '');
});

test('a new accepted record needs a checker who is not the writer', () => {
  assert.match(problems([OLD], [OLD, record('RESULT-0002', { status: 'accepted', written_by: 'a' })]), /no checked_by/);
  assert.match(problems([OLD], [OLD, record('RESULT-0002', { status: 'accepted', written_by: '`A`', checked_by: ' a ' })]), /same as written_by/);
  assert.equal(problems([OLD], [OLD, record('RESULT-0002', { status: 'accepted', written_by: 'a', checked_by: 'b' })]), '');
});

test('status values are normalized, so a backticked or capitalized accepted still needs a checker', () => {
  assert.match(problems([], [record('RESULT-0002', { status: '`ACCEPTED`', written_by: 'a' })]), /no checked_by/);
});

for (const [field, value] of [['statement', 'New claim.'], ['evidence', 'receipt B'], ['updated', '2026-09-26'], ['as_of', '2026-09-26']]) {
  test(`changing an accepted record's ${field} needs a writer and a checker`, () => {
    const edited = record('RESULT-0001', { status: 'accepted', statement: 'Old claim.', evidence: 'receipt A', [field]: value });
    const found = problems([OLD], [edited]);
    assert.match(found, /RESULT-0001: changed record with no written_by/);
    assert.match(found, /no checked_by/);
  });
}

test('retiring accepted evidence needs an independent check, whatever correction it cites', () => {
  const retired = record('RESULT-0001', { status: 'superseded', statement: 'Old claim.', evidence: 'receipt A', superseded_by: '[CORRECTION-0010]' });
  assert.match(problems([OLD], [retired]), /it was accepted on the base, but no checked_by/);
  const signed = record('RESULT-0001', {
    status: 'superseded', statement: 'Old claim.', evidence: 'receipt A', superseded_by: '[CORRECTION-0010]', written_by: 'a', checked_by: 'b',
  });
  assert.equal(problems([OLD], [signed]), '');
});

test('an accepted record newly narrowed needs a checker', () => {
  const narrowed = record('RESULT-0001', { status: 'narrowed', statement: 'Old claim.', evidence: 'receipt A', written_by: 'a' });
  assert.match(problems([OLD], [narrowed]), /status narrowed, but no checked_by/);
});

test('removing any record fails, including one added after the gate landed', () => {
  const later = record('RESULT-0050', { status: 'accepted', written_by: 'a', checked_by: 'b' });
  assert.match(problems([OLD, later], [OLD]), /RESULT-0050: was removed/);
  assert.match(problems([OLD, later], [later]), /RESULT-0001: was removed/);
});

test('a duplicated ID fails and neither copy counts as untouched', () => {
  const found = problems([OLD], [OLD, OLD]);
  assert.match(found, /appears more than once/);
  assert.match(found, /no written_by/);
});

test('a heading written with a plain hyphen is still a record the gate sees', () => {
  assert.match(problems([], [record('RESULT-0002', { status: 'accepted' }).replace(' — ', ' - ')]), /no written_by/);
});

test('the live ledger passes the gate against its base', () => {
  const out = execFileSync('node', ['tools/verify-ledger-authorship.js'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /LEDGER AUTHORSHIP GATE PASS/);
});
