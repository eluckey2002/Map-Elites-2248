/* Local pack qualification and bounded shortcut inspection, not a difficulty bot. */
const fs=require('node:fs');
const path=require('node:path');
const rules=require('../src/connection-rules');
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
function findGoal(state,goal=state.objective,maxNodes=20000){
  let nodes=0,truncated=false,found=null;
  function walk(chain,total,end){
    if(nodes>=maxNodes){truncated=true;return;}nodes++;
    if(total>goal.target)return;
    const last=chain.at(-1);
    if(same(last,end)){
      if(total===goal.target&&rules.valid(state,chain))found=chain;
      return;
    }
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const next=[...chain,[last[0]+dx,last[1]+dy]];
      if(rules.valid(state,next,false))walk(next,total+state.grid[last[1]+dy][last[0]+dx].value,end);
      if(found||truncated)return;
    }
  }
  for(const [start,end] of [goal.ends,[...goal.ends].reverse()]){
    walk([start],state.grid[start[1]][start[0]].value,end);
    if(found||truncated)break;
  }
  return {status:found?'FOUND':truncated?'UNKNOWN':'NONE',chain:found,nodes};
}
function qualify(levels,witnesses){
  if(!Array.isArray(levels)||levels.length!==3||new Set(levels.map(level=>level.id)).size!==3)throw new Error('Missing or invalid catalog');
  if(!Array.isArray(witnesses)||witnesses.length!==levels.length)throw new Error('Missing witnesses');
  return levels.map(level=>{
    rules.create(level);
    if(level.objectives.length!==3||level.objectives.some(goal=>Math.max(Math.abs(goal.ends[0][0]-goal.ends[1][0]),Math.abs(goal.ends[0][1]-goal.ends[1][1]))<2))throw new Error('Invalid goal sequence');
    const witness=witnesses.find(entry=>entry.id===level.id);
    if(!witness||!Array.isArray(witness.actions)||witness.actions.some(action=>!['move','remove'].includes(action.type)))throw new Error('Invalid witness');
    const state=rules.replay(level,witness.actions);
    if(state.outcome!=='won'||state.completed!==3||state.moves>level.moves)throw new Error('Witness does not finish level');
    return {id:level.id,outcome:state.outcome,moves:state.moves,budget:level.moves,
      removals:witness.actions.filter(action=>action.type==='remove').length};
  });
}
function shortcutReport(level,{maxStates=1000,maxChainNodes=20000}={}){
  const start=rules.create(level);let states=1,truncated=false,found=null;
  // Search the FIRST goal, not the whole three-goal level (which cannot finish in two moves by construction).
  const direct=findGoal(start,start.objective,maxChainNodes);truncated||=direct.status==='UNKNOWN';
  if(direct.chain)found=[{type:'move',chain:direct.chain}];
  const scan=rules.enumerateChains(start,maxChainNodes);truncated||=scan.truncated;
  for(const chain of scan.chains){
    if(found)break;
    if(states>=maxStates){truncated=true;break;}states++;
    const next=rules.move(start,chain);
    if(next.outcome!=='playing')continue;
    const finish=findGoal(next,next.objective,maxChainNodes);truncated||=finish.status==='UNKNOWN';
    if(finish.chain)found=[{type:'move',chain},{type:'move',chain:finish.chain}];
  }
  return {id:level.id,openingObjective:1,depth:2,states,maxStates,maxChainNodes,status:found?'FOUND':truncated?'UNKNOWN':'NONE_WITHIN_BOUND',
    witness:found,humanDifficulty:'unmeasured'};
}
if(require.main===module){
  const argument=process.argv.indexOf('--witnesses');
  const file=argument>=0?process.argv[argument+1]:path.resolve(__dirname,'../docs/game-design/levels/connection-pack/witnesses.json');
  const levels=require('../src/connection-levels');
  const witnesses=JSON.parse(fs.readFileSync(file,'utf8'));
  console.log(JSON.stringify({feasibility:qualify(levels,witnesses),shortcuts:levels.map(level=>shortcutReport(level))},null,2));
}
module.exports={findGoal,qualify,shortcutReport};
