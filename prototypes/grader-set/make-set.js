/* Grader set v1: picks the boards for the owner's difficulty-grader play session (see PLAN.md). For each v5 keeper
   board (prototypes/sampler/levels.js) it makes CANDIDATES new boards by shuffling the start tiles (walls, spots, ★ and the
   gate stay put; Through the Gate shuffles each room on its own, so each room keeps its tiles) under a new refill seed.
   A candidate is kept when the beam solver wins it within 20 moves and a wide beam (200, chains up to 8)
   finds no win in 3 moves or fewer (a screen: the exhaustive proof took minutes per Make It Here board). Each kept
   candidate gets a rough pre-grade: the win rate of the ordinary player over TRIALS games where each move is a random
   legal chain with probability EPSILON (40 moves allowed), then the beam's move count. Per kind it picks PER_KIND boards
   spread across that order (easiest, middle, hardest). Move limits use the v5 rule (calibrate.js): the largest of beam
   P90 + 2, beam median + 8, and ordinary P80 + 2 where the ordinary player wins at least half of the draws.
   The pre-grade only spreads the picks; it is the grader under test, not a measure of the owner.
   Usage (deterministic): node prototypes/grader-set/make-set.js --kind <board id> <part.json>   (one kind; runs in parallel)
                          node prototypes/grader-set/make-set.js --merge <out.js> <part.json>...  (mixes the order, writes levels.js) */
const fs=require('node:fs'),path=require('node:path');
const search=require('../sampler/search'),levels=require('../sampler/levels'),core=require('../../solver/engine');
const CANDIDATES=10,PER_KIND=3,TRIALS=20,EPSILON=0.2,DRAWS=30;
const q=(arr,p)=>{if(!arr.length)return null;const a=[...arr].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(p*a.length)-1)];};

// Shared Material and The Drought lose every win under a full shuffle (scattered 3s; no refills), so they get a light
// shake instead: `swaps` random swaps of two tiles, more for later candidates.
const LIGHT={'shared-material':true,'the-drought':true};
function shaken(base,rng,swaps){
  const stone=new Set((base.stone||[]).map(String)),grid=base.grid.map(r=>r.slice()),cells=[];
  grid.forEach((row,y)=>row.forEach((v,x)=>{if(!stone.has(x+','+y))cells.push([x,y]);}));
  for(let s=0;s<swaps;s++){const [ax,ay]=cells[Math.floor(rng()*cells.length)],[bx,by]=cells[Math.floor(rng()*cells.length)];[grid[ay][ax],grid[by][bx]]=[grid[by][bx],grid[ay][ax]];}
  return grid;
}
// The Drought is only won with long chains (v5 README: chains up to 12), so its solver allows them and a wide beam.
// It also keeps v5's exception to the no-win-in-3 screen: the v5 Drought itself has a 2-move win with 12-tile chains
// (the owner took 5 moves), so the screen is skipped there.
const drought=level=>level.refill===false;
const solveOpts=level=>drought(level)?{beam:1000,maxLength:12}:{beam:60,maxLength:7};
function shuffled(base,rng){
  const stone=new Set((base.stone||[]).map(String)),grid=base.grid.map(r=>r.slice());
  const wall=base.stone?Math.min(...base.stone.map(p=>p[0])):null;
  const rooms=wall===null?[()=>true]:[x=>x<wall,x=>x>wall];
  for(const inRoom of rooms){
    const cells=[];grid.forEach((row,y)=>row.forEach((v,x)=>{if(!stone.has(x+','+y)&&inRoom(x))cells.push([x,y]);}));
    const values=cells.map(([x,y])=>grid[y][x]);
    for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}
    cells.forEach(([x,y],i)=>{grid[y][x]=values[i];});
  }
  return grid;
}

function pregrade(level){
  const rng=core.makeRng(level.seed*31+7);let wins=0;
  for(let t=0;t<TRIALS;t++)if(search.ordinary({...level,moves:40},{noise:{epsilon:EPSILON,rng}}).outcome==='won')wins++;
  return wins/TRIALS;
}

