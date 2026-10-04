'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {runCurrentSuite}=require('../../docs/goals/policy-terms-loop/live-suite');
const {inventoryException}=require('../../docs/goals/policy-terms-loop/poststop-recompute');
test('current closeout rejects a new failing test added after a successful saved suite receipt',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-current-suite-'));
  try{
    fs.mkdirSync(path.join(root,'solver/tests'),{recursive:true});
    fs.mkdirSync(path.join(root,'docs/goals/policy-terms-loop'),{recursive:true});
    const fixture="const test=require('node:test');\n"+[1,2,3].map(n=>`test('known-${n}',()=>{throw new Error('deliberate synthetic baseline');});\n`).join('')+"test.skip('original skip',()=>{});\n";
    fs.writeFileSync(path.join(root,'solver/tests/baseline.test.js'),fixture);
    const baseline=[1,2,3].map(n=>`not ok ${n} - known-${n}`).join('\n');
    fs.writeFileSync(path.join(root,'docs/goals/policy-terms-loop/baseline-output.txt'),baseline);
    const first=runCurrentSuite(root);
    assert.deepEqual(first.totals,{tests:4,pass:0,fail:3,skipped:1});
    fs.writeFileSync(path.join(root,'docs/goals/policy-terms-loop/recovery-final-tests.txt'),first.output);
    fs.writeFileSync(path.join(root,'solver/tests/new.test.js'),"const test=require('node:test');test('new unexpected failure',()=>{throw new Error('new failure');});\n");
    assert.throws(()=>runCurrentSuite(root),error=>/current full suite/.test(error.message)&&error.stdout.includes('new unexpected failure'));
    assert.equal(fs.readFileSync(path.join(root,'docs/goals/policy-terms-loop/recovery-final-tests.txt'),'utf8'),first.output);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('post-stop exception permits exactly RESULT-0081 and preserves every other inventory byte',()=>{
  const before="prefix\n'RESULT-0036', 'RESULT-0037', 'RESULT-0041', 'RESULT-0042', 'RESULT-0080',\nsuffix\n";
  const current=before.replace("'RESULT-0080',","'RESULT-0080', 'RESULT-0081',");
  assert.equal(inventoryException(before,current).path,'solver/tests/failedRunLedger.test.js');
  for(const bad of [before,current+'// unapproved edit\n',current.replace('RESULT-0081','RESULT-0082'),current.replace('RESULT-0042','RESULT-0043')])assert.throws(()=>inventoryException(before,bad),/approved RESULT-0081/);
});
