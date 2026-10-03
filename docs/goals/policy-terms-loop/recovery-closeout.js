'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {registeredConfiguration}=require('../../../solver/policy-lab/recovery-controls');
const ROOT=path.resolve(__dirname,'../../..');
const BASE='cd83127f176111a0b0fb40eb14402f301a1fab07';
const git=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'});
const {config,commit}=registeredConfiguration();
const inventory='solver/tests/failedRunLedger.test.js';
const before=git(['show',`${BASE}:${inventory}`]);
const needle="'RESULT-0036', 'RESULT-0037', 'RESULT-0041', 'RESULT-0042',";
if(before.split(needle).length!==2)throw new Error('inventory exception is ambiguous');
const authorized=before.replace(needle,needle+" 'RESULT-0080',");
if(fs.readFileSync(path.join(ROOT,inventory),'utf8')!==authorized)throw new Error('existing inventory test differs beyond the approved one-line addition');
const allowed=f=>/^(solver\/policy-lab\/|solver\/tests\/|experiments\/RESULT-0080\/|docs\/goals\/policy-terms-loop\/)/.test(f)
  ||f.startsWith(`experiments/${config.result}/`)
  ||['experiments/SEEDS.md','FAILED-RUN-LEDGER.CSV','EVIDENCE_LEDGER.md','LEDGER-INDEX.md','CURRENT.md',
    'docs/backlog/BL-0012-generator-cannot-build-climbing-chains.md','docs/backlog/BL-0013-policy-vocabulary-gaps.md'].includes(f);
const changed=[...new Set([...git(['diff','--name-only',BASE]).split('\n'),...git(['ls-files','--others','--exclude-standard']).split('\n')].filter(Boolean))];
for(const f of changed){
  if(!allowed(f))throw new Error(`out of scope ${f}`);
  if(f.startsWith('solver/tests/')&&f!==inventory&&git(['ls-tree','--name-only',BASE,'--',f]).trim())throw new Error(`unapproved existing test edit ${f}`);
}
if(!fs.readFileSync(path.join(ROOT,'experiments/SEEDS.md'),'utf8').startsWith(git(['show',`${BASE}:experiments/SEEDS.md`])))throw new Error('seed declarations not append-only');
for(const f of changed.filter(f=>f.startsWith('docs/backlog/')))if(!fs.readFileSync(path.join(ROOT,f),'utf8').startsWith(git(['show',`${BASE}:${f}`])))throw new Error(`backlog changed beyond appended history ${f}`);
console.log('PASS authorized paths, exact single existing-test exception, unchanged frozen sources and carried evidence',commit);
console.log('PASS append-only seeds and backlog History');
const failures=s=>s.split('\n').filter(l=>/^not ok /.test(l)).map(l=>l.replace(/^not ok \d+ - /,'')).sort();
const baseline=fs.readFileSync(path.join(__dirname,'baseline-output.txt'),'utf8');
const suite=fs.readFileSync(path.join(__dirname,'recovery-final-tests.txt'),'utf8');
if(JSON.stringify(failures(baseline))!==JSON.stringify(failures(suite))||!/^# fail 3$/m.test(suite)||!/^# skipped 1$/m.test(suite))throw new Error('full suite does not match original named failures and skip');
console.log('PASS exact original named test failures and skip');
console.log(suite.split('\n').filter(l=>/^not ok |^# (tests|pass|fail|skipped) /.test(l)).join('\n'));
for(const command of ['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js','solver/policy-lab/recovery-recompute.js']){
  console.log('$ node',command);process.stdout.write(execFileSync(process.execPath,command.split(' '),{cwd:ROOT,encoding:'utf8',maxBuffer:32*1024*1024}));
}
console.log('PASS recovery close-out checks; scientific closure and owner acceptance must still be reported explicitly');
