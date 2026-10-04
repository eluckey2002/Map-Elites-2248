'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const script=path.join(root,'solver/policy-fit/recompute-preflight.js');
test('historical recompute rejects the retained zero-coverage cross-check receipt',()=>{
 const input=path.join(root,'docs/goals/policy-learned-judge/noise-before-arm-correction.json');
 const result=spawnSync(process.execPath,[script,input],{cwd:root,encoding:'utf8'});
 assert.notEqual(result.status,0);assert.match(result.stderr,/cross-check must actually cover twelve levels/);
 assert.doesNotMatch(result.stdout,/MATCH CROSS-CHECK/);
});
test('historical recompute requires and reduces both real twelve-level arms',()=>{
 const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/MATCH CROSS-CHECK: all twelve/);
});
