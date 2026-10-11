'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkInputs,sameApartFromRuntimeIdentity,rederivedReceiptVerifies}=require('../policy-fit/check-inputs');
const {historicalVersion}=require('../game-rule-surface');
const fs=require('node:fs'),path=require('node:path');
const manifest=require('../../docs/goals/policy-learned-judge/historical-inputs.json');
test('historical manifest pins all archive stores and receipts with unchanged hashes',()=>assert.ok(checkInputs(manifest)>0));
test('historical manifest rejects an omitted archived candidate input',()=>{
 const omitted={...manifest}; const key=Object.keys(omitted).find(p=>p.startsWith('solver/candidates-archive/')&&!p.endsWith('.receipt.json'));
 assert.ok(key); delete omitted[key]; assert.throws(()=>checkInputs(omitted),/Unpinned archive input/);
});
test('a re-derived pilot receipt may move only its two runtime identity fields (DECISION-0013)',()=>{
 const pinned=Buffer.from(JSON.stringify({artifactIdentity:'a',runtimeBundleIdentity:'b',score:140544,seed:424242}));
 const rederived=Buffer.from(JSON.stringify({artifactIdentity:'c',runtimeBundleIdentity:'d',score:140544,seed:424242}));
 const rescored=Buffer.from(JSON.stringify({artifactIdentity:'c',runtimeBundleIdentity:'d',score:140545,seed:424242}));
 assert.ok(sameApartFromRuntimeIdentity(rederived,pinned));
 assert.ok(!sameApartFromRuntimeIdentity(rescored,pinned));
});
test('a re-derived pilot receipt must carry identities its own pinned pilot verifier accepts',()=>{
 const input='pilots/HUMAN-PILOT-0002/execution-receipt.json';
 const live=fs.readFileSync(path.join(__dirname,'../..',input));
 const {commit}=historicalVersion(path.join(__dirname,'../..'),input,manifest[input]);
 assert.ok(rederivedReceiptVerifies(input,live,commit));
 const receipt=JSON.parse(live);
 for(const forged of [{...receipt,runtimeBundleIdentity:'0'.repeat(64)},{...receipt,artifactIdentity:null},(({artifactIdentity,...rest})=>rest)(receipt)]){
  assert.ok(!rederivedReceiptVerifies(input,Buffer.from(JSON.stringify(forged)),commit));
 }
 assert.ok(!rederivedReceiptVerifies('pilots/HUMAN-PILOT-0001/execution-receipt.json',live,commit),'a pilot without its own verifier is never accepted');
 assert.ok(!rederivedReceiptVerifies(input,live),'a receipt with no pinned commit is never accepted');
 // A verifier that differs from the pinned commit's is not trusted, even one
 // that would pass everything.
 const qualifier=fs.readFileSync(path.join(__dirname,'../../pilots/HUMAN-PILOT-0002/qualify.js'));
 assert.ok(!rederivedReceiptVerifies(input,live,commit,Buffer.concat([qualifier,Buffer.from('\nmodule.exports.verifyExecution=()=>({status:\'PASS\'});\n')])));
 assert.ok(!rederivedReceiptVerifies(input,live,'04c5e5f5^'),'a pinned commit without the verifier is not trusted');
});
test('a later commit that restores pinned bytes beside a changed verifier cannot stand in for the original',()=>{
 const os=require('node:os'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
 const repo=fs.mkdtempSync(path.join(os.tmpdir(),'pinned-history-'));
 const git=(...args)=>execFileSync('git',['-c','user.name=t','-c','user.email=t@t','-c','commit.gpgsign=false',...args],{cwd:repo,encoding:'utf8'}).trim();
 try{
  git('init','-q');
  fs.mkdirSync(path.join(repo,'p'));
  const receipt='{"score":1}';
  fs.writeFileSync(path.join(repo,'p/receipt.json'),receipt); fs.writeFileSync(path.join(repo,'p/qualify.js'),'strict');
  git('add','.'); git('commit','-q','-m','original'); const original=git('rev-parse','HEAD');
  fs.rmSync(path.join(repo,'p/receipt.json')); fs.writeFileSync(path.join(repo,'p/qualify.js'),'weak');
  git('add','-A'); git('commit','-q','-m','move'); 
  fs.writeFileSync(path.join(repo,'p/receipt.json'),receipt);
  git('add','.'); git('commit','-q','-m','restore beside weak verifier');
  const hash=crypto.createHash('sha256').update(receipt).digest('hex');
  assert.equal(historicalVersion(repo,'p/receipt.json',hash).commit,original);
 }finally{fs.rmSync(repo,{recursive:true,force:true});}
});
