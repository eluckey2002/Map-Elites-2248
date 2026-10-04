'use strict';
// Read-only reduction of retained jobs. No controller, statistics or loop imports.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const RAW='solver/policy-lab/runs/recovery/controls-raw.json';
const JOURNAL='solver/policy-lab/runs/recovery/control-journal';
const MANIFEST='docs/goals/policy-terms-loop/recovery-stop-journal.json';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const equal=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(label);};
function audit(root=ROOT) {
  const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
  const raw=read(RAW), manifest=read(JOURNAL+'/manifest.json');
  if(raw.status!=='RUNNING'||raw.headlines.controls.length!==11||raw.headlines.bars)throw new Error('interrupted raw must remain an incomplete eleven-block checkpoint');
  if(manifest.workers!==4||manifest.runId!=='RESULT-0081-journaled-recovery-60052000')throw new Error('journal identity differs');
  const sourceHashes={};
  const completed=new Map(),dispatched=new Map();
  for(const name of fs.readdirSync(path.join(root,JOURNAL)).sort()){
    const file=JOURNAL+'/'+name, bytes=fs.readFileSync(path.join(root,file));sourceHashes[file]=digest(bytes);
    if(name==='manifest.json')continue;
    if(!/^[a-f0-9]{64}\.(completed|dispatched)\.json$/.test(name))throw new Error('unexpected journal file '+name);
    const entry=JSON.parse(bytes),id=digest(JSON.stringify(entry.job));
    if(entry.id!==id||!name.startsWith(id+'.')||entry.runId!==manifest.runId)throw new Error('journal job identity differs');
    const level=entry.job.levelData.level;
    equal(entry.job.levelData,raw.levelDefinitions.find(l=>l.level===level),'journal level definition differs');
    const dispatch=raw.dispatches.find(d=>JSON.stringify(d.policy)===JSON.stringify(entry.job.policy)&&JSON.stringify(d.seeds)===JSON.stringify(entry.job.seeds));
    if(!dispatch||!raw.config.levels.includes(level))throw new Error('journal job is outside charged panels');
    const map=name.endsWith('.completed.json')?completed:dispatched;
    if(map.has(id))throw new Error('duplicate journal job');map.set(id,entry);
  }
  const pending=[];let completedGames=0,partialGames=0;
  for(const [id,entry] of dispatched){
    const done=completed.get(id);
    if(!done){pending.push(id);continue;}
    equal(done.job,entry.job,'completion differs from dispatch');
    const games=done.result.games;
    equal(games.map(g=>({level:g.level,seed:g.seed})),entry.job.seeds.map(seed=>({level:entry.job.levelData.level,seed})),'completed job address differs');
    for(const g of games){const o=g.outcome;if(!o||typeof o.win!=='boolean'||o.moveBudget!==entry.job.levelData.moves||!Number.isInteger(o.movesUsed)||!Number.isFinite(o.score)||! /^[a-f0-9]{64}$/.test(o.traceIdentity)||(o.win?(!Number.isInteger(o.movesToTarget)||o.movesToTarget<1||o.movesToTarget>o.moveBudget):o.movesToTarget!==null))throw new Error('malformed retained outcome');}
    if(done.result.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('recording read in measured job');
    completedGames+=games.length;
    const p=raw.panels.find(p=>JSON.stringify(p.policy)===JSON.stringify(entry.job.policy)&&JSON.stringify(p.seeds)===JSON.stringify(entry.job.seeds));
    if(p)equal(games,p.games.filter(g=>g.level===entry.job.levelData.level),'completed journal differs from panel');
    else partialGames+=games.length;
  }
  for(const id of completed.keys())if(!dispatched.has(id))throw new Error('completion lacks dispatch');
  for(const d of raw.dispatches){
    const jobs=[...dispatched.values()].filter(e=>JSON.stringify(e.job.policy)===JSON.stringify(d.policy)&&JSON.stringify(e.job.seeds)===JSON.stringify(d.seeds));
    equal(jobs.map(e=>e.job.levelData.level).sort((a,b)=>a-b),raw.config.levels,'charged panel has missing or duplicate dispatch jobs');
  }
  const counts=structuredClone(raw.config.carryForward.counts);
  for(const d of raw.dispatches)counts[d.budget]+=d.games;
  equal(counts,raw.counts,'charged accounting differs');
  const controls=raw.headlines.controls;
  const summary={result:raw.result,closure_status:'UNVERIFIED',scientificComplete:false,completeControlBlocks:controls.length,
    completedJobs:completed.size,dispatchedJobs:dispatched.size,pendingJobs:pending.length,completedNewGames:completedGames,
    retainedPartialGames:partialGames,unknownNewGames:pending.length*10,
    includedCompleteControlGames:raw.panels.filter(p=>/^C\d+$/.test(p.block)).reduce((n,p)=>n+p.games.length,0),
    zeroAccepted:controls.filter(r=>r.zero.netWins>=0&&r.zero.meanMovesSaved>0&&r.zero.moveCi95[0]>0).length,
    strongDetected:controls.filter(r=>r.strong.moveCi95[1]!==null&&r.strong.moveCi95[1]<0).length,
    mildDetected:controls.filter(r=>r.mild.moveCi95[1]!==null&&r.mild.moveCi95[1]<0).length,
    chargedAccounting:raw.counts,totalCharged:Object.values(raw.counts).reduce((n,v)=>n+v,0),
    rawSha256:digest(fs.readFileSync(path.join(root,RAW))),pendingJobIds:pending.sort()};
  if(!pending.length||!partialGames)throw new Error('interruption must retain partial results and unknown dispatches');
  return{summary,sourceHashes};
}
function verifyFailure(closure,observed){
  if(closure.closure_status!=='UNVERIFIED'||closure.path!=='NONE'||closure.noIdeaJudged!==true||closure.proposalRounds!==0||closure.effortBoundExhausted!==false)throw new Error('interrupted evidence cannot qualify a completed path or verdict');
  equal(closure.interruptionSummary,observed.summary,'failed closure summary differs');
  return true;
}
function main(){
  const observed=audit();
  const retained=JSON.parse(fs.readFileSync(path.join(ROOT,MANIFEST),'utf8'));
  equal(retained,observed,'retained interruption manifest differs');
  const closure=JSON.parse(fs.readFileSync(path.join(ROOT,'experiments/RESULT-0081/closure.json'),'utf8'));
  verifyFailure(closure,observed);
  console.log('REFUSE COMPLETE CLOSURE: UNVERIFIED; no Path A-D complete');
  console.log('RETAINED_INTERRUPTION',JSON.stringify(observed.summary));
  console.log('MATCH partial journal identities, outcomes, retained panels and charged accounting; no games replayed');
}
if(require.main===module){try{main();}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={audit,verifyFailure,MANIFEST,RAW};
