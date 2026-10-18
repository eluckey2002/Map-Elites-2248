/* Board maker and screen for the Relay connection puzzles. Uses the shipped
   finite Connections rules (src/connection-rules.js) unchanged; nothing here
   is a difficulty or enjoyment claim.
   Usage: node prototypes/connection-relay/search.js <flavor> <tries> [startSeed] */
const rules=require('../../src/connection-rules');
const relay=require('./relay-play');
const VALUES=rules.VALUES;
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
const span=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
const isPower=n=>Number.isInteger(Math.log2(n));
const DUMMY=[0,1,2].map(()=>({ends:[[0,0],[4,5]],target:1e15}));

function rng(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}

// Every legal chain up to maxLength tiles (bounded).
function chains(state,maxLength=6,maxNodes=6000){
  const out=[];let nodes=0;
  function walk(chain){
    if(++nodes>maxNodes)return;
    if(chain.length>=3)out.push(chain);
    if(chain.length>=maxLength)return;
    const [x,y]=chain.at(-1);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const next=[...chain,[x+dx,y+dy]];
      if(rules.valid(state,next,false))walk(next);
    }
  }
  for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)walk([[x,y]]);
  return out;
}
// All chains that complete the goal right now (either direction), bounded.
function goalChains(state,goal,limit=40,maxNodes=8000){
  const found=[];let nodes=0;
  function walk(chain,total,end){
    if(++nodes>maxNodes||found.length>=limit)return;
    if(total>goal.target)return;
    const last=chain.at(-1);
    if(same(last,end)){if(total===goal.target&&chain.length>=3)found.push(chain);return;}
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const next=[...chain,[last[0]+dx,last[1]+dy]];
      if(rules.valid(state,next,false))walk(next,total+state.grid[last[1]+dy][last[0]+dx].value,end);
    }
  }
  walk([goal.ends[0]],state.grid[goal.ends[0][1]][goal.ends[0][0]].value,goal.ends[1]);
  walk([goal.ends[1]],state.grid[goal.ends[1][1]][goal.ends[1][0]].value,goal.ends[0]);
  return {found,exhausted:nodes>maxNodes};
}
function physics(state,chain){ // a normal move that never completes a goal
  const s={...state,objectives:DUMMY,objective:DUMMY[0],completed:0,maxMoves:999,outcome:'playing'};
  return rules.move(s,chain);
}

/* Builds a witnessed three-goal sequence on one start board.
   flavor: 'relay'   goal k+1 starts on the tile goal k made
           'reunion' goals 1 and 2 each make a tile; goal 3 joins those two tiles
           'home'    all three goals use the same two places; goals 2 and 3 start on the tile just made
   A goal end that starts on a made tile follows that tile (relay-play.js), so setups track it. */
function author(grid,refillSeed,flavor,random){
  const level={id:'draft',moves:999,refillSeed,grid,objectives:DUMMY};
  let state=rules.create(level);
  const goals=[],actions=[],made=[];
  for(let k=0;k<3;k++){
    // Made tiles this goal starts on, followed through one- or two-move setups that leave them alone.
    const needed=flavor==='reunion'?(k===2?[0,1]:[]):k?[k-1]:[];
    const keep=flavor==='reunion'?made.map((_,i)=>i):needed,start=keep.map(i=>made[i]);
    const anchor=pos=>needed.map(i=>pos[keep.indexOf(i)]);
    const touches=(setup,pos)=>pos.some(p=>setup.some(q=>same(p,q)));
    const prepared=[];
    for(const first of chains(state,6).sort(()=>random()-.5).slice(0,k?60:30)){
      if(touches(first,start))continue;
      const one=physics(state,first);if(one.outcome!=='playing')continue;
      const pos1=start.map(p=>relay.followMove(first,p));
      prepared.push({setup:[first],after:one,pos:pos1});
      if(k===0)continue;
      for(const second of chains(one,6).sort(()=>random()-.5).slice(0,12)){
        if(touches(second,pos1))continue;
        const two=physics(one,second);
        if(two.outcome==='playing')prepared.push({setup:[first,second],after:two,pos:pos1.map(p=>relay.followMove(second,p))});
      }
    }
    const options=[];
    for(const {setup,after,pos:kept} of prepared.sort(()=>random()-.5)){
      const pos=anchor(kept);
      const landing=[after.last.landing.x,after.last.landing.y];
      for(const chain of chains(after,7,3000)){
        const a=chain[0],b=chain.at(-1);
        if(span(a,b)<2)continue;
        if(k===0&&!chain.some(p=>same(p,landing)))continue;
        const target=chain.reduce((n,[x,y])=>n+after.grid[y][x].value,0);
        if(target<(k?32:16)||target>1024)continue;
        if(k<2&&!isPower(target))continue;
        // The chain starts on the followed tile; for reunion goal 3 it joins both.
        if(needed.length===1&&!same(a,pos[0]))continue;
        if(needed.length===2&&!(same(a,pos[0])&&same(b,pos[1])))continue;
        if(flavor==='home'&&k>0&&!(goals[0].ends.some(e=>same(e,a))&&goals[0].ends.some(e=>same(e,b))))continue;
        if(flavor==='reunion'&&k===1&&(chain.some(p=>same(p,kept[0]))||span(kept[0],b)<2))continue;
        options.push({setup,chain,target,before:after,kept});
        if(options.length>400)break;
      }
      if(options.length>400)break;
    }
    // Keep goals that need at least one setup move from where they are issued, and that land on ②.
    let pick=null;
    for(const o of options.sort(()=>random()-.5).slice(0,60)){
      const after=physics(o.before,o.chain);
      const landing=[after.last.landing.x,after.last.landing.y];
      if(k<2&&!same(landing,o.chain.at(-1)))continue;
      // Ends as shown when the goal appears: followed ends sit where their tiles were then.
      const issued=anchor(start),ends=[needed.length?issued[0]:o.chain[0],needed.length===2?issued[1]:o.chain.at(-1)];
      if(same(ends[0],ends[1]))continue;
      const g=goalChains(state,{ends,target:o.target},1);
      if(g.found.length||g.exhausted)continue;
      pick={...o,landing,after,ends};break;
    }
    if(!pick){if(process.env.DBG)console.error('fail at goal',k+1,'options',options.length);return null;}
    goals.push({ends:pick.ends,target:pick.target,follow:needed.map((m,end)=>({end,made:m}))});
    for(const c of pick.setup)actions.push({type:'move',chain:c});actions.push({type:'move',chain:pick.chain});
    // Made tiles move with the goal chain too (none is in it: setups and options leave them alone).
    keep.forEach((i,j)=>{made[i]=relay.followMove(pick.chain,pick.kept[j]);});
    made.push(pick.landing);
    state=pick.after;
  }
  return {grid,refillSeed,objectives:goals,witness:actions};
}

