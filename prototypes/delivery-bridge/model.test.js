const {test}=require('node:test');
const assert=require('node:assert/strict');
const base=require('../archetype-trio/model');
const reference=require('../delivery-sequence/model');
const game=require('./model');
const routes=require('./witnesses.json');
const actions=route=>route.map(chain=>({type:'move',chain,swapped:false}));

test('same four tiles and same sum trade immediate progress for survivor placement',()=>{
  const start=game.create('delivery');
  assert.deepEqual(routes.inside[0].map(String).sort(),routes.outside[0].map(String).sort());
  const inside=game.move(start,routes.inside[0]),outside=game.move(start,routes.outside[0]);
  assert.equal(inside.last.points,outside.last.points);
  assert.equal(inside.last.landing.value,64);
  assert.equal(outside.last.landing.value,64);
  assert.equal(inside.grid[2][2].cargo,true);
  assert.equal(outside.grid[3][2].cargo,true,'Outside endpoint lowers parcel one row farther');
  assert.deepEqual(inside.last.landing,{x:2,y:3,value:64});
  assert.deepEqual(outside.last.landing,{x:3,y:3,value:64});
  assert.deepEqual(start,game.create('delivery'),'Preview does not mutate the initial board');
});

test('the same left-hand clear aligns the inside survivor but leaves the outside one too high',()=>{
  let inside=game.move(game.create('delivery'),routes.inside[0]);
  let outside=game.move(game.create('delivery'),routes.outside[0]);
  inside=game.move(inside,routes.inside[1]);
  outside=game.move(outside,routes.inside[1]);
  assert.equal(inside.grid[4][2].value,64);
  assert.equal(outside.grid[3][3].value,64);
  assert.equal(outside.grid[4][2].cargo,true);
  assert.equal(game.valid(inside,routes.inside[2]),true);
  assert.equal(game.valid(outside,[[3,3],[2,5],[3,5]]),false,'Two-row gap is not adjacent');
  assert.equal(game.valid(outside,routes.outsideRecovery[2]),true,'A repair remains available');
});

test('both placements and the recovery have refill-independent routes and replayable undo',()=>{
  for(const [name,length]of [['inside',3],['outside',3],['outsideRecovery',4]]){
    let state=game.create('delivery');
    state.grid.flat().forEach(tile=>{if(tile)tile.initialMaterial=true;});
    for(const chain of routes[name]){
      assert.ok(chain.every(([x,y])=>state.grid[y][x]?.initialMaterial),name+' uses no refill');
      assert.ok(game.valid(state,chain));
      state=game.move(state,chain);
    }
    assert.equal(state.outcome,'won',name);
    assert.equal(state.moves,length);
    assert.equal(game.replay('delivery',actions(routes[name])).outcome,'won');
    const undone=game.replay('delivery',[...actions(routes[name]),{type:'undo'}]);
    assert.equal(undone.delivered,0);
    assert.equal(undone.outcome,'playing');
  }
});

// One exact opening sanity check, not a reusable difficulty model.
function legalChains(rules,state,budget){
  const result=[];
  function visit(chain){
    assert.ok(--budget.remaining>=0,'Enumeration bound exhausted; absence cannot be claimed');
    if(chain.length>=state.minChain)result.push(chain);
    const [x,y]=chain.at(-1);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const next=[...chain,[x+dx,y+dy]];
      if(rules.valid(state,next,false))visit(next);
    }
  }
  for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++){
    if(rules.valid(state,[[x,y]],false))visit([[x,y]]);
  }
  return result;
}
function shortWin(rules,maxNodes=200000){
  const budget={remaining:maxNodes},initial=rules.create('delivery');
  for(const first of legalChains(rules,initial,budget)){
    const after=rules.move(initial,first);
    if(after.outcome==='won')return [first];
    if(after.outcome!=='playing')continue;
    for(const second of legalChains(rules,after,budget)){
      if(rules.move(after,second).outcome==='won')return [first,second];
    }
  }
  return null;
}
test('opening enumeration finds a known short win, fails on cutoff, and excludes two-move wins here',()=>{
  const easy=base.withLevels({delivery:{seed:728,moves:8,exit:1,grid:[[4,'cargo',32],[8,8,16]]}});
  assert.ok(shortWin(easy));
  assert.throws(()=>shortWin(game,1),/bound exhausted/);
  assert.equal(shortWin(game),null);
});

test('reference rules, refill pool and allowance stay intact',()=>{
  assert.deepEqual(game.LEVELS.delivery.spawnValues,reference.LEVELS.delivery.spawnValues);
  assert.equal(game.create('delivery').maxMoves,8);
  assert.equal(reference.LEVELS.delivery.seed,624);
  assert.deepEqual(reference.LEVELS.delivery.grid[0],[2,32,4,16,64]);
  assert.equal(base.LEVELS.delivery.seed,208);
  assert.notDeepEqual(game.LEVELS.delivery.grid,reference.LEVELS.delivery.grid);
});
