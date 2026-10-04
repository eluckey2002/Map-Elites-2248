'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync,spawnSync}=require('node:child_process');
const {initialRaw,charge,aggregate,completionProblems}=require('../policy-lab/resume-core');
const ROOT=path.resolve(__dirname,'../..');
const read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f)));
const previous=read('solver/policy-lab/runs/recovery/controls-raw.json');
const closure=read('experiments/RESULT-0081/closure.json');
function config(){const c=structuredClone(previous.config);c.result='RESULT-0082';c.blocks.C12={start:60053000,count:10};
  c.budgets.controls=30160;c.maxGames=120160;c.carryForward={counts:structuredClone(previous.counts),excludedPreviousC12:{completedGames:480,unknownChargedGames:100,chargedGames:580}};return c;}
function complete(){
  const c=config(),raw=initialRaw(previous,closure,c,{synthetic:true});
  for(const arm of['champion','zero','handicap10','handicap5']){
    const p=structuredClone(previous.panels.find(p=>p.block==='C1'&&p.arm===arm));
    const oldStart=p.seeds[0];p.block='C12';p.seeds=Array.from({length:10},(_,i)=>60053000+i);
    for(const g of p.games)g.seed=60053000+g.seed-oldStart;
    raw.panels.push(p);charge(raw.counts,'controls',580,c);
    raw.dispatches.push({block:'C12',arm,policy:p.policy,seeds:p.seeds,budget:'controls',games:580});
  }
  raw.headlines.controls.push({...structuredClone(previous.headlines.controls[0]),block:'C12'});
  Object.assign(raw.headlines,aggregate(raw.headlines.controls,c.historicalMde));return raw;
}
test('continuation retains eleven controls and every unknown-game charge without replaying a cell',()=>{
  const c=config(),raw=initialRaw(previous,closure,c,{synthetic:true});
  assert.equal(raw.counts.controls,27840);assert.equal(Object.values(raw.counts).reduce((a,b)=>a+b),29800);
  assert.equal(raw.panels.filter(p=>/^C/.test(p.block)).length,44);assert.deepEqual(raw.panels,previous.panels);
  assert.equal(raw.dispatches.length,0);assert.deepEqual(raw.parity,previous.parity);assert.deepEqual(raw.inert,previous.inert);
  const bad=config();bad.carryForward.counts.controls-=100;assert.throws(()=>initialRaw(previous,closure,bad,{}),/carried charges changed/);
  const lost=structuredClone(previous);lost.panels=lost.panels.filter(p=>!(p.block==='C11'&&p.arm==='zero'));
  assert.throws(()=>initialRaw(lost,closure,c,{}),/incomplete carried control/);
});
test('minimum budget increase funds exactly one whole replacement while preserving other funded phases',()=>{
  const c=config(),counts=structuredClone(previous.counts);
  const unfunded=structuredClone(c);unfunded.budgets.controls=30000;unfunded.maxGames=120000;
  assert.throws(()=>charge(structuredClone(counts),'controls',2320,unfunded),/BUDGET_STOP/);
  charge(counts,'controls',2320,c);assert.equal(counts.controls,30160);assert.equal(Object.values(counts).reduce((a,b)=>a+b),32120);
  assert.throws(()=>charge(counts,'controls',1,c),/BUDGET_STOP/);
  charge(counts,'proposals',580,c);assert.equal(counts.proposals,1160);assert.equal(counts.confirmation,0);
});
test('completion refuses lost-game discounts, old C12 seeds, missing arms and weakened bars',()=>{
  const raw=complete();assert.deepEqual(completionProblems(raw),[]);
  const discount=structuredClone(raw);discount.counts.controls-=680;
  assert.ok(completionProblems(discount).some(p=>/accounting mismatch/.test(p)));
  const missing=structuredClone(raw);missing.panels.pop();assert.ok(completionProblems(missing).length);
  const old=structuredClone(raw),p=old.panels.find(p=>p.block==='C12'&&p.arm==='champion');p.games.forEach(g=>g.seed-=2000);p.seeds=p.seeds.map(s=>s-2000);
  assert.ok(completionProblems(old).some(p=>/substituted|dispatch differs/.test(p)));
  const weak=structuredClone(raw);weak.headlines.bars.strongRequired=.5;
  assert.ok(completionProblems(weak).some(p=>/aggregate bars/.test(p)));
});
test('independent CLI refuses erased charges and inherited-panel mutations without playing new games',()=>{
  const plan='docs/goals/policy-terms-loop/RESUME_PLAN.md';
  const commit=execFileSync('git',['log','--diff-filter=A','--format=%H','--',plan],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').at(-1);
  const c=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(fs.readFileSync(path.join(ROOT,plan),'utf8'))[1]);
  const raw=initialRaw(previous,closure,c,{exploratory:true,recoveryPlanCommit:commit});
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'policy-resume-audit-'));
  const check=value=>{
    const file=path.join(temporary,'fixture.json');fs.writeFileSync(file,JSON.stringify(value));
    return spawnSync(process.execPath,['solver/policy-lab/resume-recompute.js',file],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  };
  try{
    const valid=check(raw);assert.equal(valid.status,0,valid.stderr);assert.match(valid.stdout,/UNVERIFIED aggregate/);assert.match(valid.stdout,/MATCH retained arithmetic/);
    const discount=structuredClone(raw);discount.counts.controls-=100;const badCount=check(discount);
    assert.equal(badCount.status,1);assert.match(badCount.stderr,/charged accounting/);
    const modified=structuredClone(raw);modified.panels.find(p=>p.block==='C11'&&p.arm==='zero').games[0].outcome.movesToTarget++;
    const badPanel=check(modified);assert.equal(badPanel.status,1);assert.match(badPanel.stderr,/all inherited panels/);
  }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
