const {test}=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../../src/delivery-rules');
const levels=require('../../src/delivery-levels');
const witnesses=require('../../docs/game-design/levels/delivery-pack/witnesses.json');
const engine=require('../engine');

// The owner played these exact prototypes; the shipped rules must reproduce them move for move.
const prototypes={'pair-drop':require('../../prototypes/delivery-pair-drop/model'),
  staggered:require('../../prototypes/delivery-sequence/model'),landing:require('../../prototypes/delivery-bridge/model')};

function legalChains(state,limit=40){
  const found=[];
  function extend(chain){
    if(found.length>=limit)return;
    if(chain.length>=state.minChain)found.push(chain);
    if(chain.length>=6)return;
    const [x,y]=chain.at(-1);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const next=[...chain,[x+dx,y+dy]];
      if(rules.valid(state,next,false))extend(next);
    }
  }
  for(let y=0;y<state.gridHeight;y++)for(let x=0;x<state.gridWidth;x++)if(rules.valid(state,[[x,y]],false))extend([[x,y]]);
  return found;
}
// gateChanged belongs to the prototype's Gates board and is always false on Delivery boards.
const comparable=state=>{const {gateChanged=false,...last}=state.last||{};assert.equal(gateChanged,false);
  return {grid:state.grid,score:state.score,moves:state.moves,delivered:state.delivered,outcome:state.outcome,randomCursor:state.randomCursor,last:state.last&&last};};

test('pack holds the three owner-played Delivery boards in teaching order',()=>{
  assert.deepEqual(levels.map(level=>level.id),['pair-drop','staggered','landing']);
  for(const level of levels){
    const prototype=prototypes[level.id].LEVELS.delivery;
    assert.deepEqual(level.grid,prototype.grid,level.id);
    assert.equal(level.seed,prototype.seed);assert.equal(level.moves,prototype.moves);assert.equal(level.exit,prototype.exit);
    assert.deepEqual(level.spawnValues,prototype.spawnValues);
  }
});

test('every authored route delivers the parcel within the move budget',()=>{
  for(const board of witnesses.boards){
    const level=levels.find(item=>item.id===board.id);
    for(const [name,route] of Object.entries(board.routes)){
      const state=rules.replay(level,route.map(chain=>({type:'move',chain})));
      assert.equal(state.outcome,'won',`${board.id}/${name}`);
      assert.ok(state.moves<=level.moves);
    }
  }
});

test('shipped rules match the played prototypes move for move, including refills and outcomes',()=>{
  for(const level of levels){
    const prototype=prototypes[level.id];
    for(let game=0;game<25;game++){
      const pick=engine.makeRng(9100+game);
      let ours=rules.create(level),theirs=prototype.create('delivery');
      assert.deepEqual(comparable(ours),comparable(theirs));
      while(ours.outcome==='playing'){
        const options=legalChains(ours);assert.ok(options.length,'playing state must have a legal chain');
        const chain=options[Math.floor(pick()*options.length)];
        assert.equal(prototype.valid(theirs,chain),true);
        ours=rules.move(level,ours,chain);theirs=prototype.move(theirs,chain,false);
        assert.deepEqual(comparable(ours),comparable(theirs),`${level.id} game ${game} move ${ours.moves}`);
      }
    }
  }
});

test('retries are identical, undo restores, preview spends nothing, and the parcel cannot join a chain',()=>{
  const level=levels[1],route=witnesses.boards[1].routes.prepareFirst;
  const a=rules.replay(level,route.map(chain=>({type:'move',chain}))),b=rules.replay(level,route.map(chain=>({type:'move',chain})));
  assert.deepEqual(a,b);
  const undone=rules.replay(level,[{type:'move',chain:route[0]},{type:'undo'}]);
  assert.deepEqual(undone,rules.create(level));
  const start=rules.create(level),before=JSON.stringify(start),predicted=rules.preview(level,start,route[0]);
  assert.equal(predicted.moves,1);assert.equal(JSON.stringify(start),before);
  assert.equal(rules.preview(level,start,[[0,0]]),null);
  const parcel=rules.parcel(start);assert.deepEqual([parcel.x,parcel.y],[2,1]);
  assert.equal(rules.valid(start,[[1,1],[2,1],[3,1]]),false);
  assert.throws(()=>rules.move(level,a,route[0]),/finished/);
});

test('invalid boards and replays are rejected',()=>{
  assert.throws(()=>rules.create({...levels[0],grid:[[2,2,2]]}),/Invalid delivery board/);
  assert.throws(()=>rules.create({...levels[0],exit:9}),/Invalid delivery board/);
  assert.throws(()=>rules.replay(levels[0],[{type:'jump'}]),/Invalid replay action/);
  assert.throws(()=>rules.replay(levels[0],[{type:'move',chain:[[0,0],[4,5],[1,1]]}]),/Invalid chain/);
});
