'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { assertRegistration } = require('../../../solver/policy-lab/registration');
const ROOT = path.resolve(__dirname, '../../..');
const BASE = 'cd83127f176111a0b0fb40eb14402f301a1fab07';
const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
const allowed = file => /^(solver\/policy-lab\/|solver\/tests\/|experiments\/RESULT-0080\/|docs\/goals\/policy-terms-loop\/)/.test(file)
  || ['experiments/SEEDS.md', 'FAILED-RUN-LEDGER.CSV', 'EVIDENCE_LEDGER.md', 'LEDGER-INDEX.md', 'CURRENT.md',
    'docs/backlog/BL-0012-generator-cannot-build-climbing-chains.md', 'docs/backlog/BL-0013-policy-vocabulary-gaps.md'].includes(file);
const changed = [...new Set([...git(['diff', '--name-only', BASE]).trim().split('\n'), ...git(['ls-files', '--others', '--exclude-standard']).trim().split('\n')].filter(Boolean))];
for (const file of changed) {
  if (!allowed(file)) throw new Error(`out-of-scope source: ${file}`);
  if (file.startsWith('solver/tests/')) {
    const existed = git(['ls-tree', '--name-only', BASE, '--', file]).trim();
    if (existed) throw new Error(`existing test changed: ${file}`);
  }
}
console.log('PASS allowed paths and no existing test modification', changed.length);
const oldSeeds = git(['show', `${BASE}:experiments/SEEDS.md`]);
if (!fs.readFileSync(path.join(ROOT, 'experiments/SEEDS.md'), 'utf8').startsWith(oldSeeds)) throw new Error('SEEDS.md prefix changed');
console.log('PASS append-only seed declarations');
for (const file of changed.filter(f => f.startsWith('docs/backlog/'))) {
  const before = git(['show', `${BASE}:${file}`]);
  const after = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!after.startsWith(before) || !before.includes('## History')) throw new Error(`backlog changed outside append-only History: ${file}`);
}
console.log('PASS History-only backlog updates');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'solver/policy-lab/runs/controls-raw.json'), 'utf8'));
const planPath = 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md';
const planText = fs.readFileSync(path.join(ROOT, planPath), 'utf8');
if (assertRegistration(ROOT, raw.registration.explorationPlanCommit, planPath) !== planText) throw new Error('committed exploration plan changed');
console.log('PASS reachable first-addition exploration registration');
const config = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(planText)[1]);
if (JSON.stringify(config) !== JSON.stringify(raw.config)) throw new Error('retained config differs from registered plan');
for (const [file, hash] of Object.entries(config.harnessFreeze)) {
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
  if (actual !== hash) throw new Error(`frozen harness changed: ${file}`);
}
console.log('PASS registered harness and protected source identities');
const failures = text => text.split('\n').filter(l => /^not ok /.test(l)).map(l => l.replace(/^not ok \d+ - /, '')).sort();
const baseline = fs.readFileSync(path.join(__dirname, 'baseline-output.txt'), 'utf8');
const final = fs.readFileSync(path.join(__dirname, 'closeout-tests.txt'), 'utf8');
console.log('BASELINE FAILURE NAMES', JSON.stringify(failures(baseline)));
console.log('CLOSE-OUT FAILURE NAMES', JSON.stringify(failures(final)));
console.log(final.split('\n').filter(line => /^# (tests|pass|fail|skipped) /.test(line)).join('\n'));
if (JSON.stringify(failures(baseline)) !== JSON.stringify(failures(final))) throw new Error('test failure names differ from baseline');
if (!/^# fail 3$/m.test(final) || !/^# skipped 1$/m.test(final)) throw new Error('unexpected failure/skip totals');
console.log('PASS exact named baseline failures and single existing skip');
console.log(failures(final).join('\n'));
console.log('COUNTS', JSON.stringify(raw.counts));
