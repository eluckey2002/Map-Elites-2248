/* Local playtest only: three connections share one board. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../archetype-trio/model'));
  else root.Connections = factory(root.Archetypes);
})(typeof globalThis === 'object' ? globalThis : this, function buildConnections(rules, layout) {
  'use strict';
  const goals = layout?.goals || [
    {id:'A',kind:'tiles',label:'16 ↔ 16',ends:[[0,3],[0,4]]},
    {id:'B',kind:'tiles',label:'16 → 64',ends:[[2,3],[0,5]]},
    {id:'C',kind:'cells',label:'C1 ↔ C2',ends:[[2,2],[3,3]]},
  ];
  const base=rules.withLevels({connections:layout?.level || {name:'Connections',seed:624,moves:10,
    target:Number.MAX_SAFE_INTEGER,
    grid:[[2,4,4,2,4],[4,8,4,4,2],[8,8,4,8,4],
      [16,32,16,4,8],[16,16,32,32,4],[64,32,128,256,8]],
  }});
  const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  function create(id='connections') {
    const state=base.create(id);
    state.goals=goals.map(goal=>({...goal,ends:goal.ends.map(p=>[...p]),done:false}));
    for(const goal of state.goals.filter(g=>g.kind==='tiles')) {
      goal.ends.forEach(([x,y],index)=>{state.grid[y][x].mark={goal:goal.id,end:index+1};});
    }
    return state;
  }
  function valid(state,chain,complete=true) {
    if(!base.valid(state,chain,complete)) return false;
    const marks=chain.map(([x,y])=>state.grid[y][x].mark);
    const first=marks[0],last=marks.at(-1);
    if(marks.slice(1,-1).some(Boolean)) return false;
    if(!first) return !marks.some(Boolean);
    if(chain.length===1) return !complete;
    if(last&&(last.goal!==first.goal||last.end===first.end)) return false;
    return complete?Boolean(last):true;
  }
  function completions(state,chain) {
    if(!valid(state,chain)) return [];
    const first=chain[0],last=chain.at(-1);
    return state.goals.filter(goal=>!goal.done && (goal.kind==='cells'
      ? (same(first,goal.ends[0])&&same(last,goal.ends[1])) || (same(first,goal.ends[1])&&same(last,goal.ends[0]))
      : state.grid[first[1]][first[0]].mark?.goal===goal.id && state.grid[last[1]][last[0]].mark?.goal===goal.id
    )).map(goal=>goal.id);
  }
  function hasMove(state) {
    function extend(chain) {
      if(valid(state,chain)) return true;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const next=[...chain,[x+dx,y+dy]];
        if(valid(state,next,false)&&extend(next)) return true;
      }
      return false;
    }
    for(let y=0;y<state.gridHeight;y++) for(let x=0;x<state.gridWidth;x++) {
      if(extend([[x,y]])) return true;
    }
    return false;
  }
  function move(state,chain,swapped=false) {
    if(!valid(state,chain)) throw new Error('A chain must start and end on matching goal markers to use them.');
    const completed=completions(state,chain),next=base.move(state,chain,swapped);
    for(const goal of next.goals) if(completed.includes(goal.id)) goal.done=true;
    for(const tile of next.grid.flat()) if(tile.mark&&completed.includes(tile.mark.goal)) delete tile.mark;
    next.last.completed=completed;
    next.outcome=next.goals.every(g=>g.done)?'won':next.moves>=next.maxMoves?'out-of-moves':hasMove(next)?'playing':'no-chains';
    return next;
  }
  function replay(id,actions) {
    if(id!=='connections') throw new Error('Unknown level');
    if(!Array.isArray(actions)||actions.length>300) throw new Error('Invalid action list');
    let state=create(id);const history=[];
    for(const action of actions) {
      if(action.type==='move'){history.push(state);state=move(state,action.chain,action.swapped);}
      else if(action.type==='undo'&&history.length)state=history.pop();
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {create,valid,move,replay,hasMove,completions,
    withLayout: config=>buildConnections(rules,JSON.parse(JSON.stringify(config)))};
});
