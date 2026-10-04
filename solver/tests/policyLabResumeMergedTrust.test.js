'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {requireTrustInputs}=require('../../docs/goals/policy-terms-loop/resume-proof-audit');
const {requireFullTrustHistory}=require('../../docs/goals/policy-terms-loop/resume-reviewed-proof');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'merged-trust-'));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const write=text=>fs.writeFileSync(path.join(root,'validator.js'),text);
  git(['init','-q']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  write('trusted');git(['add','.']);git(['commit','-qm','anchor']);
  return{root,git,write,anchor:git(['rev-parse','HEAD'])};
}
test('full history rejects a restored side-branch edit that the retained simplified audit accepts',()=>{
  const f=fixture();try{
    f.git(['checkout','-qb','clean']);fs.writeFileSync(path.join(f.root,'clean.txt'),'clean');f.git(['add','.']);f.git(['commit','-qm','clean branch']);
    f.git(['checkout','-qb','changed',f.anchor]);f.write('weakened');f.git(['add','.']);f.git(['commit','-qm','hidden trust edit']);
    f.git(['checkout','-q','clean']);f.git(['merge','--no-ff','--no-commit','changed']);f.write('trusted');f.git(['add','.']);f.git(['commit','-qm','merge restores anchor bytes']);
    assert.equal(f.git(['log','--format=%H',f.anchor+'..HEAD','--','validator.js']),'');
    assert.equal(Object.keys(requireTrustInputs(f.root,f.anchor,['validator.js'])).length,1);
    assert.throws(()=>requireFullTrustHistory(f.root,f.anchor,['validator.js']),/full ordinary history/);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('full custody also rejects merge-only edit/restore and allows an unchanged integration',()=>{
  const f=fixture();try{
    f.git(['checkout','-qb','side']);fs.writeFileSync(path.join(f.root,'side.txt'),'side');f.git(['add','.']);f.git(['commit','-qm','unrelated side']);
    f.git(['checkout','-qb','clean',f.anchor]);f.git(['merge','--no-ff','side','-m','unchanged integration']);
    assert.equal(Object.keys(requireFullTrustHistory(f.root,f.anchor,['validator.js'])).length,1);
    f.git(['checkout','-qb','side2']);fs.writeFileSync(path.join(f.root,'side2.txt'),'side2');f.git(['add','.']);f.git(['commit','-qm','unrelated second side']);
    f.git(['checkout','-q','clean']);f.git(['merge','--no-ff','--no-commit','side2']);f.write('weakened');f.git(['add','.']);f.git(['commit','-qm','merge-only edit']);
    const weakened=f.git(['rev-parse','HEAD']);
    f.git(['checkout','-qb','side3']);fs.writeFileSync(path.join(f.root,'side3.txt'),'side3');f.git(['add','.']);f.git(['commit','-qm','unrelated third side']);
    f.git(['checkout','-q','clean']);f.git(['merge','--no-ff','--no-commit','side3']);f.write('trusted');f.git(['add','.']);f.git(['commit','-qm','merge-only restore']);
    assert.equal(f.git(['log','--full-history','--no-merges','--format=%H',f.anchor+'..HEAD','--','validator.js']),'');
    assert.throws(()=>requireFullTrustHistory(f.root,f.anchor,['validator.js']),/changed by a merge/);
    assert.ok(weakened);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('unchanged trust bytes inherited by a CI-style merge from its second parent are allowed',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ci-trust-'));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try{
    git(['init','-q']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
    fs.writeFileSync(path.join(root,'base.txt'),'base');git(['add','.']);git(['commit','-qm','base']);const base=git(['rev-parse','HEAD']);
    git(['checkout','-qb','subject']);fs.writeFileSync(path.join(root,'validator.js'),'trusted');git(['add','.']);git(['commit','-qm','anchor']);const anchor=git(['rev-parse','HEAD']);
    git(['checkout','-qb','main',base]);fs.writeFileSync(path.join(root,'main.txt'),'main');git(['add','.']);git(['commit','-qm','unrelated main']);
    git(['merge','--no-ff','subject','-m','CI merge inherits trust file']);
    assert.equal(Object.keys(requireFullTrustHistory(root,anchor,['validator.js'])).length,1);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
