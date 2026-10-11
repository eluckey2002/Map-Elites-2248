/* Finite Delivery: move one parcel out through the bottom of its column. Ported from prototypes/archetype-trio/model.js (Delivery only). */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../solver/engine'));
  else root.DeliveryRules=factory(root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(core){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const positive=value=>Number.isSafeInteger(value)&&value>0;
  function create(level){
    if(!level||typeof level.id!=='string'||!level.id||!positive(level.moves)||!Number.isInteger(level.seed)||
      !Array.isArray(level.grid)||!level.grid.length||!Array.isArray(level.grid[0])||!level.grid[0].length||
      !level.grid.every(row=>Array.isArray(row)&&row.length===level.grid[0].length&&row.every(v=>v==='cargo'||positive(v)))||
      level.grid.flat().filter(v=>v==='cargo').length!==1||!Number.isInteger(level.exit)||level.exit<0||level.exit>=level.grid[0].length||
      (level.spawnValues!==undefined&&(!Array.isArray(level.spawnValues)||!level.spawnValues.length||!level.spawnValues.every(positive))))throw new Error('Invalid delivery board');
    return {id:level.id,gridWidth:level.grid[0].length,gridHeight:level.grid.length,
      grid:level.grid.map((row,y)=>row.map((value,x)=>({x,y,value:value==='cargo'?0:value,cargo:value==='cargo',blocker:null}))),
      minChain:3,tileScale:1,score:0,moves:0,maxMoves:level.moves,randomCursor:0,delivered:0,outcome:'playing',last:null};
  }
  function inside(state,x,y){return x>=0&&y>=0&&x<state.gridWidth&&y<state.gridHeight;}
  function valid(state,chain,complete=true){
    if(!Array.isArray(chain)||chain.length<(complete?state.minChain:1))return false;
    const seen=new Set(),tiles=[];
    for(const position of chain){
      if(!Array.isArray(position)||position.length!==2||!position.every(Number.isInteger))return false;
      const [x,y]=position,key=`${x},${y}`,tile=inside(state,x,y)?state.grid[y][x]:null;
      if(!tile||tile.cargo||seen.has(key))return false;
      const previous=tiles.at(-1);
      if(previous&&Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y))!==1)return false;
      if(!core.canExtendChain(tiles,tile))return false;
      seen.add(key);tiles.push(tile);
    }
    return true;
  }
  function settle(state){
    for(let x=0;x<state.gridWidth;x++){
      let dest=state.gridHeight-1;
      for(let y=state.gridHeight-1;y>=0;y--){
        const tile=state.grid[y][x];
        if(!tile)continue;
        if(dest!==y){state.grid[dest][x]=tile;state.grid[y][x]=null;tile.y=dest;}
        dest--;
      }
    }
  }
  function hasMove(state){
    function extend(chain){
      if(chain.length>=state.minChain)return true;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const next=[...chain,[x+dx,y+dy]];
        if(valid(state,next,false)&&extend(next))return true;
      }
      return false;
    }
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)if(valid(state,[[x,y]],false)&&extend([[x,y]]))return true;
    return false;
  }
  function move(level,input,chain){
    if(input.outcome!=='playing')throw new Error('Game has finished');
    if(!valid(input,chain))throw new Error('Invalid chain');
    const state=copy(input);
    const tiles=chain.map(([x,y])=>state.grid[y][x]),survivor=tiles.at(-1);
    const points=core.executeChain(state,tiles);
    settle(state);
    if(state.grid[state.gridHeight-1][level.exit]?.cargo){state.grid[state.gridHeight-1][level.exit]=null;state.delivered++;settle(state);}
    const random=core.makeRng(level.seed);
    for(let i=0;i<state.randomCursor;i++)random();
    const refill=[];
    for(let x=0;x<state.gridWidth;x++)for(let y=0;y<state.gridHeight;y++){
      if(state.grid[y][x])continue;
      const draw=random();state.randomCursor++;
      const value=level.spawnValues?level.spawnValues[Math.floor(draw*level.spawnValues.length)]:draw<0.6?2:draw<0.9?4:8;
      state.grid[y][x]={x,y,value,cargo:false,blocker:null};refill.push({x,y,value});
    }
    state.outcome=state.delivered>0?'won':state.moves>=state.maxMoves?'out-of-moves':!hasMove(state)?'no-chains':'playing';
    state.last={points,landing:{x:survivor.x,y:survivor.y,value:survivor.value},delivered:state.delivered-input.delivered,refill};
    return state;
  }
  function preview(level,state,chain){return valid(state,chain)&&state.outcome==='playing'?move(level,state,chain):null;}
  function parcel(state){
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)if(state.grid[y][x]?.cargo)return {x,y,rowsToGo:state.gridHeight-1-y};
    return null;
  }
  function replay(level,actions){
    let state=create(level);const history=[];
    if(!Array.isArray(actions)||actions.length>300)throw new Error('Invalid action list');
    for(const action of actions){
      if(action?.type==='move'){history.push(state);state=move(level,state,action.chain);}
      else if(action?.type==='undo'&&history.length)state=history.pop();
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {create,valid,move,preview,parcel,hasMove,replay};
});
