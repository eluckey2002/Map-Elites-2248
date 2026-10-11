'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkInputs,sameApartFromRuntimeIdentity}=require('../policy-fit/check-inputs');
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