function limit(level){
  const seeds=level.refill===false?[level.seed]:Array.from({length:DRAWS},(_,i)=>i===0?level.seed:1000+i);
  const ord=[],beam=[];
  for(const seed of seeds){
    const l={...level,seed,moves:40};
    const o=search.ordinary(l);if(o.outcome==='won')ord.push(o.moves);
    const b=search.solve(l,{...solveOpts(level),budget:20});if(b)beam.push(b.moves);
  }
  if(!beam.length)throw new Error(level.id+': no draw won for the limit');
  const parts=[q(beam,.9)+2,q(beam,.5)+8];
  if(ord.length*2>=seeds.length)parts.push(q(ord,.8)+2);
  return {moves:Math.max(...parts),draws:seeds.length,ordinaryWins:ord.length,beamWins:beam.length};
}

module.exports={shaken,shuffled,limit,solveOpts,drought,LIGHT};
const args=process.argv.slice(2);
if(require.main!==module){}else if(args[0]==='--kind'){
const picked=[];
levels.forEach((base,k)=>{if(base.id!==args[1])return;
  const rng=core.makeRng(9100+k),kept=[];
  const tries=LIGHT[base.id]?2*CANDIDATES:CANDIDATES;
  for(let c=0;c<tries;c++){
    const level={...base,seed:5000+k*100+c,grid:LIGHT[base.id]?shaken(base,rng,1+c):shuffled(base,rng),moves:20};
    const beam=search.solve(level,{...solveOpts(level),budget:20});
    if(!beam||!drought(level)&&search.solve(level,{beam:200,maxLength:8,budget:3})||drought(level)&&beam.moves<2)continue;  // no one-move Drought
    kept.push({level,beamMoves:beam.moves,winRate:pregrade(level)});
  }
  kept.sort((a,b)=>b.winRate-a.winRate||a.beamMoves-b.beamMoves||a.level.seed-b.level.seed);
  if(kept.length<PER_KIND)throw new Error(`${base.id}: only ${kept.length} candidates kept`);
  const at=[0,Math.floor((kept.length-1)/2),kept.length-1];
  at.forEach((i,n)=>{const c=kept[i],lim=limit(c.level);
    picked.push({...c.level,id:`${base.id}-${'abc'[n]}`,moves:lim.moves,pregrade:{winRate:c.winRate,beamMoves:c.beamMoves,spread:['easiest','middle','hardest'][n],
      limitDraws:lim.draws,ordinaryWins:lim.ordinaryWins,beamWins:lim.beamWins}});
    console.error(base.id,'abc'[n],JSON.stringify({kept:kept.length,winRate:c.winRate,beamMoves:c.beamMoves,limit:lim.moves}));
  });
});
if(!picked.length)throw new Error('no board with id '+args[1]);
fs.writeFileSync(args[2],JSON.stringify(picked));
}else if(args[0]==='--merge'){
const picked=levels.flatMap(base=>{const part=args.slice(2).map(f=>JSON.parse(fs.readFileSync(f,'utf8'))).find(p=>p[0].id.startsWith(base.id+'-'));
  if(!part)throw new Error('missing part for '+base.id);return part;});
// The limit's draws do not include the board's own draw; make sure the board's own beam line fits with 4 to spare.
for(const b of picked)b.moves=Math.max(b.moves,b.pregrade.beamMoves+4);
// Mixed play order (seeded), so the boards of one kind are not played back to back in difficulty order.
const order=core.makeRng(2248);
for(let i=picked.length-1;i>0;i--){const j=Math.floor(order()*(i+1));[picked[i],picked[j]]=[picked[j],picked[i]];}
const out=args[1];
fs.writeFileSync(out,`/* Generated by make-set.js (grader set v1); do not edit by hand. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SamplerLevels=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  return [
${picked.map(b=>'    '+JSON.stringify(b)).join(',\n')}
  ];
});
`);
console.error('wrote',out,picked.length,'boards');
}else throw new Error('usage: --kind <id> <part.json> | --merge <out.js> <part.json>...');
