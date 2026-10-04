'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {expectedNavigation,validateNavigation,verifyCorrectedInput,BASE}=require('../../docs/goals/policy-terms-loop/resume-route-correction');
const ROOT=path.resolve(__dirname,'../..');
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'route-correction-'));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git(['init','-q']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
  for(const file of ['EVIDENCE_LEDGER.md','CURRENT.md','LEDGER-INDEX.md'])fs.writeFileSync(path.join(root,file),execFileSync('git',['show',BASE+':'+file],{cwd:ROOT,maxBuffer:64*1024*1024}));
  git(['add','.']);git(['commit','-qm','original navigation']);const base=git(['rev-parse','HEAD']);
  const expected=expectedNavigation(root,base);for(const[file,body]of Object.entries(expected))fs.writeFileSync(path.join(root,file),body);
  return{root,base,expected};
}
test('exact routing correction preserves all claims and rejects an added scientific claim',()=>{
  const f=fixture();try{
    assert.equal(validateNavigation(f.root,f.base),true);
    fs.appendFileSync(path.join(f.root,'EVIDENCE_LEDGER.md'),'\nNew unverified scientific claim\n');
    assert.throws(()=>validateNavigation(f.root,f.base),/more than the exact navigation/);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('unrelated CURRENT or generated-index edits are refused',()=>{
  const f=fixture();try{
    fs.appendFileSync(path.join(f.root,'CURRENT.md'),'\nAdopt the policy\n');assert.throws(()=>validateNavigation(f.root,f.base),/CURRENT/);
    fs.writeFileSync(path.join(f.root,'CURRENT.md'),f.expected['CURRENT.md']);fs.appendFileSync(path.join(f.root,'LEDGER-INDEX.md'),'\nInvented accepted result\n');assert.throws(()=>validateNavigation(f.root,f.base),/LEDGER-INDEX/);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('the exception cannot admit changed scientific data or an unexpected adapter',()=>{
  assert.throws(()=>verifyCorrectedInput({sourceCommit:BASE},'experiments/RESULT-0082/raw-pairs.json','bad',{root:ROOT}),/unapproved pin exception/);
  assert.throws(()=>verifyCorrectedInput({sourceCommit:BASE},'docs/goals/policy-terms-loop/audit-source-pin.js','bad',{root:ROOT}),/unexpected historical/);
});
