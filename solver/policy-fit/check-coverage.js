'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'); const goal=path.join(root,'docs/goals/policy-learned-judge');
const plan=fs.readFileSync(path.join(goal,'EXPLORATION_PLAN.md'),'utf8');
const {blocks,levels}=JSON.parse(fs.readFileSync(path.join(goal,'blocks.json'),'utf8'));
if(levels.length!==58||levels.some((v,i)=>v!==i+1))throw Error('FAIL: not all 58 levels');
console.log('PASS declared level set: 1 to 58');
const ranges=[];
for(const [name,b]of Object.entries(blocks)) {
 if(!plan.includes('| '+name+' | '+b.start+' | '+(b.start+b.count-1)+' | '+b.count+' |'))throw Error('FAIL: plan/block mismatch '+name);
 if(b.start<70000000||b.start+b.count-1>79999999)throw Error('FAIL: range outside authorized interval '+name);
 if(ranges.some(r=>b.start<=r.end&&b.start+b.count-1>=r.start))throw Error('FAIL: seed overlap '+name);
 ranges.push({start:b.start,end:b.start+b.count-1});
 console.log('PASS '+name+' declared range inside authorized interval and disjoint');
}
const ceiling=JSON.parse(fs.readFileSync(path.join(goal,'ceiling.json'),'utf8'));
if(ceiling.path!=='E')throw Error('FAIL: this closure requires Path E');
for(const name of Object.keys(blocks))console.log(name+': not run');
console.log('PASS Path E: no fresh panel or confirmation was run; coverage assertions apply to no unrun block');
