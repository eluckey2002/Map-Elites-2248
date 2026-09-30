const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLedgerRecords } = require('../../tools/ledger-index.js');
const { plan, run, classify, KNOWN_TEST_FAILURES } = require('../../tools/ledger-recheck.js');

function record(id, status, reverify) {
  return `### ${id} — t\n\n- **status:** ${status}\n- **reverify:** ${reverify}\n`;
}

test('shared commands run once and credit every record that cites them', () => {
  const { runnable } = plan(parseLedgerRecords([
    record('FACT-0100', 'accepted', 'Run `node --test a.test.js`; expect pass.'),
    record('FACT-0101', 'narrowed', 'Run `node --test a.test.js`; expect pass.'),
  ].join('\n')));
  assert.deepEqual([...runnable], [['node --test a.test.js', ['FACT-0100', 'FACT-0101']]]);
});

test('superseded records are not re-checked', () => {
  const { runnable, manual } = plan(parseLedgerRecords(record('FACT-0100', 'superseded', 'Run `node x.js`.')));
  assert.equal(runnable.size, 0);
  assert.equal(manual.length, 0);
});

test('inline scripts and shell syntax are never executed, only listed as manual', () => {
  const { runnable, manual } = plan(parseLedgerRecords([
    record('RESULT-0100', 'accepted', "Run `node -e 'console.log(1)'`; expect 1."),
    record('RESULT-0101', 'accepted', 'Run `node x.js; rm -rf y`.'),
    record('RESULT-0102', 'accepted', 'Inspect the cited symbols.'),
    record('RESULT-0103', 'accepted', 'not_applicable'),
  ].join('\n')));
  assert.equal(runnable.size, 0);
  assert.deepEqual(manual.map((m) => m.id), ['RESULT-0100', 'RESULT-0101', 'RESULT-0102']);
});

test('commands that produce evidence are set aside, not run', () => {
  const { runnable, producesEvidence } = plan(parseLedgerRecords([
    record('RESULT-0100', 'accepted', 'Run `node a.js --confirm`.'),
    record('RESULT-0101', 'accepted', 'Run `node b.js --out x.json`.'),
    record('RESULT-0102', 'accepted', 'Run `node c.js write`.'),
    record('RESULT-0103', 'accepted', 'Run `node d.js --protocol RESULT-0103`.'),
    record('RESULT-0104', 'accepted', 'Run `node e.js verify`.'),
  ].join('\n')));
  assert.deepEqual([...producesEvidence.keys()].length, 4);
  assert.deepEqual([...runnable.keys()], ['node e.js verify']);
});

test('only the documented failures count as known; any other failure is new', () => {
  const failed = { status: 1 };
  const known = KNOWN_TEST_FAILURES.map((t) => `✖ ${t} (1.2ms)`).join('\n');
  assert.equal(classify('node --test x', failed, known), 'KNOWN');
  assert.equal(classify('node --test x', failed, `${known}\n✖ a new regression (3.1ms)`), 'NEW_FAILURE');
  assert.equal(classify('node x.js', failed, 'MODULE_NOT_FOUND'), 'NEW_FAILURE');
  assert.equal(classify('node tools/verify-universe-map.js', failed, 'stale'), 'KNOWN');
  assert.equal(classify('node x.js', { error: { code: 'ETIMEDOUT' } }, ''), 'TOO_SLOW');
  assert.equal(classify('node v.js', failed, 'FAIL: source identity closure mismatch'), 'CODE_CHANGED');
  assert.equal(classify('node v.js', failed, 'FAIL: protected file changed: solver/bot.js'), 'CODE_CHANGED');
});

test('run reports pass and new failure from the process result', () => {
  assert.equal(run('node -v', 30_000).status, 'PASS');
  assert.equal(run('node does-not-exist.js', 30_000).status, 'NEW_FAILURE');
});
