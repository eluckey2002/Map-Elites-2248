/* Recipe: win by making an exact tile from one kind of ingredient, e.g. a 512 from only 128s.
   Chain, merge, gravity and refill follow the Delivery pack (src/delivery-rules.js); the parcel is replaced by orders. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../solver/engine'));
  else root.RecipeRules=factory(root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(core){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const positive=value=>Number.isSafeInteger(value)&&value>0;
  const MIN_CHAIN=3;
  function checkLevel(level){
    const ok=level&&typeof level.id==='string'&&level.id&&positive(level.moves)&&Number.isInteger(level.seed)&&
      Array.isArray(level.grid)&&level.grid.length&&Array.isArray(level.grid[0])&&level.grid[0].length&&
      level.grid.every(row=>Array.isArray(row)&&row.length===level.grid[0].length&&row.every(positive))&&
      Array.isArray(level.spawnValues)&&level.spawnValues.length&&level.spawnValues.every(positive)&&
      Array.isArray(level.orders)&&level.orders.length&&level.orders.every(o=>positive(o.make)&&positive(o.from)&&o.make%o.from===0&&o.make/o.from>=MIN_CHAIN);
    if(!ok)throw new Error('Invalid recipe board');
  }
  function create(level){
    checkLevel(level);
    return {id:level.id,gridWidth:level.grid[0].length,gridHeight:level.grid.length,
      grid:level.grid.map((row,y)=>row.map((value,x)=>({x,y,value,blocker:null}))),
      minChain:MIN_CHAIN,tileScale:1,score:0,moves:0,maxMoves:level.moves,randomCursor:0,
      done:level.orders.map(()=>false),outcome:'playing',last:null};
  }
  function inside(state,x,y){return x>=0&&y>=0&&x<state.gridWidth&&y<state.gridHeight;}
  function valid(state,chain,complete=true){
    if(!Array.isArray(chain)||chain.length<(complete?state.minChain:1))return false;
    const seen=new Set(),tiles=[];
    for(const position of chain){
      if(!Array.isArray(position)||position.length!==2||!position.every(Number.isInteger))return false;
      const [x,y]=position,key=`${x},${y}`,tile=inside(state,x,y)?state.grid[y][x]:null;
      if(!tile||seen.has(key))return false;
      const previous=tiles.at(-1);
      if(previous&&Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y))!==1)return false;
      if(!core.canExtendChain(tiles,tile))return false;
      seen.add(key);tiles.push(tile);
    }
    return true;
  }
  // Which unfinished order (index) this chain completes, or -1. Every tile must be the ingredient and the sum exact.
  function completes(level,state,chain){
    const values=chain.map(([x,y])=>state.grid[y][x].value),sum=values.reduce((a,b)=>a+b,0);
    return level.orders.findIndex((o,i)=>!state.done[i]&&sum===o.make&&values.every(v=>v===o.from));
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
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)if(extend([[x,y]]))return true;
    return false;
  }
  function move(level,input,chain){
    if(input.outcome!=='playing')throw new Error('Game has finished');
    if(!valid(input,chain))throw new Error('Invalid chain');
    const order=completes(level,input,chain);
    const state=copy(input);
    const tiles=chain.map(([x,y])=>state.grid[y][x]),survivor=tiles.at(-1);
    const points=core.executeChain(state,tiles);
    if(order>=0)state.done[order]=true;
    settle(state);
    const random=core.makeRng(level.seed);
    for(let i=0;i<state.randomCursor;i++)random();
    const refill=[];
    for(let x=0;x<state.gridWidth;x++)for(let y=0;y<state.gridHeight;y++){
      if(state.grid[y][x])continue;
      const draw=random();state.randomCursor++;
      const value=level.spawnValues[Math.floor(draw*level.spawnValues.length)];
      state.grid[y][x]={x,y,value,blocker:null};refill.push({x,y,value});
    }
    state.outcome=state.done.every(Boolean)?'won':state.moves>=state.maxMoves?'out-of-moves':!hasMove(state)?'no-chains':'playing';
    state.last={points,order,landing:{x:survivor.x,y:survivor.y,value:survivor.value},refill};
    return state;
  }
  function preview(level,state,chain){return valid(state,chain)&&state.outcome==='playing'?move(level,state,chain):null;}
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
  // Calls visit(chain, tiles) for every legal chain path of minChain..maxLength tiles, in a fixed order. The arrays are
  // reused by the walk, so a visitor that keeps a chain must copy it.
  function eachChain(state,maxLength,visit){
    function dfs(chain,tiles){
      if(chain.length>=state.minChain)visit(chain,tiles);
      if(chain.length>=maxLength)return;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if((!dx&&!dy)||!inside(state,nx,ny)||chain.some(([cx,cy])=>cx===nx&&cy===ny))continue;
        const tile=state.grid[ny][nx];
        if(!core.canExtendChain(tiles,tile))continue;
        chain.push([nx,ny]);tiles.push(tile);dfs(chain,tiles);chain.pop();tiles.pop();
      }
    }
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)dfs([[x,y]],[state.grid[y][x]]);
  }
  // Every distinct legal chain (distinct by cell set and end cell), up to maxLength tiles.
  function chains(state,maxLength=8){
    const out=[],seen=new Set();
    eachChain(state,maxLength,chain=>{
      const key=chain.slice(0,-1).map(p=>p.join(',')).sort().join(' ')+'>'+chain.at(-1).join(',');
      if(!seen.has(key)){seen.add(key);out.push(chain.map(p=>[...p]));}
    });
    return out;
  }
  return {create,valid,completes,move,preview,hasMove,replay,eachChain,chains,MIN_CHAIN};
});
