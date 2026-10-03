'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {registeredConfiguration}=require('../../../solver/policy-lab/recovery-controls');
const {requiredAudits,requireCompletedAudit}=require('./recovery-closure-state');
const {verifyPin}=require('./audit-source-pin');
const {loadInputs,assertBindings}=require('./closure-inputs');
const ROOT=path.resolve(__dirname,'../../..');
const BASE='cd83127f176111a0b0fb40eb14402f301a1fab07';
const git=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'});
const {config,commit}=registeredConfiguration();
const optionalJson=file=>fs.existsSync(path.join(ROOT,file))?JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8')):null;
const closure=optionalJson(`experiments/${config.result}/closure.json`);
if(closure)assertBindings(closure,loadInputs(ROOT,config.result));
const audits=requiredAudits({closure,controls:optionalJson('solver/policy-lab/runs/recovery/controls-raw.json'),
  proposals:optionalJson('solver/policy-lab/runs/recovery/proposals-raw.json'),
  confirmation:optionalJson(`experiments/${config.result}/raw-pairs.json`),verdict:optionalJson(`experiments/${config.result}/verdict.json`)});
const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
const auditPin=optionalJson('docs/goals/policy-terms-loop/recovery-closeout-audits.json');
if(auditPin?.result!==config.result||auditPin?.path!==closure.path||JSON.stringify(auditPin?.commands)!==JSON.stringify(commands))throw new Error('closeout audit pin does not bind this closure and command list');
verifyPin(auditPin,[...commands.map(c=>c.split(' ')[0]),...['recovery-closeout.js','recovery-closure-state.js','audit-source-pin.js','pin-recovery-closeout.js','closure-inputs.js','verify-retained-closeout.js'].map(f=>'docs/goals/policy-terms-loop/'+f)],{root:ROOT});
console.log('PASS committed closeout audit identities',JSON.stringify(auditPin));
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
for(const command of commands){
  console.log('$ node',command);
  const output=execFileSync(process.execPath,command.split(' '),{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  process.stdout.write(output);if(audits.includes(command))requireCompletedAudit(command,output,closure);
}
console.log('PASS recovery close-out checks for completed Path',closure.path,'; scientific acceptance remains with a distinct reviewer');
