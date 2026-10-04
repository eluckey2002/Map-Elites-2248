'use strict';
// Additional read-only closeout enforcement; never rewrites a registration or
// claims these trust inputs were separately frozen by the original F protocol.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const DIR='docs/goals/policy-terms-loop/';
const TRUST=[DIR+'live-suite.js',DIR+'baseline-output.txt'];
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const git=(root,args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
function requireUniqueAddition(root,file,expected){
  const additions=git(root,['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--',file]).trim().split('\n').filter(Boolean);
  if(additions.length!==1||additions[0]!==expected)throw new Error('registration has competing or mismatched full-history additions: '+file);
  git(root,['merge-base','--is-ancestor',expected,'HEAD']);
  return git(root,['show',expected+':'+file]);
}
function requireTrustInputs(root,anchor,files=TRUST){
  const hashes={};
  for(const file of files){
    const bytes=git(root,['show',anchor+':'+file]);const current=fs.readFileSync(path.join(root,file));
    if(digest(bytes)!==digest(current))throw new Error('pre-confirmation trust input differs: '+file);
    if(git(root,['log','--format=%H',anchor+'..HEAD','--',file]).trim())throw new Error('pre-confirmation trust input changed in subsequent history: '+file);
    hashes[file]=digest(current);
  }
  return hashes;
}
function audit(root){
  const read=file=>fs.readFileSync(path.join(root,file),'utf8');
  const controls=JSON.parse(read('solver/policy-lab/runs/resume/controls-raw.json'));
  const result=controls.result,registration=controls.registration;
  const plans={
    [DIR+'EXPLORATION_PLAN.md']:registration.originalPlanCommit,
    [DIR+'RECOVERY_PLAN.md']:registration.previousPlanCommit,
    [DIR+'RESUME_PLAN.md']:registration.recoveryPlanCommit,
  };
  for(const[file,commit]of Object.entries(plans))requireUniqueAddition(root,file,commit);
  const proto=`experiments/${result}/protocol.md`;
  const additions=git(root,['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--',proto]).trim().split('\n').filter(Boolean);
  if(additions.length!==1)throw new Error('one unique full-history confirmation registration required');
  const registered=requireUniqueAddition(root,proto,additions[0]);
  const suite=DIR+'resume-before-confirmation-tests.txt';
  const commits=git(root,['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--',suite]).trim().split('\n').filter(Boolean);
  if(commits.length!==1)throw new Error('one unique pre-confirmation suite receipt required');
  const receipt=requireUniqueAddition(root,suite,commits[0]);
  const prefix=digest(receipt).slice(0,16);
  if(!registered.includes('  '+suite+': '+prefix+'\n')||digest(receipt)!==digest(read(suite)))throw new Error('actual pre-F suite receipt differs from registered identity');
  git(root,['merge-base','--is-ancestor',commits[0],additions[0]]);
  const trustHashes=requireTrustInputs(root,commits[0]);
  const {validateSuite}=require('./live-suite');
  const totals=validateSuite(receipt,read(DIR+'baseline-output.txt'),1);
  return{result,fullHistoryRegistrations:{...plans,[proto]:additions[0]},actualPreFTestCommit:commits[0],trustHashes,preFTotals:totals,
    scope:'Additional read-only evidence audit. Original protocol unchanged; it did not separately freeze validator/baseline. They equal their actual pre-F receipt-commit bytes and never changed in subsequent history.'};
}
if(require.main===module){try{console.log('PASS_ADDITIONAL_PROOF_AUDIT',JSON.stringify(audit(path.resolve(__dirname,'../../..'))));}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={audit,requireUniqueAddition,requireTrustInputs,trustPaths:()=>[...TRUST,DIR+'resume-proof-audit.js',DIR+'resume-additional-proof-output.json']};
