'use strict';
// Independent re-implementation: Node builtins only, no producer, chooser,
// game loop or statistics imports. No games are replayed.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const read=f=>fs.readFileSync(path.resolve(ROOT,f));
const json=f=>JSON.parse(read(f));
const hash=f=>crypto.createHash('sha256').update(read(f)).digest('hex');
const same=(a,b,label)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw new Error(`${label}: differs`);};
function near(a,b,label='number') {
  if(typeof a==='number'){if(!Number.isFinite(b)||Math.abs(a-b)>1e-10*Math.max(1,Math.abs(a)))throw new Error(`${label}: ${a} != ${b}`);}
  else if(a&&typeof a==='object'){
    if(!b||Object.keys(a).sort().join()!==Object.keys(b).sort().join())throw new Error(`${label}: keys differ`);
    for(const k of Object.keys(a))near(a[k],b[k],`${label}.${k}`);
  }else if(a!==b)throw new Error(`${label}: differs`);
}
function axis(xs,L,S) {
  if(xs.length!==L*S)throw new Error('incomplete independent grid');
  const observed=xs.filter(x=>x!==null);if(!observed.length)return{mean:null,se:null,seLevel:null,seSeed:null,ci95:[null,null],n:0};
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const error=a=>a.length<2?null:Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1)/a.length);
  const lm=[],sm=[];
  for(let l=0;l<L;l++){const a=xs.slice(l*S,(l+1)*S).filter(x=>x!==null);if(a.length)lm.push(mean(a));}
  for(let s=0;s<S;s++){const a=[];for(let l=0;l<L;l++)if(xs[l*S+s]!==null)a.push(xs[l*S+s]);if(a.length)sm.push(mean(a));}
  const seLevel=error(lm),seSeed=error(sm),se=seLevel===null||seSeed===null?null:Math.max(seLevel,seSeed),m=mean(observed);
  return{mean:m,se,seLevel,seSeed,ci95:se===null?[null,null]:[m-1.96*se,m+1.96*se],n:observed.length};
}
function summarize(candidate,champion,levels,seeds) {
  if(candidate.length!==levels.length*seeds.length||champion.length!==candidate.length)throw new Error('independent pair size');
  let winsGained=0,winsLost=0,bothWin=0,bothLose=0,candidateFaster=0,championFaster=0,sameSpeed=0,referenceMoves=0;
  const wd=[],md=[];
  for(let i=0;i<candidate.length;i++){
    const c=candidate[i],b=champion[i];
    if(c.level!==levels[Math.floor(i/seeds.length)]||c.seed!==seeds[i%seeds.length]||c.level!==b.level||c.seed!==b.seed)throw new Error('independent pair address');
    const a=c.outcome,r=b.outcome;
    for(const o of[a,r])if(!o||typeof o.win!=='boolean'||!Number.isInteger(o.moveBudget)||o.moveBudget<1
      ||(o.win&&(!Number.isInteger(o.movesToTarget)||o.movesToTarget<1||o.movesToTarget>o.moveBudget))||(!o.win&&o.movesToTarget!==null))throw new Error('malformed independent outcome');
    if(a.moveBudget!==r.moveBudget)throw new Error('different paired move budgets');
    const w=Number(a.win)-Number(r.win);wd.push(w);winsGained+=Number(w>0);winsLost+=Number(w<0);
    if(a.win&&r.win){bothWin++;const m=r.movesToTarget-a.movesToTarget;md.push(m);referenceMoves+=r.movesToTarget;candidateFaster+=Number(m>0);championFaster+=Number(m<0);sameSpeed+=Number(m===0);}
    else{md.push(null);bothLose+=Number(!a.win&&!r.win);}
  }
  const w=axis(wd,levels.length,seeds.length),m=axis(md,levels.length,seeds.length);
  return{cells:candidate.length,winsGained,winsLost,netWins:winsGained-winsLost,bothWin,bothLose,candidateFaster,championFaster,sameSpeed,
    winRateDifference:w.mean,winSe:w.se,winSeLevel:w.seLevel,winSeSeed:w.seSeed,winCi95:w.ci95,meanMovesSaved:m.mean,moveSe:m.se,
    moveSeLevel:m.seLevel,moveSeSeed:m.seSeed,moveCi95:m.ci95,mutualWins:m.n,relativeMovesPct:bothWin?100*m.mean/(referenceMoves/bothWin):null};
}
const promising=s=>s.netWins>=0&&s.meanMovesSaved!==null&&s.meanMovesSaved>0;
const outcome=(gate,fresh)=>!promising(gate)?'NOT_PROMISING':!fresh?'PROMISING_UNRECHECKED'
  :fresh.netWins>=0&&fresh.meanMovesSaved>0&&fresh.moveCi95[0]!==null&&fresh.moveCi95[0]>0?'ACCEPTED':'NOT_ACCEPTED';
