'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkInputs,sameApartFromRuntimeIdentity,rederivedReceiptVerifies}=require('../policy-fit/check-inputs');
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
test('a re-derived pilot receipt must carry identities its own pilot verifies',()=>{
 const input='pilots/HUMAN-PILOT-0002/execution-receipt.json';
 const live=fs.readFileSync(path.join(__dirname,'../..',input));
 assert.ok(rederivedReceiptVerifies(input,live));
 const receipt=JSON.parse(live);
 for(const forged of [{...receipt,runtimeBundleIdentity:'0'.repeat(64)},{...receipt,artifactIdentity:null},(({artifactIdentity,...rest})=>rest)(receipt)]){
  assert.ok(!rederivedReceiptVerifies(input,Buffer.from(JSON.stringify(forged))));
 }
 assert.ok(!rederivedReceiptVerifies('pilots/HUMAN-PILOT-0001/execution-receipt.json',live),'a pilot without its own verifier is never accepted');
});
