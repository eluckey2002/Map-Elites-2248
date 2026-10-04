'use strict';
// Saved output only. No game execution or verdict assignment.
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../../..');
const DIR='docs/goals/policy-terms-loop/';
for(const file of ['recovery-raw-report.txt','POST_STOP_APPROVAL.txt','poststop-exception-audits.json',
  'poststop-recompute-output.txt','poststop-verification-output.txt','poststop-final-tests.txt',
  'poststop-gates-output.txt','poststop-publication-output.json','poststop-review-output.json']){
  console.log('\n$ cat '+DIR+file);
  const full=path.join(ROOT,DIR+file);
  if(fs.existsSync(full))process.stdout.write(fs.readFileSync(full,'utf8'));
  else console.log('UNVERIFIED_NOT_RUN');
}
console.log('POST-STOP MAINTENANCE ONLY: RESULT-0080 and RESULT-0081 remain UNVERIFIED. No Path A-D completed, new scientific games, policy adoption, merge or scientific acceptance.');
