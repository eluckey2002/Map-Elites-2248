'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verdict,chunks,literalCandidate,reportProgress,run}=require('../policy-lab/run-confirmation');
test('confirmation requires positive overall interval without net win regressions',()=>{
  const s=(netWins,meanMovesSaved,ci)=>({netWins,meanMovesSaved,moveCi95:ci});
  assert.equal(verdict(s(0,0.3,[0.01,0.59])),'SUPPORTED');
  assert.equal(verdict(s(-1,3,[2,4])),'FALSIFIED');
  assert.equal(verdict(s(0,-0.2,[-0.3,-0.1])),'FALSIFIED');
  assert.equal(verdict(s(0,0.1,[0,0.2])),'INCONCLUSIVE');
  assert.equal(verdict(s(0,0,[0,0])),'INCONCLUSIVE');
  assert.equal(verdict(s(0,null,[null,null])),'INCONCLUSIVE');
});
test('confirmation journals ten-seed jobs without substituting the 150-seed denominator',()=>{
  const seeds=Array.from({length:150},(_,i)=>60100000+i);
  const jobs=chunks(seeds);assert.equal(jobs.length,15);assert.ok(jobs.every(j=>j.length===10));
  assert.deepEqual(jobs.flat(),seeds);assert.equal(new Set(jobs.flat()).size,150);
  assert.throws(()=>chunks(seeds,0),/invalid/);
});
test('unregistered confirmation is refused before any game or run marker',async()=>{
  await assert.rejects(run(['node','run-confirmation.js']),/needs a registered protocol/);
});
test('candidate format guard rejects nonliteral modules without executing their code',()=>{
  const policy={kind:'lab',params:{width:32}};
  assert.deepEqual(literalCandidate("'use strict';\nmodule.exports = "+JSON.stringify(policy)+";\n"),policy);
  assert.throws(()=>literalCandidate("module.exports = Object.freeze({kind: 'lab', params: {width: 32}});\n"),/literal module\.exports/);
  assert.throws(()=>literalCandidate("module.exports = (() => { throw new Error('executed'); })();\n"),/literal module\.exports/);
  assert.throws(()=>literalCandidate("exports.policy = {};\n"),/literal module\.exports/);
  assert.throws(()=>literalCandidate('// module.exports = '+JSON.stringify(policy)+';\n'),/literal module\.exports/);
  assert.throws(()=>literalCandidate('throw new Error("executed");\nmodule.exports = '+JSON.stringify(policy)+';\n'),/literal module\.exports/);
  assert.throws(()=>literalCandidate('/* ignored */\nmodule.exports = '+JSON.stringify(policy)+';\n'),/literal module\.exports/);
  assert.deepEqual(literalCandidate('module.exports = '+JSON.stringify(policy)+';\n'),policy);
});
test('operational reporting failure cannot reject a durably completed scientific job',async()=>{
  const warnings=[];
  const result=await Promise.resolve({retained:true}).then(part=>{
    assert.equal(reportProgress('100 jobs',{send:()=>{throw new Error('task no longer claimed');},warn:m=>warnings.push(m)}),false);
    return part;
  });
  assert.deepEqual(result,{retained:true});assert.match(warnings[0],/task no longer claimed/);
  let detail;assert.equal(reportProgress('done',{send:m=>{detail=m;}}),true);assert.equal(detail,'done');
});
