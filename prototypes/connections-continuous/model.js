/* Local prototype. Objectives observe normal moves; they never restrict them. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../archetype-trio/model'),require('../../solver/engine'));
  else root.Continuous=factory(root.Archetypes,root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(rules,core){
  'use strict';
  const VALUES=[2,4,8,16,32,64,128];
  // A rotating bank of spatial/route recipes, instantiated on the current board.
  const BANK=Array.from({length:24},(_,i)=>({id:i+1,
    mode:['prepare','connect','prepare','connect'][i%4],
    span:[3,2,4,3,2,4][i%6],preferPower:i%3!==2}));
  const copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  const span=chain=>Math.max(Math.abs(chain[0][0]-chain.at(-1)[0]),Math.abs(chain[0][1]-chain.at(-1)[1]));
  const sum=(state,chain)=>chain.reduce((n,[x,y])=>n+state.grid[y][x].value,0);
  function baseFor(boardNumber){
    const random=core.makeRng(4242+boardNumber*997);
    const grid=Array.from({length:6},()=>Array.from({length:5},()=>VALUES[Math.floor(random()*VALUES.length)]));
    return rules.withLevels({continuous:{name:'Connection Run',seed:9000+boardNumber*997,
      moves:Number.MAX_SAFE_INTEGER,target:Number.MAX_SAFE_INTEGER,spawnValues:VALUES,grid}});
  }
  function valid(state,chain,complete=true){return baseFor(state.boardNumber).valid(state,chain,complete);}
  function legalChains(state,maxNodes=1800,maxLength=8){
    const game=baseFor(state.boardNumber),chains=[];let nodes=0;
    function visit(chain){
      if(++nodes>maxNodes)return;
      if(chain.length>=3)chains.push(chain);
      if(chain.length>=maxLength)return;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(nodes>=maxNodes)return;
        const next=[...chain,[x+dx,y+dy]];if(game.valid(state,next,false))visit(next);
      }
    }
    for(let y=0;y<state.gridHeight&&nodes<maxNodes;y++)for(let x=0;x<state.gridWidth&&nodes<maxNodes;x++)visit([[x,y]]);
    return chains;
  }
  function matches(state,chain,objective=state.objective){
    if(!objective||!valid(state,chain))return false;
    const [a,b]=objective.ends,first=chain[0],last=chain.at(-1);
    return ((same(first,a)&&same(last,b))||(same(first,b)&&same(last,a)))&&sum(state,chain)===objective.target;
  }
  // A bounded exact-target check: an exhausted bound is UNKNOWN, not "no route".
  function alreadyConnects(state,objective){
    const game=baseFor(state.boardNumber);let nodes=0,unknown=false;
    function walk(chain,total,end){
      if(++nodes>3000){unknown=true;return false;}
      if(total>objective.target)return false;
      if(same(chain.at(-1),end))return chain.length>=3&&total===objective.target;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(unknown)return false;
        const next=[...chain,[x+dx,y+dy]];
        if(game.valid(state,next,false)&&walk(next,total+state.grid[y+dy][x+dx].value,end))return true;
      }
      return false;
    }
    for(const [start,end]of [[objective.ends[0],objective.ends[1]],[objective.ends[1],objective.ends[0]]]){
      if(walk([start],state.grid[start[1]][start[0]].value,end))return true;
      if(unknown)return true; // Cannot claim a preparation-only card from this position.
    }
    return false;
  }
  function issue(state){
    if(state.outcome!=='playing'){state.objective=null;return state;}
    const number=state.issued+1,spec=BANK[(number-1)%BANK.length];
    const chains=legalChains(state),candidates=[];
    function candidate(position,chain,witness,mode){
      if(span(chain)<2)return;
      const target=sum(position,chain);
      candidates.push({ends:[chain[0],chain.at(-1)],target,witness,mode,span:span(chain),
        power:Number.isInteger(Math.log2(target))});
    }
    for(const chain of chains)candidate(state,chain,[chain],'connect');
    if(spec.mode==='prepare'||!candidates.some(c=>c.span>=spec.span)){
      const source=copy(state);source.grid.flat().forEach(tile=>tile.currentMaterial=true);
      // Short power-of-two constructions are useful setup candidates, not a human policy proxy.
      const setups=[...chains].sort((a,b)=>Number(Number.isInteger(Math.log2(sum(state,b))))-Number(Number.isInteger(Math.log2(sum(state,a))))||a.length-b.length).slice(0,16);
      for(const setup of setups){
        const after=baseFor(state.boardNumber).move(source,setup,false);
        if(after.outcome!=='playing')continue;
        const landing=[after.last.landing.x,after.last.landing.y];
        for(const chain of legalChains(after,900,7)){
          if(span(chain)<2||!chain.some(p=>same(p,landing))||!chain.every(([x,y])=>after.grid[y][x].currentMaterial))continue;
          const goal={ends:[chain[0],chain.at(-1)],target:sum(after,chain)};
          if(!alreadyConnects(state,goal))candidate(after,chain,[setup,chain],'prepare');
          if(candidates.filter(c=>c.mode==='prepare').length>=24)break;
        }
        if(candidates.filter(c=>c.mode==='prepare').length>=24)break;
      }
    }
    if(!candidates.length){state.objective=null;return state;}
    const rank=c=>(c.mode===spec.mode?8:0)+(c.span>=spec.span?4:0)+(c.power===spec.preferPower?1:0);
    const best=Math.max(...candidates.map(rank)),choices=candidates.filter(c=>rank(c)===best);
    const chosen=choices[(number*17+state.boardNumber*7)%choices.length];
    state.issued=number;
    state.objective={number,bankCard:spec.id,ends:chosen.ends.map(p=>[...p]),target:chosen.target,
      issuedAt:state.totalMoves,mode:chosen.mode,requestedMode:spec.mode,
      span:chosen.span,requestedSpan:spec.span,witness:copy(chosen.witness)};
    return state;
  }
  function create(id='continuous',boardNumber=0){
    if(id!=='continuous')throw new Error('Unknown level');
    const state=baseFor(boardNumber).create('continuous');
    Object.assign(state,{boardNumber,totalMoves:0,issued:0,completed:0,skipped:0,log:[],notes:[],objective:null});
    if(!baseFor(boardNumber).hasMove(state)){
      [8,8,16].forEach((value,x)=>{state.grid[0][x].value=value;});
    }
    return issue(state);
  }
  function endObjective(state,status){
    if(!state.objective)return;
    const {witness,...objective}=state.objective;
    state.log.push({...objective,status,endedAt:state.totalMoves,movesSpent:state.totalMoves-objective.issuedAt,boardNumber:state.boardNumber});
    if(status==='completed')state.completed++;else state.skipped++;
  }
  function transition(state,chain,advance){
    const success=matches(state,chain),next=baseFor(state.boardNumber).move(state,chain,false);
    next.totalMoves=state.totalMoves+1;
    next.last.completedObjective=success?copy(state.objective):null;
    // No score target or move cap in continuous play; only normal absence of legal moves stops this board.
    next.outcome=baseFor(state.boardNumber).hasMove(next)?'playing':'no-chains';
    if(success){endObjective(next,'completed');if(advance){next.objective=null;issue(next);}}
    else if(!next.objective&&advance)issue(next);
    return next;
  }
  function move(state,chain){return transition(state,chain,true);}
  function preview(state,chain){return transition(state,chain,false);}
  function skip(state){
    const next=copy(state);endObjective(next,'skipped');next.objective=null;return issue(next);
  }
  function newBoard(state){
    const prior=copy(state);endObjective(prior,'new-board');
    const next=baseFor(state.boardNumber+1).create('continuous');
    Object.assign(next,{boardNumber:state.boardNumber+1,totalMoves:state.totalMoves,issued:state.issued,
      completed:prior.completed,skipped:prior.skipped,log:prior.log,notes:prior.notes,objective:null});
    if(!baseFor(next.boardNumber).hasMove(next))[8,8,16].forEach((value,x)=>{next.grid[0][x].value=value;});
    return issue(next);
  }
  function replay(id,actions){
    if(id!=='continuous'||!Array.isArray(actions)||actions.length>2000)throw new Error('Invalid replay');
    let state=create(id);const history=[];
    for(const action of actions){
      if(action.type==='undo'&&history.length){state=history.pop();continue;}
      if(action.type==='feedback'){
        if(!Number.isInteger(action.objective)||action.objective<1||action.objective>state.issued||!['interesting','obvious','stuck','confusing'].includes(action.rating)||typeof action.note!=='string'||action.note.length>1000)throw new Error('Invalid feedback');
        state=copy(state);state.notes.push({objective:action.objective,rating:action.rating,note:action.note,atMove:state.totalMoves});continue;
      }
      history.push(state);
      if(action.type==='move')state=move(state,action.chain);
      else if(action.type==='skip')state=skip(state);
      else if(action.type==='new-board')state=newBoard(state);
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {BANK,VALUES,create,valid,matches,move,preview,skip,newBoard,replay,legalChains};
});
