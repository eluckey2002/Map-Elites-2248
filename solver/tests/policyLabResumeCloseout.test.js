'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {requiredAudits,requireCompletedAudit}=require('../../docs/goals/policy-terms-loop/resume-closure-state');
const {assertBindings,evidencePaths}=require('../../docs/goals/policy-terms-loop/resume-closure-inputs');
const {verify}=require('../../docs/goals/policy-terms-loop/verify-resume-closeout');
const controls={status:'CONTROLS_COMPLETE',headlines:{controls:Array(12).fill({}),path:'CONTROLS_PASSED'}};
test('resumed closeout cannot turn a running phase or unconfirmed candidate into a named finish',()=>{
  assert.throws(()=>requiredAudits({controls}),/completed named closure/);
  const a={closure:{closure_status:'CLOSED',path:'A'},controls,proposals:{status:'EXPLORATION_COMPLETE',path:'CONFIRMATION_REGISTRATION_PENDING'}};
  assert.throws(()=>requiredAudits(a),/complete one-shot/);
  const b={closure:{closure_status:'CLOSED',path:'B'},controls,proposals:{status:'RUNNING',path:'B',candidate:'NO_CANDIDATE'}};
  assert.throws(()=>requiredAudits(b),/completed no-candidate/);
  const d={closure:{closure_status:'CLOSED',path:'D'},controls,proposals:{status:'UNVERIFIED',path:'D',error:{budget:'proposals'}}};
  assert.throws(()=>requiredAudits(d),/retained budget/);
});
test('resumed closure binds all three registrations, charges and every measurement input identity',()=>{
  const inputs={result:'RESULT-0082',controls:{result:'RESULT-0082',registration:{recoveryPlanCommit:'new',originalPlanCommit:'old',previousPlanCommit:'middle'},counts:{controls:30160},config:{harnessFreeze:{'chooser.js':'hash'},carryForward:{sourceHashes:{'old-raw.json':'hash'}}}},artifacts:{controls:{path:'controls.json',sha256:'rawhash'}}};
  const c={result:'RESULT-0082',registration:{...inputs.controls.registration,exploratory:true},diagnosticInputs:inputs.artifacts,chargedAccounting:inputs.controls.counts,proposalRounds:0};
  assert.equal(assertBindings(c,inputs),true);
  const wrong=structuredClone(c);wrong.registration.previousPlanCommit='replacement';assert.throws(()=>assertBindings(wrong,inputs),/registration differs/);
  const discounted=structuredClone(c);discounted.chargedAccounting.controls-=100;assert.throws(()=>assertBindings(discounted,inputs),/accounting differs/);
  const files=evidencePaths('RESULT-0082',c,inputs);
  for(const f of ['chooser.js','old-raw.json','controls.json','experiments/RESULT-0082/closure.json'])assert.ok(files.includes(f));
});
test('closeout rejects successful exits with incomplete numeric audits and keeps the active run pending',()=>{
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/resume-recompute.js','MATCH retained arithmetic\nUNVERIFIED aggregate',{path:'A'}),/complete control/);
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/resume-proposal-recompute.js','MATCH retained proposal arithmetic',{path:'B'}),/complete proposal/);
  assert.throws(()=>requireCompletedAudit('solver/policy-lab/resume-proposal-recompute.js --confirmation','MATCH confirmation arithmetic',{path:'A'}),/complete confirmation/);
  const result=verify(path.resolve(__dirname,'../..'));assert.equal(typeof result.pending,'boolean');
  if(result.pending)assert.equal(result.scientificComplete,false);
});
