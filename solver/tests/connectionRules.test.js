const {test}=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../../src/connection-rules');
const retained=require('../../prototypes/connections-powerup/model');
const copy=value=>JSON.parse(JSON.stringify(value));
const path=[[0,0],[1,0],[2,0]];
function puzzle(overrides={}){
  return {id:'fixture',name:'Fixture',refillSeed:9000,moves:8,
    grid:[[2,2,4],[16,64,8],[128,32,16]],
    objectives:Array.from({length:3},()=>({ends:[[0,2],[2,2]],target:9999})),...overrides};
}

test('real retained transitions keep chain, gravity, refill and scoring behavior',()=>{
  const original=retained.create();
  const definition=puzzle({grid:original.grid.map(row=>row.map(tile=>tile.value)),moves:100});
  const state=rules.create(definition);
  for(const chain of retained.legalChains(original).slice(0,20)){
    const expected=retained.move(original,chain),actual=rules.move(state,chain);
    assert.deepEqual(actual.grid,expected.grid);
    assert.equal(actual.score,expected.score);
    assert.equal(actual.randomCursor,expected.randomCursor);
    assert.deepEqual(actual.last.refill,expected.last.refill);
    assert.deepEqual(actual.last.landing,expected.last.landing);
  }
});

test('ordinary growth stays legal; only exact endpoint and sum matches advance',()=>{
  const initial=rules.create(puzzle()),before=copy(initial);
  const growth=rules.move(initial,path);
  assert.equal(growth.completed,0);
  assert.equal(growth.moves,1);
  assert.deepEqual(growth.objective,initial.objective);
  const goal={ends:[[0,0],[2,0]],target:8};
  const matching=rules.create(puzzle({objectives:[goal,goal,goal]}));
  assert.equal(rules.move(matching,path).completed,1);
  assert.equal(rules.matches(matching,path,{...goal,target:16}),false);
  assert.equal(rules.matches(matching,path,{...goal,ends:[[1,0],[2,0]]}),false);
  assert.deepEqual(initial,before);
});

test('committed 2048-or-higher merges earn one credit, capped at three',()=>{
  for(const [values,expected] of [[[512,512,512],0],[[512,512,1024],1],[[768,768,768],1]]){
    const state=rules.create(puzzle({grid:[values,[16,64,8],[128,32,16]]}));
    assert.equal(rules.move(state,path).charges,expected);
  }
  const state=rules.create(puzzle({grid:[[512,512,1024],[16,64,8],[128,32,16]]}));
  state.charges=3;
  assert.equal(rules.move(state,path).charges,3);
  const before=copy(state),preview=rules.preview(state,path);
  assert.equal(preview.moves,1);
  assert.deepEqual(state,before,'preview grants/spends nothing in the real state');
});

test('removal uses one move and charge, normal refill, no score or goal credit',()=>{
  const state=rules.create(puzzle());state.charges=1;
  const next=rules.remove(state,[1,1]);
  assert.equal(next.moves,1);assert.equal(next.charges,0);
  assert.equal(next.score,0);assert.equal(next.completed,0);
  assert.deepEqual(next.objective,state.objective);
  assert.equal(next.randomCursor,1);
  assert.equal(next.grid[1][1].value,state.grid[0][1].value);
  assert.equal(next.grid[0][1].value,2,'first draw from seed 9000');
  assert.throws(()=>rules.remove(rules.create(puzzle()),[1,1]));
});

test('no-chain rescue survives with earned credit; exhaustion loses; final goal wins first',()=>{
  const state=rules.create(puzzle());
  state.grid.flat().forEach((tile,i)=>tile.value=3+i*6);
  state.charges=1;state.moves=7;
  assert.equal(rules.hasMove(state),false);
  assert.equal(rules.canRemove(state,[0,0]),true);
  assert.equal(rules.remove(state,[0,0]).outcome,'lost');
  const goal={ends:[[0,0],[2,0]],target:8};
  const final=rules.create(puzzle({moves:1,objectives:[goal,goal,goal]}));
  final.completed=2;final.objective=copy(goal);
  const won=rules.move(final,path);
  assert.equal(won.outcome,'won');assert.equal(won.moves,1);
  assert.equal(won.objective,null);
  assert.throws(()=>rules.move(won,path));
});

test('replay and undo restore budget, goal, board, RNG, charges and outcome; retry is exact',()=>{
  const definition=puzzle({grid:[[512,512,1024],[16,64,8],[128,32,16]]});
  const earned=rules.replay(definition,[{type:'move',chain:path}]);
  const actions=[{type:'move',chain:path},{type:'remove',position:[1,1]}];
  assert.deepEqual(rules.replay(definition,[...actions,{type:'undo'}]),earned);
  assert.deepEqual(rules.replay(definition,[{type:'move',chain:path},{type:'undo'}]),rules.create(definition));
  assert.deepEqual(rules.replay(definition,actions),rules.replay(definition,actions));
  assert.equal(rules.create(definition).charges,0);
  for(const action of [{type:'skip'},{type:'new-board'},{type:'undo'},null]){
    assert.throws(()=>rules.replay(definition,[action]));
  }
});

test('finite state rejects invalid definitions and invalid chain commitments',()=>{
  assert.throws(()=>rules.create(puzzle({moves:0})));
  assert.throws(()=>rules.create(puzzle({grid:[]})));
  assert.throws(()=>rules.create(puzzle({objectives:[{ends:[[0,0],[9,9]],target:8}]})));
  const state=rules.create(puzzle());
  for(const chain of [[],[[0,0],[0,0],[1,0]],[[0,0],[2,2],[1,2]],null]){
    assert.throws(()=>rules.move(state,chain));
  }
});
