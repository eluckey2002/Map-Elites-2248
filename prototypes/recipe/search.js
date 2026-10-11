/* Screening helpers for Recipe boards: a beam solver (does a win exist within the budget?) and a
   harvest proxy (largest-sum chain every move). Both are screens, not owner evidence (AGENTS.md). */
const rules=require('./model');

function key(state){return state.grid.map(r=>r.map(t=>t.value).join(',')).join('/')+'|'+state.done.join('')+'|'+state.randomCursor;}

// Prefers boards rich in the next unfinished order's ingredient, clustered together.
function heuristic(level,state){
  let h=0;
  level.orders.forEach((o,i)=>{
    if(state.done[i]){h+=1000;return;}
    const need=o.make/o.from;let count=0,best=0;const seen=new Set();
    for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++){
      if(state.grid[y][x].value!==o.from)continue;count++;
      if(seen.has(x+','+y))continue;
      let size=0;const stack=[[x,y]];seen.add(x+','+y);
      while(stack.length){const [cx,cy]=stack.pop();size++;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy,k=nx+','+ny;
          if(nx<0||ny<0||nx>=state.gridWidth||ny>=state.gridHeight||seen.has(k)||state.grid[ny][nx].value!==o.from)continue;
          seen.add(k);stack.push([nx,ny]);}}
      best=Math.max(best,size);
    }
    let half=0;for(const row of state.grid)for(const t of row)if(t.value===o.from/2)half++;
    h+=Math.min(count,need)*40+Math.min(best,need)*60+Math.min(half,2*need)*8;
  });
  return h;
}

function solve(level,{beam=400,maxLength=7,budget=level.moves}={}){
  let frontier=[{state:rules.create(level),path:[]}];
  for(let depth=0;depth<budget;depth++){
    const next=[],seen=new Set();
    for(const node of frontier){
      for(const chain of rules.chains(node.state,maxLength)){
        const state=rules.move(level,node.state,chain),path=[...node.path,chain];
        if(state.outcome==='won')return {moves:depth+1,path};
        if(state.outcome!=='playing')continue;
        const k=key(state);if(seen.has(k))continue;seen.add(k);
        next.push({state,path,h:heuristic(level,state)});
      }
    }
    next.sort((a,b)=>b.h-a.h);frontier=next.slice(0,beam);
    if(!frontier.length)break;
  }
  return null;
}

// Harvest proxy: always take the chain with the largest sum (ties: longer), over every chain length on the board. Reports whether it wins.
function harvest(level){
  let state=rules.create(level);const path=[];
  while(state.outcome==='playing'){
    let best=null,bestSum=-1;
    for(const chain of rules.chains(state,state.gridWidth*state.gridHeight)){
      const sum=chain.reduce((s,[x,y])=>s+state.grid[y][x].value,0);
      if(sum>bestSum||(sum===bestSum&&chain.length>best.length)){best=chain;bestSum=sum;}
    }
    path.push(best);state=rules.move(level,state,best);
  }
  return {outcome:state.outcome,moves:state.moves,path};
}

module.exports={solve,harvest,heuristic};
