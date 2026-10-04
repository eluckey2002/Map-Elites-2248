const {test} = require('node:test');
const assert = require('node:assert/strict');
const game = require('./model');
const routes = require('./witnesses.json');
const values = state => state.grid.map(row=>row.map(tile=>tile?.value || 0));
const count = state => state.grid.flat().filter(Boolean).length;
const apply = (state,action) => action.type==='rotate' ? game.rotate(state,action.direction) : game.move(state,action.chain);

test('a paid turn gains a connection and disrupts a ready harvest without touching the input',()=>{
  const initial = game.create(), saved = JSON.stringify(initial);
  const ready = routes.harvestFirst[0].chain;
  assert.ok(game.valid(initial,ready));
  assert.equal(game.move(initial,ready).last.points,192);
  const left = game.rotate(initial,'cw');
  assert.equal(left.gravity,'left'); assert.equal(left.moves,1);
  assert.equal(left.score,0); assert.equal(left.randomCursor,0);
  assert.equal(count(left),17); assert.equal(JSON.stringify(initial),saved);
  assert.ok(game.valid(left,routes.turnFirst[1].chain));
  assert.equal(game.valid(left,[[1,2],[3,3],[4,4]]),false,'Ready 32s are now separated');
  const harvestThenLeft = game.rotate(game.move(initial,ready),'cw');
  assert.equal(game.valid(harvestThenLeft,[[1,3],[3,3],[0,4]]),false,'The same big connection needs another preparation');
  assert.ok(game.valid(game.move(initial,ready),[[2,1],[3,1],[2,2]]),
    'An ordinary follow-up remains available; the opening harvest does not force a rescue turn');
});

test('all four gravity directions preserve order and coordinates on a non-square board',()=>{
  const initial = game.create();
  initial.gridWidth=3; initial.gridHeight=2;
  initial.grid=[[{x:0,y:0,value:2},null,{x:2,y:0,value:4}],[null,{x:1,y:1,value:8},null]];
  const cases = [
    ['down','cw','left',[[2,4,0],[8,0,0]]],
    ['down','ccw','right',[[0,2,4],[0,0,8]]],
    ['left','cw','up',[[2,8,4],[0,0,0]]],
    ['right','cw','down',[[0,0,0],[2,8,4]]],
  ];
  for (const [before,turn,after,expected] of cases) {
    const state=game.rotate({...initial,gravity:before},turn);
    assert.equal(state.gravity,after); assert.deepEqual(values(state),expected);
    assert.equal(count(state),3);
    state.grid.forEach((row,y)=>row.forEach((tile,x)=>{if(tile)assert.deepEqual([tile.x,tile.y],[x,y]);}));
  }
  assert.deepEqual(values(initial),[[2,0,4],[0,8,0]]);
});

test('merges refill only removed material in its lanes and preserve empty space in every direction',()=>{
  for (const gravity of ['down','left','up','right']) {
    const initial=game.create(); initial.gridWidth=3; initial.gridHeight=3; initial.gravity=gravity;
    initial.grid=Array.from({length:3},(_,y)=>Array.from({length:3},(_,x)=>y===0 ? {x,y,value:2} : null));
    const before=JSON.stringify(initial), state=game.move(initial,[[0,0],[1,0],[2,0]]);
    assert.equal(state.last.points,9); assert.equal(state.last.landing.value,6);
    assert.equal(state.moves,1); assert.equal(count(state),3);
    assert.equal(state.last.refill.length,2); assert.equal(state.randomCursor,2);
    assert.equal(JSON.stringify(initial),before);
    state.grid.forEach((row,y)=>row.forEach((tile,x)=>{if(tile)assert.deepEqual([tile.x,tile.y],[x,y]);}));
    assert.ok(state.last.refill.every(tile=>game.LEVELS.turn.spawnValues.includes(tile.value)));
    if(gravity==='left'||gravity==='right') assert.ok(state.grid.slice(1).every(row=>row.every(tile=>tile===null)));
  }
});

