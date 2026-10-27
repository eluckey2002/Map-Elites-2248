/* Grader tuning for grader set v1 (TUNING.md). A grader plays each board TRIALS times with a fixed rng and turns the
   games into one difficulty number; agreement with the owner's struggle scores (PLAN.md) is then counted over pairs.
   Not evidence: a screen for the owner's difficulty-grader loop idea.
   Usage: node prototypes/grader-set/tune.js <runs dir>            (all rounds on the tuning boards, then the held-out check)
          node prototypes/grader-set/tune.js <runs dir> --time       (seconds per grader setting on one board, no scoring) */
const fs=require('node:fs'),path=require('node:path');
const search=require('../sampler/search'),rules=require('../sampler/model'),core=require('../../solver/engine');
const levels=require('./levels');
const TRIALS=40;

// One game by a noisy player. `player`: 'greedy' is search.ordinary's one-move pick; 'planner' re-plans every move with
// a small beam (width `beam`, up to 6 moves ahead) and plays the plan's first chain, falling back to the greedy pick.
function game(level,cfg,rng){
  const lvl=cfg.limit==='board'?level:{...level,moves:40};
  if(cfg.player==='greedy')return search.ordinary(lvl,{noise:{epsilon:cfg.epsilon,rng}});
  let state=rules.create(lvl);
  while(state.outcome==='playing'){
    const all=rules.chains(state,8);if(!all.length)break;
    let pick;
    if(rng()<cfg.epsilon)pick=all[Math.floor(rng()*all.length)];
    else{const plan=search.solve(lvl,{beam:cfg.beam,maxLength:7,start:state,budget:Math.min(6,state.maxMoves-state.moves)});
      pick=plan?plan.path[0]:greedyPick(lvl,state,all);}
    state=rules.move(lvl,state,pick);
  }
  return {outcome:state.outcome,moves:state.moves,limit:state.maxMoves};
}
function greedyPick(level,state,all){
  let best=all[0],bh=-Infinity;
  for(const c of all){const n=rules.move(level,state,c);const h=n.outcome==='won'?1e9:search.heuristic(level,n);if(h>bh){bh=h;best=c;}}
  return best;
}
// Difficulty of one board under a grader: higher = harder.
function grade(level,cfg){
  const rng=core.makeRng(level.seed*31+7);let wins=0,used=0;
  for(let t=0;t<TRIALS;t++){const g=game(level,cfg,rng);const limit=cfg.limit==='board'?level.moves:40;
    if(g.outcome==='won'){wins++;used+=g.moves/limit;}else used+=2;}
  return cfg.measure==='winRate'?1-wins/TRIALS:used/TRIALS;
}

// Owner's struggle score per PLAN.md, first run per board only.
function struggle(dir){
  const runs={};
  for(const f of fs.readdirSync(dir)){const j=JSON.parse(fs.readFileSync(path.join(dir,f)));const d=j.data||j;
    if(!runs[d.board]||d.startedAt<runs[d.board].startedAt)runs[d.board]=d;}
  const out={};
  for(const [b,d] of Object.entries(runs)){const frac=d.movesUsed/d.budget;let s=null;
    if(['gave-up','out-of-moves','no-chains','no-moves'].includes(d.outcome))s=3;
    else if(d.outcome==='won')s=d.undos>=3?2:(d.undos>=1||frac>0.75)?1:0;
    if(s!==null)out[b]={s,frac};}
  return out;
}
// Agreement over pairs whose struggle scores differ (PLAN.md); a tie in the grade counts half.
function agreement(ids,owner,grades){
  let agree=0,pairs=0;
  for(let i=0;i<ids.length;i++)for(let k=i+1;k<ids.length;k++){
    const a=owner[ids[i]],b=owner[ids[k]];if(a.s===b.s)continue;
    const [hi,lo]=a.s>b.s?[ids[i],ids[k]]:[ids[k],ids[i]];pairs++;
    if(grades[hi]>grades[lo])agree++;else if(grades[hi]===grades[lo])agree+=0.5;}
  return {agree,pairs,pct:pairs?Math.round(1000*agree/pairs)/10:null};
}

const BASE={player:'greedy',epsilon:0.2,limit:'40',measure:'winRate',beam:20};
const ROUNDS=[
  {name:'limit',options:[{limit:'40'},{limit:'board'}]},
  {name:'measure',options:[{measure:'winRate'},{measure:'movesUsed'}]},
  {name:'epsilon',options:[{epsilon:0.2},{epsilon:0},{epsilon:0.1},{epsilon:0.3}]},
  {name:'player',options:[{player:'greedy'},{player:'planner',beam:20}]},
];

if(require.main===module){
  const dir=process.argv[2],byId=Object.fromEntries(levels.map(l=>[l.id,l]));
  if(process.argv.includes('--time')){
    const lvl=byId['see-it-coming-a'];
    for(const cfg of [BASE,{...BASE,player:'planner'}]){const t=Date.now();grade(lvl,cfg);console.log(cfg.player,(Date.now()-t)/1000,'s');}
    process.exit(0);
  }
  const owner=struggle(dir),held=levels.filter(l=>l.id.endsWith('-b')).map(l=>l.id);
  const tune=Object.keys(owner).filter(id=>!held.includes(id)).sort(),hold=Object.keys(owner).filter(id=>held.includes(id)).sort();
  const cache=new Map(),gradesFor=(cfg,ids)=>Object.fromEntries(ids.map(id=>{const k=JSON.stringify(cfg)+id;
    if(!cache.has(k))cache.set(k,grade(byId[id],cfg));return [id,cache.get(k)];}));
  console.log('tuning boards',tune.length,'held-out boards played',hold.length);
  let cfg={...BASE},score=agreement(tune,owner,gradesFor(cfg,tune));
  console.log('baseline',JSON.stringify(cfg),score);
  for(const r of ROUNDS){
    for(const o of r.options){const c={...cfg,...o};const s=agreement(tune,owner,gradesFor(c,tune));
      console.log(' ',r.name,JSON.stringify(o),s);
      if(s.agree/s.pairs>score.agree/score.pairs){cfg=c;score=s;}}
    console.log('after',r.name,JSON.stringify(cfg),score);
  }
  const all=Object.keys(owner);
  console.log('HELD-OUT baseline',agreement(hold,owner,gradesFor(BASE,hold)),'final',agreement(hold,owner,gradesFor(cfg,hold)));
  console.log('ALL-14 (not a test: includes tuning boards) baseline',agreement(all,owner,gradesFor(BASE,all)),'final',agreement(all,owner,gradesFor(cfg,all)));
  console.log(JSON.stringify(Object.fromEntries(all.map(id=>[id,{owner:owner[id].s,base:+gradesFor(BASE,[id])[id].toFixed(2),final:+gradesFor(cfg,[id])[id].toFixed(2)}]))));
}
module.exports={grade,agreement,struggle};