const doses={occupancy:[0.001,1,8,128,1000000],width:[28,32,40,48,64],pathWidth:[10,12,16,20,24]};
function main() {
  const file=process.argv[2]||'solver/policy-lab/runs/recovery/proposals-raw.json';
  if(!fs.existsSync(path.resolve(ROOT,file))){console.log('UNVERIFIED_NOT_RUN: proposal raw absent');return;}
  const raw=json(file),config=raw.config;
  const git=args=>execFileSync('git',args,{cwd:ROOT,encoding:'utf8'});
  const plan='docs/goals/policy-terms-loop/RECOVERY_PLAN.md',text=read(plan).toString();
  const first=git(['log','--diff-filter=A','--format=%H','--',plan]).trim().split('\n').at(-1);
  same(config,JSON.parse(/```json\n([\s\S]*?)\n```/.exec(text)[1]),'registered config');
  if(raw.result!==config.result||raw.registration.recoveryPlanCommit!==first||git(['show',`${first}:${plan}`])!==text)throw new Error('registration differs');
  for(const commit of[first,raw.registration.phaseCommit])git(['merge-base','--is-ancestor',commit,'HEAD']);
  for(const [f,h]of Object.entries({...config.harnessFreeze,...config.carryForward.sourceHashes,...raw.sourceHashes}))if(hash(f)!==h)throw new Error(`source drift ${f}`);
  for(const f of['solver/policy-lab/run-proposals.js','solver/policy-lab/proposal-planning.js','solver/policy-lab/proposal-space.js']){
    const bytes=execFileSync('git',['show',`${raw.registration.phaseCommit}:${f}`],{cwd:ROOT});
    if(crypto.createHash('sha256').update(bytes).digest('hex')!==raw.sourceHashes[f])throw new Error('phase not committed before use');
  }
  const controls=json('solver/policy-lab/runs/recovery/controls-raw.json');
  if(controls.status!=='CONTROLS_COMPLETE'||controls.headlines.path!=='CONTROLS_PASSED')throw new Error('proposals lack qualified controls');
  same(raw.priorCounts,controls.counts,'prior counts');
  const expected=structuredClone(raw.priorCounts),keys=new Set();
  for(const d of raw.dispatches){
    if(d.games!==580||!['proposals','jointSearch'].includes(d.budget)||keys.has(`${d.block}/${d.arm}`))throw new Error('dispatch count/identity');
    keys.add(`${d.block}/${d.arm}`);expected[d.budget]+=580;
    same(d.seeds,Array.from({length:10},(_,i)=>config.blocks[d.block].start+i),'dispatch seeds');
  }
  same(expected,raw.counts,'charged accounting');
  for(const [k,n]of Object.entries(raw.counts))if(!Number.isSafeInteger(n)||n<0||n>config.budgets[k])throw new Error(`budget exceeded ${k}`);
  if(Object.values(raw.counts).reduce((a,b)=>a+b,0)>120000)throw new Error('total bound');
  const panelKeys=new Set();
  for(const p of raw.panels){
    const key=`${p.block}/${p.arm}`,d=raw.dispatches.find(d=>d.block===p.block&&d.arm===p.arm);
    if(panelKeys.has(key)||!d)throw new Error('duplicate/undispatched panel');panelKeys.add(key);
    same(p.policy,d.policy,'panel policy');same(p.seeds,d.seeds,'panel seeds');
    same(p.games.map(g=>[g.level,g.seed]),config.levels.flatMap(l=>d.seeds.map(s=>[l,s])),'exact 58x10 coverage');
    if(p.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('recording read in measurement');
    console.log('COVERAGE',key,'PASS 58 x 10');
  }
  const reference=controls.panels.find(p=>p.block==='G'&&p.arm==='champion');
  const generation=json('solver/policy-lab/runs/generation.json');
  const completed=[];
  for(const row of[...raw.rows,...raw.jointRows]){
    const block=row.id.startsWith('P')?'G':'S',p=raw.panels.find(p=>p.block===block&&p.arm===row.id);
    const champion=block==='G'?reference:raw.panels.find(p=>p.block==='S'&&p.arm==='champion');
    if(row.id.startsWith('P')){
      const coordinate=Object.keys(doses)[Math.floor((row.round-1)/5)],dose=doses[coordinate][(row.round-1)%5];
      const policy=coordinate==='occupancy'?{kind:'lab',weights:{occupancy:dose}}:{kind:'lab',params:{[coordinate]:dose}};
      if(row.kind!=='generation'||row.coordinate!==coordinate||row.dose!==dose||row.boards.length!==3)throw new Error('registered one-change proposal differs');
      same(row.policy,policy,'proposal policy');
      const allowedPath=`solver/policy-lab/runs/recovery/candidates/round-${String(row.round).padStart(2,'0')}.js`;
      if(row.configPath!==allowedPath||hash(row.configPath)!==row.configHash)throw new Error('candidate config identity');
      const literal=/module\.exports = ([\s\S]*);\n$/.exec(read(row.configPath).toString());
      if(!literal)throw new Error('configuration is not literal code');same(JSON.parse(literal[1]),row.policy,'candidate code');
      if(row.historicalSource.file!=='solver/policy-lab/runs/generation.json'||hash(row.historicalSource.file)!==row.historicalSource.sha256)throw new Error('planning source differs');
      const addresses=new Set();for(const b of row.boards){const original=generation.moves.find(m=>m.file===b.file&&m.move===b.move);same(b,original,'planning board');if(!b.ownerFaster||addresses.has(`${b.file}/${b.move}`))throw new Error('planning board eligibility');addresses.add(`${b.file}/${b.move}`);}
    }
    if(!row.gate){if(p)throw new Error('retained gate lacks summary');console.log(row.id,'UNVERIFIED_GATE_PENDING');continue;}
    if(!p||!champion)throw new Error('summary lacks full paired panels');
    const gate=summarize(p.games,champion.games,config.levels,p.seeds);near(gate,row.gate,`${row.id} gate`);
    near(p.threadCpuSeconds/champion.threadCpuSeconds,row.gateComputeRatio,'gate CPU ratio');
    let fresh=null;
    if(row.recheck){const c=raw.panels.find(p=>p.block===row.recheckBlock&&p.arm===row.id),r=raw.panels.find(p=>p.block===row.recheckBlock&&p.arm==='champion');if(!c||!r)throw new Error('fresh summary lacks panels');fresh=summarize(c.games,r.games,config.levels,c.seeds);near(fresh,row.recheck,`${row.id} fresh`);near(c.threadCpuSeconds/r.threadCpuSeconds,row.recheckComputeRatio,'fresh CPU ratio');}
    const expectedOutcome=row.id.startsWith('J')&&!row.recheck?'SEARCH_ONLY':outcome(gate,fresh);
    if(row.outcome!==expectedOutcome)throw new Error(`${row.id} outcome differs`);
    completed.push(row);console.log('INDEPENDENT_PROPOSAL',JSON.stringify({id:row.id,gate,fresh,outcome:expectedOutcome}));
  }
  if(raw.proposalRounds!==raw.rows.length||raw.proposalRounds>20)throw new Error('proposal effort bound');
  same(raw.rows.map(r=>r.round),Array.from({length:raw.rows.length},(_,i)=>i+1),'ordered rounds');
  if(raw.recheckAllocations.length>11)throw new Error('recheck block bound');
  raw.recheckAllocations.forEach((a,i)=>{if(a.block!==`R${i+1}`)throw new Error('recheck block reused');const row=[...raw.rows,...raw.jointRows].find(r=>r.id===a.candidate);if(!row||row.recheckBlock!==a.block)throw new Error('allocation without candidate');same(a.policy,row.policy,'fresh allocation policy');});
  // Completion, journal and joint-space validation follow below.
  auditCompletion(raw,controls,completed);
  const ranges=Object.values(config.blocks).sort((a,b)=>a.start-b.start);
  ranges.forEach((r,i)=>{if(r.start<60000000||r.start+r.count-1>69999999||(i&&ranges[i-1].start+ranges[i-1].count>r.start))throw new Error('seed block overlap/range');});
  console.log('PASS disjoint declared blocks and original carried budgets');
  for(const block of['G','S',...Array.from({length:11},(_,i)=>`R${i+1}`),'F'])if(!raw.panels.some(p=>p.block===block))console.log(block,block==='G'?'reference reused':'not run');
  if(raw.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('measurement manifest recording read');
  console.log('MEASUREMENT_FILES_READ',JSON.stringify(raw.filesRead));
  console.log('ACCOUNTING',JSON.stringify(raw.counts));
  console.log('MATCH retained proposal arithmetic; same-author re-implementation, not independent verification');
}
function auditCompletion(raw,controls,completed) {
  if(raw.status!=='EXPLORATION_COMPLETE'){console.log('UNVERIFIED complete phase; status',raw.status);return;}
  if(raw.rows.length!==15||completed.length!==raw.rows.length+raw.jointRows.length||raw.panels.length!==raw.dispatches.length)throw new Error('incomplete proposal phase');
  const counts=field=>raw.rows.reduce((a,r)=>(a[r[field]]=(a[r[field]]||0)+1,a),{});
  same(counts('outcome'),raw.outcomeCounts,'outcome counts');same(counts('kind'),raw.kindCounts,'kind counts');
  same(raw.rows.slice(0,5).map(r=>({dose:r.dose,gate:r.gate,outcome:r.outcome})),raw.doseResponse,'dose-response');
  const accepted=raw.rows.filter(r=>r.outcome==='ACCEPTED');
  if(!accepted.length){
    if(raw.path!=='B'||raw.candidate!=='NO_CANDIDATE'||raw.jointRows.length||raw.counts.jointSearch!==0)throw new Error('no-candidate closure differs');
    same(raw.budgetRelease,{from:'jointSearch',to:'buffer',games:20000},'joint budget release');
    same(raw.effectiveBudgets,{...raw.config.budgets,jointSearch:0,buffer:40000},'effective budgets');
  }else{
    const axes=[];
    for(const key of Object.keys(doses)){
      const values=new Set();for(const row of accepted.filter(r=>r.coordinate===key)){const i=doses[key].indexOf(row.dose);for(let j=Math.max(0,i-1);j<=Math.min(4,i+1);j++)values.add(doses[key][j]);}
      if(values.size)axes.push([key,[...values].sort((a,b)=>a-b)]);
    }
    const combos=[];
    function enumerate(i,spec){if(i===axes.length){combos.push({...spec});return;}for(const v of axes[i][1])enumerate(i+1,{...spec,[axes[i][0]]:v});}
    enumerate(0,{});
    const centers={};for(const[key]of axes){const best=accepted.filter(r=>r.coordinate===key).sort((a,b)=>b.recheck.meanMovesSaved-a.recheck.meanMovesSaved||a.dose-b.dose)[0];centers[key]=doses[key].indexOf(best.dose);}
    const distance=spec=>Object.keys(centers).map(k=>Math.abs(doses[k].indexOf(spec[k])-centers[k])).reduce((a,b)=>a+b,0);
    combos.sort((a,b)=>{const d=distance(a)-distance(b);if(d)return d;for(const[key]of axes)if(a[key]!==b[key])return a[key]-b[key];return 0;});
    const space=combos.slice(0,31).map(spec=>{const p={kind:'lab'};if('occupancy'in spec)p.weights={occupancy:spec.occupancy};const params={};for(const k of['width','pathWidth'])if(k in spec)params[k]=spec[k];if(Object.keys(params).length)p.params=params;return p;});
    same(raw.jointSpace,space,'independent joint space');same(raw.jointRows.map(r=>r.policy),space,'complete joint candidates');
    const best=[...raw.jointRows].sort((a,b)=>b.gate.netWins-a.gate.netWins||(b.gate.meanMovesSaved??0)-(a.gate.meanMovesSaved??0)||a.id.localeCompare(b.id))[0];
    if(raw.jointBest!==best.id||!best.recheck)throw new Error('joint best/fresh check differs');
    const changes=r=>Object.keys(r.policy.weights||{}).length+Object.keys(r.policy.params||{}).length;
    const winner=[...raw.rows,...raw.jointRows].filter(r=>r.outcome==='ACCEPTED').sort((a,b)=>b.recheck.meanMovesSaved-a.recheck.meanMovesSaved||changes(a)-changes(b)||a.id.localeCompare(b.id))[0];
    same(raw.selected,{id:winner.id,policy:winner.policy,recheck:winner.recheck,recheckBlock:winner.recheckBlock},'selected frozen candidate');
    if(raw.path!=='CONFIRMATION_REGISTRATION_PENDING')throw new Error('selection phase disposition');
  }
  const directory=path.join(ROOT,'solver/policy-lab/runs/recovery/proposal-journal');
  const files=fs.readdirSync(directory).filter(f=>f.endsWith('.completed.json'));
  if(files.length!==raw.dispatches.length*58)throw new Error('incomplete completed-job journal');
  const seen=new Set();
  for(const file of files){
    const j=JSON.parse(fs.readFileSync(path.join(directory,file)));
    if(crypto.createHash('sha256').update(JSON.stringify(j.job)).digest('hex')!==j.id||j.runId!==`${raw.result}-registered-proposals`)throw new Error('journal identity differs');
    const d=raw.dispatches.find(d=>JSON.stringify(d.policy)===JSON.stringify(j.job.policy)&&JSON.stringify(d.seeds)===JSON.stringify(j.job.seeds));
    if(!d)throw new Error('job has no dispatch');const key=`${d.block}/${d.arm}/${j.job.levelData.level}`;if(seen.has(key))throw new Error('repeated journal job');seen.add(key);
    const p=raw.panels.find(p=>p.block===d.block&&p.arm===d.arm);same(p.games.filter(g=>g.level===j.job.levelData.level),j.result.games,'journal outcomes');
  }
  console.log('PASS completed proposal journal jobs',files.length,'PATH',raw.path);
}
function confirmation() {
  const plan='docs/goals/policy-terms-loop/RECOVERY_PLAN.md';
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(read(plan).toString())[1]);
  const file=`experiments/${config.result}/raw-pairs.json`;
  if(!fs.existsSync(path.join(ROOT,file))){console.log('UNVERIFIED_NOT_RUN: confirmation raw absent');return;}
  const raw=json(file),reported=json(`experiments/${config.result}/verdict.json`);
  const proto=`experiments/${config.result}/protocol.md`,protocol=read(proto).toString();
  const first=execFileSync('git',['log','--diff-filter=A','--format=%H','--',proto],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').at(-1);
  if(raw.registration.exploratory||raw.registration.protocol!==config.result||raw.registration.protocolCommit!==first)throw new Error('confirmation registration identity');
  execFileSync('git',['merge-base','--is-ancestor',first,'HEAD'],{cwd:ROOT});
  const registered=execFileSync('git',['show',`${first}:${proto}`],{cwd:ROOT,encoding:'utf8'});
  const normalize=s=>s.replace(/^status: .*$/m,'status: registered');
  if(normalize(protocol)!==normalize(registered))throw new Error('confirmation protocol changed');
  const frozen=/^version_freeze:\n((?:  [^\n]+\n)+)/m.exec(registered);
  if(!frozen)throw new Error('missing confirmation freeze');
  const sources=Object.fromEntries(frozen[1].trimEnd().split('\n').map(line=>{
    const m=/^  (.+): ([0-9a-f]{16})$/.exec(line);if(!m)throw new Error('malformed frozen source');return[m[1],m[2]];
  }));
  same(raw.sources,sources,'confirmation sources');
  const recoveryCommit=execFileSync('git',['log','--diff-filter=A','--format=%H','--',plan],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').at(-1);
  if(raw.recoveryPlanCommit!==recoveryCommit)throw new Error('confirmation recovery registration identity');
  for(const[f,h]of Object.entries(sources))if(hash(f).slice(0,16)!==h)throw new Error(`confirmation frozen drift ${f}`);
  const candidatePath='solver/policy-lab/frozen-candidate.js';
  for(const source of[...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes),plan,'experiments/SEEDS.md',candidatePath,
    'solver/policy-lab/run-confirmation.js','solver/policy-lab/proposal-recompute.js','solver/experiment-guard.js','tools/verify-experiments.js','tools/persist-before-verdict.js'])
    if(sources[source]!==hash(source).slice(0,16))throw new Error(`confirmation protocol omits source ${source}`);
  if(raw.candidate.path!==candidatePath||raw.candidate.sha256!==hash(candidatePath)||sources[candidatePath]!==hash(candidatePath).slice(0,16))throw new Error('candidate path/hash');
  const literal=/module\.exports = ([\s\S]*);\n$/.exec(read(candidatePath).toString());
  if(!literal)throw new Error('candidate configuration is not frozen literal code');
  same(raw.candidate.policy,JSON.parse(literal[1]),'frozen candidate policy');
  const phase=json('solver/policy-lab/runs/recovery/proposals-raw.json');
  if(phase.status!=='EXPLORATION_COMPLETE'||phase.path!=='CONFIRMATION_REGISTRATION_PENDING')throw new Error('confirmation lacks complete exploration');
  same(raw.candidate.policy,phase.selected.policy,'selected candidate');
  if(raw.candidate.selectedRecheck!==phase.selected.recheckBlock)throw new Error('selected fresh recheck');
  same(raw.priorCounts,phase.counts,'confirmation prior counts');
  same(raw.levels,Array.from({length:58},(_,i)=>i+1),'all-58 denominator');
  same(raw.seeds,Array.from({length:150},(_,i)=>config.blocks.F.start+i),'150-seed denominator');
  if(raw.status!=='PAIRS_COMPLETE'||raw.panels.length!==2||raw.dispatches.length!==2||raw.cells.length!==8700)throw new Error('incomplete one-shot confirmation');
  const expectedCounts={...raw.priorCounts,confirmation:17400};same(raw.counts,expectedCounts,'confirmation charged counts');
  if(raw.priorCounts.confirmation!==0)throw new Error('second confirmation forbidden');
  for(const[k,n]of Object.entries(raw.counts))if(!Number.isSafeInteger(n)||n<0||n>config.budgets[k])throw new Error(`confirmation budget ${k}`);
  if(Object.values(raw.counts).reduce((a,b)=>a+b,0)>120000)throw new Error('confirmation total bound');
  for(const arm of['champion','candidate']){
    const panels=raw.panels.filter(p=>p.arm===arm),dispatch=raw.dispatches.filter(d=>d.arm===arm);
    if(panels.length!==1||dispatch.length!==1)throw new Error('confirmation duplicate arm');
    const p=panels[0],d=dispatch[0],policy=arm==='champion'?{kind:'champion'}:raw.candidate.policy;
    if(p.block!=='F'||d.block!=='F'||d.games!==8700||d.budget!=='confirmation')throw new Error('confirmation arm identity');
    same(p.policy,policy,'confirmation panel policy');same(d.policy,policy,'confirmation dispatch policy');
    same(p.levels,raw.levels,'confirmation panel levels');same(p.seeds,raw.seeds,'confirmation panel seeds');same(d.seeds,raw.seeds,'confirmation dispatch seeds');
    same(p.games.map(g=>[g.level,g.seed]),raw.levels.flatMap(l=>raw.seeds.map(s=>[l,s])),'confirmation exact cells');
    if(p.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('confirmation recording read');
  }
  const c=raw.panels.find(p=>p.arm==='candidate'),r=raw.panels.find(p=>p.arm==='champion');
  same(raw.cells,c.games.map((g,i)=>({level:g.level,seed:g.seed,candidate:g.outcome,champion:r.games[i].outcome})),'persisted raw pairs');
  const primary=summarize(c.games,r.games,raw.levels,raw.seeds);
  const sub=levels=>summarize(c.games.filter(g=>levels.includes(g.level)),r.games.filter(g=>levels.includes(g.level)),levels,raw.seeds);
  const secondary={late:sub([56,57,58]),other:sub(raw.levels.filter(l=>l<56))};
  const perLevel=raw.levels.map(level=>({level,summary:sub([level])}));
  const domain=primary.netWins<0||(primary.moveCi95[1]!==null&&primary.moveCi95[1]<0)?'FALSIFIED'
    :primary.meanMovesSaved!==null&&primary.meanMovesSaved>0&&primary.moveCi95[0]!==null&&primary.moveCi95[0]>0?'SUPPORTED':'INCONCLUSIVE';
  near(primary,reported.primary,'confirmation primary');near(secondary,reported.secondary,'confirmation secondary');near(perLevel,reported.perLevel,'confirmation per-level');
  const compute={champion:{threadCpuSeconds:r.threadCpuSeconds,wallSeconds:r.wallSeconds},candidate:{threadCpuSeconds:c.threadCpuSeconds,wallSeconds:c.wallSeconds},
    threadCpuRatio:c.threadCpuSeconds/r.threadCpuSeconds,wallRatio:c.wallSeconds/r.wallSeconds};
  near(compute,reported.compute,'confirmation physical compute');
  if(reported.primaryOutcome!==domain||reported.rawSha256!==hash(file)||reported.rawArtifact!==file)throw new Error('confirmation verdict/raw binding');
  const directory=path.join(ROOT,'solver/policy-lab/runs/recovery/confirmation/journal');
  const files=fs.readdirSync(directory).filter(f=>f.endsWith('.completed.json'));
  if(files.length!==1740)throw new Error('confirmation completed job count');
  const observed=new Set(),definitions=json('solver/policy-lab/runs/recovery/controls-raw.json').levelDefinitions;
  for(const name of files){
    const j=JSON.parse(fs.readFileSync(path.join(directory,name)));
    if(crypto.createHash('sha256').update(JSON.stringify(j.job)).digest('hex')!==j.id||j.runId!==`${raw.result}-one-shot-F`)throw new Error('confirmation journal identity');
    const arm=JSON.stringify(j.job.policy)===JSON.stringify(raw.candidate.policy)?'candidate':JSON.stringify(j.job.policy)===JSON.stringify({kind:'champion'})?'champion':null;
    if(!arm||j.job.seeds.length!==10)throw new Error('confirmation job arm/chunk');
    const start=raw.seeds.indexOf(j.job.seeds[0]);if(start<0||start%10!==0)throw new Error('confirmation job seeds');
    same(j.job.seeds,raw.seeds.slice(start,start+10),'confirmation chunk');
    same(j.job.levelData,definitions.find(l=>l.level===j.job.levelData.level),'frozen level definition');
    const panel=arm==='candidate'?c:r;
    same(j.result.games,panel.games.filter(g=>g.level===j.job.levelData.level&&j.job.seeds.includes(g.seed)),'confirmation journal outcomes');
    for(const g of j.result.games){const key=`${arm}/${g.level}/${g.seed}`;if(observed.has(key))throw new Error('confirmation repeated completed cell');observed.add(key);}
  }
  if(observed.size!==17400)throw new Error('confirmation journal incomplete cells');
  if(raw.filesRead.some(f=>/(^|\/)(recordings|play-sessions)\//.test(f)))throw new Error('confirmation manifest recording read');
  const ranges=Object.values(config.blocks).sort((a,b)=>a.start-b.start);
  ranges.forEach((v,i)=>{if(v.start<60000000||v.start+v.count-1>69999999||(i&&ranges[i-1].start+ranges[i-1].count>v.start))throw new Error('confirmation block overlap/range');});
  const result={result:raw.result,primaryOutcome:domain,primary,secondary,perLevel,compute,counts:raw.counts,
    coverage:{levels:58,seedsPerLevel:150,pairs:8700,completedJobs:1740,journalCells:17400,disjoint:true,noRecordingReads:true},filesRead:raw.filesRead,arithmetic:'MATCH',verification:'same-author re-implementation only'};
  if(process.argv.includes('--json'))console.log(JSON.stringify(result));
  else{
    console.log('INDEPENDENT_PRIMARY',JSON.stringify(primary),'VERDICT',domain);
    console.log('INDEPENDENT_SECONDARY',JSON.stringify(secondary));for(const row of perLevel)console.log('INDEPENDENT_PER_LEVEL',JSON.stringify(row));
    console.log('INDEPENDENT_COMPUTE',JSON.stringify(compute));console.log('PASS confirmation coverage/disjointness/journal',JSON.stringify(result.coverage));
    console.log('CONFIRMATION_FILES_READ',JSON.stringify(raw.filesRead));console.log('ACCOUNTING',JSON.stringify(raw.counts));
    console.log('MATCH confirmation arithmetic; same-author re-implementation, not independent verification');
  }
}
if(require.main===module){try{if(process.argv.includes('--confirmation'))confirmation();else main();}catch(e){console.error(e.stack);process.exitCode=1;}}
module.exports={axis,summarize,outcome,near};
