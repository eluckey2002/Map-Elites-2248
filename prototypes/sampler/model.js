/* Kinds sampler: one rules module for five candidate level kinds from the archetype research
   (level-archetypes files 04, 09, 09b, 10, 11). Chain legality, sum-on-last-tile and gravity follow the Recipe
   prototype (prototypes/recipe/model.js). Each board has one goal and at most one twist:
     goal.type 'orders'   Recipe orders; an order with `at` counts only if its chain ends on that cell. With `parts` (v2)
                          orders fill in turn, the tile each order makes becomes a part, each later order's chain must
                          include at least one part (any part), and a fill that would leave more than MAX_PARTS parts on
                          the board is not allowed. With `parts` and `anyOrder` (v3 Feed the Next — Advanced, proposed)
                          orders fill in any order, every fill makes a part, an order's chain must include `o.parts`
                          parts (default 0), and the MAX_PARTS cap still refuses a fill that would make a third part.
                          `goal.cap` overrides MAX_PARTS (screening only: search.js removes the cap to test it binds).
     goal.type 'exact'    make one tile of exactly goal.make (any values).
     goal.type 'leftover' end with at most goal.max tiles on the board.
     goal.type 'connect'  one chain must include every cell in goal.marks.
     goal.type 'relay'    make exactly stages[0], then exactly stages[1], ... in order; each later chain must use the
                          tile the previous stage made.
     forecast: true       each column has its own refill queue; the page shows the next tile above each column.
     refill: false        no refills (The Drought); empty cells stay empty.
     boss: {title, text}  a boss board: the page announces it before the first move.
     stone: [[x,y],...]   walls: no tile, nothing falls through, nothing chains across a diagonal between two walls.
     gate: {at, sum}      a wall cell that opens once a chain whose sum is at least `sum` ends touching it. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../solver/engine'));
  else root.SamplerRules=factory(root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(core){
  'use strict';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const positive=value=>Number.isSafeInteger(value)&&value>0;
  const MIN_CHAIN=3,MAX_PARTS=2;
  const GOALS=['orders','exact','leftover','connect','relay'];
  function checkLevel(level){
    const g=level&&level.goal,h=level&&Array.isArray(level.grid)?level.grid.length:0,w=h&&Array.isArray(level.grid[0])?level.grid[0].length:0;
    const cell=p=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&Number.isInteger(p[1])&&p[0]>=0&&p[1]>=0&&p[0]<w&&p[1]<h;
    const stone=new Set((level&&level.stone||[]).map(p=>String(p)));
    const ok=typeof level.id==='string'&&level.id&&positive(level.moves)&&Number.isInteger(level.seed)&&w&&
      level.grid.every((row,y)=>Array.isArray(row)&&row.length===w&&row.every((v,x)=>stone.has(x+','+y)?v===0:positive(v)))&&
      Array.isArray(level.spawnValues)&&level.spawnValues.length&&level.spawnValues.every(positive)&&
      g&&GOALS.includes(g.type)&&
      (g.type!=='orders'||Array.isArray(g.orders)&&g.orders.length&&g.orders.every(o=>positive(o.make)&&positive(o.from)&&
        o.make%o.from===0&&o.make/o.from>=MIN_CHAIN&&(o.parts===undefined||Number.isInteger(o.parts)&&o.parts>=0)&&(o.at===undefined||cell(o.at)&&!stone.has(String(o.at)))))&&
      (g.type!=='exact'||positive(g.make))&&(g.type!=='leftover'||positive(g.max))&&
      (g.type!=='connect'||Array.isArray(g.marks)&&g.marks.length>=2&&g.marks.every(p=>cell(p)&&!stone.has(String(p))))&&
      (g.type!=='relay'||Array.isArray(g.stages)&&g.stages.length>1&&g.stages.every(positive))&&
      (level.gate===undefined||cell(level.gate.at)&&stone.has(String(level.gate.at))&&positive(level.gate.sum))&&
      (level.stone===undefined||Array.isArray(level.stone)&&level.stone.every(cell))&&
      // Rust was retired in v3 (PDL-040); a board that still asks for it is refused rather than silently ignored.
      level.rust===undefined&&!(g&&g.feeds);
    if(!ok)throw new Error('Invalid sampler board');
  }
  function create(level){
    checkLevel(level);
    const stone=new Set((level.stone||[]).map(String));
    return {id:level.id,gridWidth:level.grid[0].length,gridHeight:level.grid.length,
      grid:level.grid.map((row,y)=>row.map((value,x)=>stone.has(x+','+y)?null:{x,y,value,blocker:null})),
      stone:[...stone],minChain:MIN_CHAIN,tileScale:1,score:0,moves:0,maxMoves:level.moves,
      randomCursor:0,columnCursor:level.grid[0].map(()=>0),
      done:Array(level.goal.type==='orders'?level.goal.orders.length:level.goal.type==='relay'?level.goal.stages.length:1).fill(false),
      gateOpen:false,outcome:'playing',last:null};
  }
  function inside(state,x,y){return x>=0&&y>=0&&x<state.gridWidth&&y<state.gridHeight;}
  const isStone=(state,x,y)=>state.stone.includes(x+','+y);
  const usable=tile=>!!tile;
  // A diagonal step is blocked when both cells it squeezes between are stone.
  const stepOpen=(state,ax,ay,bx,by)=>ax===bx||ay===by||!(isStone(state,ax,by)&&isStone(state,bx,ay));
  function valid(state,chain,complete=true){
    if(!Array.isArray(chain)||chain.length<(complete?state.minChain:1))return false;
    const seen=new Set(),tiles=[];
    for(const position of chain){
      if(!Array.isArray(position)||position.length!==2||!position.every(Number.isInteger))return false;
      const [x,y]=position,key=`${x},${y}`,tile=inside(state,x,y)?state.grid[y][x]:null;
      if(!usable(tile)||seen.has(key))return false;
      const previous=tiles.at(-1);
      if(previous&&(Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y))!==1||!stepOpen(state,previous.x,previous.y,x,y)))return false;
      if(!core.canExtendChain(tiles,tile))return false;
      seen.add(key);tiles.push(tile);
    }
    return true;
  }
  // Which unfinished order (index) this chain completes, or -1.
  function completes(level,state,chain){
    if(level.goal.type!=='orders')return -1;
    const values=chain.map(([x,y])=>state.grid[y][x].value),sum=values.reduce((a,b)=>a+b,0),[ex,ey]=chain.at(-1);
    // The first unfinished order this chain fills, all rules included (two orders can share a recipe).
    return level.goal.orders.findIndex((o,i)=>!state.done[i]&&inTurn(level,state,i)&&sum===o.make&&values.every(v=>v===o.from)&&
      (!o.at||o.at[0]===ex&&o.at[1]===ey)&&partsOk(level,state,chain,i));
  }
  // `oneAtATime` boards (Make It Here) fill their orders strictly in list order, the same as the page shows them.
  const inTurn=(level,state,i)=>!level.oneAtATime||state.done.indexOf(false)===i;
  const isPart=t=>!!t&&!!t.made;
  function partCount(state){let n=0;for(const row of state.grid)for(const t of row)if(isPart(t))n++;return n;}
  // How many parts the board would hold after this chain fills an order: the chain's parts merge away, its last tile
  // becomes a part.
  const partsAfter=(state,chain)=>partCount(state)-chain.filter(([x,y])=>isPart(state.grid[y][x])).length+1;
  // How many parts order i's chain must include: `o.parts` when given; otherwise one for every order after the first
  // (in-turn parts), none with `anyOrder`.
  const partsNeeded=(level,i)=>{const o=level.goal.orders[i];return o.parts!==undefined?o.parts:level.goal.anyOrder||i===0?0:1;};
  const partsIn=(state,chain)=>chain.filter(([x,y])=>isPart(state.grid[y][x])).length;
  // With `parts`: orders fill in turn (unless `anyOrder`); the chain includes the parts it needs; at most MAX_PARTS
  // parts at once.
  function partsOk(level,state,chain,i){
    if(!level.goal.parts)return true;
    const g=level.goal,cap=g.cap===undefined?MAX_PARTS:g.cap;
    // `strictTurn` is a screening flag only (search.js): an any-order board played strictly in list order.
    return (g.anyOrder&&!g.strictTurn||state.done.indexOf(false)===i)&&partsIn(state,chain)>=partsNeeded(level,i)&&partsAfter(state,chain)<=cap;
  }
  // The same check ignoring the marked cell, so the page can say "right recipe, wrong spot".
  function recipeOnly(level,state,chain){
    if(level.goal.type!=='orders')return -1;
    const values=chain.map(([x,y])=>state.grid[y][x].value),sum=values.reduce((a,b)=>a+b,0);
    return level.goal.orders.findIndex((o,i)=>!state.done[i]&&inTurn(level,state,i)&&sum===o.make&&values.every(v=>v===o.from));
  }
  // The relay stage this chain completes, or -1: its sum is the stage's target and, after the first stage, it uses the
  // tile the previous stage made.
  function relayStage(level,state,chain){
    if(level.goal.type!=='relay')return -1;
    const i=state.done.indexOf(false);if(i<0)return -1;
    const sum=chain.reduce((a,[x,y])=>a+state.grid[y][x].value,0);
    if(sum!==level.goal.stages[i])return -1;
    return i===0||chain.some(([x,y])=>state.grid[y][x].made)?i:-1;
  }
  const connects=(level,chain)=>level.goal.type==='connect'&&level.goal.marks.every(([mx,my])=>chain.some(([x,y])=>x===mx&&y===my));
  function tileCount(state){let n=0;for(const row of state.grid)for(const t of row)if(t)n++;return n;}
  function goalMet(level,state){return level.goal.type==='leftover'?tileCount(state)<=level.goal.max:state.done.every(Boolean);}
  // Gravity inside each stone-bounded stretch of a column.
  function settle(state){
    for(let x=0;x<state.gridWidth;x++){
      let dest=state.gridHeight-1;
      for(let y=state.gridHeight-1;y>=0;y--){
        if(isStone(state,x,y)){dest=y-1;continue;}
        const tile=state.grid[y][x];
        if(!tile)continue;
        if(dest!==y){state.grid[dest][x]=tile;state.grid[y][x]=null;tile.y=dest;}
        dest--;
      }
    }
  }
  const columnRng=(level,x)=>core.makeRng(level.seed*1009+x*7+1);
  // The next n refill values for column x, nearest first: the first one fills the lowest empty cell.
  function upcoming(level,state,x,n){
    const random=columnRng(level,x);
    for(let i=0;i<state.columnCursor[x];i++)random();
    return Array.from({length:n},()=>level.spawnValues[Math.floor(random()*level.spawnValues.length)]);
  }
  function refill(level,state){
    const placed=[],put=(x,y,value)=>{state.grid[y][x]={x,y,value,blocker:null};placed.push({x,y,value});};
    if(level.refill===false)return placed;
    if(level.forecast){
      for(let x=0;x<state.gridWidth;x++){
        const empty=[];for(let y=state.gridHeight-1;y>=0;y--)if(!state.grid[y][x]&&!isStone(state,x,y))empty.push(y);
        const values=upcoming(level,state,x,empty.length);state.columnCursor[x]+=empty.length;
        empty.forEach((y,i)=>put(x,y,values[i]));
      }
      return placed;
    }
    const random=core.makeRng(level.seed);
    for(let i=0;i<state.randomCursor;i++)random();
    for(let x=0;x<state.gridWidth;x++)for(let y=0;y<state.gridHeight;y++){
      if(state.grid[y][x]||isStone(state,x,y))continue;
      put(x,y,level.spawnValues[Math.floor(random()*level.spawnValues.length)]);state.randomCursor++;
    }
    return placed;
  }
  const opensGate=(level,sum)=>!!level.gate&&sum>=level.gate.sum;
  function hasMove(state){
    let found=false;
    eachChain(state,state.minChain,()=>{found=true;return true;});
    return found;
  }
  function move(level,input,chain){
    if(input.outcome!=='playing')throw new Error('Game has finished');
    if(!valid(input,chain))throw new Error('Invalid chain');
    const order=completes(level,input,chain),linked=connects(level,chain),stage=relayStage(level,input,chain);
    const state=copy(input);
    const tiles=chain.map(([x,y])=>state.grid[y][x]),survivor=tiles.at(-1);
    const sum=tiles.reduce((a,t)=>a+t.value,0);
    const points=core.executeChain(state,tiles);
    tiles.forEach(t=>{delete t.made;});
    if(stage>=0){state.done[stage]=true;survivor.made=true;}
    if(order>=0){state.done[order]=true;if(level.goal.parts)survivor.made=true;}
    if(linked)state.done[0]=true;
    if(level.goal.type==='exact'&&survivor.value===level.goal.make)state.done[0]=true;
    const touches=(x,y)=>Math.max(Math.abs(survivor.x-x),Math.abs(survivor.y-y))===1;
    let opened=false;
    if(level.gate&&!state.gateOpen&&opensGate(level,sum)&&touches(...level.gate.at)){
      state.gateOpen=true;opened=true;state.stone=state.stone.filter(k=>k!==String(level.gate.at));
    }
    settle(state);
    const placed=refill(level,state);
    if(level.goal.type==='leftover')state.done[0]=goalMet(level,state);
    state.outcome=goalMet(level,state)?'won':state.moves>=state.maxMoves?'out-of-moves':!hasMove(state)?'no-chains':'playing';
    state.last={points,order,stage,opened,landing:{x:survivor.x,y:survivor.y,value:survivor.value},refill:placed};
    return state;
  }
  function preview(level,state,chain){return valid(state,chain)&&state.outcome==='playing'?move(level,state,chain):null;}
  function replay(level,actions){
    let state=create(level);const history=[];
    if(!Array.isArray(actions)||actions.length>1000)throw new Error('Invalid action list');
    for(const action of actions){
      if(action?.type==='move'){history.push(state);state=move(level,state,action.chain);}
      else if(action?.type==='undo'&&history.length)state=history.pop();
      else if(action?.type==='preview')continue;
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  // Calls visit(chain, tiles) for every legal chain path of minChain..maxLength tiles, in a fixed order; a visitor that
  // returns true stops the walk. The arrays are reused, so a visitor that keeps a chain must copy it.
  function eachChain(state,maxLength,visit){
    let stop=false;
    function dfs(chain,tiles){
      if(chain.length>=state.minChain&&visit(chain,tiles)){stop=true;return;}
      if(chain.length>=maxLength)return;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1&&!stop;dy++)for(let dx=-1;dx<=1&&!stop;dx++){
        const nx=x+dx,ny=y+dy;
        if((!dx&&!dy)||!inside(state,nx,ny)||!stepOpen(state,x,y,nx,ny)||chain.some(([cx,cy])=>cx===nx&&cy===ny))continue;
        const tile=state.grid[ny][nx];
        if(!usable(tile)||!core.canExtendChain(tiles,tile))continue;
        chain.push([nx,ny]);tiles.push(tile);dfs(chain,tiles);chain.pop();tiles.pop();
      }
    }
    for(let y=0;y<state.gridHeight&&!stop;y++)for(let x=0;x<state.gridWidth&&!stop;x++){
      const tile=state.grid[y][x];if(usable(tile))dfs([[x,y]],[tile]);
    }
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
  // Every distinct legal chain whose sum is exactly `target` (distinct by cell set and end cell), any length. Walks
  // backwards from each end tile: a chain never goes down in value, so going backwards each tile is equal to or half
  // the one after it, and the running sum bounds the walk. Used by the exhaustive short-win check in search.js.
  function chainsWithSum(state,target){
    const out=[],seen=new Set(),path=[];let sum=0;
    function back(){
      const cur=path.at(-1),ct=state.grid[cur[1]][cur[0]];
      if(path.length>=state.minChain&&sum===target){
        const second=state.grid[path.at(-2)[1]][path.at(-2)[0]];
        if(ct.value===second.value){
          const chain=path.slice().reverse(),key=chain.slice(0,-1).map(p=>p.join(',')).sort().join(' ')+'>'+chain.at(-1).join(',');
          if(!seen.has(key)){seen.add(key);out.push(chain);}
        }
      }
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=cur[0]+dx,ny=cur[1]+dy;
        if((!dx&&!dy)||!inside(state,nx,ny)||!stepOpen(state,nx,ny,cur[0],cur[1])||path.some(([px,py])=>px===nx&&py===ny))continue;
        const t=state.grid[ny][nx];
        if(!usable(t)||sum+t.value>target||!(ct.value===t.value||ct.value===2*t.value))continue;
        path.push([nx,ny]);sum+=t.value;back();path.pop();sum-=t.value;
      }
    }
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++){
      const t=state.grid[y][x];if(!usable(t)||t.value>target)continue;
      path.push([x,y]);sum=t.value;back();path.pop();
    }
    return out;
  }
  return {create,valid,completes,recipeOnly,relayStage,connects,move,preview,hasMove,replay,eachChain,chains,upcoming,tileCount,goalMet,
    isStone,partCount,partsAfter,partsNeeded,partsIn,opensGate,chainsWithSum,MIN_CHAIN,MAX_PARTS};
});
