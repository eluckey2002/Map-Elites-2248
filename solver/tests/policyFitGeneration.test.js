'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {generationDecision}=require('../policy-fit/generation-decision');
function rows(n,misses) {return Array.from({length:n},(_,i)=>({ownerFaster:true,ownerPoints:100,botPoints:80,poolBest:i<misses?99:100}));}
test('generation ceiling does not stop an undersized all-missing subset',()=>{
 const r=generationDecision(rows(29,29),[]);assert.equal(r.path,null);assert.equal(r.status,'INCONCLUSIVE_SMALL_SUBSET');
});
test('generation ceiling stops exactly at the frozen minimum and half threshold',()=>{
 assert.equal(generationDecision(rows(30,15),[]).path,'E');assert.equal(generationDecision(rows(30,14),[]).path,null);
 assert.equal(generationDecision(rows(31,15),[]).path,null);assert.equal(generationDecision(rows(31,16),[]).path,'E');
});
test('generation ceiling excludes bot-faster boards and tied owner points',()=>{
 const r=generationDecision([...rows(29,29),{ownerFaster:false,ownerPoints:100,botPoints:80,poolBest:0},{ownerFaster:true,ownerPoints:100,botPoints:100,poolBest:0}],[]);
 assert.equal(r.n,29);assert.equal(r.path,null);
});
test('unresolved recording prevents a generation prerequisite verdict',()=>{
 const r=generationDecision(rows(30,30),[{file:'unresolved'}]);assert.equal(r.status,'UNMET_ITEM');assert.equal(r.path,null);
});
