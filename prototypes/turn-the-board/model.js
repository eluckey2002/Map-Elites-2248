(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../solver/engine'));
  else root.Archetypes = factory(root.ChainCore);
})(typeof globalThis === 'object' ? globalThis : this, function (core) {
  'use strict';
  const DIRECTIONS = ['down', 'left', 'up', 'right'];
  const LEVELS = {turn: {
    name: 'Turn the Board', subtitle: 'Choose what falls together.', seed: 905,
    target: 550, moves: 8, spawnValues: [2,4,8,16,32,64,128],
    grid: [[0,0,4,0,256],[0,0,8,2,16],[0,0,16,32,64],
      [0,2,64,8,32],[128,8,4,2,64]],
  }};
  const copy = value => JSON.parse(JSON.stringify(value));
  function create(id = 'turn') {
    if (!Object.hasOwn(LEVELS,id)) throw new Error('Unknown level');
    const level = LEVELS[id];
    return {id, gridWidth:level.grid[0].length, gridHeight:level.grid.length,
      grid:level.grid.map((row,y)=>row.map((value,x)=>value ? {x,y,value,blocker:null} : null)),
      minChain:3, tileScale:1, score:0, moves:0, maxMoves:level.moves,
      targetScore:level.target, gravity:'down', randomCursor:0,
      outcome:'playing', last:null};
  }
  function valid(state,chain,complete = true) {
    if (!Array.isArray(chain) || chain.length < (complete ? state.minChain : 1)) return false;
    const seen = new Set(), tiles = [];
    for (const position of chain) {
      if (!Array.isArray(position) || position.length !== 2 || !position.every(Number.isInteger)) return false;
      const [x,y] = position, tile = state.grid[y]?.[x], key = `${x},${y}`;
      if (!tile || seen.has(key)) return false;
      const previous = tiles.at(-1);
      if (previous && Math.max(Math.abs(previous.x-x),Math.abs(previous.y-y)) !== 1) return false;
      if (!core.canExtendChain(tiles,tile)) return false;
      seen.add(key); tiles.push(tile);
    }
    return true;
  }
  // Each lane runs from the destination edge toward the incoming edge.
  function lanes(state) {
    const vertical = state.gravity === 'up' || state.gravity === 'down';
    const count = vertical ? state.gridWidth : state.gridHeight;
    const length = vertical ? state.gridHeight : state.gridWidth;
    return Array.from({length:count},(_,lane)=>Array.from({length},(_,step)=>{
      const offset = state.gravity === 'down' || state.gravity === 'right' ? length-1-step : step;
      return vertical ? [lane,offset] : [offset,lane];
    }));
  }
  function settle(state) {
    for (const lane of lanes(state)) {
      const tiles = lane.map(([x,y])=>state.grid[y][x]).filter(Boolean);
      lane.forEach(([x,y])=>{state.grid[y][x] = null;});
      tiles.forEach((tile,index)=>{
        const [x,y] = lane[index]; tile.x=x; tile.y=y; state.grid[y][x]=tile;
      });
    }
  }
  function finish(state) {
    state.outcome = state.score >= state.targetScore ? 'won' :
      state.moves >= state.maxMoves ? 'out-of-moves' : 'playing';
    // No chain is not terminal: a paid turn can restore a connection.
    return state;
  }
  function move(input,chain) {
    if (input.outcome !== 'playing') throw new Error('Game has finished');
    if (!valid(input,chain)) throw new Error('Invalid chain');
    const state = copy(input), level = LEVELS[state.id];
    const paths = lanes(state);
    const counts = paths.map(lane=>lane.filter(([x,y])=>state.grid[y][x]).length);
    const tiles = chain.map(([x,y])=>state.grid[y][x]), survivor = tiles.at(-1);
    const points = core.executeChain(state,tiles);
    settle(state);
    const rng = core.makeRng(level.seed);
    for (let i=0;i<state.randomCursor;i++) rng();
    const refill = [];
    paths.forEach((lane,index)=>{
      const remaining = lane.filter(([x,y])=>state.grid[y][x]).length;
      // Replenish the removed material only, upstream of the surviving stack.
      for (const [x,y] of lane.slice(remaining,counts[index]).reverse()) {
        const value = level.spawnValues[Math.floor(rng()*level.spawnValues.length)];
        state.randomCursor++;
        state.grid[y][x] = {x,y,value,blocker:null}; refill.push({x,y,value});
      }
    });
    state.last = {type:'move',points,landing:{x:survivor.x,y:survivor.y,value:survivor.value},refill};
    return finish(state);
  }
  function rotate(input,direction) {
    if (input.outcome !== 'playing') throw new Error('Game has finished');
    if (direction !== 'cw' && direction !== 'ccw') throw new Error('Invalid turn');
    const state = copy(input), offset = direction === 'cw' ? 1 : 3;
    state.gravity = DIRECTIONS[(DIRECTIONS.indexOf(state.gravity)+offset)%4];
    settle(state); state.moves++;
    state.last = {type:'rotate',direction,points:0,gravity:state.gravity,refill:[]};
    return finish(state);
  }
  function replay(id,actions) {
    if (!Array.isArray(actions) || actions.length > 300) throw new Error('Invalid action list');
    let state = create(id); const history = [];
    for (const action of actions) {
      if (!action || typeof action !== 'object') throw new Error('Invalid replay action');
      if (action.type === 'move' || action.type === 'rotate') {
        history.push(state);
        state = action.type === 'move' ? move(state,action.chain) : rotate(state,action.direction);
      } else if (action.type === 'undo' && history.length) state = history.pop();
      else throw new Error('Invalid replay action');
    }
    return state;
  }
  return {LEVELS,create,valid,move,rotate,replay};
});
