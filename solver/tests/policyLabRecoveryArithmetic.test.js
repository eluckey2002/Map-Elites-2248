'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync,execFileSync}=require('node:child_process');
const {axis,summarize}=require('../policy-lab/recovery-recompute');
test('independent arithmetic gives the hand-calculated level and seed errors',()=>{
  const a=axis([0,2,4,6],2,2);
  assert.equal(a.mean,3);assert.equal(a.seLevel,2);assert.equal(a.seSeed,1);assert.equal(a.se,2);
  assert.ok(Math.abs(a.ci95[0]+0.92)<1e-12);assert.ok(Math.abs(a.ci95[1]-6.92)<1e-12);
  assert.throws(()=>axis([0,2,4],2,2),/incomplete/);
});
test('independent arithmetic keeps win regressions and single mutual-win uncertainty',()=>{
  const outcome=(win,moves)=>({win,movesToTarget:win?moves:null,moveBudget:8});
  const cells=[
    {level:1,seed:10,candidate:outcome(true,2),champion:outcome(true,4)},
    {level:1,seed:11,candidate:outcome(true,3),champion:outcome(false)},
    {level:2,seed:10,candidate:outcome(false),champion:outcome(true,3)},
    {level:2,seed:11,candidate:outcome(false),champion:outcome(false)},
  ];
  const s=summarize(cells,[1,2],[10,11]);
  assert.equal(s.winsGained,1);assert.equal(s.winsLost,1);assert.equal(s.netWins,0);
  assert.equal(s.winSe,0.5);assert.equal(s.meanMovesSaved,2);assert.equal(s.mutualWins,1);
  assert.equal(s.moveSe,null);assert.deepEqual(s.moveCi95,[null,null]);assert.equal(s.relativeMovesPct,50);
  cells[0].candidate.movesToTarget=9;assert.throws(()=>summarize(cells,[1,2],[10,11]),/malformed/);
});
test('independent audit matches inherited real panels and rejects discounted charges or burned C3 substitution',t=>{
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'policy-recovery-arithmetic-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const plan='docs/goals/policy-terms-loop/RECOVERY_PLAN.md';
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(fs.readFileSync(path.join(root,plan),'utf8'))[1]);
  const first=execFileSync('git',['log','--diff-filter=A','--format=%H','--',plan],{cwd:root,encoding:'utf8'}).trim().split('\n').at(-1);
  const old=JSON.parse(fs.readFileSync(path.join(root,'solver/policy-lab/runs/controls-raw.json')));
  const raw={...structuredClone(old),result:config.result,config,registration:{recoveryPlanCommit:first},status:'QUALIFICATION_SNAPSHOT',dispatches:[],
    panels:old.panels.filter(p=>p.block!=='C3'),excludedOriginalPanels:old.panels.filter(p=>p.block==='C3').map(p=>({block:p.block,arm:p.arm,games:p.games.length}))};
  const file=path.join(temp,'snapshot.json');
  const run=value=>{fs.writeFileSync(file,JSON.stringify(value));return spawnSync(process.execPath,[path.join(root,'solver/policy-lab/recovery-recompute.js'),file],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});};
  const valid=run(raw);assert.equal(valid.status,0,valid.stderr);assert.match(valid.stdout,/MATCH retained arithmetic/);assert.match(valid.stdout,/UNVERIFIED aggregate/);
  const discounted=structuredClone(raw);discounted.counts.controls-=580;
  const badCharge=run(discounted);assert.equal(badCharge.status,1);assert.match(badCharge.stderr,/charged accounting/);
  const burned=structuredClone(raw);burned.panels.push(old.panels.find(p=>p.block==='C3'));
  const badSeed=run(burned);assert.equal(badSeed.status,1);assert.match(badSeed.stderr,/addresses/);
});
