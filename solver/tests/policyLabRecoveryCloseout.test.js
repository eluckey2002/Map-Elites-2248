'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {requiredAudits,requireCompletedAudit}=require('../../docs/goals/policy-terms-loop/recovery-closure-state');
const controls={status:'CONTROLS_COMPLETE',headlines:{controls:Array(12).fill({}),path:'CONTROLS_PASSED'}};
test('closeout refuses a running recovery or absent named closure',()=>{
  assert.throws(()=>requiredAudits({controls}),/named closure/);
  assert.throws(()=>requiredAudits({closure:{closure_status:'CLOSED',path:'C'},controls:{...controls,status:'RUNNING'}}),/completed failing controls/);
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
