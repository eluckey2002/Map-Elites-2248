'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const commands = [
  ['node', ['docs/goals/policy-terms-loop/check-closeout.js']],
  ['node', ['tools/verify-experiments.js']],
  ['node', ['tools/verify-ledger-authorship.js']],
  ['node', ['tools/ledger-index.js', '--check']],
  ['node', ['tools/failed-run-ledger.js']],
];
let failed = false;
for (const [command, args] of commands) {
  console.log('$', command, ...args);
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' });
  process.stdout.write(result.stdout || ''); process.stdout.write(result.stderr || '');
  if (result.error) console.log(result.error.message);
  console.log('exit_code', result.status);
  failed ||= result.status !== 0;
}
console.log('$ node --test --test-reporter=tap solver/tests/*.test.js (saved completed run)');
const suite = fs.readFileSync(path.join(__dirname, 'closeout-tests.txt'), 'utf8');
console.log(suite.split('\n').filter(line => /^not ok |^# (tests|pass|fail|skipped) /.test(line)).join('\n'));
console.log('GOAL CLOSE-OUT REQUIREMENT', failed ? 'UNMET: strict baseline-only failure check refused' : 'PASS');
process.exitCode = failed ? 1 : 0;
