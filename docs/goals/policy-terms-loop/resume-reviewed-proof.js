'use strict';
// Stronger read-only custody proof; retain the original audit and its pin.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {audit:originalAudit}=require('./resume-proof-audit');
const TRUST=['docs/goals/policy-terms-loop/live-suite.js','docs/goals/policy-terms-loop/baseline-output.txt'];
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024}).trim();
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function requireFullTrustHistory(root,anchor,files=TRUST){
  git(root,['merge-base','--is-ancestor',anchor,'HEAD']);
  const histories={};
  for(const file of files){
    const bytes=execFileSync('git',['show',anchor+':'+file],{cwd:root,maxBuffer:64*1024*1024});
    if(sha(bytes)!==sha(fs.readFileSync(path.join(root,file))))throw new Error('actual trust input differs: '+file);
    const ordinary=git(root,['log','--full-history','--no-merges','--format=%H',anchor+'..HEAD','--',file]);
    if(ordinary)throw new Error('trust input changed in full ordinary history: '+file);
    const merges=git(root,['log','--full-history','--merges','--format=%H',anchor+'..HEAD','--',file]).split('\n').filter(Boolean);
    for(const commit of merges){
      // Inspect the result bytes, including when a CI merge inherits the
      // registered input from its second parent and main lacks the file.
      let merged;try{merged=execFileSync('git',['show',commit+':'+file],{cwd:root,maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});}
      catch{throw new Error('trust input removed by a merge: '+file);}
      if(sha(merged)!==sha(bytes))throw new Error('trust input changed by a merge: '+file);
    }
    histories[file]={sha256:sha(bytes),ordinaryChanges:[],inspectedMerges:merges};
  }
  return histories;
}
function audit(root){
  const original=originalAudit(root);
  return{...original,trustHistory:requireFullTrustHistory(root,original.actualPreFTestCommit),
    scope:'Additional full-history custody proof, including ordinary side-branch edits and every selected merge result. Original experiment, audit source and all prior pins are retained unchanged.'};
}
if(require.main===module){try{console.log('PASS_REVIEWED_FULL_HISTORY_PROOF',JSON.stringify(audit(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={audit,requireFullTrustHistory};
