/* Turns chosen drafts into levels.js: plain hints, move budgets, then re-screens each board
   at its budget (same policy seed as the search; not held out). ① is the marker that follows a made tile (relay-play.js).
   Usage: node finalize.js <drafts.jsonl> */
const fs=require('node:fs'),path=require('node:path');
const relay=require('./relay-play');
const {screen}=require('./search');
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const GROW='Each tile you make starts the next connection';
const MEET='Your first two tiles meet in the last connection';
const CHOSEN=[
  {flavor:'reunion',seed:5101,id:'bring-them-together',name:'Bring Them Together',focus:MEET},
  {flavor:'reunion',seed:8120,id:'meet-in-the-middle',name:'Meet in the Middle',focus:MEET},
  {flavor:'reunion',seed:8243,id:'big-finish',name:'Big Finish',focus:MEET},
  {flavor:'relay',seed:8055,id:'keep-growing',name:'Keep Growing',focus:GROW},
  {flavor:'relay',seed:7071,id:'ladder-up',name:'Ladder Up',focus:GROW},
  {flavor:'relay',seed:5116,id:'climb-high',name:'Climb High',focus:GROW},
];
// Hints name only the dependency; ① moves with the tile it sits on.
function hint(flavor,k){
  if(flavor==='reunion')return k===2?'① and ② are the tiles your first two connections made. They move if their tiles fall.':
    k===0?'Keep the tile you make. The last connection needs it.':'New places. Keep this tile too.';
  if(k===0)return flavor==='home'?'The tile you make here starts the next connection.':'The tile you make starts the next connection.';
  const where=flavor==='home'?'; ② is the other place from before':'';
  return `① is the tile you just made${where}. It moves if that tile falls.${k<2?' The new tile starts the next one.':''}`;
}
const rows=fs.readFileSync(process.argv[2],'utf8').trim().split('\n').map(JSON.parse);
const out=[],report=[];
for(const pick of CHOSEN){
  const row=rows.find(r=>r.seed===pick.seed&&r.flavor===pick.flavor);if(!row)throw new Error('missing '+pick.seed);
  const draft=row.level,flavor=row.flavor;
  const objectives=draft.objectives.map((g,k)=>({ends:g.ends,target:g.target,follow:g.follow,hint:hint(flavor,k)}));
  // Along the witness: every linked marker sits on its made tile, and no marked tile is already as big as its target when the goal appears.
  {const probe={id:'x',moves:99,refillSeed:draft.refillSeed,grid:draft.grid,objectives};let t=relay.create(probe);
   const look=issued=>{const g=t.objective;if(!g)return;
     if(issued&&g.ends.some(([x,y])=>t.grid[y][x].value>=g.target))throw new Error(pick.id+': a marked tile is already as big as the target');
     for(const link of g.follow)if(!same(g.ends[link.end],t.relay.made[link.made].at))throw new Error(pick.id+': marker off its tile');};
   look(true);for(const a of draft.witness){const before=t.completed;t=relay.move(t,a.chain);look(t.completed>before);}
   if(t.outcome!=='won')throw new Error('witness fails '+pick.id);}
  const expected={relay:[0,1,1],home:[0,1,1],reunion:[0,0,2]}[flavor];
  if(!objectives.every((g,k)=>g.follow.length===expected[k]))throw new Error(pick.id+': links');
  const moves=Math.max(14,draft.witness.length+6,(row.p80??99)+4,row.p90!=null?row.p90+2:0);
  const level={id:pick.id,name:pick.name,focus:pick.focus,refillSeed:draft.refillSeed,moves,grid:draft.grid,objectives};
  const won=relay.replay(level,draft.witness);if(won.outcome!=='won')throw new Error('witness fails '+pick.id);
  // Budget rule: raise it by 2 until the ordinary player wins at least 48 of 60 tries.
  let check=screen(level,60,level.moves);
  while(check.wins<48&&level.moves<30){level.moves+=2;check=screen(level,60,level.moves);}
  report.push({id:pick.id,flavor,targets:objectives.map(g=>g.target),witness:draft.witness.length,budget:level.moves,ordinaryAtBudget:`${check.wins}/60`,median:check.median});
  out.push({level,witness:draft.witness});
}
const banner='/* Relay connection puzzles: boards from search.js, finalized by finalize.js. Rules: src/connection-rules.js unchanged. */\n';
fs.writeFileSync(path.join(__dirname,'levels.js'),banner+'window.RelayLevels='+JSON.stringify(out.map(o=>o.level))+';\n');
fs.writeFileSync(path.join(__dirname,'witnesses.json'),JSON.stringify(out.map(o=>({id:o.level.id,actions:o.witness})),null,1)+'\n');
console.log(JSON.stringify(report,null,1));
