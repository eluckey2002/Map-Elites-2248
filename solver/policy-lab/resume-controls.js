'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {LEVELS}=require('../../src/game');
const {summarizePairs}=require('../ruler/core');
const {createJournaledPool}=require('./journaled-pool');
const {assertRegistration}=require('./registration');
const {atomicJson,charge,assertPanel,paired,initialRaw,aggregate,completionProblems}=require('./resume-core');
const ROOT=path.resolve(__dirname,'../..');
const PLAN='docs/goals/policy-terms-loop/RESUME_PLAN.md';
const OUT=path.join(__dirname,'runs/resume');
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
function registeredConfiguration() {
  const commit=execFileSync('git',['log','--diff-filter=A','--format=%H','--',PLAN],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').at(-1);
  const text=fs.readFileSync(path.join(ROOT,PLAN),'utf8');
  if(assertRegistration(ROOT,commit,PLAN)!==text) throw new Error('continuation registration drift');
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]);
  for(const[file,h]of Object.entries({...config.harnessFreeze,...config.carryForward.sourceHashes})) if(sha(file)!==h) throw new Error(`frozen source drift: ${file}`);
  if(JSON.stringify(LEVELS.map(l=>l.level))!==JSON.stringify(config.levels)||config.workers!==4
      ||config.maxGames!==120160||config.budgets.controls!==30160||config.maxProposalRounds!==20) throw new Error('panel/effort/concurrency drift');
  return{config,commit};
}
async function run() {
  const{config,commit}=registeredConfiguration();
  if(fs.existsSync(OUT)) throw new Error('burned continuation output: never restart');
  // A read-only audit checks both historical pins and every retained partial job.
  const audit=execFileSync(process.execPath,['docs/goals/policy-terms-loop/verify-poststop-closeout.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  if(!audit.includes('"scientificComplete":false')||!audit.includes('"closure_status":"UNVERIFIED"')) throw new Error('historical audit boundary differs');
  const previous=JSON.parse(fs.readFileSync(path.join(ROOT,'solver/policy-lab/runs/recovery/controls-raw.json')));
  const closure=JSON.parse(fs.readFileSync(path.join(ROOT,'experiments/RESULT-0081/closure.json')));
  const raw=initialRaw(previous,closure,config,{exploratory:true,recoveryPlanCommit:commit,
    originalPlanCommit:config.carryForward.originalPlanCommit,previousPlanCommit:config.carryForward.previousPlanCommit});
  // Fund the entire four-arm replacement before creating a dispatch marker.
  charge(structuredClone(raw.counts),'controls',2320,config);
  fs.mkdirSync(OUT);
  const file=path.join(OUT,'controls-raw.json');
  const checkpoint=()=>atomicJson(file,raw);
  raw.filesRead=[PLAN,...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes)].sort();checkpoint();
  let pool;
  const progress=detail=>{try{execFileSync('python',['.blackboard/board.py','progress','--actor',config.actor,'--id',config.task,'--detail',detail],{cwd:ROOT,stdio:'inherit'});}
    catch(error){console.error('OPERATIONAL_PROGRESS_WARNING',error.message,'; journaled science continues.');}};
  async function panel(arm,policy) {
    registeredConfiguration();
    if(raw.dispatches.some(d=>d.arm===arm)) throw new Error('burned panel cannot be replayed');
    const seeds=Array.from({length:10},(_,i)=>config.blocks.C12.start+i);
    charge(raw.counts,'controls',580,config);
    raw.dispatches.push({block:'C12',arm,policy,seeds,budget:'controls',games:580});checkpoint();
    const started=performance.now();
    const jobs=await Promise.all(LEVELS.map(levelData=>pool.run({levelData,seeds,policy})));
    const p={block:'C12',arm,policy,levels:config.levels,seeds,
      games:jobs.flatMap(j=>j.games).sort((a,b)=>a.level-b.level||a.seed-b.seed),
      workerElapsedSeconds:jobs.reduce((n,j)=>n+j.workerElapsedSeconds,0),threadCpuSeconds:jobs.reduce((n,j)=>n+j.threadCpuSeconds,0),
      wallSeconds:(performance.now()-started)/1000,filesRead:[...new Set(jobs.flatMap(j=>j.filesRead).map(f=>path.relative(ROOT,f).replaceAll('\\','/')))].sort()};
    assertPanel(p,config);if(p.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f))) throw new Error('recording read during measurement');
    raw.panels.push(p);raw.filesRead=[...new Set([...raw.filesRead,...p.filesRead])].sort();checkpoint();
    console.log('PANEL C12',arm,'games',580,'wall_seconds',p.wallSeconds,'thread_cpu_seconds',p.threadCpuSeconds);
    progress(`Fresh C12/${arm} retained580games; cumulative charged=${JSON.stringify(raw.counts)}. No proposal judged.`);
    return p;
  }
  try{
    pool=createJournaledPool(4,{directory:path.join(OUT,'control-journal'),runId:config.runId});
    console.log('RESUME_REGISTRATION',commit);console.log('CARRIED_ACCOUNTING',JSON.stringify(raw.counts));
    for(const r of raw.headlines.controls) console.log('INHERITED_CONTROL',JSON.stringify(r));
    const champion=await panel('champion',{kind:'champion'});
    const zero=await panel('zero',{kind:'zero',lookaheadBase:config.zeroLookaheadBase});
    const mild=await panel('handicap10',{kind:'handicap',every:10});
    const strong=await panel('handicap5',{kind:'handicap',every:5});
    const summarize=p=>summarizePairs(paired(p,champion,config),config.levels,champion.seeds);
    const row={block:'C12',zero:summarize(zero),mild:summarize(mild),strong:summarize(strong)};
    raw.headlines.controls.push(row);Object.assign(raw.headlines,aggregate(raw.headlines.controls,config.historicalMde));
    const problems=completionProblems(raw);if(problems.length) throw new Error(problems.join('; '));
    raw.status='CONTROLS_COMPLETE';checkpoint();console.log('CONTROL',JSON.stringify(row));
    console.log('AGGREGATE',JSON.stringify(raw.headlines.bars),'PATH',raw.headlines.path,'COUNTS',JSON.stringify(raw.counts));
    console.log('12 blocks can only catch a false-accept rate of roughly17% or more: sanity check, not calibration.');
    progress(`Complete12-block controls: ${raw.headlines.path}; zero accepted=${raw.headlines.bars.zeroAccepted}/12; strong detected=${raw.headlines.bars.strongDetected}/12. No proposal judged.`);
  }catch(error){
    raw.status=error.budget?'BUDGET_STOP':'UNVERIFIED';raw.error={message:error.message,budget:error.budget||null};checkpoint();
    console.error(error.stack);progress(`Continuation stopped ${raw.status}: ${error.message}; preserve all charges and never restart.`);throw error;
  }finally{if(pool) await pool.close();}
}
if(require.main===module)run().catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={registeredConfiguration,run};
