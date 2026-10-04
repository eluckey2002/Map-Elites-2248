'use strict';
// Current reviewed entry point. All previous sources and pins remain intact.
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {readAnchoredPin,verifyPin}=require('./audit-source-pin');
const {audit}=require('./resume-reviewed-proof');
const {verify}=require('./verify-resume-closeout');
const ROOT=path.resolve(__dirname,'../../..');
const DIR='docs/goals/policy-terms-loop/';
const FILES=[DIR+'resume-reviewed-closeout.js',DIR+'resume-reviewed-proof.js',
  DIR+'resume-reviewed-proof-tests.txt',DIR+'resume-reviewed-proof-output.txt',
  DIR+'RESUME_FINAL_REVIEW_ADDENDUM.md',DIR+'resume-proof-audit.js',DIR+'verify-resume-closeout.js',
  DIR+'resume-closeout.js',DIR+'audit-source-pin.js',DIR+'resume-closeout-audits.json',
  DIR+'resume-terminal-buffer.js',DIR+'resume-terminal-buffer-pin.json',
  'solver/tests/policyLabResumeMergedTrust.test.js','solver/tests/policyLabResumeReviewedCloseout.test.js'];
function requireReviewedProof(root){
  const pin=readAnchoredPin(DIR+'resume-reviewed-closeout-pin.json',{root});
  if(pin.result!=='RESULT-0082'||pin.operation!=='full-history trust custody before completion')throw new Error('wrong reviewed custody pin');
  verifyPin(pin,FILES,{root});
  return{pin,proof:audit(root)};
}
function verifyReviewed(root){
  const {pin,proof}=requireReviewedProof(root);
  return{...verify(root),reviewedProof:true,reviewProofSourceCommit:pin.sourceCommit,trustHistory:proof.trustHistory};
}
function terminal(root){
  const {pin,proof}=requireReviewedProof(root);
  console.log('PASS separately anchored reviewed custody proof',JSON.stringify({sourceCommit:pin.sourceCommit,proof}));
  // The original capacity adapter validates its own pin and executes every
  // original terminal check, including the fresh full suite and numeric audits.
  execFileSync(process.execPath,[DIR+'resume-terminal-buffer.js'],{cwd:root,stdio:'inherit'});
}
if(require.main===module){try{
  if(process.argv[2]==='--terminal')terminal(ROOT);
  else if(process.argv.length===2||process.argv[2]==='--verify')console.log('RETAINED_REVIEWED_RESUMED_CLOSEOUT',JSON.stringify(verifyReviewed(ROOT)));
  else throw new Error('use --terminal or --verify');
}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={verifyReviewed,requireReviewedProof,FILES};
