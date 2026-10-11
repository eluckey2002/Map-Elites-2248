/* Screening helpers for sampler boards: a beam solver (does a win exist within the budget?) and a harvest proxy
   (largest-sum chain every move). Both are screens, not owner evidence (AGENTS.md). */
const rules=require('./model');

function key(state){
  return state.grid.map(r=>r.map(t=>t?t.value+(t.rust?'r':'')+(t.made?'m':''):'.').join(',')).join('/')+'|'+state.done.join('')+'|'+state.randomCursor+'|'+state.columnCursor.join(',');
}
const tilesOf=state=>state.grid.flat().filter(Boolean);
const near=(a,b,d)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))<=d;

// Rough progress score per goal; only used to keep the beam on promising states.
function heuristic(level,state){
  const g=level.goal,tiles=tilesOf(state).filter(t=>!t.rust);let h=0;
  if(g.type==='orders')g.orders.forEach((o,i)=>{
    if(state.done[i]){h+=1000;return;}
    const need=o.make/o.from,ing=tiles.filter(t=>t.value===o.from),half=tiles.filter(t=>t.value===o.from/2);
    h+=Math.min(ing.length,need)*40+Math.min(half.length,2*need)*8;
    if(o.at)h+=Math.min(ing.filter(t=>near([t.x,t.y],o.at,2)).length,need)*50;
  });
  if(g.type==='exact'){
    if(state.done[0])return 1e6;
    const useful=tiles.filter(t=>t.value<=g.make).map(t=>t.value).sort((a,b)=>b-a);
    h+=(useful[0]||0)*2+(useful[1]||0)+useful.length;
  }
  if(g.type==='relay'){
    const i=state.done.indexOf(false);h+=state.done.filter(Boolean).length*1000;
    if(i>=0){const made=tiles.find(t=>t.made),target=g.stages[i]-(made?made.value:0);
      const useful=tiles.filter(t=>t.value<=target).map(t=>t.value).sort((a,b)=>b-a);h+=(useful[0]||0)*2+(useful[1]||0);}
  }
  if(level.gate&&state.gateOpen)h+=400;
  if(g.type==='leftover'){
    h-=rules.tileCount(state)*100;
    for(const t of tiles)for(const u of tiles)if(t!==u&&t.value===u.value&&near([t.x,t.y],[u.x,u.y],1))h+=3;
  }
  if(g.type==='connect'){
    if(state.done[0])return 1e6;
    for(const m of g.marks){const t=state.grid[m[1]][m[0]];if(!t)continue;
      h+=tiles.filter(u=>u!==t&&(u.value===t.value||u.value===2*t.value||2*u.value===t.value)&&near([u.x,u.y],m,2)).length*10;}
  }
  if(level.rust)h-=tilesOf(state).filter(t=>t.rust).length*25;
  return h;
}

// The next layer is trimmed to the best `beam` states while it is built, so memory stays bounded.
function solve(level,{beam=300,maxLength=7,budget=level.moves}={}){
  let frontier=[{state:rules.create(level),path:[]}];
  const trim=layer=>layer.sort((a,b)=>b.h-a.h).slice(0,beam);
  for(let depth=0;depth<budget;depth++){
    let next=[];const seen=new Set();
    for(const node of frontier){
      for(const chain of rules.chains(node.state,maxLength)){
        const state=rules.move(level,node.state,chain);
        if(state.outcome==='won')return {moves:depth+1,path:[...node.path,chain]};
        if(state.outcome!=='playing')continue;
        const k=key(state);if(seen.has(k))continue;seen.add(k);
        next.push({state,path:[...node.path,chain],h:heuristic(level,state)});
        if(next.length>=4*beam)next=trim(next);
      }
    }
    frontier=trim(next);
    if(!frontier.length)break;
  }
  return null;
}

// Harvest proxy: always take the chain with the largest sum (ties: longer, then first found).
function harvest(level){
  let state=rules.create(level);const path=[];
  while(state.outcome==='playing'){
    let best=null,bestSum=-1;
    rules.eachChain(state,state.gridWidth*state.gridHeight,(chain,tiles)=>{
      const sum=tiles.reduce((s,t)=>s+t.value,0);
      if(sum>bestSum||(sum===bestSum&&chain.length>best.length)){best=chain.map(p=>[...p]);bestSum=sum;}
    });
    path.push(best);state=rules.move(level,state,best);
  }
  return {outcome:state.outcome,moves:state.moves,path,left:rules.tileCount(state)};
}

// "Do the obvious" proxy: take any chain that completes part of the goal right now (an order, a relay stage, the
// connection, the exact tile, opening the gate, or the win), otherwise the largest-sum chain.
function obvious(level){
  let state=rules.create(level);const path=[];
  const progress=s=>s.done.filter(Boolean).length+(s.gateOpen?1:0)+(s.outcome==='won'?10:0);
  while(state.outcome==='playing'){
    let best=null,bestSum=-1,quick=null;const base=progress(state);
    rules.eachChain(state,state.gridWidth*state.gridHeight,(chain,tiles)=>{
      const sum=tiles.reduce((s,t)=>s+t.value,0);
      if(sum>bestSum||(sum===bestSum&&chain.length>best.length)){best=chain.map(p=>[...p]);bestSum=sum;}
      if(!quick&&progress(rules.move(level,state,chain))>base){quick=chain.map(p=>[...p]);}
    });
    const pick=quick||best;path.push(pick);state=rules.move(level,state,pick);
  }
  return {outcome:state.outcome,moves:state.moves,path};
}

const play=(level,path)=>{let s=rules.create(level);for(const c of path){if(s.outcome!=='playing'||!rules.valid(s,c))return s;s=rules.move(level,s,c);}return s;};

// Twist-necessity checks (research F12: if the board can be won without the twist, it is not that kind yet).
function necessity(level,opts={}){
  const out={};
  if(level.goal.type==='orders'&&level.goal.orders.some(o=>o.at)){
    // A player who makes the recipe but ignores the spot: the plan that wins with no spot must fail with it.
    const blind={...level,goal:{...level.goal,orders:level.goal.orders.map(({at,...o})=>o)}};
    const sol=solve(blind,opts);out.spotBlindWins=!!sol&&play(level,sol.path).outcome==='won';
  }
  if(level.forecast){
    // With useless refills (one huge value) there must be no win: the falling tiles are needed.
    const sol=solve({...level,spawnValues:[1<<20]},opts);out.winsWithoutRefills=!!sol;
  }
  if(level.rust){
    // Reported, not required: whether the harvest proxy would win with no rust at all.
    const {rust,...plain}=level;out.harvestWinsWithoutRust=harvest(plain).outcome==='won';
    // A player who plans as if there were no rust: that plan must fail once rust spreads.
    // null when no rust-free plan was found: then nothing shows the rust matters, and the check fails.
    const sol=solve(plain,opts);out.rustBlindWins=sol?play(level,sol.path).outcome==='won':null;
  }
  return out;
}

module.exports={solve,harvest,obvious,heuristic,necessity,play};
