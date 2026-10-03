'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { assertRegistration } = require('../../../solver/policy-lab/registration');
const root = path.resolve(__dirname, '../../..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'solver/policy-lab/runs/controls-raw.json')));
const plan = 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md';
const text = fs.readFileSync(path.join(root, plan), 'utf8');
if (assertRegistration(root, raw.registration.explorationPlanCommit, plan) !== text) throw new Error('registered plan drift');
for (const [file, hash] of Object.entries(raw.config.harnessFreeze)) {
  if (crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex') !== hash) throw new Error(`frozen source drift ${file}`);
}
console.log('PASS reachable registration, unchanged registered plan and frozen source identities', raw.registration.explorationPlanCommit);
let failed = false;
for (const args of [['tools/verify-experiments.js'], ['tools/verify-ledger-authorship.js'], ['tools/ledger-index.js', '--check'], ['tools/failed-run-ledger.js'], ['solver/policy-lab/recompute.js']]) {
  console.log('$ node', ...args);
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
  process.stdout.write(r.stdout || ''); process.stdout.write(r.stderr || '');
  console.log('exit_code', r.status); failed ||= r.status !== 0;
}
console.log('$ node --test --test-reporter=tap solver/tests/*.test.js (saved completed reviewed run)');
const suite = fs.readFileSync(path.join(__dirname, 'closeout-tests-reviewed.txt'), 'utf8');
console.log(suite.split('\n').filter(line => /^not ok |^# (tests|pass|fail|skipped) /.test(line)).join('\n'));
console.log('Baseline-only close-out requirement remains UNMET; original strict refusal is preserved in closeout-output.txt.');
process.exitCode = failed ? 1 : 0;
