'use strict';
// Read-only raw-output navigation. This never runs games, assigns an outcome,
// or turns a saved audit transcript into a current verification.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const GOAL='docs/goals/policy-terms-loop/';
const RUNS='solver/policy-lab/runs/resume/';
function read(file){
  const full=path.join(ROOT,file);
  if(!fs.existsSync(full))return null;
  const bytes=fs.readFileSync(full);
  return {file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),text:bytes.toString('utf8')};
}
function show(label,file){
  const saved=read(file);
  console.log('\n'+label+'\n$ cat '+file);
  if(saved){console.log('SOURCE_SHA256',saved.sha256);process.stdout.write(saved.text);if(!saved.text.endsWith('\n'))console.log();}
  else console.log('NOT_RETAINED_OR_NOT_RUN; no result inferred');
}
function snapshot(file){const saved=read(file);return saved?{...saved,value:JSON.parse(saved.text)}:null;}
function print(){
  const plan=read(GOAL+'RESUME_PLAN.md');
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(plan.text)[1]);
  // Each atomic checkpoint is read once. Different files may represent
  // different instants while a phase is running; do not combine their counts.
  const controls=snapshot(RUNS+'controls-raw.json');
  const proposals=snapshot(RUNS+'proposals-raw.json');
  const confirmation=snapshot(`experiments/${config.result}/raw-pairs.json`);
  const closure=snapshot(`experiments/${config.result}/closure.json`);
  console.log('RESUMED_RAW_REPORT',config.result,new Date().toISOString());
  console.log('BOUNDARY: retained observations and saved audit output; no new arithmetic audit, scientific acceptance, adoption or goal completion certified.');
  console.log('STATE',JSON.stringify({controls:controls?.value.status??'NOT_RUN',proposals:proposals?.value.status??'NOT_RUN',confirmation:confirmation?.value.status??'NOT_RUN',closure:closure?.value.closure_status??'PENDING',path:closure?.value.path??null}));
  show('1. ORIGINAL START STATE',GOAL+'start-output.txt');
  show('2. HISTORICAL NOISE TABLE','solver/policy-lab/runs/noise-output.txt');
  show('3. HISTORICAL GENERATION DIAGNOSIS','solver/policy-lab/runs/generation-output.txt');
  show('4. PROSPECTIVE CONTINUATION REGISTRATION',GOAL+'RESUME_PLAN.md');
  console.log('\n5. CONTROL CHECKPOINT');
  if(controls){const r=controls.value;console.log('SOURCE',controls.file,controls.sha256);console.log(JSON.stringify({registration:r.registration,status:r.status,parity:r.parity,inert:r.inert,headlines:r.headlines,counts:r.counts,excludedOriginalPanels:r.excludedOriginalPanels,excludedPreviousC12:r.excludedPreviousC12},null,2));}
  else console.log('NOT_RUN');
  show('5. SAVED COMPLETE CONTROL AUDIT',RUNS+'control-recompute-output.txt');
  console.log('\n6-9. PROPOSALS, DOSE RESPONSE, JOINT SEARCH AND SELECTION');
  if(proposals){const r=proposals.value;console.log('SOURCE',proposals.file,proposals.sha256);console.log(JSON.stringify({registration:r.registration,status:r.status,path:r.path??null,proposalRounds:r.proposalRounds,counts:r.counts,rows:r.rows,jointSpace:r.jointSpace??null,jointRows:r.jointRows,selected:r.selected??null,candidate:r.candidate??null,error:r.error??null},null,2));console.log('Exploratory ACCEPTED means eligibility for selection, not confirmed improvement. Pending rows and unmeasured configurations remain pending.');}
  else console.log('NOT_RUN');
  show('9. FROZEN ACTUAL SELECTION','solver/policy-lab/resume-frozen-candidate.js');
  show('10. ONE-SHOT PREREGISTRATION',`experiments/${config.result}/protocol.md`);
  if(confirmation){console.log('CONFIRMATION_RAW_SOURCE',confirmation.file,confirmation.sha256);console.log('CONFIRMATION_CHECKPOINT',JSON.stringify({status:confirmation.value.status,registration:confirmation.value.registration,counts:confirmation.value.counts}));}
  else console.log('CONFIRMATION_NOT_RUN');
  show('10. ONE-SHOT VERDICT',`experiments/${config.result}/verdict.json`);
  show('11. SAVED COMPLETE EXPLORATION AUDIT',RUNS+'proposal-recompute-output.txt');
  show('11. SAVED CONFIRMATION AUDIT',GOAL+'resume-confirmation-recompute-output.txt');
  show('12. ORIGINAL COVERAGE AND DECLARED DISJOINTNESS','solver/policy-lab/runs/coverage-output.txt');
  console.log('Coverage for new complete phases is verified by the saved phase audits above; absent audit output is not verification.');
  show('ACTUAL CLOSURE',`experiments/${config.result}/closure.json`);
  show('CLOSEOUT AUDIT IDENTITIES',GOAL+'resume-closeout-audits.json');
  show('LATEST RETAINED HANDOFF SUITE; terminal closeout must execute the current suite',GOAL+'resume-handoff-tests.txt');
  show('ACTUAL RESULT-PREPARATION SUITE',GOAL+'resume-result-tests.txt');
  show('FRESH RESULT-PREPARATION NUMERIC AUDITS',GOAL+'resume-result-recompute-output.txt');
  show('FINAL TERMINAL CLOSEOUT; retained transcript, not a new execution',GOAL+'resume-final-closeout-output.txt');
  show('FINAL EXECUTED RECURRING AUDIT RECEIPT',GOAL+'resume-final-recurring-output.txt');
  show('CURRENT REVIEWED COMPLETION REQUIREMENTS',GOAL+'RESUME_FINAL_REVIEW_ADDENDUM.md');
  show('AUTHORITATIVE VERIFICATION ROUTING CORRECTION',GOAL+'RESUME_ROUTE_CORRECTION.md');
  show('EXACT ROUTING CORRECTION QUALIFICATION',GOAL+'resume-route-correction-tests.txt');
  show('REVIEWED FULL-HISTORY CUSTODY QUALIFICATION',GOAL+'resume-reviewed-proof-tests.txt');
  show('ACTUAL REVIEWED FULL-HISTORY CUSTODY PROOF',GOAL+'resume-reviewed-proof-output.txt');
  show('CURRENT REVIEWED TERMINAL CLOSEOUT',GOAL+'resume-reviewed-closeout-output.txt');
  show('CURRENT REVIEWED EXECUTED RETAINED AUDIT',GOAL+'resume-reviewed-recurring-output.txt');
  show('ACTUAL FINAL PR REVIEW RECEIPT',GOAL+'resume-final-review.json');
  show('ACTUAL FINAL CI RECEIPT',GOAL+'resume-final-ci.json');
  console.log('Any pending or interrupted phase stays pending/UNVERIFIED. Only a retained, independently audited budget or effort stop can be Path D.');
}
if(require.main===module){try{print();}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={print};
