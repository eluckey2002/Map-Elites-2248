'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { twoAxis } = require('../ruler/core');
const { generationDecision } = require('./generation-decision');
const { collect, resolveRecordedBoard } = require('../human-benchmark');
const { replay } = require('../recording-replay');
const { analyzeMove } = require('../bot');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../engine');
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/goals/policy-learned-judge');
const json = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
function noise() {
 const a=json('experiments/RESULT-0049/corpus.json');
 const b=json('experiments/RESULT-0058/raw-games.json');
 const historical = a.cells.map(c=>c.base.win && c.champion.win ? c.base.movesToTarget-c.champion.movesToTarget : null);
 const summary=twoAxis(historical,58,300);
 const cross=b.games.filter(g=>g.stage==='positive3000');
 const champ=new Map(cross.filter(g=>g.arm==='candidate').map(g=>[g.level+':'+g.seed,g.outcome]));
 const rows=[];
 for(let level=1;level<=58;level++) {
  const main=a.cells.filter(c=>c.level===level);
  if(main.length!==300) throw Error('historical coverage failed level '+level);
  const s=twoAxis(main.map(c=>c.base.win&&c.champion.win?c.base.movesToTarget-c.champion.movesToTarget:null),1,300);
  const xp=cross.filter(g=>g.level===level&&g.arm==='champion');
  const x=xp.length?twoAxis(xp.map(g=>{const c=champ.get(g.level+':'+g.seed); return c&&c.win&&g.outcome.win ? g.outcome.movesToTarget-c.movesToTarget:null;}),1,xp.length):null;
  const row={level,source:'RESULT-0049 champion-vs-base',cells:main.length,mutualWins:s.n,pairedVariance:s.seSeed===null?null:s.seSeed*s.seSeed*s.n,crossCheckSource:xp.length?'RESULT-0058 positive3000':'not covered',crossCheckCells:xp.length,crossCheckVariance:x?.seSeed===null?null:x?x.seSeed*x.seSeed*x.n:null,uncovered:false};
  rows.push(row); console.log(JSON.stringify(row));
 }
 const designs=[{levels:58,seeds:10,permitted:true},{levels:58,seeds:150,role:'confirmation'},{levels:12,seeds:6,permitted:false,role:'information only'}];
 const table=designs.map(d=>{const seLevel=summary.seLevel*Math.sqrt(58/d.levels); const seSeed=summary.seSeed*Math.sqrt(300/d.seeds); const se=Math.max(seLevel,seSeed);return {...d,seLevel,seSeed,se,halfWidth95:1.96*se,detectableGain80:2.8*se};});
 console.log('NOISE TABLE '+JSON.stringify(table));
 console.log('5% significance, 80% target power; detectable gain = 2.8 x standard error, conditional on historical champion-vs-base variance. Adding seeds does not shrink the level-axis error. Neither historical source holds challenger-vs-champion pairs; champion-vs-itself is not a variability estimate.');
 const raw={rows,historical:summary,designs:table}; fs.writeFileSync(path.join(OUT,'noise.json'),JSON.stringify(raw,null,2)+'\n');
}
function ceiling() {
 const cache=path.join(OUT,'human-benchmark.json');
 const benchmark=fs.existsSync(cache)?JSON.parse(fs.readFileSync(cache,'utf8')):collect();
 fs.writeFileSync(path.join(OUT,'human-benchmark.json'),JSON.stringify(benchmark,null,2)+'\n');
 console.log('HUMAN BENCHMARK '+JSON.stringify(benchmark));
 const dirs=['recordings','play-sessions'];
 for(const pilot of fs.readdirSync(path.join(ROOT,'pilots'))) {const d='pilots/'+pilot+'/recordings'; if(fs.existsSync(path.join(ROOT,d))) dirs.push(d);}
 const rows=[]; const excluded=[]; const issues=[]; let sessions=0;
 for(const dir of dirs) {
  if(!fs.existsSync(path.join(ROOT,dir))) continue;
  for(const name of fs.readdirSync(path.join(ROOT,dir)).filter(n=>n.endsWith('.json')).sort()) {
   const file=dir+'/'+name; const recording=json(file); sessions++;
   const resolved=resolveRecordedBoard(recording);
   if(!resolved) {issues.push({file,issue:'unresolved board'});continue;}
   const checked=replay(resolved.candidate,recording);
   if(checked.problems.length) {issues.push({file,problems:checked.problems});continue;}
   const matches=benchmark.rows.filter(r=>r.file===name.slice(0,8)&&r.level===recording.candidateLevel&&r.seed===recording.seed);
   if(matches.length!==1) {issues.push({file,issue:'benchmark resolution not unique'});continue;}
   const paired=matches[0]; const ownerFaster=paired.human.outcome==='win'&&paired.bot.outcome==='win'&&paired.human.moves<paired.bot.moves;
   const rng=makeRng(recording.seed); const state=createLevelState(resolved.candidate,rng);
   recording.chains.forEach((chain,moveIndex)=>{
    const analysis=analyzeMove(state,{lookaheadRngFactory:()=>makeRng(987654321+moveIndex)});
    const live=chain.tiles.map(t=>state.grid[t.y][t.x]);
    const selected=analysis.candidates.find(c=>c.id===analysis.selectedId);
    if(analysis.reason==='bomb-priority') excluded.push({file,moveIndex});
    else {
     const poolBest=analysis.candidates.length?Math.max(...analysis.candidates.map(c=>c.immediatePoints)):0;
     rows.push({file,level:recording.candidateLevel,moveIndex,ownerPoints:chain.points,botPoints:selected?.immediatePoints??0,poolBest,ownerFaster,diagnostic:ownerFaster&&chain.points>(selected?.immediatePoints??0),reason:analysis.reason});
    }
    executeChain(state,live);applyGravity(state);spawnNewTiles(state,rng);tickBlockers(state);
   });
  }
 }
 function summary(label,subset) {
  const misses=subset.filter(r=>r.poolBest<r.ownerPoints).length;
  const result={label,n:subset.length,poolBelowOwner:misses,botBelowOwner:subset.filter(r=>r.botPoints<r.ownerPoints).length,fraction:subset.length?misses/subset.length:null};console.log(JSON.stringify(result));return result;
 }
 const tables=[summary('overall',rows),summary('levels 56 to 58',rows.filter(r=>r.level>=56&&r.level<=58)),summary('DIAGNOSTIC SUBSET: owner faster mutual-win boards and owner chain scores above bot choice',rows.filter(r=>r.diagnostic))];
 console.log('BOMB-PRIORITY EXCLUDED '+excluded.length);console.log('SESSIONS '+sessions+'; unresolved '+issues.length);
 const n=tables[2].n, N_MIN=30;
 let closurePath=null;
 if(issues.length||benchmark.unresolved.length) console.log('UNVERIFIED: every-recorded-session prerequisite cannot be met: '+JSON.stringify(issues));
 else if(n<N_MIN) console.log('ceiling check inconclusive: subset too small (n = '+n+')');
 else if(generationDecision(rows,issues,N_MIN).path==='E') {console.log('Candidate coverage failed the prerequisite for this ranking experiment; stop and report a generation bottleneck.');closurePath='E';}
 else console.log('Generation prerequisite cleared on the diagnostic subset only.');
 const raw={sessions,rows,excluded,issues,tables,N_MIN,path:closurePath,benchmarkReplayGames:benchmark.rows.length*2};
 fs.writeFileSync(path.join(OUT,'ceiling.json'),JSON.stringify(raw,null,2)+'\n');
 if(issues.length||benchmark.unresolved.length) process.exitCode=1;
}
if(require.main===module) {noise();ceiling();}

