'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {specification,plan}=require('../policy-lab/proposal-planning');
const {jointSpace,selectFrozen}=require('../policy-lab/proposal-space');
const {csv,preflight,committedPhaseSources}=require('../policy-lab/run-proposals');
const independent=require('../policy-lab/proposal-recompute');
test('registered proposal sequence has fifteen distinct generation changes and near-zero/large untrimmed doses',()=>{
  const specs=Array.from({length:15},(_,i)=>specification(i+1));
  assert.equal(new Set(specs.map(s=>JSON.stringify(s.policy))).size,15);
  assert.deepEqual(specs.slice(0,5).map(s=>s.dose),[0.001,1,8,128,1000000]);
  assert.deepEqual(specs.slice(5,10).map(s=>s.dose),[28,32,40,48,64]);
  assert.deepEqual(specs.slice(10).map(s=>s.dose),[10,12,16,20,24]);
  for(const s of specs){assert.equal(s.kind,'generation');assert.equal(Object.keys(s.policy.weights||s.policy.params).length,1);}
  assert.throws(()=>specification(16),/1\.\.15/);
});
test('joint search varies accepted coordinates together and caps complete candidates at thirty-one',()=>{
  assert.deepEqual(jointSpace([]),[]);
  const small=jointSpace([{coordinate:'occupancy',dose:8},{coordinate:'width',dose:40}]);
  assert.equal(small.length,9);
  assert.deepEqual(new Set(small.map(p=>p.weights.occupancy)),new Set([1,8,128]));
  assert.deepEqual(new Set(small.map(p=>p.params.width)),new Set([32,40,48]));
  assert.ok(small.every(p=>p.weights && p.params));
  const many=jointSpace([{coordinate:'occupancy',dose:1},{coordinate:'occupancy',dose:128},
    {coordinate:'width',dose:32},{coordinate:'width',dose:48},{coordinate:'pathWidth',dose:12},{coordinate:'pathWidth',dose:20}]);
  assert.equal(many.length,31);assert.equal(new Set(many.map(p=>JSON.stringify(p))).size,31);
  assert.deepEqual(many,jointSpace([{coordinate:'pathWidth',dose:20},{coordinate:'width',dose:48},
    {coordinate:'occupancy',dose:128},{coordinate:'pathWidth',dose:12},{coordinate:'width',dose:32},{coordinate:'occupancy',dose:1}]));
  const ranked=jointSpace([{coordinate:'occupancy',dose:1,recheck:{meanMovesSaved:0.1}},
    {coordinate:'occupancy',dose:128,recheck:{meanMovesSaved:0.4}},{coordinate:'width',dose:48,recheck:{meanMovesSaved:0.3}}]);
  assert.deepEqual(ranked[0],{kind:'lab',weights:{occupancy:128},params:{width:48}});
});
test('candidate freeze chooses fresh recheck speed and fewer changes on ties',()=>{
  const row=(id,outcome,mean,policy)=>({id,outcome,recheck:{meanMovesSaved:mean},policy});
  const chosen=row('P2','ACCEPTED',0.4,{kind:'lab',params:{width:32}});
  const rows=[row('P1','NOT_ACCEPTED',9,{kind:'lab'}),row('J1','ACCEPTED',0.4,{kind:'lab',params:{width:32,pathWidth:12}}),chosen,
    row('P3','ACCEPTED',0.3,{kind:'lab',weights:{occupancy:8}})];
  assert.equal(selectFrozen(rows),chosen);assert.equal(selectFrozen([{id:'pending',outcome:'PROMISING_UNRECHECKED'}]),null);
});
test('paired-panel preflight cannot spend a reference when its fresh candidate cannot fit',()=>{
  const counts={proposals:900};const config={budgets:{proposals:2000},maxGames:2000};
  assert.throws(()=>preflight(counts,'proposals',1160,config),/BUDGET_STOP/);
  assert.deepEqual(counts,{proposals:900});
  preflight({proposals:840},'proposals',1160,config);
});
test('proposal CSV identifies fresh recheck as the primary result and preserves unreached stages',()=>{
  const output=csv([{id:'P1',round:1,kind:'generation',hypothesis:'a, "quoted" hypothesis',outcome:'NOT_ACCEPTED',
    gate:{netWins:2,meanMovesSaved:5,moveCi95:[4,6]},recheckBlock:'R1',recheck:{netWins:-1,meanMovesSaved:-0.2,moveCi95:[-0.4,0]}}]);
  assert.match(output,/recheckNetWins,recheckMeanMovesSaved,recheckCi95,gateNetWins/);
  assert.match(output,/"-1","-0.2","\[-0.4,0\]","2","5"/);
  assert.match(output,/a, ""quoted"" hypothesis/);
  assert.match(csv([{id:'P2',outcome:'GATE_PENDING'}]),/UNVERIFIED_NOT_RUN/);
});
test('independent proposal arithmetic reproduces a hand-calculated four-cell grid',()=>{
  const reference=[0,1,2,3].map(i=>({level:Math.floor(i/2)+1,seed:10+i%2,outcome:{win:true,moveBudget:10,movesToTarget:8}}));
  const candidate=reference.map((g,i)=>({...g,outcome:{...g.outcome,movesToTarget:8-2*i}}));
  const s=independent.summarize(candidate,reference,[1,2],[10,11]);
  assert.equal(s.meanMovesSaved,3);assert.equal(s.moveSeLevel,2);assert.equal(s.moveSeSeed,1);assert.equal(s.moveSe,2);
  assert.ok(Math.abs(s.moveCi95[0]+0.92)<1e-12);assert.ok(Math.abs(s.moveCi95[1]-6.92)<1e-12);
  assert.equal(s.candidateFaster,3);assert.equal(s.sameSpeed,1);assert.equal(s.relativeMovesPct,37.5);
  candidate[0].seed=99;assert.throws(()=>independent.summarize(candidate,reference,[1,2],[10,11]),/address/);
});
test('independent verdict refuses gate-only success, fresh uncertainty and win regressions',()=>{
  const gate={netWins:0,meanMovesSaved:1};
  assert.equal(independent.outcome(gate,null),'PROMISING_UNRECHECKED');
  assert.equal(independent.outcome(gate,{netWins:0,meanMovesSaved:1,moveCi95:[null,null]}),'NOT_ACCEPTED');
  assert.equal(independent.outcome(gate,{netWins:-1,meanMovesSaved:5,moveCi95:[4,6]}),'NOT_ACCEPTED');
  assert.equal(independent.outcome(gate,{netWins:0,meanMovesSaved:1,moveCi95:[0,2]}),'NOT_ACCEPTED');
  assert.equal(independent.outcome(gate,{netWins:0,meanMovesSaved:1,moveCi95:[0.1,1.9]}),'ACCEPTED');
});
test('planning preserves three distinct eligible historical boards and refuses candidate overwrite',t=>{
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-proposal-planning-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const file=path.join(root,'solver/policy-lab/runs/generation.json');fs.mkdirSync(path.dirname(file),{recursive:true});
  const boards=[1,2,3].map(move=>({file:'historical-fixture.json',move,ownerFaster:true,diagnostic:true,board:[[{value:2},{value:4}]]}));
  fs.writeFileSync(file,JSON.stringify({branch:'GENERATION',moves:boards}));
  const receipt=plan(1,{root});assert.deepEqual(receipt.boards,boards);
  assert.deepEqual(require(path.join(root,receipt.configPath)),{kind:'lab',weights:{occupancy:0.001}});
  assert.throws(()=>plan(1,{root}),/EEXIST/);
  fs.writeFileSync(file,JSON.stringify({branch:'GENERATION',moves:boards.slice(0,2)}));
  assert.throws(()=>plan(2,{root}),/fewer than three/);
  fs.writeFileSync(file,JSON.stringify({branch:'GENERATION',moves:[boards[0],boards[0],boards[0]]}));
  assert.throws(()=>plan(2,{root}),/duplicate planning board/);
});
test('phase admission pins the committed audit and rejects uncommitted drift before execution',t=>{
  const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'policy-audit-identity-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const git=args=>cp.execFileSync('git',args,{cwd:root,stdio:'ignore'});
  git(['init','--quiet']);git(['config','user.name','Qualification fixture']);git(['config','user.email','fixture@example.invalid']);
  const file=path.join(root,'audit.js');fs.writeFileSync(file,"throw new Error('must never execute during identity validation');\n");
  git(['add','audit.js']);git(['commit','--quiet','-m','Fixture audit identity']);
  const pinned=committedPhaseSources(['audit.js'],{root});assert.match(pinned.phaseCommit,/^[a-f0-9]{40}$/);assert.match(pinned.sourceHashes['audit.js'],/^[a-f0-9]{64}$/);
  fs.writeFileSync(file,"console.log('fake qualification');\n");
  assert.throws(()=>committedPhaseSources(['audit.js'],{root}),/must be committed before use: audit\.js/);
  git(['add','audit.js']);git(['commit','--quiet','-m','New fixture identity before use']);
  const next=committedPhaseSources(['audit.js'],{root});assert.notEqual(next.phaseCommit,pinned.phaseCommit);assert.notEqual(next.sourceHashes['audit.js'],pinned.sourceHashes['audit.js']);
});
