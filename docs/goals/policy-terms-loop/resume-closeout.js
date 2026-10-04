'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {registeredConfiguration}=require('../../../solver/policy-lab/resume-controls');
const {requiredAudits,requireCompletedAudit}=require('./resume-closure-state');
const {verifyPin,readAnchoredPin}=require('./audit-source-pin');
const {loadInputs,assertBindings,evidencePaths}=require('./resume-closure-inputs');
const {runCurrentSuite}=require('./live-suite');
const {requireHandoff}=require('./resume-handoff-presence');
const {audit:proofAudit}=require('./resume-proof-audit');
const ROOT=path.resolve(__dirname,'../../..');
const BASE='cd83127f176111a0b0fb40eb14402f301a1fab07';
// Main advanced during the registered run. Preserve registration ancestry by
// merging this exact upstream commit after F, then audit this goal's changes
// relative to it. Original inventory/seed/history constraints still use BASE.
const INTEGRATION_BASE='77d23d7f0efe3c582abbe51a0f0cba4fe854f170';
const git=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'});
const result=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(fs.readFileSync(path.join(__dirname,'RESUME_PLAN.md'),'utf8'))[1]).result;
requireHandoff(ROOT,result);
const optionalJson=file=>fs.existsSync(path.join(ROOT,file))?JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8')):null;
const closure=optionalJson(`experiments/${result}/closure.json`);
const inputs=loadInputs(ROOT,result);
if(closure)assertBindings(closure,inputs);
const audits=requiredAudits({closure,controls:optionalJson('solver/policy-lab/runs/resume/controls-raw.json'),
  proposals:optionalJson('solver/policy-lab/runs/resume/proposals-raw.json'),
  confirmation:optionalJson(`experiments/${result}/raw-pairs.json`),verdict:optionalJson(`experiments/${result}/verdict.json`)});
const {config,commit}=registeredConfiguration();
const commands=['tools/verify-experiments.js','tools/verify-ledger-authorship.js','tools/ledger-index.js --check','tools/failed-run-ledger.js',...audits];
const auditPin=readAnchoredPin('docs/goals/policy-terms-loop/resume-closeout-audits.json',{root:ROOT});
if(auditPin?.result!==config.result||auditPin?.path!==closure.path||JSON.stringify(auditPin?.commands)!==JSON.stringify(commands))throw new Error('closeout audit pin does not bind this closure and command list');
verifyPin(auditPin,[...commands.map(c=>c.split(' ')[0]),...evidencePaths(config.result,closure,inputs),...['resume-closeout.js','resume-closure-state.js','audit-source-pin.js','pin-resume-closeout.js','resume-closure-inputs.js','verify-resume-closeout.js'].map(f=>'docs/goals/policy-terms-loop/'+f)],{root:ROOT});
console.log('PASS committed closeout audit identities',JSON.stringify(auditPin));
if(closure.path==='A')console.log('PASS additional full-history and actual pre-F trust audit',JSON.stringify(proofAudit(ROOT)));
const inventory='solver/tests/failedRunLedger.test.js';
const before=git(['show',`${BASE}:${inventory}`]);
const needle="'RESULT-0036', 'RESULT-0037', 'RESULT-0041', 'RESULT-0042',";
if(before.split(needle).length!==2)throw new Error('inventory exception is ambiguous');
const authorized=before.replace(needle,needle+" 'RESULT-0080', 'RESULT-0081',");
if(fs.readFileSync(path.join(ROOT,inventory),'utf8')!==authorized)throw new Error('existing inventory test differs beyond the approved inventory additions');
const allowed=f=>/^(solver\/policy-lab\/|solver\/tests\/|experiments\/RESULT-008[01]\/|docs\/goals\/policy-terms-loop\/)/.test(f)
  ||f.startsWith(`experiments/${config.result}/`)
  ||['experiments/SEEDS.md','FAILED-RUN-LEDGER.CSV','EVIDENCE_LEDGER.md','LEDGER-INDEX.md','CURRENT.md',
    'docs/backlog/BL-0012-generator-cannot-build-climbing-chains.md','docs/backlog/BL-0013-policy-vocabulary-gaps.md'].includes(f);
git(['merge-base','--is-ancestor',INTEGRATION_BASE,'HEAD']);
const changed=[...new Set([...git(['diff','--name-only',INTEGRATION_BASE]).split('\n'),...git(['ls-files','--others','--exclude-standard']).split('\n')].filter(Boolean))];
for(const f of changed){
  if(!allowed(f))throw new Error(`out of scope ${f}`);
  if(f.startsWith('solver/tests/')&&f!==inventory&&git(['ls-tree','--name-only',BASE,'--',f]).trim())throw new Error(`unapproved existing test edit ${f}`);
}
if(!fs.readFileSync(path.join(ROOT,'experiments/SEEDS.md'),'utf8').startsWith(git(['show',`${BASE}:experiments/SEEDS.md`])))throw new Error('seed declarations not append-only');
for(const f of changed.filter(f=>f.startsWith('docs/backlog/')))if(!fs.readFileSync(path.join(ROOT,f),'utf8').startsWith(git(['show',`${BASE}:${f}`])))throw new Error(`backlog changed beyond appended history ${f}`);
console.log('PASS authorized paths, exact approved existing-test inventory additions, unchanged frozen sources and carried evidence',commit);
console.log('PASS integrated upstream ancestry and goal-only scope baseline',INTEGRATION_BASE);
console.log('PASS append-only seeds and backlog History');
console.log('$ node --test --test-reporter=tap solver/tests/*.test.js (fresh execution)');
const {output:suite}=runCurrentSuite(ROOT);
console.log('PASS exact original named test failures and skip');
console.log(suite.split('\n').filter(l=>/^not ok |^# (tests|pass|fail|skipped) /.test(l)).join('\n'));
for(const command of commands){
  console.log('$ node',command);
  const output=execFileSync(process.execPath,command.split(' '),{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  process.stdout.write(output);if(audits.includes(command))requireCompletedAudit(command,output,closure);
}
console.log('PASS recovery close-out checks for completed Path',closure.path,'; scientific acceptance remains with a distinct reviewer');