test('no-chain positions still allow turns; cost, direction and terminal guards apply',()=>{
  const initial=game.create(); initial.grid=initial.grid.map(row=>row.map(()=>null));
  initial.grid[4][0]={x:0,y:4,value:2};
  assert.equal(game.rotate(initial,'cw').outcome,'playing');
  assert.equal(game.rotate({...initial,moves:7},'cw').outcome,'out-of-moves');
  assert.throws(()=>game.rotate(initial,'left'),/Invalid turn/);
  assert.throws(()=>game.move(initial,[[0,4],[0,4],[0,4]]),/Invalid chain/);
  for(const outcome of ['won','out-of-moves']) assert.throws(()=>game.rotate({...initial,outcome},'cw'),/finished/);
  assert.equal(game.valid(game.create(),[[0,0]]),false);
  assert.equal(game.valid(game.create(),[[3.5,2]]),false);
  assert.equal(game.valid(game.create(),[[3,2],[4,3],[3,2]]),false);
  assert.throws(()=>game.replay('turn',[{type:'undo'}]),/Invalid replay/);
  assert.throws(()=>game.replay('turn',[null]),/Invalid replay/);
  assert.throws(()=>game.replay('turn',[{type:'rotate',direction:'bad'}]),/Invalid turn/);
});

test('both opening plans win using original/built material, with exact replay and undo for turns',()=>{
  for(const name of ['turnFirst','harvestFirst']) {
    let state=game.create(); state.grid.flat().filter(Boolean).forEach(tile=>{tile.initialMaterial=true;});
    for(const action of routes[name]) {
      if(action.type==='move') assert.ok(action.chain.every(([x,y])=>state.grid[y][x]?.initialMaterial),name+' uses no refill');
      state=apply(state,action); assert.equal(count(state),17);
    }
    assert.equal(state.outcome,'won'); assert.equal(state.moves,4);
    assert.equal(state.score,name==='turnFirst'?576:624);
    const replay=game.replay('turn',routes[name]);
    const plain=game.create(); let expected=plain;
    for(const action of routes[name])expected=apply(expected,action);
    assert.deepEqual(replay,expected);
    const undone=game.replay('turn',[...routes[name],{type:'undo'}]);
    assert.equal(undone.moves,3); assert.equal(undone.outcome,'playing');
  }
  assert.deepEqual(game.replay('turn',[{type:'rotate',direction:'cw'},{type:'undo'}]),game.create());
});

// Exact opening sanity check only; no heuristic difficulty score.
function legalChains(state,budget) {
  const result=[];
  function visit(chain) {
    assert.ok(--budget.remaining>=0,'Aggregate bound exhausted; absence is unknown');
    if(chain.length>=state.minChain)result.push(chain);
    const [x,y]=chain.at(-1);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
      const next=[...chain,[x+dx,y+dy]];
      if(game.valid(state,next,false))visit(next);
    }
  }
  for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)if(game.valid(state,[[x,y]],false))visit([[x,y]]);
  return result;
}
function shortWin(initial,maxNodes=200000) {
  const budget={remaining:maxNodes};
  const actions=state=>[...legalChains(state,budget).map(chain=>({type:'move',chain})),
    {type:'rotate',direction:'cw'},{type:'rotate',direction:'ccw'}];
  for(const first of actions(initial)) {
    const state=apply(initial,first);
    if(state.outcome==='won')return [first];
    if(state.outcome!=='playing')continue;
    for(const second of actions(state))if(apply(state,second).outcome==='won')return [first,second];
  }
  return null;
}
test('shortcut check sees a known win, fails on aggregate cutoff, and excludes opening two-action wins',()=>{
  assert.ok(shortWin({...game.create(),targetScore:100}));
  assert.throws(()=>shortWin(game.create(),1),/bound exhausted/);
  assert.equal(shortWin(game.create()),null);
});
