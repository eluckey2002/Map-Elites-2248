/* Turns chosen drafts into levels.js: marker order (② = where the witness leaves its tile),
   plain hints, move budgets, then re-screens each board at its budget with fresh draws.
   Usage: node finalize.js <drafts.jsonl> */
const fs=require('node:fs'),path=require('node:path');
const rules=require('../../src/connection-rules');
const {screen,rng}=require('./search');
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const GROW='Each tile you make is part of the next connection',HOME='Three connections between the same two places';
const CHOSEN=[
  {flavor:'reunion',seed:5248,id:'bring-them-together',name:'Bring Them Together',focus:'Your first two tiles meet in the last connection'},
  {flavor:'home',seed:5353,id:'back-again',name:'Back Again',focus:HOME},
  {flavor:'home',seed:5031,id:'same-two-spots',name:'Same Two Spots',focus:HOME},
  {flavor:'relay',seed:6010,id:'keep-growing',name:'Keep Growing',focus:GROW},
  {flavor:'relay',seed:6200,id:'big-finish',name:'Big Finish',focus:GROW},
  {flavor:'relay',seed:5210,id:'ladder-up',name:'Ladder Up',focus:GROW},
];
// Hints describe only the marker layout, checked below.
function hint(flavor,k,ends,prev){
  const madeIs=prev&&(same(ends[1],prev)?'②':same(ends[0],prev)?'①':null);
  if(flavor==='reunion'&&k===2)return '① and ② are where your first two connections ended.';
  if(flavor==='reunion')return k===0?'End on ②. You will need that tile later.':'New places. End on ② and keep that tile too.';
  if(flavor==='home'&&k>0)return `Same two places. The tile you made sits on ${madeIs}.${k<2?' End on ② to leave the new one there.':''}`;
  if(k===0)return 'End on ②. The tile you make there is part of the next connection.';
  return `The tile you made sits on ${madeIs}.${k<2?' End on ② to pass the new one on.':''}`;
}
const rows=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').map(JSON.parse);
const out=[],report=[];
for(const pick of CHOSEN){
  const row=rows.find(r=>r.seed===pick.seed&&r.flavor===pick.flavor);if(!row)throw new Error('missing '+pick.seed);
  const draft=row.level,flavor=row.flavor;
  // Replay the witness to find where each completing chain leaves its tile.
  let state=rules.create({id:'x',moves:99,...draft});const landings=[];
  for(const a of draft.witness){const before=state.completed;state=rules.move(state,a.chain);if(state.completed>before)landings.push([state.last.landing.x,state.last.landing.y]);}
  if(landings.length!==3)throw new Error('witness');
  // Readable goals: when each goal appears (on the witness line), both marked tiles are smaller than its target.
  {let t=rules.create({id:'x',moves:99,...draft});const look=()=>{const g=t.objective;if(g&&g.ends.some(([x,y])=>t.grid[y][x].value>=g.target))throw new Error(pick.id+': a marked tile is already as big as the target');};
   look();for(const a of draft.witness){const b=t.completed;t=rules.move(t,a.chain);if(t.completed>b)look();}}
  const objectives=draft.objectives.map((g,k)=>{
    // ② is where the witness leaves its tile (the last goal's tile may fall; then ① is the made tile).
    let ends;
    if(g.ends.some(e=>same(e,landings[k])))ends=same(g.ends[1],landings[k])?g.ends:[g.ends[1],g.ends[0]];
    else if(k===2&&flavor!=='reunion')ends=same(g.ends[0],landings[1])?g.ends:[g.ends[1],g.ends[0]];
    else if(k===2)ends=g.ends;
    else throw new Error(pick.id+': landing not on a marker');
    return {ends,target:g.target,hint:hint(flavor,k,ends,landings[k-1])};
  });
  for(const [k,g] of objectives.entries()){
    if(flavor==='reunion'&&k===2){if(!g.ends.every(e=>same(e,landings[0])||same(e,landings[1])))throw new Error(pick.id+': reunion');}
    else if(k>0&&flavor!=='reunion'&&!g.ends.some(e=>same(e,landings[k-1])))throw new Error(pick.id+': goal does not use the made tile');
    if(flavor==='home'&&k>0&&!g.ends.every(e=>objectives[0].ends.some(f=>same(e,f))))throw new Error(pick.id+': not the same places');
  }
  const moves=Math.max(14,draft.witness.length+6,(row.p80??99)+4,row.p90!=null?row.p90+2:0);
  const level={id:pick.id,name:pick.name,focus:pick.focus,refillSeed:draft.refillSeed,moves,grid:draft.grid,objectives};
  const won=rules.replay(level,draft.witness);if(won.outcome!=='won')throw new Error('witness fails '+pick.id);
  // Forgiving: raise the budget by 2 until the ordinary player wins at least 48 of 60 fresh tries.
  let check=screen(level,60,level.moves);
  while(check.wins<48&&level.moves<30){level.moves+=2;check=screen(level,60,level.moves);}
  report.push({id:pick.id,flavor,targets:objectives.map(g=>g.target),witness:draft.witness.length,budget:level.moves,ordinaryAtBudget:`${check.wins}/60`,median:check.median});
  out.push({level,witness:draft.witness});
}
const banner='/* Relay connection puzzles: boards from search.js, finalized by finalize.js. Rules: src/connection-rules.js unchanged. */\n';
fs.writeFileSync(path.join(__dirname,'levels.js'),banner+'window.RelayLevels='+JSON.stringify(out.map(o=>o.level))+';\n');
fs.writeFileSync(path.join(__dirname,'witnesses.json'),JSON.stringify(out.map(o=>({id:o.level.id,actions:o.witness})),null,1)+'\n');
console.log(JSON.stringify(report,null,1));
