'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {verifyPin,readAnchoredPin}=require('./audit-source-pin');
const {failureSources,verify:verifyOriginal}=require('./verify-retained-closeout');
const {loadInputs,assertBindings}=require('./closure-inputs');
const {audit,verifyFailure,MANIFEST}=require('./interrupted-recovery');
const {validate,recompute,PIN,OLD_PIN,APPROVAL,INVENTORY}=require('./poststop-recompute');
const DIR='docs/goals/policy-terms-loop/';
function sources(root){return [...new Set([...failureSources('RESULT-0081',root),OLD_PIN,APPROVAL,
  DIR+'poststop-recompute.js',DIR+'verify-poststop-closeout.js',DIR+'live-suite.js',DIR+'recovery-closeout.js'])].sort();}
function verify(root){
  if(!fs.existsSync(path.join(root,APPROVAL)))return verifyOriginal(root);
  const checked=validate(root),pin=readAnchoredPin(PIN,{root});
  verifyPin(checked.previous,failureSources('RESULT-0081',root).filter(f=>f!==INVENTORY),{root});
  verifyPin(pin,sources(root),{root});
  if(fs.existsSync(path.join(root,DIR+'recovery-closeout-audits.json')))throw new Error('UNVERIFIED cannot retain a completed-path pin');
  const closure=JSON.parse(fs.readFileSync(path.join(root,'experiments/RESULT-0081/closure.json'),'utf8'));
  const observed=audit(root),manifest=JSON.parse(fs.readFileSync(path.join(root,MANIFEST),'utf8'));
  if(JSON.stringify(observed)!==JSON.stringify(manifest))throw new Error('partial journal differs from original pinned interruption');
  verifyFailure(closure,observed);assertBindings(closure,loadInputs(root,'RESULT-0081'));
  const lines=[];recompute(root,{print:(...args)=>lines.push(args.join(' '))});
  const output=lines.join('\n');if(!output.includes('MATCH retained arithmetic')||!output.includes('UNVERIFIED aggregate'))throw new Error('post-stop arithmetic disposition differs');
  return{pending:false,failedReceipt:true,scientificComplete:false,result:'RESULT-0081',path:'NONE',closure_status:'UNVERIFIED',approvedInventoryException:checked.exception};
}
if(require.main===module){try{console.log('RETAINED_POST_STOP_CLOSEOUT',JSON.stringify(verify(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={verify,sources};
