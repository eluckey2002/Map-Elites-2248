'use strict';
// Phase orchestration only. All games, statistics and decisions call the
// unchanged paths frozen in RECOVERY_PLAN.md; this source is pinned before use.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {LEVELS} = require('../../src/game');
const {summarizePairs} = require('../ruler/core');
const {promising, disposition, compareFitness} = require('./decision');
const {createJournaledPool, syncDirectory} = require('./journaled-pool');
const {registeredConfiguration} = require('./recovery-controls');
const {atomicJson, charge, assertPanel, paired, completionProblems} = require('./recovery-core');
const {jointSpace, selectFrozen} = require('./proposal-space');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'runs/recovery');
const CONTROL = 'solver/policy-lab/runs/recovery/controls-raw.json';
const RELATIVE = file => path.relative(ROOT, file).replaceAll('\\', '/');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
function atomicText(file, text) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx');
  try {fs.writeFileSync(fd, text); fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
  fs.renameSync(temporary, file); syncDirectory(path.dirname(file));
}
function csv(rows) {
  const columns = ['id','round','kind','coordinate','dose','hypothesis','configPath','outcome','recheckBlock',
    'recheckNetWins','recheckMeanMovesSaved','recheckCi95','gateNetWins','gateMeanMovesSaved','gateCi95'];
  const quote = x => `"${String(x ?? '').replaceAll('"', '""')}"`;
  return columns.join(',') + '\n' + rows.map(r => columns.map(k => quote({
    ...r, recheckNetWins:r.recheck?.netWins, recheckMeanMovesSaved:r.recheck?.meanMovesSaved,
    recheckCi95:r.recheck ? JSON.stringify(r.recheck.moveCi95) : 'UNVERIFIED_NOT_RUN',
    gateNetWins:r.gate?.netWins, gateMeanMovesSaved:r.gate?.meanMovesSaved,
    gateCi95:r.gate ? JSON.stringify(r.gate.moveCi95) : 'UNVERIFIED_NOT_RUN',
  }[k])).join(',')).join('\n') + (rows.length ? '\n' : '');
}
function preflight(counts, budget, games, config) {charge(structuredClone(counts), budget, games, config);}
function committedPhaseSources(sources,{root=ROOT}={}) {
  const phaseCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  const sourceHashes=Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
  for(const source of sources.filter(f=>f.endsWith('.js'))){
    const committed=execFileSync('git',['show',`${phaseCommit}:${source}`],{cwd:root});
    if(crypto.createHash('sha256').update(committed).digest('hex')!==sourceHashes[source])throw new Error(`phase executable must be committed before use: ${source}`);
  }
  return{phaseCommit,sourceHashes};
}
async function run() {
  const {config, commit} = registeredConfiguration();
  const controls = JSON.parse(fs.readFileSync(path.join(ROOT, CONTROL)));
  if (controls.status !== 'CONTROLS_COMPLETE' || controls.headlines.path !== 'CONTROLS_PASSED'
      || completionProblems(controls).length) throw new Error('proposals forbidden: complete qualified controls required');
  const file = path.join(OUT, 'proposals-raw.json');
  if (fs.existsSync(file) || fs.existsSync(path.join(OUT, 'proposal-journal'))
      || fs.existsSync(path.join(OUT,'candidates')) || fs.existsSync(path.join(__dirname,'runs/proposals.csv'))) throw new Error('burned proposal run: never resume or reuse outputs');
  const sources = ['solver/policy-lab/run-proposals.js','solver/policy-lab/proposal-planning.js','solver/policy-lab/proposal-space.js','solver/policy-lab/recovery-recompute.js',
    'solver/policy-lab/runs/generation.json',CONTROL,'docs/goals/policy-terms-loop/RECOVERY_PLAN.md'];
  const {sourceHashes,phaseCommit}=committedPhaseSources(sources);
  // Verify the executable identity before executing the admission audit.
  const independent = execFileSync(process.execPath, ['solver/policy-lab/recovery-recompute.js'], {cwd:ROOT, encoding:'utf8',maxBuffer:32*1024*1024});
  if (!independent.includes('PASS complete journal jobs 2320') || !independent.includes('MATCH retained arithmetic')) throw new Error('controls arithmetic qualification absent');
  const raw = {kind:'exploration-diagnostic-proposals',result:config.result,registration:{recoveryPlanCommit:commit,phaseCommit,exploratory:true},config,
    sourceHashes,priorCounts:structuredClone(controls.counts),counts:structuredClone(controls.counts),proposalRounds:0,
    panels:[],dispatches:[],rows:[],jointRows:[],recheckAllocations:[],
    computeCaveat:'G champion CPU includes carried inert qualification callbacks; gate ratios compare physical instrumented totals and do not estimate pure policy overhead. Fresh R and S references have no inert callbacks. CPU and wall time are separate physical measurements.',
    filesRead:[...new Set([...sources,...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes),
      ...Object.keys(require.cache).map(RELATIVE)])].sort(),status:'RUNNING'};
  const checkpoint = () => {
    raw.filesRead=[...new Set([...raw.filesRead,...raw.rows.map(r=>r.configPath).filter(Boolean)])].sort();
    atomicJson(file,raw);atomicText(path.join(__dirname,'runs/proposals.csv'),csv(raw.rows));
  };
  checkpoint();
  const pool = createJournaledPool(4,{directory:path.join(OUT,'proposal-journal'),runId:`${config.result}-registered-proposals`});
  const progress = detail => {
    try{execFileSync('python',['.blackboard/board.py','progress','--actor',config.actor,'--id',config.task,'--detail',detail],{cwd:ROOT,stdio:'inherit'});}
    catch(error){console.error('OPERATIONAL_PROGRESS_WARNING',error.message,'; journaled science continues.');}
  };
  const unchanged = () => {
    registeredConfiguration();
    for (const [f,h] of Object.entries(sourceHashes)) if (sha(f)!==h) throw new Error(`phase source drift: ${f}`);
  };
  async function measure(block, arm, policy, budget) {
    unchanged();
    if (raw.dispatches.some(d => d.block===block && d.arm===arm)) throw new Error('burned proposal panel');
    const seeds=Array.from({length:config.blocks[block].count},(_,i)=>config.blocks[block].start+i);
    charge(raw.counts,budget,580,config);
    raw.dispatches.push({block,arm,policy,seeds,budget,games:580});checkpoint();
    const started=performance.now();
    const jobs=await Promise.all(LEVELS.map(levelData=>pool.run({levelData,seeds,policy})));
    const panel={block,arm,policy,levels:config.levels,seeds,games:jobs.flatMap(j=>j.games).sort((a,b)=>a.level-b.level||a.seed-b.seed),
      workerElapsedSeconds:jobs.reduce((a,j)=>a+j.workerElapsedSeconds,0),threadCpuSeconds:jobs.reduce((a,j)=>a+j.threadCpuSeconds,0),
      wallSeconds:(performance.now()-started)/1000,filesRead:[...new Set(jobs.flatMap(j=>j.filesRead).map(RELATIVE))].sort()};
    assertPanel(panel,config);
    if(panel.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('recording read in measurement');
    raw.panels.push(panel);raw.filesRead=[...new Set([...raw.filesRead,...panel.filesRead])].sort();checkpoint();
    console.log('PROPOSAL_PANEL',block,arm,'games',580,'wall_seconds',panel.wallSeconds,'thread_cpu_seconds',panel.threadCpuSeconds);
    return panel;
  }
  const summary=(a,b)=>summarizePairs(paired(a,b,config),config.levels,b.seeds);
  async function recheck(row,budget) {
    const number=raw.recheckAllocations.length+1;
    if(number>11){const e=new Error('EFFORT_STOP: eleven one-use recheck blocks consumed');e.budget='recheck-blocks';throw e;}
    preflight(raw.counts,budget,1160,config);
    row.recheckBlock=`R${number}`;raw.recheckAllocations.push({block:row.recheckBlock,candidate:row.id,policy:row.policy});checkpoint();
    const champion=await measure(row.recheckBlock,'champion',{kind:'champion'},budget);
    const candidate=await measure(row.recheckBlock,row.id,row.policy,budget);
    row.recheck=summary(candidate,champion);row.recheckComputeRatio=candidate.threadCpuSeconds/champion.threadCpuSeconds;
    row.outcome=disposition(row.gate,row.recheck);checkpoint();console.log('RECHECK',JSON.stringify(row));
  }
  try {
    console.log('PROPOSAL_PHASE_SOURCE_FREEZE',JSON.stringify(sourceHashes));
    console.log('CARRIED_ACCOUNTING',JSON.stringify(raw.counts));
    console.log('COMPUTE_CAVEAT',raw.computeCaveat);
    const champion=controls.panels.find(p=>p.block==='G' && p.arm==='champion');assertPanel(champion,config);
    for(let round=1;round<=15;round++) {
      if(raw.proposalRounds>=config.maxProposalRounds){const e=new Error('EFFORT_STOP: twenty proposal rounds');e.budget='proposal-rounds';throw e;}
      preflight(raw.counts,'proposals',580,config);
      const planned=JSON.parse(execFileSync(process.execPath,['solver/policy-lab/proposal-planning.js',String(round)],{cwd:ROOT,encoding:'utf8',maxBuffer:8*1024*1024}));
      if(planned.round!==round || planned.boards.length<3 || planned.boards.some(b=>!b.ownerFaster) || sha(planned.configPath)!==planned.configHash)throw new Error('proposal planning receipt differs');
      console.log('PLANNING_ONLY',JSON.stringify(planned));
      const row={...planned,id:`P${String(round).padStart(2,'0')}`,outcome:'GATE_PENDING'};
      raw.rows.push(row);raw.proposalRounds++;checkpoint();
      const candidate=await measure('G',row.id,row.policy,'proposals');
      row.gate=summary(candidate,champion);row.gateComputeRatio=candidate.threadCpuSeconds/champion.threadCpuSeconds;
      row.outcome=promising(row.gate)?'PROMISING_UNRECHECKED':'NOT_PROMISING';checkpoint();
      if(promising(row.gate))await recheck(row,'proposals');
      console.log('PROPOSAL',JSON.stringify(row));progress(`Proposal ${row.id} ${row.coordinate}=${row.dose}: ${row.outcome}; fresh block=${row.recheckBlock||'not run'}; counts=${JSON.stringify(raw.counts)}`);
    }
    raw.doseResponse=raw.rows.filter(r=>r.coordinate==='occupancy').map(r=>({dose:r.dose,gate:r.gate,outcome:r.outcome}));
    console.log('UNTRIMMED_OFFERING_DOSE_RESPONSE',JSON.stringify(raw.doseResponse));
    const acceptedRows=raw.rows.filter(r=>r.outcome==='ACCEPTED');
    if(!acceptedRows.length) {
      raw.jointSearch='SKIPPED_NO_ACCEPTED';raw.budgetRelease={from:'jointSearch',to:'buffer',games:20000};
      raw.effectiveBudgets={...config.budgets,jointSearch:0,buffer:config.budgets.buffer+20000};
      raw.path='B';raw.candidate='NO_CANDIDATE';
      console.log('no ACCEPTED changes: joint search skipped');
      console.log('no change tested was ACCEPTED at this resolution');
    } else {
      if(raw.recheckAllocations.length>=11){const e=new Error('EFFORT_STOP: no fresh block remains for required joint recheck');e.budget='recheck-blocks';throw e;}
      const space=jointSpace(acceptedRows);
      preflight(raw.counts,'jointSearch',580*(space.length+1)+1160,config);
      raw.jointSpace=space;checkpoint();console.log('JOINT_SPACE_PRERUN',JSON.stringify(space));
      const reference=await measure('S','champion',{kind:'champion'},'jointSearch');
      for(let i=0;i<space.length;i++) {
        const row={id:`J${String(i+1).padStart(2,'0')}`,kind:'generation',policy:space[i],outcome:'GATE_PENDING'};
        raw.jointRows.push(row);checkpoint();
        const candidate=await measure('S',row.id,row.policy,'jointSearch');row.gate=summary(candidate,reference);
        row.gateComputeRatio=candidate.threadCpuSeconds/reference.threadCpuSeconds;row.outcome='SEARCH_ONLY';checkpoint();
        console.log('JOINT_GATE',JSON.stringify(row));
      }
      const best=[...raw.jointRows].sort((a,b)=>-compareFitness(a.gate,b.gate)||a.id.localeCompare(b.id))[0];
      await recheck(best,'jointSearch');raw.jointBest=best.id;
      const selected=selectFrozen([...raw.rows,...raw.jointRows]);
      if(!selected)throw new Error('accepted source disappeared');
      raw.selected={id:selected.id,policy:selected.policy,recheck:selected.recheck,recheckBlock:selected.recheckBlock};
      raw.path='CONFIRMATION_REGISTRATION_PENDING';console.log('SELECTED_FOR_FREEZE',JSON.stringify(raw.selected));
    }
    raw.outcomeCounts=raw.rows.reduce((a,r)=>(a[r.outcome]=(a[r.outcome]||0)+1,a),{});
    raw.kindCounts=raw.rows.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{});
    raw.status='EXPLORATION_COMPLETE';checkpoint();
    console.log('PROPOSAL_COUNTS',JSON.stringify({rounds:raw.proposalRounds,kind:raw.kindCounts,outcome:raw.outcomeCounts}));
    console.log('EXPLORATION_DISPOSITION',raw.path,'COUNTS',JSON.stringify(raw.counts));
    progress(`Registered proposals and conditional joint search complete: ${raw.path}; counts=${JSON.stringify(raw.counts)}. No confirmation played or policy adopted.`);
  } catch(e) {
    raw.status=e.budget?'BUDGET_STOP':'UNVERIFIED';raw.path=e.budget?'D':null;raw.error={message:e.message,budget:e.budget||null};checkpoint();
    console.error(e.stack);progress(`Proposal phase stopped ${raw.status}: ${e.message}; charges retained, never restart.`);throw e;
  } finally {await pool.close();}
}
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={csv,preflight,committedPhaseSources,run};
