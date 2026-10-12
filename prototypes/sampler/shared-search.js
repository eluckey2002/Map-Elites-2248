/* BL-0030 instrument: MAP-Elites search over Shared Material boards (kinds sampler, prototypes/sampler/).
   This file is the INSTRUMENT only (generator, keeper test, MAP-Elites loop, archive writer, independent verifier, CLI).
   It is a screen, not owner evidence (AGENTS.md); a result needs a registered protocol before the real run.

   Board family (all sampler rules stay): 6 columns x 6 rows, v3 rules from model.js (8-way chains, first two tiles equal
   then equal/double, sum on the last tile, gravity, seeded refills 2..64 that can never make a 3). The Next-tiles strip
   is on (forecast:true: one refill queue per column; the values and the spawn list are unchanged). Every tile is a power
   of two (2..64) except the placed green 3s. Two or three PLAIN orders, each {make:12, from:3} (four 3s in one chain);
   all of them want the same greens. No anyOrder, parts, spots, stones, gates or leave-N goals. Identical orders fill in
   whatever order the chains come (model.completes takes the first unfinished order a chain fits).

   Player-visible descriptors (board + goal; Z needs the witness line):
     X spare greens = (tiles equal to 3) - 4 x orders          bins 0, 1, 2+   (negative = unwinnable, never kept)
     Y orders competing = 2 or 3
     Z setup moves = moves of the witness line before the first order fills (a move that fills no order); bins 0, 1, 2+.
       Tie-break between equal-length best lines: Z is the FEWEST setup moves among all best-length winning lines the
       instrument finds (the beam witnesses plus every best-length win of a 200-wide, 7-long collecting beam); the stored
       witness is that line (ties: lexicographically smallest JSON). Lines come from beams, so this is a found minimum.
   Keeper test (a game, not a brain teaser; all must hold; see evaluate / verifyEntry):
     1 a solver win exists within the budget
     2 budget = max(best + 6, 3 x orders + 4); best = shortest of beam 1000/len 8 and beam 200/len 7 (search.solve),
       best >= 4 and search.exhaustive proves no win in 3 moves or fewer
     3 an ORDINARY PLAYER wins at that budget: each move it plays the chain whose resulting board scores highest (one move
       of look-ahead, no undo): 1000 per filled order + 100 x the biggest touching group of greens (cap 4) - the sum over
       greens of the distance to the nearest other green - 400 per green wasted in a chain that filled nothing; ties go to
       the first chain in scan order
     4 at least 60 opening chains (maxOpen/maxLong are cost guards of this instrument, not rules)
     5 at least 3 distinct winning FIRST chains: of the 30 best-looking first chains (ranked by the ordinary player's score)
       each is tried with a beam of 20 (length <= 6) for a win inside the budget; the count stops at 10. A stored winning
       line per counted first chain lets the verifier replay them.
     6 refills stay within spawnValues (2,4,8,16,32,64); none is a 3 (so a Drought-style flush cannot rebuild greens)
   Reported facts, NOT gates: whether harvest / obvious / greedyFirst / greedyLast lose at the budget ("bite"), and the
   split report: at the position where the witness makes its first fill, each order-filling chain available and how many
   fills are still available after it (0 = that fill strands the other orders).
   Difficulty is MEASURED, not set by the move limit: win rate of the ordinary player over 20 games in which each move is a
   random legal chain with probability 0.2 (seeded from the board hash, deterministic), within the budget. Bins: easy >= 0.8,
   medium 0.4-0.8, hard < 0.4. Stored per kept board (winRate, avgWinMoves on wins, bin) as a REPORTED column, not a fourth
   axis: 3 x 2 x 3 x 3 = 54 cells would be too sparse for the evaluations a run affords.
   Fitness (cell competition, higher wins): the number of distinct winning first chains (cap 10). Ties: the smaller best
   line, then the smaller board hash.
   Wall-clock caps make a run non-reproducible only when the cap is hit; with no cap hit a seed gives identical cells. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const rules=require('./model'),search=require('./search');

const INSTRUMENT_VERSION=2;
const COLS=6,ROWS=6,GREEN=3,ORDER_MAKE=12,SLACK=6,MIN_OPEN=60,PROXY_CAP=40,MAX_SPARE=4,MIN_FIRST=3;
const SPAWN=[2,4,8,16,32,64];
// Filler palettes. Spaced values (each four times the last) never chain with each other, so a tile only clears with equal
// neighbours: those palettes build walls that a setup move cannot simply remove.
const PALETTES=[[2,8,32],[4,16,64],[2,8,32,64],[4,16,64,2],[2,4,16,64],[2,8,16,32],[4,8,32,64]];
const STEPPING=/^(ordinary player|too few first|win in 3|rough win in 3|best line under 4)/,POOL_MAX=80;
const DEFAULT_BEAMS=[{beam:1000,maxLength:8},{beam:200,maxLength:7}];
const DEFAULT_CFG={beams:DEFAULT_BEAMS,roughBeam:{beam:40,maxLength:6},roughBudget:12,collect:{beam:200,maxLength:7,cap:200},
  first:{tries:30,cap:10,beam:20,maxLength:6},maxOpen:700,maxLong:20000};

// ---------------------------------------------------------------- small utilities
function makeRng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const pick=(rng,list)=>list[Math.floor(rng()*list.length)];
const int=(rng,lo,hi)=>lo+Math.floor(rng()*(hi-lo+1));
const sha=text=>crypto.createHash('sha1').update(text).digest('hex');
const fileSha=name=>sha(fs.readFileSync(path.join(__dirname,name),'utf8'));
const isPow2=v=>Number.isSafeInteger(v)&&v>0&&(v&(v-1))===0;
const chainKey=chain=>chain.slice(0,-1).map(p=>p.join(',')).sort().join(' ')+'>'+chain.at(-1).join(',');
const pathKey=p=>p.map(chainKey).join(';');
const toNum=f=>f==='inf'?Infinity:f;
const toJson=f=>f===Infinity?'inf':f;
const budgetFor=(best,orders)=>Math.max(best+SLACK,3*orders+4);

// ---------------------------------------------------------------- boards
const boardHash=({grid,seed,orders})=>sha(JSON.stringify([grid,seed,orders]));
function makeLevel({grid,seed,orders},moves){
  const hash=boardHash({grid,seed,orders});
  return {id:'sm-'+hash.slice(0,10),kind:'shared-material',name:'Shared Material',
    focus:orders+' orders want the same green 3s',
    ruleTitle:orders+' orders, one pile of green 3s.',
    rule:'Each order wants four green 3s in one chain. Green tiles never fall in and no chain can make a 3. Watch the next tiles, and fill the orders so every one still has four 3s that can touch.',
    hint:'',seed,moves,spawnValues:SPAWN.slice(),forecast:true,
    goal:{type:'orders',orders:Array.from({length:orders},()=>({make:ORDER_MAKE,from:GREEN}))},
    grid:grid.map(r=>r.slice())};
}
const genomeOf=level=>({grid:level.grid.map(r=>r.slice()),seed:level.seed,orders:level.goal.orders.length});
const hashOfLevel=level=>boardHash(genomeOf(level));

// Is this board inside the family (shape, values, goal)? Returns a list of problems (empty = ok).
function familyProblems(level){
  const out=[];
  try{rules.create(level);}catch(e){return ['not a valid sampler board'];}
  const g=level.goal;
  if(level.grid.length!==ROWS||level.grid.some(r=>r.length!==COLS))out.push(`not ${COLS}x${ROWS}`);
  if(level.grid.flat().some(v=>!(isPow2(v)&&v>=2&&v<=64||v===GREEN)))out.push('a tile is not a power of two 2..64 or a green 3');
  if(JSON.stringify(level.spawnValues)!==JSON.stringify(SPAWN))out.push('spawnValues are not 2..64');
  if(level.forecast!==true)out.push('forecast is not on');
  if(!g||g.type!=='orders'||g.parts||g.anyOrder||g.cap!==undefined||g.strictTurn)out.push('goal is not plain orders');
  else{
    if(![2,3].includes(g.orders.length))out.push('order count is not 2 or 3');
    if(g.orders.some(o=>o.make!==ORDER_MAKE||o.from!==GREEN||o.at!==undefined||o.parts!==undefined))out.push('an order is not {make:12,from:3}');
  }
  for(const k of ['stone','gate','oneAtATime','boss','rust'])if(level[k]!==undefined)out.push('has '+k);
  if(level.refill===false)out.push('refill off');
  return out;
}

// ---------------------------------------------------------------- descriptors
const greensOn=level=>level.grid.flat().filter(v=>v===GREEN).length;
function spareGreens(level){return greensOn(level)-level.goal.orders.reduce((a,o)=>a+o.make/o.from,0);}
const binX=spare=>spare<0?null:Math.min(spare,2);
const binZ=setup=>Number.isFinite(setup)?Math.min(setup,2):null;
const binLabel=b=>b===2?'2+':String(b);
const ordersOf=level=>level.goal.orders.length;
// Setup moves of a line: moves played before the first one that fills an order (Infinity if no move fills one).
function setupMoves(level,line){
  let s=rules.create(level);
  for(let i=0;i<line.length;i++){s=rules.move(level,s,line[i]);if(s.last.order>=0)return i;if(s.outcome!=='playing')break;}
  return Infinity;
}
function cellOf(level,setup){
  const x=binX(spareGreens(level)),z=binZ(setup);
  return x===null||z===null?null:`X${binLabel(x)}|Y${ordersOf(level)}|Z${binLabel(z)}`;
}
const ALL_CELLS=[];for(const x of ['0','1','2+'])for(const y of [2,3])for(const z of ['0','1','2+'])ALL_CELLS.push(`X${x}|Y${y}|Z${z}`);

// ---------------------------------------------------------------- the ordinary player
const greenCells=state=>{const out=[];state.grid.forEach((row,y)=>row.forEach((t,x)=>{if(t&&t.value===GREEN)out.push([x,y]);}));return out;};
const cheb=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
// How good a board looks to an ordinary player (see the header). `start` is the green count at the opening.
function playerScore(state,start){
  const gs=greenCells(state),seen=new Set();let group=0,nn=0;
  for(const g of gs){
    let near=99;for(const h of gs)if(h!==g)near=Math.min(near,cheb(g,h));
    nn+=near===99?0:near;
    const k=g.join(',');if(seen.has(k))continue;
    const stack=[g],comp=[];seen.add(k);
    while(stack.length){const c=stack.pop();comp.push(c);for(const h of gs){const hk=h.join(',');if(!seen.has(hk)&&cheb(c,h)===1){seen.add(hk);stack.push(h);}}}
    group=Math.max(group,comp.length);
  }
  const done=state.done.filter(Boolean).length,wasted=Math.max(0,start-gs.length-4*done);
  return 1000*done+100*Math.min(group,4)-nn-400*wasted;
}
// Plays up to `cap` moves (default: the level's own budget); returns {outcome,moves,line}. With `noise` {epsilon,rng} each
// move is, with probability epsilon, a random legal chain (up to 8 tiles) instead of the best-scoring one.
function ordinaryPlayer(level,cap,noise){
  const long={...level,moves:cap||level.moves};let state=rules.create(long);const start=greenCells(state).length,line=[];
  while(state.outcome==='playing'){
    const all=rules.chains(state,8);
    let bestChain=null;
    if(noise&&noise.rng()<noise.epsilon)bestChain=all[Math.floor(noise.rng()*all.length)];
    else{
      let bestScore=-Infinity;
      for(const chain of all){
        const sc=playerScore(rules.move(long,state,chain),start);
        if(sc>bestScore){bestScore=sc;bestChain=chain;}
      }
    }
    state=rules.move(long,state,bestChain);line.push(bestChain);
  }
  return {outcome:state.outcome,moves:state.moves,line};
}
// MEASURED difficulty: win rate of the ordinary player over TRIALS games where each move is random with probability
// EPSILON (trial t is seeded from the board hash + t, so it is deterministic), within the board's budget.
const TRIALS=20,EPSILON=0.2;
const difficultyBin=rate=>rate>=0.8?'easy':rate>=0.4?'medium':'hard';
function difficulty(level){
  const base=parseInt(hashOfLevel(level).slice(0,8),16);let wins=0,moves=0;
  for(let t=0;t<TRIALS;t++){
    const r=ordinaryPlayer(level,null,{epsilon:EPSILON,rng:makeRng(base+t)});
    if(r.outcome==='won'){wins++;moves+=r.moves;}
  }
  const winRate=wins/TRIALS;
  return {winRate,avgWinMoves:wins?Math.round(100*moves/wins)/100:null,trials:TRIALS,epsilon:EPSILON,bin:difficultyBin(winRate)};
}

// ---------------------------------------------------------------- reported facts: proxies and the split
// Greedy fill: if some chain fills an order take the first / last such chain in scan order, else the largest sum.
function greedyFill(level,which){
  let state=rules.create(level);
  while(state.outcome==='playing'){
    let fill=null,best=null,bestSum=-1;
    rules.eachChain(state,state.gridWidth*state.gridHeight,(chain,tiles)=>{
      if(rules.completes(level,state,chain)>=0){if(which==='first'){if(!fill)fill=chain.map(p=>[...p]);}else fill=chain.map(p=>[...p]);}
      const sum=tiles.reduce((s,t)=>s+t.value,0);
      if(sum>bestSum||(sum===bestSum&&chain.length>best.length)){best=chain.map(p=>[...p]);bestSum=sum;}
      return false;
    });
    state=rules.move(level,state,fill||best);
  }
  return {outcome:state.outcome,moves:state.moves};
}
const PROXIES={
  harvest:l=>search.harvest(l),
  obvious:l=>search.obvious(l),
  greedyFirst:l=>greedyFill(l,'first'),
  greedyLast:l=>greedyFill(l,'last')
};
// Moves each proxy needs to win when given PROXY_CAP moves (Infinity = never won). Proxy choices do not depend on the
// budget, so "wins within the budget" is exactly "winMoves <= budget".
function proxyWins(level){
  const long={...level,moves:PROXY_CAP},out={};
  for(const [name,run] of Object.entries(PROXIES)){const r=run(long);out[name]=r.outcome==='won'?r.moves:Infinity;}
  return out;
}
// Split report at the position before the line's first fill: every order-filling chain there, and how many fills
// remain available after each (0 with orders left = that fill strands the others).
function splitReport(level,line){
  let state=rules.create(level);
  for(const c of line){if(rules.completes(level,state,c)>=0)break;state=rules.move(level,state,c);}
  const fillsIn=s=>{
    const seen=new Set(),out=[];
    rules.eachChain(s,4,chain=>{if(rules.completes(level,s,chain)>=0){const k=chainKey(chain);if(!seen.has(k)){seen.add(k);out.push(chain.map(p=>[...p]));}}return false;});
    return out;
  };
  const fills=fillsIn(state),after=fills.map(c=>{const n=rules.move(level,state,c);return n.outcome==='won'?0:fillsIn(n).length;});
  const left=ordersOf(level)-1;
  return {fills:fills.length,afterFill:after,strandingFills:left>0?after.filter(n=>n===0).length:0};
}

// ---------------------------------------------------------------- solving
function stateKey(state){
  return state.grid.map(r=>r.map(t=>t?t.value+(t.made?'m':''):'.').join(',')).join('/')+'|'+state.done.join('')+'|'+state.randomCursor+'|'+state.columnCursor.join(',');
}
// Every best-length win a beam sees at depth `best` (cap), as paths. Same pruning and ordering as search.solve.
function collectBestLines(level,best,{beam,maxLength,cap}){
  let frontier=[{state:rules.create(level),path:[]}];
  const trim=layer=>layer.sort((a,b)=>b.h-a.h).slice(0,beam),wins=[],seenWin=new Set();
  for(let depth=0;depth<best;depth++){
    let next=[];const seen=new Set();
    for(const node of frontier)for(const chain of rules.chains(node.state,maxLength)){
      const state=rules.move(level,node.state,chain);
      if(state.outcome==='won'){
        if(depth+1===best){const p=[...node.path,chain],k=pathKey(p);if(!seenWin.has(k)&&wins.length<cap){seenWin.add(k);wins.push(p);}}
        continue;
      }
      if(state.outcome!=='playing'||depth+1>=best)continue;
      const k=stateKey(state);if(seen.has(k))continue;seen.add(k);
      next.push({state,path:[...node.path,chain],h:search.heuristic(level,state)});
      if(next.length>=4*beam)next=trim(next);
    }
    frontier=trim(next);if(!frontier.length)break;
  }
  return wins;
}
const lineSetup=(level,p)=>setupMoves({...level,moves:p.length},p);
// Distinct winning FIRST chains inside the budget: one full winning line per counted first chain (beam-bounded; see header).
function winningFirstMoves(level,{tries,cap,beam,maxLength},seedLines=[]){
  const found=new Map();
  for(const l of seedLines)if(!found.has(chainKey(l[0])))found.set(chainKey(l[0]),l);
  const open=rules.create(level),start=greenCells(open).length,seen=new Set();
  const ranked=[];
  for(const chain of rules.chains(open,maxLength)){
    const k=chainKey(chain);if(seen.has(k))continue;seen.add(k);
    const next=rules.move(level,open,chain);
    ranked.push({chain,next,score:playerScore(next,start)});
  }
  ranked.sort((a,b)=>b.score-a.score||(chainKey(a.chain)<chainKey(b.chain)?-1:1));
  for(const r of ranked.slice(0,tries)){
    if(found.size>=cap)break;
    const k=chainKey(r.chain);if(found.has(k))continue;
    if(r.next.outcome==='won'){found.set(k,[r.chain]);continue;}
    if(r.next.outcome!=='playing')continue;
    const sol=search.solve(level,{beam,maxLength,budget:level.moves-1,start:r.next});
    if(sol)found.set(k,[r.chain,...sol.path]);
  }
  return [...found.values()];
}
// Cost guard: how many legal chains of up to `len` tiles (stops counting at `limit`). Dense green blobs make the full-length
// chain enumeration in search.harvest / obvious / exhaustive explode, so such boards are refused before any solve.
function countChains(state,len,limit){
  let n=0;
  rules.eachChain(state,len,()=>++n>limit);
  return n;
}

// ---------------------------------------------------------------- the keeper test, with the solver (generator side)
// Returns {ok:false,reason} or {ok:true,entry}. Cheap rejections come first because solves are expensive.
function evaluate(genome,cfg=DEFAULT_CFG,incumbent=()=>null){
  const t0=Date.now();
  const draft=makeLevel(genome,16),bad=familyProblems(draft),Y=genome.orders;
  if(bad.length)return {ok:false,reason:'family: '+bad[0]};
  const spare=spareGreens(draft);
  if(spare<0)return {ok:false,reason:'too few greens'};
  if(spare>MAX_SPARE)return {ok:false,reason:'too many greens'};
  const open=rules.chains(rules.create(draft),8).length;
  if(open<MIN_OPEN)return {ok:false,reason:'fewer than 60 opening chains'};
  if(open>cfg.maxOpen||countChains(rules.create(draft),16,cfg.maxLong)>cfg.maxLong)return {ok:false,reason:'too many opening chains (cost guard)'};
  const rough=search.solve(draft,{...cfg.roughBeam,budget:cfg.roughBudget});
  if(!rough)return {ok:false,reason:'no rough win'};
  if(rough.moves<4)return {ok:false,reason:'rough win in 3 or fewer'};
  // the ordinary player ignores the budget, so a loss against the largest budget this board could get is a loss for good
  const ordinary=ordinaryPlayer(draft,budgetFor(rough.moves,Y));
  if(ordinary.outcome!=='won')return {ok:false,reason:'ordinary player loses'};
  if(search.exhaustive(draft,3).win)return {ok:false,reason:'win in 3 moves or fewer'};
  const found=[];
  for(const [i,o] of cfg.beams.entries()){
    const cap=found.length?Math.min(rough.moves,...found.map(f=>f.moves)):rough.moves;
    const sol=search.solve(draft,{...o,budget:cap});
    if(sol)found.push({...sol,finder:i});
  }
  if(!found.length)return {ok:false,reason:'beams miss the rough line'};
  const best=Math.min(...found.map(f=>f.moves));
  if(best<4)return {ok:false,reason:'best line under 4 moves'};
  const level=makeLevel(genome,budgetFor(best,Y));
  if(ordinary.moves>level.moves)return {ok:false,reason:'ordinary player loses'};
  // witness set: the finders' best lines plus every best-length win of the collecting beam
  const lines=found.filter(f=>f.moves===best).map(f=>f.path).concat(collectBestLines(level,best,cfg.collect));
  const distinct=new Map();for(const p of lines)distinct.set(pathKey(p),p);
  const ranked=[...distinct.values()].map(p=>({p,z:lineSetup(level,p)})).sort((a,b)=>a.z-b.z||(JSON.stringify(a.p)<JSON.stringify(b.p)?-1:1));
  const witness=ranked[0];
  if(rules.replay(level,witness.p.map(chain=>({type:'move',chain}))).outcome!=='won')return {ok:false,reason:'witness does not replay'};
  const cell=cellOf(level,witness.z);
  if(!cell)return {ok:false,reason:'no cell'};
  const inc=incumbent(cell);   // a cell already at the fitness cap only changes hands for a shorter best line
  if(inc&&inc.fitness>=cfg.first.cap&&inc.best<=best)return {ok:false,reason:'lost its cell (incumbent at the cap)'};
  const paths=winningFirstMoves(level,cfg.first,[witness.p]);
  if(paths.length<MIN_FIRST)return {ok:false,reason:'too few first moves win'};
  const wins=proxyWins(level);
  return {ok:true,entry:{
    cell,hash:hashOfLevel(level),
    descriptors:{spare,orders:Y,setup:witness.z,bins:{X:binLabel(binX(spare)),Y,Z:binLabel(binZ(witness.z))}},
    fitness:paths.length,firstMoves:paths.length,paths,
    bestLines:distinct.size,best,budget:level.moves,openingChains:open,witness:witness.p,
    ordinary:{outcome:ordinary.outcome,moves:ordinary.moves},
    bites:{harvestObviousGreedyLose:Object.values(wins).every(w=>w>level.moves),proxyWins:Object.fromEntries(Object.entries(wins).map(([k,v])=>[k,toJson(v)]))},
    split:splitReport(level,witness.p),difficulty:difficulty(level),
    board:level,ms:Date.now()-t0}};
}

// ---------------------------------------------------------------- fitness comparison (cell competition)
function better(a,b){
  if(a.fitness!==b.fitness)return a.fitness>b.fitness;
  if(a.best!==b.best)return a.best<b.best;
  return a.hash<b.hash;
}

// ---------------------------------------------------------------- generator: sampling and mutation
// A start board: filler from a palette with 4*orders+spare greens placed as `minBlobs`+ BLOBS of random sizes. `tight` is
// the chance a green joins its blob next to a member (else up to two cells away, which leaves a gap a setup move has to
// close). Unequal blobs are what makes the split a decision.
function sampleBoard(rng,{orders,spare,tight,minBlobs=2,noFill=false}){
  const vals=pick(rng,PALETTES);
  const grid=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>pick(rng,vals)));
  const total=4*orders+spare,blobs=int(rng,minBlobs,Math.max(minBlobs,Math.min(8,total>>1))),sizes=Array(blobs).fill(1);
  // noFill: no blob holds four greens, so no order can fill on move 1 and the board needs setup (Z >= 1)
  const nBlobs=noFill?Math.max(blobs,Math.ceil(total/3)):blobs;
  if(noFill)sizes.length=0,sizes.push(...Array(nBlobs).fill(1));
  for(let n=sizes.length;n<total;n++){let i=int(rng,0,sizes.length-1);if(noFill)while(sizes[i]>=3)i=(i+1)%sizes.length;sizes[i]++;}
  const greens=[],isGreen=(x,y)=>greens.some(p=>p[0]===x&&p[1]===y);
  const near=(x,y,d)=>greens.some(p=>Math.max(Math.abs(p[0]-x),Math.abs(p[1]-y))<=d);
  const cellsAll=[];for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)cellsAll.push([x,y]);
  for(const size of sizes){
    const apart=cellsAll.filter(([x,y])=>!near(x,y,1)),start=pick(rng,apart.length?apart:cellsAll.filter(([x,y])=>!isGreen(x,y)));
    const blob=[start];greens.push(start);
    while(blob.length<size){
      const base=pick(rng,blob),d=rng()<tight?1:2;
      const opts=cellsAll.filter(([x,y])=>!isGreen(x,y)&&Math.max(Math.abs(base[0]-x),Math.abs(base[1]-y))<=d);
      const c=opts.length?pick(rng,opts):pick(rng,cellsAll.filter(([x,y])=>!isGreen(x,y)));
      blob.push(c);greens.push(c);
    }
  }
  for(const [x,y] of greens)grid[y][x]=GREEN;
  return {grid,seed:int(rng,1,9999),orders};
}
function randomTarget(rng,i){
  // round-robin over orders x spare, so the start set covers the X and Y axes; blobs and tightness vary the setup distance
  const orders=2+(i%2),spare=[0,1,2,3][Math.floor(i/2)%4],tight=[0,0.25,0.5,0.75][int(rng,0,3)],minBlobs=int(rng,3,6);
  return {orders,spare,tight,minBlobs,noFill:rng()<0.5};
}
function mutate(rng,genome){
  const g={grid:genome.grid.map(r=>r.slice()),seed:genome.seed,orders:genome.orders};
  const cells=()=>[int(rng,0,COLS-1),int(rng,0,ROWS-1)];
  const at=([x,y])=>g.grid[y][x];
  const vals=[...new Set(g.grid.flat().filter(v=>v!==GREEN))];
  const ops=int(rng,1,3);
  for(let i=0;i<ops;i++){
    const r=rng();
    if(r<0.25){const a=cells(),b=cells(),t=at(a);g.grid[a[1]][a[0]]=at(b);g.grid[b[1]][b[0]]=t;}               // swap any two
    else if(r<0.5){                                                                                           // nudge a green
      const gs=[];g.grid.forEach((row,y)=>row.forEach((v,x)=>{if(v===GREEN)gs.push([x,y]);}));
      const a=pick(rng,gs),b=[Math.max(0,Math.min(COLS-1,a[0]+int(rng,-2,2))),Math.max(0,Math.min(ROWS-1,a[1]+int(rng,-2,2)))];
      const t=at(b);g.grid[b[1]][b[0]]=GREEN;g.grid[a[1]][a[0]]=t;
    }else if(r<0.75){const a=cells();if(at(a)!==GREEN)g.grid[a[1]][a[0]]=pick(rng,rng()<0.8?vals:SPAWN);}      // replace a filler tile
    else if(r<0.88){                                                                                          // spare +-1
      const a=cells(),greens=g.grid.flat().filter(v=>v===GREEN).length;
      if(at(a)===GREEN&&greens>4*g.orders)g.grid[a[1]][a[0]]=pick(rng,vals);
      else if(at(a)!==GREEN&&greens<4*g.orders+MAX_SPARE)g.grid[a[1]][a[0]]=GREEN;
    }else if(r<0.96)g.seed=int(rng,1,9999);                                                                   // new refills
    else{                                                                                                     // one more / fewer order, four more / fewer greens
      const greens=g.grid.flat().filter(v=>v===GREEN).length;
      if(g.orders===2){g.orders=3;for(let n=0;n<4;n++){const a=cells();if(at(a)!==GREEN)g.grid[a[1]][a[0]]=GREEN;}}
      else{g.orders=2;let drop=Math.min(4,greens-8);for(let y=0;y<ROWS&&drop>0;y++)for(let x=0;x<COLS&&drop>0;x++)if(g.grid[y][x]===GREEN&&rng()<0.3){g.grid[y][x]=pick(rng,vals);drop--;}}
    }
  }
  return g;
}

// ---------------------------------------------------------------- MAP-Elites loop
function runSearch({seed=1,evals=100,maxSeconds=Infinity,cfg=DEFAULT_CFG,log=()=>{}}={}){
  const rng=makeRng(seed),cells=new Map(),cache=new Set(),pool=[],stats={evaluated:0,cacheHits:0,kept:0,replaced:0,rejected:{}};
  const start=Date.now();
  let attempts=0,stoppedBy='evals';
  while(stats.evaluated<evals){
    if(Date.now()-start>maxSeconds*1000){stoppedBy='wall-clock';break;}
    if(++attempts>evals*20+100){stoppedBy='attempts';break;}
    let genome;
    const keys=[...cells.keys()].sort();
    // parents: a fresh sample, an elite, or a stepping stone (a solvable board that failed a later keeper check)
    const roll=rng();
    if(roll<0.15||(!keys.length&&!pool.length))genome=sampleBoard(rng,randomTarget(rng,stats.evaluated+attempts));
    else if(keys.length&&(!pool.length||roll<0.55))genome=mutate(rng,genomeOf(cells.get(pick(rng,keys)).board));
    else genome=mutate(rng,pick(rng,pool));
    const h=boardHash(genome);
    if(cache.has(h)){stats.cacheHits++;continue;}
    cache.add(h);
    const r=evaluate(genome,cfg,c=>cells.get(c));
    stats.evaluated++;
    if(!r.ok){
      stats.rejected[r.reason]=(stats.rejected[r.reason]||0)+1;
      if(STEPPING.test(r.reason)){if(pool.length<POOL_MAX)pool.push(genome);else pool[Math.floor(rng()*POOL_MAX)]=genome;}
      continue;
    }
    const e={...r.entry,evalIndex:stats.evaluated},old=cells.get(e.cell);
    if(!old){cells.set(e.cell,e);stats.kept++;log(`eval ${stats.evaluated}: new cell ${e.cell} fitness ${e.fitness} best ${e.best} budget ${e.budget}`);}
    else if(better(e,old)){cells.set(e.cell,e);stats.replaced++;log(`eval ${stats.evaluated}: ${e.cell} improved ${old.fitness} -> ${e.fitness}`);}
    else stats.rejected['lost its cell']=(stats.rejected['lost its cell']||0)+1;
  }
  return buildArchive({seed,evals,maxSeconds,cfg,cells,stats,stoppedBy,seconds:(Date.now()-start)/1000});
}

// ---------------------------------------------------------------- archive
function versions(){
  return {instrument:INSTRUMENT_VERSION,sharedSearch:fileSha('shared-search.js'),model:fileSha('model.js'),search:fileSha('search.js'),
    engine:sha(fs.readFileSync(path.join(__dirname,'../../solver/engine.js'),'utf8')),node:process.version};
}
function buildArchive({seed,evals,maxSeconds,cfg,cells,stats,stoppedBy,seconds}){
  const out={};
  for(const k of [...cells.keys()].sort())out[k]=cells.get(k);
  return {format:'shared-material-archive',version:2,versions:versions(),
    args:{seed,evals,maxSeconds:maxSeconds===Infinity?null:maxSeconds,cfg},
    family:{cols:COLS,rows:ROWS,orderMake:ORDER_MAKE,orderFrom:GREEN,spawnValues:SPAWN,forecast:true,slack:SLACK,minFirstMoves:MIN_FIRST,minOpening:MIN_OPEN},
    cellCount:cells.size,cellsPossible:ALL_CELLS.length,stats,run:{stoppedBy,seconds},cells:out};
}
function writeArchive(archive,file){fs.writeFileSync(file,JSON.stringify(archive,null,1)+'\n');}
function readArchive(file){return JSON.parse(fs.readFileSync(file,'utf8'));}

// ---------------------------------------------------------------- independent verifier
// Re-checks one entry against the keeper test by replaying its stored lines through model.js and recomputing the
// descriptors, the ordinary player, the proxies and the reports. It does not search for a better line unless deep is set.
function verifyEntry(cellKey,entry,{deep=false,cfg=DEFAULT_CFG}={}){
  const fails=[],check=(ok,msg)=>{if(!ok)fails.push(msg);};
  const level=entry&&entry.board;
  if(!level||!level.goal||!Array.isArray(level.grid)||!Array.isArray(entry.witness)||!Array.isArray(entry.paths))return ['entry is malformed'];
  const bad=familyProblems(level);check(!bad.length,'family: '+bad.join('; '));
  if(bad.length)return fails;
  check(hashOfLevel(level)===entry.hash,'board hash does not match');
  const best=entry.witness.length;
  check(level.moves===budgetFor(best,ordersOf(level))&&entry.best===best&&entry.budget===level.moves,`budget ${level.moves} is not max(witness length ${best} + ${SLACK}, 3 x orders + 4)`);
  check(best>=4,'best line under 4 moves');
  // a long chain count first, so a tampered dense board cannot hang the proxies
  if(countChains(rules.create(level),16,cfg.maxLong)>cfg.maxLong){fails.push('cost guard: too many chains');return fails;}
  // replay the witness through model.js, move by move (also checks refills)
  let state=rules.create(level),firstFill=Infinity;
  try{
    entry.witness.forEach((chain,i)=>{
      check(state.outcome==='playing','witness continues after the game ended');
      state=rules.move(level,state,chain);
      if(state.last.order>=0&&firstFill===Infinity)firstFill=i;
      for(const r of state.last.refill){check(SPAWN.includes(r.value),`refill ${r.value} is off the spawn list`);check(r.value!==GREEN,'a refill is a 3');}
    });
  }catch(e){fails.push('witness does not replay: '+e.message);return fails;}
  check(state.outcome==='won'&&state.moves===best,'witness does not win in exactly its length');
  check(firstFill===entry.descriptors.setup,`setup moves ${firstFill} differ from the recorded ${entry.descriptors.setup}`);
  check(cellOf(level,firstFill)===cellKey,`descriptors give cell ${cellOf(level,firstFill)}, not ${cellKey}`);
  check(spareGreens(level)===entry.descriptors.spare&&ordersOf(level)===entry.descriptors.orders,'spare/orders descriptors differ');
  check(rules.chains(rules.create(level),8).length>=MIN_OPEN,'fewer than 60 opening chains');
  check(search.exhaustive(level,3).win===null,'a win in 3 moves or fewer exists');
  const ord=ordinaryPlayer(level);
  check(ord.outcome==='won','the ordinary player loses at the budget');
  // the stored winning line for every counted first chain
  const firsts=new Set();
  for(const [i,line] of entry.paths.entries()){
    try{
      const s=rules.replay(level,line.map(chain=>({type:'move',chain})));
      check(s.outcome==='won'&&s.moves<=level.moves,`path ${i} does not win within the budget`);
      firsts.add(chainKey(line[0]));
    }catch(e){fails.push(`path ${i} does not replay: ${e.message}`);}
  }
  check(firsts.size===entry.paths.length&&firsts.size===entry.fitness&&entry.fitness===entry.firstMoves,'distinct first chains differ from the recorded fitness');
  check(firsts.size>=MIN_FIRST,`fewer than ${MIN_FIRST} distinct winning first chains`);
  const wins=proxyWins(level);
  check(entry.bites.harvestObviousGreedyLose===Object.values(wins).every(w=>w>level.moves),'recorded proxy bite differs');
  check(JSON.stringify(entry.difficulty)===JSON.stringify(difficulty(level)),'difficulty differs from the recorded measurement');
  check(JSON.stringify(entry.split)===JSON.stringify(splitReport(level,entry.witness)),'split report differs');
  if(deep){
    const lines=cfg.beams.map(o=>search.solve(level,{...o,budget:best})).filter(Boolean);
    check(lines.length>0&&Math.min(...lines.map(l=>l.moves))===best,'a beam does not reproduce the best line length');
    const shorter=cfg.beams.map(o=>search.solve(level,{...o,budget:best-1})).filter(Boolean);
    check(!shorter.length,'a beam finds a shorter line');
    const again=collectBestLines(level,best,cfg.collect);
    check(again.every(p=>lineSetup(level,p)>=firstFill),'a best line fills an order sooner than the recorded setup');
  }
  return fails;
}
function verifyArchive(archive,{deep=false}={}){
  const results=[],seen=new Set(),top=[];
  if(!archive||archive.format!=='shared-material-archive'||!archive.cells)return {ok:false,top:['not an archive'],results};
  const cfg=archive.args&&archive.args.cfg?archive.args.cfg:DEFAULT_CFG;
  for(const [k,e] of Object.entries(archive.cells)){
    const failures=ALL_CELLS.includes(k)?verifyEntry(k,e,{deep,cfg}):['unknown cell key'];
    if(e&&seen.has(e.hash))failures.push('same board in two cells');
    if(e)seen.add(e.hash);
    results.push({cell:k,ok:!failures.length,failures});
  }
  if(archive.cellCount!==Object.keys(archive.cells).length)top.push('cellCount does not match');
  return {ok:!top.length&&results.every(r=>r.ok),top,results};
}

// ---------------------------------------------------------------- CLI
function parseArgs(argv){
  const a={seed:1,evals:100,out:null,verify:null,maxSeconds:3300,deep:false,quiet:false,beamWide:null,beamNarrow:null};
  for(let i=0;i<argv.length;i++){
    const k=argv[i],v=()=>argv[++i];
    if(k==='--seed')a.seed=Number(v());else if(k==='--evals')a.evals=Number(v());else if(k==='--out')a.out=v();
    else if(k==='--verify')a.verify=v();else if(k==='--max-seconds')a.maxSeconds=Number(v());else if(k==='--deep')a.deep=true;
    else if(k==='--quiet')a.quiet=true;else if(k==='--beam-wide')a.beamWide=Number(v());else if(k==='--beam-narrow')a.beamNarrow=Number(v());
    else throw new Error('unknown option '+k);
  }
  return a;
}
function main(argv){
  const a=parseArgs(argv);
  if(a.verify){
    const r=verifyArchive(readArchive(a.verify),{deep:a.deep});
    for(const x of r.results)console.log((x.ok?'PASS ':'FAIL ')+x.cell+(x.ok?'':' - '+x.failures.join('; ')));
    for(const t of r.top)console.log('FAIL archive - '+t);
    console.log(r.ok?`verified ${r.results.length} cells`:'VERIFY FAILED');
    return r.ok?0:1;
  }
  const cfg={...DEFAULT_CFG,beams:DEFAULT_BEAMS.map((b,i)=>({...b,beam:(i===0?a.beamWide:a.beamNarrow)||b.beam}))};
  const archive=runSearch({seed:a.seed,evals:a.evals,maxSeconds:a.maxSeconds,cfg,log:a.quiet?()=>{}:console.log});
  if(a.out)writeArchive(archive,a.out);
  console.log(`seed ${a.seed}: ${archive.cellCount}/${archive.cellsPossible} cells in ${archive.stats.evaluated} evals, ${archive.run.seconds.toFixed(1)}s (${archive.run.stoppedBy})`);
  console.log('rejections: '+JSON.stringify(archive.stats.rejected));
  return 0;
}
if(require.main===module)process.exitCode=main(process.argv.slice(2));

module.exports={COLS,ROWS,SPAWN,ALL_CELLS,DEFAULT_CFG,DEFAULT_BEAMS,SLACK,makeRng,makeLevel,boardHash,hashOfLevel,genomeOf,familyProblems,
  greensOn,spareGreens,binX,binZ,setupMoves,cellOf,budgetFor,ordinaryPlayer,playerScore,proxyWins,greedyFill,splitReport,difficulty,
  collectBestLines,winningFirstMoves,evaluate,better,sampleBoard,mutate,runSearch,buildArchive,writeArchive,readArchive,
  verifyEntry,verifyArchive,parseArgs,main};