/* An ordinary player: completes the goal when it can; otherwise makes a move
   after which the goal can be completed (picked at random among those);
   otherwise a random plain merge of 3 to 5 tiles. No undo, no preview of refills. */
function ordinary(level,random,maxMoves){
  let state=relay.create({...level,moves:maxMoves});
  while(state.outcome==='playing'){
    const now=goalChains(state,state.objective,12);
    if(now.found.length){state=relay.move(state,now.found[Math.floor(random()*now.found.length)]);continue;}
    const all=chains(state,5,2500);
    if(!all.length)break;
    const order=all.map(c=>[random(),c]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
    let chosen=null;
    for(const c of order.slice(0,120)){
      const next=relay.move(state,c);
      if(next.outcome==='playing'&&goalChains(next,next.objective,1,3000).found.length){chosen=c;break;}
    }
    // Plain move: leave the marked tiles alone and build a piece no bigger than half the target.
    if(!chosen){
      // Protected: the marked tiles, and made tiles a later connection still needs.
      const goal=state.objective,later=state.objectives.slice(state.completed+1).flatMap(g=>(g.follow||[]).map(l=>state.relay.made[l.made]?.at).filter(Boolean));
      const guard=[...goal.ends,...later],marked=c=>c.some(p=>guard.some(e=>same(e,p)));
      const piece=c=>{const v=c.reduce((n,[x,y])=>n+state.grid[y][x].value,0);return v<=goal.target/2;};
      chosen=order.find(c=>!marked(c)&&piece(c))||order.find(c=>!marked(c))||order[0];
    }
    state=relay.move(state,chosen);
  }
  return {won:state.outcome==='won',moves:state.moves,completed:state.completed};
}
function screen(level,trials=40,cap=40){
  const random=rng(level.refillSeed*31+7),runs=[];
  for(let i=0;i<trials;i++)runs.push(ordinary(level,random,cap));
  const wins=runs.filter(r=>r.won).map(r=>r.moves).sort((a,b)=>a-b);
  const at=q=>wins.length?wins[Math.min(wins.length-1,Math.floor(q*(trials)))]:null;
  return {trials,wins:wins.length,fastest:wins[0]??null,median:at(.5),p80:wins.length>=.8*trials?wins[Math.ceil(.8*trials)-1]:null,p90:wins.length>=.9*trials?wins[Math.ceil(.9*trials)-1]:null};
}
function randomGrid(random){
  return Array.from({length:6},()=>Array.from({length:5},()=>VALUES[Math.floor(random()*VALUES.length)]));
}
if(require.main===module){
  const [flavor='relay',triesArg='20',seedArg='1']=process.argv.slice(2);
  for(let s=+seedArg;s<+seedArg+ +triesArg;s++){
    const random=rng(s*7919);
    const draft=author(randomGrid(random),1000+s,flavor,random);
    if(!draft){continue;}
    const level={id:`${flavor}-${s}`,moves:40,...draft};
    const check=relay.replay(level,draft.witness);
    if(check.outcome!=='won'){console.error('witness failed',s);continue;}
    const result=screen(level,30,40);
    console.log(JSON.stringify({seed:s,flavor,targets:draft.objectives.map(g=>g.target),witness:draft.witness.length,...result,level:draft}));
  }
}
module.exports={author,ordinary,screen,chains,goalChains,randomGrid,rng};
