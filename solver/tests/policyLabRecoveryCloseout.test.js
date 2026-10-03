'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requiredAudits,requireCompletedAudit}=require('../../docs/goals/policy-terms-loop/recovery-closure-state');
const {createPin,verifyPin,readAnchoredPin}=require('../../docs/goals/policy-terms-loop/audit-source-pin');
const {assertBindings,evidencePaths}=require('../../docs/goals/policy-terms-loop/closure-inputs');
const {verify}=require('../../docs/goals/policy-terms-loop/verify-retained-closeout');
const {startingState}=require('../../docs/goals/policy-terms-loop/prepare-confirmation-protocol');
const controls={status:'CONTROLS_COMPLETE',headlines:{controls:Array(12).fill({}),path:'CONTROLS_PASSED'}};
test('closeout refuses a running recovery or absent named closure',()=>{
  assert.throws(()=>requiredAudits({controls}),/named closure/);
  assert.throws(()=>requiredAudits({closure:{closure_status:'CLOSED',path:'C'},controls:{...controls,status:'RUNNING'}}),/completed failing controls/);
});
test('no-confirmation audit pin rejects uncommitted changes, missing auditors and post-pin drift',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-audit-pin-'));
  const git=args=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
  try{
    git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Fixture']);
    fs.writeFileSync(path.join(root,'audit.js'),"console.log('MATCH');\n");git(['add','audit.js']);git(['commit','-qm','fixture']);
    const pin=createPin(['audit.js'],{root});assert.equal(verifyPin(pin,['audit.js'],{root}),true);
    assert.throws(()=>verifyPin(pin,['other.js'],{root}),/identity differs/);
    fs.appendFileSync(path.join(root,'audit.js'),"console.log('PASS');\n");
    assert.throws(()=>createPin(['audit.js'],{root}),/committed before pinning/);
    assert.throws(()=>verifyPin(pin,['audit.js'],{root}),/identity differs/);
    git(['add','audit.js']);git(['commit','-qm','changed fixture']);
    assert.equal(verifyPin(createPin(['audit.js'],{root}),['audit.js'],{root}),true);
    fs.writeFileSync(path.join(root,'raw.json'),'{"mean":1}\n');fs.writeFileSync(path.join(root,'closure.json'),'{"mean":1}\n');
    git(['add','raw.json','closure.json']);git(['commit','-qm','retained data']);
    const dataPin=createPin(['audit.js','raw.json','closure.json'],{root});
    fs.writeFileSync(path.join(root,'raw.json'),'{"mean":2}\n');fs.writeFileSync(path.join(root,'closure.json'),'{"mean":2}\n');
    assert.throws(()=>verifyPin(dataPin,['audit.js','raw.json','closure.json'],{root}),/identity differs/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('no-candidate and confirmed closeouts require their actual phase audits',()=>{
  const proposals={status:'EXPLORATION_COMPLETE',path:'B',candidate:'NO_CANDIDATE'};
  const b={closure:{closure_status:'CLOSED',path:'B'},controls,proposals};
  assert.deepEqual(requiredAudits(b),['solver/policy-lab/recovery-recompute.js','solver/policy-lab/proposal-recompute.js']);
  assert.throws(()=>requiredAudits({...b,proposals:{...proposals,status:'RUNNING'}}),/completed no-candidate/);
  const a={closure:{closure_status:'CLOSED',path:'A'},controls,proposals:{status:'EXPLORATION_COMPLETE',path:'CONFIRMATION_REGISTRATION_PENDING'},confirmation:{status:'PAIRS_COMPLETE'},verdict:{primaryOutcome:'FALSIFIED'}};
  assert.equal(requiredAudits(a).at(-1),'solver/policy-lab/proposal-recompute.js --confirmation');
  assert.throws(()=>requiredAudits({...a,confirmation:null}),/complete one-shot/);
});
test('successful command exit with partial arithmetic cannot qualify closeout',()=>{
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/recovery-recompute.js','UNVERIFIED aggregate\nMATCH retained arithmetic',{path:'B'}),/complete control/);
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/proposal-recompute.js','MATCH retained proposal arithmetic',{path:'B'}),/complete proposal/);
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/proposal-recompute.js --confirmation','MATCH confirmation arithmetic',{path:'A'}),/complete confirmation/);
  assert.doesNotThrow(()=>requireCompletedAudit('solver/policy-lab/proposal-recompute.js','PASS completed proposal journal jobs 100\nMATCH retained proposal arithmetic',{path:'B'}));
});
test('direct-source closure binds its result, registration, raw hashes and consumed charges',()=>{
  const inputs={result:'RESULT-0081',controls:{result:'RESULT-0081',registration:{recoveryPlanCommit:'recover',originalPlanCommit:'original'},counts:{controls:29580}},proposals:{result:'RESULT-0081',registration:{phaseCommit:'phase'},counts:{controls:29580,proposals:17400},proposalRounds:15},artifacts:{controls:{path:'control.json',sha256:'controlhash'},proposals:{path:'proposals.json',sha256:'proposalhash'}}};
  const closure={result:'RESULT-0081',registration:{recoveryPlanCommit:'recover',originalPlanCommit:'original',phaseCommit:'phase',exploratory:true},diagnosticInputs:inputs.artifacts,chargedAccounting:inputs.proposals.counts,proposalRounds:15};
  assert.equal(assertBindings(closure,inputs),true);
  for(const mutate of [c=>c.result='RESULT-0080',c=>c.registration.recoveryPlanCommit='different',c=>c.diagnosticInputs.controls.sha256='stale',c=>c.chargedAccounting.proposals--,c=>c.proposalRounds--]){
    const bad=structuredClone(closure);mutate(bad);assert.throws(()=>assertBindings(bad,inputs),/differs|differ/);
  }
});
test('rendered protocol retains the template pre-registration identity through amend',()=>{
  const line='- git HEAD abcdef12, branch codex/fixture.';
  assert.equal(startingState('registered: date\n'+line+'\n'),line);
  assert.throws(()=>startingState('- git HEAD <sha>, branch <name>.\n'),/starting identity absent/);
});
test('confirmed closure binds the actual verdict and pins both raw evidence and closure bytes',()=>{
  const inputs={result:'RESULT-0081',controls:{result:'RESULT-0081',registration:{recoveryPlanCommit:'recover',originalPlanCommit:'original'}},confirmation:{result:'RESULT-0081',registration:{protocol:'RESULT-0081',protocolCommit:'registered',exploratory:false},counts:{confirmation:17400}},verdict:{result:'RESULT-0081',primaryOutcome:'SUPPORTED'},artifacts:{controls:{path:'controls.json',sha256:'controlhash'},confirmation:{path:'experiments/RESULT-0081/raw-pairs.json',sha256:'rawhash'},verdict:{path:'experiments/RESULT-0081/verdict.json',sha256:'verdicthash'}}};
  const closure={result:'RESULT-0081',registration:{...inputs.controls.registration,...inputs.confirmation.registration},diagnosticInputs:inputs.artifacts,chargedAccounting:inputs.confirmation.counts,proposalRounds:0,primary_outcome:'SUPPORTED',contract:{path:'closeout-contract.json'},artifacts:[{path:'report.md'}]};
  assert.equal(assertBindings(closure,inputs),true);
  assert.throws(()=>assertBindings({...closure,primary_outcome:'FALSIFIED'},inputs),/primary outcome differs/);
  assert.throws(()=>assertBindings({...closure,diagnosticInputs:{...inputs.artifacts,verdict:{...inputs.artifacts.verdict,sha256:'different'}}},inputs),/hashes differ/);
  const paths=evidencePaths('RESULT-0081',closure,inputs);
  for(const file of ['experiments/RESULT-0081/closure.json','controls.json','experiments/RESULT-0081/raw-pairs.json','experiments/RESULT-0081/verdict.json','experiments/RESULT-0081/closeout-contract.json','experiments/RESULT-0081/report.md'])assert.ok(paths.includes(file));
  assert.throws(()=>evidencePaths('RESULT-0081',{...closure,contract:{path:'../../outside.json'}},inputs),/escaping/);
});
test('recurring final-tree suite revalidates every retained closeout and committed audit pin',()=>{
  const result=verify(path.resolve(__dirname,'../..'));
  assert.equal(typeof result.pending,'boolean');
});
test('replacing committed evidence and regenerating its pin cannot replace the first-added receipt',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-receipt-anchor-'));
  const git=args=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
  try{
    git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Fixture']);
    fs.writeFileSync(path.join(root,'raw.json'),'{"mean":1}\n');git(['add','raw.json']);git(['commit','-qm','initial evidence']);
    fs.writeFileSync(path.join(root,'pin.json'),JSON.stringify(createPin(['raw.json'],{root}))+'\n');
    assert.throws(()=>readAnchoredPin('pin.json',{root}),/committed before validation/);
    git(['add','pin.json']);git(['commit','-qm','anchor first pin']);
    assert.equal(verifyPin(readAnchoredPin('pin.json',{root}),['raw.json'],{root}),true);
    fs.writeFileSync(path.join(root,'raw.json'),'{"mean":2}\n');git(['add','raw.json']);git(['commit','-qm','replacement evidence']);
    fs.writeFileSync(path.join(root,'pin.json'),JSON.stringify(createPin(['raw.json'],{root}))+'\n');git(['add','pin.json']);git(['commit','-qm','replacement pin']);
    assert.throws(()=>readAnchoredPin('pin.json',{root}),/first-added bytes/);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
