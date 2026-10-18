/* v5 budget calibration (owner's final review: limits must survive unlucky draws for ordinary play, not come from the
   solver's best line). For each board, the same start grid is played under many refill seeds. Two players:
   ordinary() from search.js (no look-ahead, no undo) and the beam solver (an upper bound on skill). Prints, per board,
   how many seeds each wins and the moves it needed. Usage: node prototypes/sampler/calibrate.js [seeds] [boardId] */
const search=require('./search'),levels=require('./levels');
const N=Number(process.argv[2]||30),only=process.argv[3];
const q=(arr,p)=>{if(!arr.length)return null;const a=[...arr].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.ceil(p*a.length)-1)];};
for(const base of levels){
  if(only&&base.id!==only)continue;
  const seeds=base.refill===false?[base.seed]:Array.from({length:N},(_,i)=>i===0?base.seed:1000+i);
  const ord=[],beam=[],home={};let ordLoss=0,beamLoss=0;
  for(const seed of seeds){
    const level={...base,seed,moves:40};
    const o=search.ordinary(level);o.outcome==='won'?ord.push(o.moves):ordLoss++;
    if(seed===base.seed)home.ordinary=o.outcome==='won'?o.moves:null;
    const b=search.solve(level,{beam:60,maxLength:7,budget:20});b?beam.push(b.moves):beamLoss++;
    if(seed===base.seed)home.beam=b?b.moves:null;
  }
  console.log(JSON.stringify({id:base.id,seeds:seeds.length,ordinaryWins:ord.length,ordinaryP50:q(ord,.5),ordinaryP80:q(ord,.8),ordinaryMax:q(ord,1),
    beamWins:beam.length,beamP50:q(beam,.5),beamP90:q(beam,.9),beamMax:q(beam,1),home}));
}
