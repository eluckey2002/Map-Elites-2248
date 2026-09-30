const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { reverifyPlan, run } = require('../../tools/run-reverify');

const ledger = fs.readFileSync(path.join(__dirname, '../../EVIDENCE_LEDGER.md'), 'utf8');

test('historical reverify commands that need manual context are reported with reasons', () => {
  const plan = reverifyPlan(ledger);
  for (const [id, command] of [
    ['RESULT-0016', 'node solver/multipath-ablation.js --confirm'],
    ['RESULT-0045', 'node solver/oracle/cli.js --verify docs/oracle/runs/attempt-05-full-corpus.json'],
    ['CORRECTION-0017', 'node solver/game-tester.js --seeds 20'],
    ['CORRECTION-0017', 'node solver/routing-ablation.js'],
  ]) {
    const entry = plan.find(item => item.id === id && item.command === command);
    assert.ok(entry, `${id} command is present in the real ledger`);
    assert.equal(entry.manual, true);
    assert.ok(entry.manualReason);
  }
  assert.equal(plan.find(item => item.id === 'RESULT-0016' && item.command.startsWith('node --test')).manual, false);
});

test('a changed command does not inherit a historical manual exception', () => {
  const changed = ledger.replaceAll('`node solver/multipath-ablation.js --confirm`', '`node solver/multipath-ablation.js --confirm --new-check`');
  assert.notEqual(changed, ledger);
  const entry = reverifyPlan(changed).find(item => item.id === 'RESULT-0016' && item.command.includes('--new-check'));
  assert.ok(entry);
  assert.equal(entry.manual, false);
  assert.equal(run({ cwd: '.', command: 'node -e "process.exit(7)"' }, 5000).outcome, 'FAIL');
});
