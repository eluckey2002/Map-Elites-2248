'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const childProcess=require('node:child_process');
const {withCompleteGitOutput}=require('../../docs/goals/policy-terms-loop/resume-terminal-buffer');
test('real Git inventory exceeding the default buffer retains every path and the forbidden tail',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-terminal-buffer-'));
  const original=childProcess.execFileSync;
  const git=args=>childProcess.execFileSync('git',args,{cwd:root,encoding:'utf8'});
  try{
    git(['init','-q']);fs.mkdirSync(path.join(root,'solver'),{recursive:true});
    const names=[];
    for(let i=0;i<5000;i++){
      const name='solver/'+String(i).padStart(5,'0')+'-'+('x'.repeat(220))+'.json';
      names.push(name);fs.writeFileSync(path.join(root,name),'');
    }
    names.push('src/forbidden-tail.js');fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,names.at(-1)),'');
    git(['add','--all']);
    assert.throws(()=>git(['ls-files']),error=>error.code==='ENOBUFS');
    const output=withCompleteGitOutput(()=>git(['ls-files']));
    assert.ok(Buffer.byteLength(output)>1024*1024);
    assert.deepEqual(output.trimEnd().split('\n'),names);
    assert.equal(output.trimEnd().split('\n').at(-1),'src/forbidden-tail.js');
    assert.throws(()=>withCompleteGitOutput(()=>childProcess.execFileSync('git',['ls-files'],{cwd:root,maxBuffer:1000})),error=>error.code==='ENOBUFS');
    assert.equal(childProcess.execFileSync,original);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('Git errors propagate and the original function is restored after refusal',()=>{
  const original=childProcess.execFileSync;
  assert.throws(()=>withCompleteGitOutput(()=>childProcess.execFileSync('git',['rev-parse','--verify','refs/does-not-exist'],{stdio:'pipe'})),error=>error.status!==0);
  assert.equal(childProcess.execFileSync,original);
  assert.throws(()=>withCompleteGitOutput(()=>childProcess.execFileSync(process.execPath,['-e','process.stdout.write("x".repeat(1100000))'])),error=>error.code==='ENOBUFS');
  assert.equal(childProcess.execFileSync,original);
});
