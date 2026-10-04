/* Isolated extension; the existing Connection Run remains unchanged. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../connections-continuous/model'),require('../archetype-trio/model'),require('../../solver/engine'));
  else root.Continuous=factory(root.Continuous,root.Archetypes,root.ChainCore);
})(typeof globalThis==='object'?globalThis:this,function(base,rules,core){
  'use strict';
  const THRESHOLD=2048,CAPACITY=3;
  const copy=v=>JSON.parse(JSON.stringify(v));
  function create(id='continuous',boardNumber=0){
    return {...base.create(id,boardNumber),charges:0};
  }
  function award(next){
    const qualifies=next.last.landing.value>=THRESHOLD;
    next.last.powerupEarned=qualifies&&next.charges<CAPACITY;
    next.last.powerupFull=qualifies&&!next.last.powerupEarned;
    if(next.last.powerupEarned)next.charges++;
    return next;
  }
  function move(state,chain){return award(base.move(state,chain));}
  function preview(state,chain){return award(base.preview(state,chain));}
  function canRemove(state,position){
    if(state.charges<1||!['playing','no-chains'].includes(state.outcome))return false;
    if(!Array.isArray(position)||position.length!==2||!position.every(Number.isInteger))return false;
    const [x,y]=position;
    return x>=0&&x<state.gridWidth&&y>=0&&y<state.gridHeight&&Boolean(state.grid[y][x]);
  }
  function remove(state,position){
    if(!canRemove(state,position))throw new Error('Invalid removal');
    const next=copy(state),[x,y]=position,value=next.grid[y][x].value;
    next.grid[y][x]=null;next.charges--;next.moves++;next.totalMoves++;
    core.applyGravity(next);
    // One removal leaves one space. Reuse the ordinary board's seeded refill stream.
    const random=core.makeRng(9000+state.boardNumber*997);
    for(let i=0;i<next.randomCursor;i++)random();
    const spawned=base.VALUES[Math.floor(random()*base.VALUES.length)];
    next.randomCursor++;
    next.grid[0][x]={x,y:0,value:spawned,cargo:false,blocker:null};
    const ordinary=rules.withLevels({continuous:{grid:next.grid.map(row=>row.map(tile=>tile.value))}});
    next.outcome=ordinary.hasMove(next)?'playing':'no-chains';
    next.last={type:'remove',removed:{x,y,value},points:0,
      refill:[{x,y:0,value:spawned}],completedObjective:null};
    return next;
  }
  function newBoard(state){return {...base.newBoard(state),charges:state.charges};}
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
      else if(action.type==='remove')state=remove(state,action.position);
      else if(action.type==='skip')state=base.skip(state);
      else if(action.type==='new-board')state=newBoard(state);
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {...base,THRESHOLD,CAPACITY,create,move,preview,canRemove,remove,newBoard,replay};
});
