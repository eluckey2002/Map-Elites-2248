const {test}=require('node:test');
const assert=require('node:assert/strict');
const original=require('../archetype-trio/model');
const game=require('./model');
const routes=require('./witnesses.json');
const actions=route=>route.map(chain=>({type:'move',chain,swapped:false}));

test('equal-value placements leave different usable alignments',()=>{
  const start=game.create('delivery');
  const low=game.move(start,routes.prepareFirst[0]);
  const high=game.move(start,routes.upperPlacement[0]);
  assert.equal(low.last.points,high.last.points);
  assert.equal(low.last.landing.value,64);
  assert.equal(high.last.landing.value,64);
  assert.equal(low.grid[3][1].value,64);
  assert.equal(game.valid(low,routes.prepareFirst[1]),true);
  assert.equal(game.valid(high,routes.prepareFirst[1]),false);
  assert.equal(start.grid[1][2].cargo,true,'Setup does not move the parcel yet');
  assert.equal(low.grid[1][2].cargo,true);
  assert.deepEqual(start,game.create('delivery'),'Preview is nonmutating');
});

test('clearing the bottom first drops the shaft past the upper exit partner',()=>{
  const afterBottom=game.move(game.create('delivery'),routes.bottomFirst[0]);
  assert.equal(afterBottom.grid[2][2].cargo,true,'Immediate parcel progress');
  const prepared=game.move(afterBottom,routes.bottomFirst[1]);
  assert.equal(prepared.grid[4][0].value,64);
  assert.equal(prepared.grid[4][1].value,64);
  assert.equal(prepared.grid[4][2].value,128);
  assert.equal(prepared.grid[2][3].value,128);
  const brokenHarvest=[[0,4],[1,4],[2,4],[3,2]];
  assert.equal(game.valid(prepared,brokenHarvest),false,'Partner is now two rows away');
});

test('all three authored alternatives deliver without selecting refill tiles',()=>{
  for(const [name,moves]of [['prepareFirst',3],['upperPlacement',4],['bottomFirst',5]]){
    let state=game.create('delivery');
    state.grid.flat().forEach(tile=>{if(tile)tile.originalMaterial=true;});
    for(const chain of routes[name]){
      assert.ok(chain.every(([x,y])=>state.grid[y][x]?.originalMaterial),name+' uses only initial or built material');
      assert.equal(game.valid(state,chain),true,name+' has a legal step');
      state=game.move(state,chain);
    }
    assert.equal(state.outcome,'won',name);
    assert.equal(state.moves,moves);
    const result=game.replay('delivery',actions(routes[name]));
    assert.equal(result.outcome,'won');
    const undone=game.replay('delivery',[...actions(routes[name]),{type:'undo'}]);
    assert.equal(undone.delivered,0);
    assert.equal(undone.outcome,'playing');
  }
});

// Exact opening sanity check, including refills, not a general-purpose bot.
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
  const budget={remaining:maxNodes};
  const initial=rules.create('delivery');
  for(const first of legalChains(rules,initial,budget)){
    const next=rules.move(initial,first);
    if(next.outcome==='won')return [first];
    if(next.outcome!=='playing')continue;
    for(const second of legalChains(rules,next,budget)){
      if(rules.move(next,second).outcome==='won')return [first,second];
    }
  }
  return null;
}
test('opening check catches a real short win and finds none within two moves here',()=>{
  const easy=original.withLevels({delivery:{name:'Positive control',seed:624,moves:8,exit:1,grid:[[4,'cargo',32],[8,8,16]]}});
  assert.ok(shortWin(easy),'The same check must detect a known easy board');
  assert.throws(()=>shortWin(game,1),/bound exhausted/,'A cut-off search must fail, not report no win');
  assert.equal(shortWin(game),null);
});

test('variant widens the refill pool without changing shared Delivery rules',()=>{
  assert.deepEqual(game.LEVELS.delivery.spawnValues,[2,4,8,16,32,64,128]);
  assert.equal(original.LEVELS.delivery.spawnValues,undefined);
  assert.equal(original.LEVELS.delivery.seed,208);
  assert.equal(game.create('delivery').maxMoves,8);
});
