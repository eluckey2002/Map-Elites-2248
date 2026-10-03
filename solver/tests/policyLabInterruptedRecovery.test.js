'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifyFailure}=require('../../docs/goals/policy-terms-loop/interrupted-recovery');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createPin,verifyPin}=require('../../docs/goals/policy-terms-loop/audit-source-pin');
test('partial durable results cannot become a completed control verdict or erase charged jobs',()=>{
  const observed={summary:{completedJobs:48,pendingJobs:10,retainedPartialGames:480,unknownNewGames:100,chargedAccounting:{controls:580}}};
  const receipt={closure_status:'UNVERIFIED',path:'NONE',noIdeaJudged:true,proposalRounds:0,effortBoundExhausted:false,interruptionSummary:observed.summary};
  assert.equal(verifyFailure(receipt,observed),true);
  for(const change of [c=>c.closure_status='CLOSED',c=>c.path='C',c=>c.path='D',c=>c.effortBoundExhausted=true,c=>c.interruptionSummary.pendingJobs=0,c=>c.interruptionSummary.chargedAccounting.controls=480]){
    const bad=structuredClone(receipt);change(bad);assert.throws(()=>verifyFailure(bad,observed),/cannot qualify|differs/);
  }
});
test('committed evidence identities support raw artifacts larger than the child-process default buffer',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-large-pin-'));
  const git=args=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
  try{
    git(['init','-q']);git(['config','user.email','fixture@example.invalid']);git(['config','user.name','Fixture']);
    fs.writeFileSync(path.join(root,'raw.json'),JSON.stringify({synthetic:'x'.repeat(2*1024*1024)}));
    git(['add','raw.json']);git(['commit','-qm','large synthetic raw']);
    assert.equal(verifyPin(createPin(['raw.json'],{root}),['raw.json'],{root}),true);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
