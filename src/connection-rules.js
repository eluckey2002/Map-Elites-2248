/* Finite Connections: objectives observe normal chains; they do not restrict play. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../solver/engine'));
  else root.ConnectionRules=factory(root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(core){
  'use strict';
  const VALUES=Object.freeze([2,4,8,16,32,64,128]);
  const THRESHOLD=2048,CAPACITY=3;
  const copy=value=>JSON.parse(JSON.stringify(value));
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  const positive=value=>Number.isSafeInteger(value)&&value>0;
  function positionValid(state,position){
    return Array.isArray(position)&&position.length===2&&position.every(Number.isInteger)&&
      position[0]>=0&&position[0]<state.gridWidth&&position[1]>=0&&position[1]<state.gridHeight;
  }
  function create(level){
    if(!level||typeof level.id!=='string'||!level.id||!positive(level.moves)||
      !Number.isInteger(level.refillSeed)||!Array.isArray(level.grid)||!level.grid.length||
      !Array.isArray(level.grid[0])||!level.grid[0].length||
      !level.grid.every(row=>Array.isArray(row)&&row.length===level.grid[0].length&&row.every(positive))||
      !Array.isArray(level.objectives)||!level.objectives.length)throw new Error('Invalid puzzle');
    const state={id:level.id,gridWidth:level.grid[0].length,gridHeight:level.grid.length,
      grid:level.grid.map((row,y)=>row.map((value,x)=>({x,y,value,cargo:false,blocker:null}))),
      minChain:3,tileScale:1,score:0,moves:0,maxMoves:level.moves,refillSeed:level.refillSeed,
      randomCursor:0,charges:0,completed:0,objectives:copy(level.objectives),
      objective:copy(level.objectives[0]),outcome:'playing',last:null};
    if(!state.objectives.every(goal=>goal&&positive(goal.target)&&Array.isArray(goal.ends)&&
      goal.ends.length===2&&goal.ends.every(p=>positionValid(state,p))&&!same(...goal.ends)))throw new Error('Invalid objective');
    return finish(state);
  }
  function valid(state,chain,complete=true){
    if(!Array.isArray(chain)||chain.length<(complete?state.minChain:1))return false;
    const seen=new Set(),tiles=[];
    for(const position of chain){
      if(!positionValid(state,position))return false;
      const [x,y]=position,key=`${x},${y}`,tile=state.grid[y][x],previous=tiles.at(-1);
      if(!tile||seen.has(key)||
        (previous&&Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y))!==1)||
        !core.canExtendChain(tiles,tile))return false;
      seen.add(key);tiles.push(tile);
    }
    return true;
  }
  function hasMove(state){
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++){
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const pair=[[x,y],[x+dx,y+dy]];
        if(!valid(state,pair,false))continue;
        for(let ey=-1;ey<=1;ey++)for(let ex=-1;ex<=1;ex++){
          if(valid(state,[...pair,[x+dx+ex,y+dy+ey]]))return true;
        }
      }
    }
    return false;
  }
  function matches(state,chain,goal=state.objective){
    if(!goal||!valid(state,chain))return false;
    const [a,b]=goal.ends,first=chain[0],last=chain.at(-1);
    return ((same(first,a)&&same(last,b))||(same(first,b)&&same(last,a)))&&
      chain.reduce((total,[x,y])=>total+state.grid[y][x].value,0)===goal.target;
  }
  function finish(state){
    state.objective=state.completed<state.objectives.length?copy(state.objectives[state.completed]):null;
    state.outcome=!state.objective?'won':state.moves>=state.maxMoves||(!hasMove(state)&&!state.charges)?'lost':'playing';
    return state;
  }
  function refill(state){
    core.applyGravity(state);
    const random=core.makeRng(state.refillSeed),spawned=[];
    for(let i=0;i<state.randomCursor;i++)random();
    for(let x=0;x<state.gridWidth;x++)for(let y=0;y<state.gridHeight;y++){
      if(state.grid[y][x])continue;
      const value=VALUES[Math.floor(random()*VALUES.length)];state.randomCursor++;
      state.grid[y][x]={x,y,value,cargo:false,blocker:null};spawned.push({x,y,value});
    }
    return spawned;
  }
  function move(state,chain){
    if(state.outcome!=='playing'||state.moves>=state.maxMoves)throw new Error('Attempt has finished');
    if(!valid(state,chain))throw new Error('Invalid chain');
    const completed=matches(state,chain),next=copy(state);
    const tiles=chain.map(([x,y])=>next.grid[y][x]),survivor=tiles.at(-1);
    const points=core.executeChain(next,tiles),spawned=refill(next);
    const qualifies=survivor.value>=THRESHOLD,earned=qualifies&&next.charges<CAPACITY;
    if(earned)next.charges++;
    if(completed)next.completed++;
    next.last={type:'move',points,landing:{x:survivor.x,y:survivor.y,value:survivor.value},
      refill:spawned,completedObjective:completed?copy(state.objective):null,
      powerupEarned:earned,powerupFull:qualifies&&!earned};
    return finish(next);
  }
  function canRemove(state,position){
    return state.outcome==='playing'&&state.moves<state.maxMoves&&state.charges>0&&
      positionValid(state,position)&&Boolean(state.grid[position[1]][position[0]]);
  }
  function remove(state,position){
    if(!canRemove(state,position))throw new Error('Invalid removal');
    const next=copy(state),[x,y]=position,value=next.grid[y][x].value;
    next.grid[y][x]=null;next.charges--;next.moves++;
    next.last={type:'remove',removed:{x,y,value},points:0,refill:refill(next),completedObjective:null};
    return finish(next);
  }
  function replay(level,actions){
    if(!Array.isArray(actions)||actions.length>2000)throw new Error('Invalid action list');
    let state=create(level);const history=[];
    for(const action of actions){
      if(!action||typeof action!=='object')throw new Error('Invalid action');
      if(action.type==='undo'){
        if(!history.length)throw new Error('Nothing to undo');
        state=history.pop();continue;
      }
      history.push(state);
      if(action.type==='move')state=move(state,action.chain);
      else if(action.type==='remove')state=remove(state,action.position);
      else throw new Error('Invalid action');
    }
    return state;
  }
  function enumerateChains(state,maxNodes=10000,maxLength=state.gridWidth*state.gridHeight){
    const chains=[];let nodes=0,truncated=false;
    function walk(chain){
      if(nodes>=maxNodes){truncated=true;return;}
      nodes++;
      if(chain.length>=state.minChain)chains.push(chain);
      if(chain.length>=maxLength)return;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const next=[...chain,[x+dx,y+dy]];
        if(valid(state,next,false))walk(next);
        if(truncated)return;
      }
    }
    for(let y=0;y<state.gridHeight&&!truncated;y++)for(let x=0;x<state.gridWidth&&!truncated;x++)walk([[x,y]]);
    return {chains,nodes,truncated};
  }
  return {VALUES,THRESHOLD,CAPACITY,create,valid,hasMove,matches,move,preview:move,canRemove,remove,replay,enumerateChains};
});
