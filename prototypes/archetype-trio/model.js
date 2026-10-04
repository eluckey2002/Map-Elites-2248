/* Isolated playtest rules. The shipped engine and level data remain untouched. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../solver/engine'));
  else root.Archetypes = factory(root.ChainCore);
})(typeof globalThis === 'object' ? globalThis : this, function buildRules(core, levels) {
  'use strict';
  const LEVELS = levels || {
    gates: {
      name: 'Gates', subtitle: 'Choose your connections', seed: 104,
      target: 3300, moves: 6, switch: [1,2], gates: [[3,1],[3,4]],
      rule: 'End a chain on the switch to open the upper passage and close the lower one. Switch again to reverse them.',
      question: 'Did changing the connections change your plan?',
      grid: [[2,2,4,0,4,2,2],[4,8,512,512,512,8,4],[2,4,8,0,8,4,2],
        [2,2,4,0,4,2,2],[4,8,128,128,128,128,128],[2,4,8,0,8,4,2]],
    },
    delivery: {
      name: 'Delivery', subtitle: 'Leave a way through', seed: 208,
      moves: 8, exit: 2,
      rule: 'Clear a route beneath the parcel. Your last selected tile stays as the merged tile, so choose where the chain ends.',
      question: 'Did moving the parcel change where you ended your chains?',
      grid: [[2,4,8,4,2],[2,8,'cargo',8,2],[8,4,4,8,4],
        [2,8,4,8,2],[32,32,64,32,4],[2,8,8,16,16]],
    },
    feeders: {
      name: 'Feeder Choice', subtitle: 'Send the right material', seed: 312,
      target: 1700, moves: 10, feeders: [1,3],
      packets: [[2,2,4,4,8,8],[8,8,16,16,4,4]],
      rule: 'Swap the two refill queues before you merge. Only cleared spaces consume tiles; unused values stay in their queue.',
      question: 'Did choosing the refill help you shape a later chain?',
      grid: [[4,2,4,8,2],[2,2,4,8,4],[4,4,8,16,2],
        [2,8,16,32,4],[4,8,16,32,8],[2,4,8,16,4]],
    },
  };
  const copy = value => JSON.parse(JSON.stringify(value));
  function create(id) {
    if (!Object.hasOwn(LEVELS,id)) throw new Error('Unknown level');
    const level=LEVELS[id];
    return { id, gridWidth: level.grid[0].length, gridHeight: level.grid.length,
      grid: level.grid.map((row,y)=>row.map((value,x)=>value===0 ? null :
        ({x,y,value:value==='cargo'?0:value,cargo:value==='cargo',blocker:null}))),
      minChain:3, tileScale:1, score:0, moves:0, maxMoves:level.moves,
      targetScore:level.target || 0, gate:'lower', randomCursor:0,
      packetCursors:[0,0], swapped:false, delivered:0, outcome:'playing', last:null };
  }
  function blocked(state,x,y) {
    const level=LEVELS[state.id];
    if(x<0||y<0||x>=state.gridWidth||y>=state.gridHeight) return true;
    if(level.grid[y][x]===0) return true;
    if(level.gates) {
      const closed=level.gates[state.gate==='lower'?0:1];
      if(x===closed[0]&&y===closed[1]) return true;
    }
    return false;
  }
  function valid(state,chain,complete=true) {
    if(!Array.isArray(chain)||chain.length<(complete?state.minChain:1)) return false;
    const seen=new Set(),tiles=[];
    for(const position of chain) {
      if(!Array.isArray(position)||position.length!==2||!position.every(Number.isInteger)) return false;
      const [x,y]=position,key=`${x},${y}`,tile=state.grid[y]?.[x];
      if(blocked(state,x,y)||!tile||tile.cargo||seen.has(key)) return false;
      const previous=tiles.at(-1);
      if(previous&&Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y))!==1) return false;
      if(!core.canExtendChain(tiles,tile)) return false;
      seen.add(key); tiles.push(tile);
    }
    return true;
  }
  function settle(state) {
    for(let x=0;x<state.gridWidth;x++) {
      let dest=state.gridHeight-1;
      for(let y=state.gridHeight-1;y>=0;y--) {
        if(blocked(state,x,y)) { dest=y-1; continue; }
        const tile=state.grid[y][x];
        if(!tile) continue;
        if(dest!==y) { state.grid[dest][x]=tile; state.grid[y][x]=null; tile.y=dest; }
        dest--;
      }
    }
  }
  function packet(state,index,count=6) {
    const values=LEVELS[state.id].packets[index];
    return Array.from({length:count},(_,i)=>values[(state.packetCursors[index]+i)%values.length]);
  }
  function hasMove(state) {
    function extend(chain) {
      if(chain.length>=state.minChain) return true;
      const [x,y]=chain.at(-1);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const next=[...chain,[x+dx,y+dy]];
        if(valid(state,next,false)&&extend(next)) return true;
      }
      return false;
    }
    for(let y=0;y<state.gridHeight;y++) for(let x=0;x<state.gridWidth;x++) {
      if(valid(state,[[x,y]],false)&&extend([[x,y]])) return true;
    }
    return false;
  }
  function move(input,chain,swapped=input.swapped) {
    if(input.outcome!=='playing') throw new Error('Game has finished');
    if(typeof swapped!=='boolean'||!valid(input,chain)) throw new Error('Invalid chain');
    const state=copy(input),level=LEVELS[state.id];
    state.swapped=swapped;
    const tiles=chain.map(([x,y])=>state.grid[y][x]),survivor=tiles.at(-1);
    const endpoint=chain.at(-1),points=core.executeChain(state,tiles);
    const gateChanged=Boolean(level.switch&&endpoint[0]===level.switch[0]&&endpoint[1]===level.switch[1]);
    if(gateChanged) state.gate=state.gate==='lower'?'upper':'lower';
    settle(state);
    if(level.exit!==undefined && state.grid[state.gridHeight-1][level.exit]?.cargo) {
      state.grid[state.gridHeight-1][level.exit]=null; state.delivered++; settle(state);
    }
    const random=core.makeRng(level.seed);
    for(let i=0;i<state.randomCursor;i++) random();
    const refill=[];
    for(let x=0;x<state.gridWidth;x++) for(let y=0;y<state.gridHeight;y++) {
      if(blocked(state,x,y)||state.grid[y][x]) continue;
      let value;
      const feeder=level.feeders?.indexOf(x) ?? -1;
      if(feeder>=0) {
        const source=swapped?1-feeder:feeder;
        value=packet(state,source,1)[0]; state.packetCursors[source]++;
      } else {
        const draw=random(); state.randomCursor++;
        value=level.spawnValues ? level.spawnValues[Math.floor(draw*level.spawnValues.length)] : draw<0.6?2:draw<0.9?4:8;
      }
      state.grid[y][x]={x,y,value,cargo:false,blocker:null}; refill.push({x,y,value});
    }
    const won=level.exit!==undefined ? state.delivered>0 : state.score>=level.target;
    state.outcome=won?'won':state.moves>=state.maxMoves?'out-of-moves':!hasMove(state)?'no-chains':'playing';
    state.last={points,landing:{x:survivor.x,y:survivor.y,value:survivor.value},
      gateChanged,delivered:state.delivered-input.delivered,refill};
    return state;
  }
  function replay(id,actions) {
    let state=create(id);const history=[];
    if(!Array.isArray(actions)||actions.length>300) throw new Error('Invalid action list');
    for(const action of actions) {
      if(action.type==='move') { history.push(state); state=move(state,action.chain,action.swapped); }
      else if(action.type==='undo'&&history.length) state=history.pop();
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {LEVELS,create,blocked,valid,move,packet,hasMove,replay,
    withLevels: levels => buildRules(core,copy(levels))};
});
