'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requiredAudits,requireCompletedAudit}=require('../../docs/goals/policy-terms-loop/recovery-closure-state');
const {createPin,verifyPin}=require('../../docs/goals/policy-terms-loop/audit-source-pin');
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
