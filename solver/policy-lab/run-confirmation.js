'use strict';
// Prepared for the conditional one-shot confirmation. This cannot run until
// the selected candidate and this runner are frozen in a committed protocol.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const {LEVELS}=require('../../src/game');
const {requireProtocol,registrationStamp}=require('../experiment-guard');
const {parseFrontmatter}=require('../../tools/verify-experiments');
const {persistBeforeVerdict}=require('../../tools/persist-before-verdict');
const {summarizePairs}=require('../ruler/core');
const {createJournaledPool}=require('./journaled-pool');
const {registeredConfiguration}=require('./recovery-controls');
const {atomicJson,charge,assertPanel,paired}=require('./recovery-core');
const ROOT=path.resolve(__dirname,'../..');
const CANDIDATE='solver/policy-lab/frozen-candidate.js';
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');
function verdict(summary) {
  if(summary.netWins>=0&&summary.meanMovesSaved!==null&&summary.meanMovesSaved>0&&summary.moveCi95[0]!==null&&summary.moveCi95[0]>0)return'SUPPORTED';
  if(summary.netWins<0||(summary.moveCi95[1]!==null&&summary.moveCi95[1]<0))return'FALSIFIED';
  return'INCONCLUSIVE';
}
function chunks(seeds,size=10) {
  if(!Number.isInteger(size)||size<1)throw new Error('invalid job chunk size');
  return Array.from({length:Math.ceil(seeds.length/size)},(_,i)=>seeds.slice(i*size,(i+1)*size));
}
async function run(argv=process.argv) {
  const registration=requireProtocol(argv,{name:'policy terms one-shot confirmation'});
  const {config,commit}=registeredConfiguration();
  if(registration.exploratory||registration.resultId!==config.result)throw new Error('only the assigned registered confirmation is allowed');
  const protocolPath=`experiments/${config.result}/protocol.md`;
  const front=parseFrontmatter(fs.readFileSync(path.join(ROOT,protocolPath),'utf8'));
  if(!front.version_freeze[CANDIDATE])throw new Error('protocol must freeze the exact selected candidate path');
  const requiredSources=[...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes),
    'docs/goals/policy-terms-loop/RECOVERY_PLAN.md','experiments/SEEDS.md',CANDIDATE,
    'solver/policy-lab/run-confirmation.js','solver/policy-lab/proposal-recompute.js',
    'solver/experiment-guard.js','tools/verify-experiments.js','tools/persist-before-verdict.js'];
  for(const source of requiredSources)if(front.version_freeze[source]!==sha(source).slice(0,16))throw new Error(`confirmation protocol omits frozen measurement input ${source}`);
  const proposalsFile='solver/policy-lab/runs/recovery/proposals-raw.json';
  const proposals=JSON.parse(fs.readFileSync(path.join(ROOT,proposalsFile)));
  if(proposals.status!=='EXPLORATION_COMPLETE'||proposals.path!=='CONFIRMATION_REGISTRATION_PENDING'||!proposals.selected)throw new Error('no qualified frozen candidate');
  const audit=execFileSync(process.execPath,['solver/policy-lab/proposal-recompute.js'],{cwd:ROOT,encoding:'utf8',maxBuffer:64*1024*1024});
  if(!audit.includes('PASS completed proposal journal jobs')||!audit.includes('MATCH retained proposal arithmetic'))throw new Error('proposal arithmetic/coverage not qualified');
  const policy=require(path.join(ROOT,CANDIDATE));
  if(JSON.stringify(policy)!==JSON.stringify(proposals.selected.policy)||sha(CANDIDATE).slice(0,16)!==front.version_freeze[CANDIDATE])throw new Error('frozen candidate differs from selected fresh result');
  const sources={...front.version_freeze};
  const out=path.join(__dirname,'runs/recovery/confirmation');
  const rawFile=path.join(ROOT,`experiments/${config.result}/raw-pairs.json`);
  if(fs.existsSync(out)||fs.existsSync(rawFile))throw new Error('burned confirmation: exactly one run, never resume');
  // Funding both arms is checked before any dispatch; neither confirmation
  // reserve nor other budgets are available to the exploration phases.
  charge(structuredClone(proposals.counts),'confirmation',17400,config);
  if(config.blocks.F.count!==150||config.levels.length!==58)throw new Error('registered confirmation denominator differs');
  fs.mkdirSync(out);
  const raw={kind:'one-shot-target-race-confirmation',result:config.result,registration:registrationStamp(registration),sources,
    recoveryPlanCommit:commit,candidate:{path:CANDIDATE,sha256:sha(CANDIDATE),policy,selectedRecheck:proposals.selected.recheckBlock},
    priorCounts:structuredClone(proposals.counts),counts:structuredClone(proposals.counts),levels:config.levels,
    seeds:Array.from({length:150},(_,i)=>config.blocks.F.start+i),panels:[],dispatches:[],
    filesRead:[...new Set([protocolPath,proposalsFile,CANDIDATE,'docs/goals/policy-terms-loop/RECOVERY_PLAN.md',
      ...Object.keys(sources),...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes),
      ...Object.keys(require.cache).map(f=>path.relative(ROOT,f).replaceAll('\\','/'))])].sort(),status:'RUNNING'};
  const file=path.join(out,'checkpoint.json');const checkpoint=()=>atomicJson(file,raw);checkpoint();
  const pool=createJournaledPool(4,{directory:path.join(out,'journal'),runId:`${config.result}-one-shot-F`});
  const progress=detail=>execFileSync('python',['.blackboard/board.py','progress','--actor',config.actor,'--id',config.task,'--detail',detail],{cwd:ROOT,stdio:'inherit'});
  async function measure(arm,policy) {
    requireProtocol(argv,{name:'policy terms one-shot confirmation'});registeredConfiguration();
    if(raw.dispatches.some(d=>d.arm===arm))throw new Error('confirmation arm already dispatched');
    charge(raw.counts,'confirmation',8700,config);raw.dispatches.push({block:'F',arm,policy,games:8700,budget:'confirmation',seeds:raw.seeds});checkpoint();
    const started=performance.now();
    const jobs=await Promise.all(LEVELS.flatMap(levelData=>chunks(raw.seeds).map(seeds=>pool.run({levelData,seeds,policy}))));
    const panel={block:'F',arm,policy,levels:config.levels,seeds:raw.seeds,games:jobs.flatMap(j=>j.games).sort((a,b)=>a.level-b.level||a.seed-b.seed),
      workerElapsedSeconds:jobs.reduce((s,j)=>s+j.workerElapsedSeconds,0),threadCpuSeconds:jobs.reduce((s,j)=>s+j.threadCpuSeconds,0),wallSeconds:(performance.now()-started)/1000,
      filesRead:[...new Set(jobs.flatMap(j=>j.filesRead).map(f=>path.relative(ROOT,f).replaceAll('\\','/')))].sort()};
    assertPanel(panel,config);
    if(panel.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('recording read in confirmation');
    raw.panels.push(panel);raw.filesRead=[...new Set([...raw.filesRead,...panel.filesRead])].sort();checkpoint();
    console.log('CONFIRMATION_PANEL',arm,'games',panel.games.length,'thread_cpu_seconds',panel.threadCpuSeconds,'wall_seconds',panel.wallSeconds);
    progress(`One-shot F ${arm} retained: 8700 games; counts=${JSON.stringify(raw.counts)}. No verdict until full pairs persisted.`);
    return panel;
  }
  try {
    console.log('CONFIRMATION_REGISTRATION',registration.protocolCommit,'CANDIDATE',CANDIDATE,raw.candidate.sha256);
    const champion=await measure('champion',{kind:'champion'});
    const candidate=await measure('candidate',policy);
    raw.cells=paired(candidate,champion,config);raw.status='PAIRS_COMPLETE';checkpoint();
    const result=persistBeforeVerdict({file:rawFile,artifact:raw,validate:value=>{
      if(value.cells.length!==8700||value.panels.length!==2||value.counts.confirmation!==17400)throw new Error('incomplete one-shot pairs');
    },evaluate:value=>{
      const fd=fs.openSync(rawFile,'r');try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
      const primary=summarizePairs(value.cells,value.levels,value.seeds);
      const summarizeLevels=levels=>summarizePairs(value.cells.filter(c=>levels.includes(c.level)),levels,value.seeds);
      return{result:config.result,registration:registrationStamp(registration),rawArtifact:`experiments/${config.result}/raw-pairs.json`,rawSha256:sha(`experiments/${config.result}/raw-pairs.json`),
        primaryOutcome:verdict(primary),primary,secondary:{late:summarizeLevels([56,57,58]),other:summarizeLevels(config.levels.filter(l=>l<56))},
        perLevel:config.levels.map(level=>({level,summary:summarizeLevels([level])})),
        compute:{champion:{threadCpuSeconds:champion.threadCpuSeconds,wallSeconds:champion.wallSeconds},candidate:{threadCpuSeconds:candidate.threadCpuSeconds,wallSeconds:candidate.wallSeconds},
          threadCpuRatio:candidate.threadCpuSeconds/champion.threadCpuSeconds,wallRatio:candidate.wallSeconds/champion.wallSeconds},
        caveats:['Secondary reports never override the all-58-level verdict.','Per-level two-axis intervals are unavailable with a single level.','This is not a compute-matched comparison; report physical CPU and wall time separately.']};
    }});
    const verdictFile=path.join(ROOT,`experiments/${config.result}/verdict.json`);
    fs.writeFileSync(verdictFile,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
    console.log('PRIMARY',JSON.stringify(result.primary),'VERDICT',result.primaryOutcome);
    console.log('SECONDARY',JSON.stringify(result.secondary));for(const row of result.perLevel)console.log('PER_LEVEL',JSON.stringify(row));
    console.log('COMPUTE',JSON.stringify(result.compute));for(const c of result.caveats)console.log(c);
    console.log('COUNTS',JSON.stringify(raw.counts));progress(`One-shot F complete: all-58 verdict=${result.primaryOutcome}; raw pairs persisted first. No rerun, adoption, merge or scientific acceptance.`);
  }catch(e){raw.status=e.budget?'BUDGET_STOP':'UNVERIFIED';raw.error={message:e.message,budget:e.budget||null};checkpoint();console.error(e.stack);progress(`One-shot F stopped ${raw.status}: ${e.message}. All charges retained; never restart.`);throw e;}
  finally{await pool.close();}
}
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={verdict,chunks,run};
