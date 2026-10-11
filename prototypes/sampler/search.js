/* Screening helpers for sampler boards: a beam solver (does a win exist within the budget?), an exhaustive short-win
   check, proxies for the owner's captured baselines, and twist-necessity checks. All are screens, not owner evidence
   (AGENTS.md). */
const rules=require('./model');

function key(state){
  return state.grid.map(r=>r.map(t=>t?t.value+(t.made?'m':''):'.').join(',')).join('/')+'|'+state.done.join('')+'|'+state.gateOpen+'|'+state.randomCursor+'|'+state.columnCursor.join(',');
}
const tilesOf=state=>state.grid.flat().filter(Boolean);
const near=(a,b,d)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))<=d;
const sumOf=(state,chain)=>chain.reduce((s,[x,y])=>s+state.grid[y][x].value,0);
const everyChain=state=>rules.chains(state,state.gridWidth*state.gridHeight);

// Rough progress score per goal; only used to keep the beam on promising states.
function heuristic(level,state){
  const g=level.goal,tiles=tilesOf(state);let h=0;
  if(g.type==='orders')g.orders.forEach((o,i)=>{
    if(state.done[i]){h+=1000;return;}
    const need=o.make/o.from,ing=tiles.filter(t=>t.value===o.from),half=tiles.filter(t=>t.value===o.from/2);
    h+=Math.min(ing.length,need)*40+Math.min(half.length,2*need)*8;
    if(o.parts)h+=Math.min(ing.filter(t=>t.made).length,o.parts)*60;
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
  if(g.type==='connect'){
    if(state.done[0])return 1e6;
    for(const m of g.marks){const t=state.grid[m[1]][m[0]];if(!t)continue;
      h+=tiles.filter(u=>u!==t&&(u.value===t.value||u.value===2*t.value||2*u.value===t.value)&&near([u.x,u.y],m,2)).length*10;}
  }
  return h;
}

// Beam search, one layer per move; the next layer is trimmed to the best `beam` states while it is built, so memory
// stays bounded. Returns the first win found at the shallowest depth it reaches (a witness, not a proof of the
// shortest line). `start` plays on from a given state instead of the opening board.
function solve(level,{beam=300,maxLength=7,budget,start}={}){
  const origin=start||rules.create(level);
  if(budget===undefined)budget=origin.maxMoves-origin.moves;
  let frontier=[{state:origin,path:[]}];
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

/* Exhaustive short-win check: is there any win in `depth` moves or fewer? Every legal chain of any length is tried,
   with one pruning rule that cannot skip a win. `need` counts the goal steps still open (orders, relay stages, the
   exact tile; on the gate board, opening the gate and then the connection), and one move closes at most one of them:
   a chain fills at most one order or stage, and no chain can open the gate and pass through it in the same move,
   because the gate is a wall until the move ends. So a state with more steps open than moves left is dropped, and
   when the two are equal only chains that close a step are tried; those are drawn from every chain with the step's
   exact sum (rules.chainsWithSum), or from every chain on the gate board. Returns {win:path|null, states}. */
function needOf(level,state){
  if(level.goal.type==='connect')return state.done[0]?0:1+(level.gate&&!state.gateOpen?1:0);
  return state.done.filter(d=>!d).length;
}
function stepCandidates(level,state){
  const g=level.goal;
  if(g.type==='connect')return everyChain(state);
  const targets=g.type==='orders'?g.orders.filter((o,i)=>!state.done[i]).map(o=>o.make):
    g.type==='relay'?[g.stages[state.done.indexOf(false)]]:[g.make];
  const out=[],seen=new Set();
  for(const t of new Set(targets))for(const c of rules.chainsWithSum(state,t)){const k=c.join(' ');if(!seen.has(k)){seen.add(k);out.push(c);}}
  return out;
}
function exhaustive(level,depth=3){
  const seen=Array.from({length:depth+1},()=>new Set());let states=0;
  function go(state,left,path){
    const need=needOf(level,state);
    if(need>left)return null;
    const k=key(state);if(seen[left].has(k))return null;seen[left].add(k);states++;
    const pool=need===left?stepCandidates(level,state):everyChain(state);
    for(const chain of pool){
      const next=rules.move(level,state,chain);
      if(next.outcome==='won')return [...path,chain];
      if(need===left&&needOf(level,next)>=need)continue;
      if(next.outcome!=='playing'||left===1)continue;
      const w=go(next,left-1,[...path,chain]);if(w)return w;
    }
    return null;
  }
  const win=go(rules.create({...level,moves:Math.max(level.moves,depth)}),depth,[]);
  return {win,states};
}

// Harvest proxy (PDL-008): always take the chain with the largest sum (ties: longer, then first found).
function harvestPick(state){
  let best=null,bestSum=-1;
  rules.eachChain(state,state.gridWidth*state.gridHeight,(chain,tiles)=>{
    const sum=tiles.reduce((s,t)=>s+t.value,0);
    if(sum>bestSum||(sum===bestSum&&chain.length>best.length)){best=chain.map(p=>[...p]);bestSum=sum;}
  });
  return best;
}
function harvest(level){
  let state=rules.create(level);const path=[];
  while(state.outcome==='playing'){const best=harvestPick(state);path.push(best);state=rules.move(level,state,best);}
  return {outcome:state.outcome,moves:state.moves,path,left:rules.tileCount(state)};
}

// "Do the obvious" proxy (PDL-037): take any chain that completes part of the goal right now (an order, a relay stage,
// the connection, the exact tile, opening the gate, or the win), otherwise the largest-sum chain.
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

/* Forecast-blind player: plans like the solver but cannot see the refills, so it imagines them from another seed.
   Each move it re-plans from the real board with the imagined refills and plays the plan's first chain (largest sum
   when it finds no plan). Returns the outcome on the real board. */
function forecastBlind(level,altSeed,opts={beam:150,maxLength:7}){
  const imagined={...level,seed:altSeed};
  let state=rules.create(level);const path=[];
  while(state.outcome==='playing'){
    const plan=solve(imagined,{...opts,start:state});
    const pick=plan?plan.path[0]:harvestPick(state);
    path.push(pick);state=rules.move(level,state,pick);
  }
  return {outcome:state.outcome,moves:state.moves,path};
}

// Twist-necessity checks (research F12: if the board can be won without the twist, it is not that kind yet).
function necessity(level,opts={},{altSeeds=[55,11,22],replanSeeds=[101,55,11,22]}={}){
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
  if(level.forecast&&level.goal.type==='relay'){
    // Seeing the refills must matter: a whole plan made with other refills fails on the real ones (null = that seed has no win in the search at all), and a player who
    // re-plans every move without seeing what falls also fails.
    out.blindPlanWins=altSeeds.map(seed=>{const sol=solve({...level,seed},opts);return sol?play(level,sol.path).outcome==='won':null;});
    out.blindReplanWins=replanSeeds.map(seed=>forecastBlind(level,seed).outcome==='won');
  }
  if(level.goal.parts&&level.goal.anyOrder){
    // The cap must bite: playing the orders strictly in list order (A, B, C, D) cannot win within the budget, a greedy
    // in-order player loses, and a plan made as if there were no cap fails once the cap applies.
    const strict={...level,goal:{...level.goal,strictTurn:true}};
    out.strictOrderWin=solve(strict,opts);
    out.strictOrderGreedy=obvious(strict).outcome;
    const capless=solve({...level,goal:{...level.goal,cap:Infinity}},opts);
    out.capBlindWins=capless?play(level,capless.path).outcome==='won':null;
  }
  return out;
}

module.exports={solve,exhaustive,harvest,obvious,forecastBlind,heuristic,necessity,play,needOf};
