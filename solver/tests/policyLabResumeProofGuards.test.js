'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requireUniqueAddition,requireTrustInputs}=require('../../docs/goals/policy-terms-loop/resume-proof-audit');
const {executePinnedAudits}=require('../../docs/goals/policy-terms-loop/verify-resume-closeout');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'resume-proof-'));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git(['init','-q']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  return{root,git,write:(file,body)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);}};
}
test('full-history guard rejects an independently added replacement hidden by a merge',()=>{
  const f=fixture();try{
    f.write('base.txt','base');f.git(['add','.']);f.git(['commit','-qm','base']);const base=f.git(['rev-parse','HEAD']);
    f.git(['checkout','-qb','original']);f.write('plan.md','original plan');f.git(['add','.']);f.git(['commit','-qm','original registration']);const original=f.git(['rev-parse','HEAD']);
    assert.equal(requireUniqueAddition(f.root,'plan.md',original),'original plan');
    f.git(['checkout','-qb','replacement',base]);f.write('plan.md','independent replacement');f.git(['add','.']);f.git(['commit','-qm','replacement registration']);
    f.git(['checkout','-q','original']);f.git(['merge','--no-ff','-X','theirs','replacement','-m','retain replacement']);
    const additions=f.git(['log','--full-history','--no-merges','--diff-filter=A','--format=%H','--','plan.md']).split('\n');assert.equal(additions.length,2);
    assert.throws(()=>requireUniqueAddition(f.root,'plan.md',original),/competing/);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('additional trust audit rejects validator/baseline drift even after bytes are restored',()=>{
  const f=fixture();try{
    f.write('validator.js','trusted validator');f.write('baseline.txt','trusted failures');f.git(['add','.']);f.git(['commit','-qm','actual suite inputs']);const anchor=f.git(['rev-parse','HEAD']);
    assert.equal(Object.keys(requireTrustInputs(f.root,anchor,['validator.js','baseline.txt'])).length,2);
    f.write('validator.js','weakened validator');assert.throws(()=>requireTrustInputs(f.root,anchor,['validator.js','baseline.txt']),/trust input differs/);
    f.git(['add','.']);f.git(['commit','-qm','weaken']);f.write('validator.js','trusted validator');f.git(['add','.']);f.git(['commit','-qm','restore']);
    assert.throws(()=>requireTrustInputs(f.root,anchor,['validator.js','baseline.txt']),/subsequent history/);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('recurring completion runs pinned numeric audits and refuses unsuccessful or incomplete output',()=>{
  const command='solver/policy-lab/resume-proposal-recompute.js';let calls=0;
  assert.throws(()=>executePinnedAudits('/fixture',[command],{path:'B'},{execute:()=>{calls++;return'MATCH retained proposal arithmetic\nUNVERIFIED phase';}}),/complete proposal/);assert.equal(calls,1);
  assert.throws(()=>executePinnedAudits('/fixture',[command],{path:'B'},{execute:()=>{throw new Error('actual recompute exit1');}}),/exit1/);
  executePinnedAudits('/fixture',[command],{path:'B'},{execute:()=> 'MATCH retained proposal arithmetic\nPASS completed proposal journal jobs'});
});
