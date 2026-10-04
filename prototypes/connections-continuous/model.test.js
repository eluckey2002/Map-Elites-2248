const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('./model');
const base=require('../archetype-trio/model');
const copy=x=>JSON.parse(JSON.stringify(x));

test('ordinary moves and refill agree with the normal engine, and never change a missed objective',()=>{
  const state=game.create(),before=copy(state),ordinary=base.withLevels({continuous:{seed:9000,spawnValues:game.VALUES,grid:state.grid.map(row=>row.map(t=>t.value)),moves:Number.MAX_SAFE_INTEGER,target:Number.MAX_SAFE_INTEGER}});
  const chains=game.legalChains(state);
  assert.ok(chains.length>10);
  for(const chain of chains.slice(0,60)){
    assert.equal(game.valid(state,chain),ordinary.valid(state,chain));
    const actual=game.move(state,chain),expected=ordinary.move(state,chain,false);
    assert.deepEqual(actual.grid,expected.grid);assert.equal(actual.randomCursor,expected.randomCursor);
    if(!game.matches(state,chain))assert.deepEqual(actual.objective,state.objective);
    assert.equal(actual.last.refill.length,chain.length-1);
    for(const tile of actual.last.refill)assert.ok(game.VALUES.includes(tile.value));
  }
  assert.deepEqual(state,before);
});

test('both endpoints and exact merged value are required; incorrect targets remain playable',()=>{
  let state=game.create();
  const witness=copy(state.objective.witness);
  for(const chain of witness.slice(0,-1))state=game.move(state,chain);
  const chain=witness.at(-1),sum=chain.reduce((n,[x,y])=>n+state.grid[y][x].value,0);
  assert.equal(game.matches(state,chain),true);
  const bad=copy(state);bad.objective.target=sum+2;
  assert.equal(game.valid(bad,chain),true);assert.equal(game.matches(bad,chain),false);
  const missed=game.move(bad,chain);assert.equal(missed.completed,0);assert.deepEqual(missed.objective,bad.objective);
  const interior=copy(state);interior.objective.ends=[chain[0],chain[1]];
  assert.equal(game.matches(interior,chain),false);
  const inverse=copy(state);inverse.objective.ends.reverse();assert.equal(game.matches(inverse,chain),true);
  const predicted=game.preview(state,chain),actual=game.move(state,chain);
  assert.deepEqual(predicted.grid,actual.grid);assert.deepEqual(predicted.objective,state.objective);
  assert.equal(actual.completed,1);assert.equal(actual.objective.number,2);assert.equal(actual.boardNumber,state.boardNumber);
  assert.equal(actual.grid[actual.last.landing.y][actual.last.landing.x].value,sum);
});

test('32 witnessed completions cross the bank boundary and replay deterministically',()=>{
  let state=game.create();const actions=[],cards=[];
  for(let i=0;i<32;i++){
    if(!state.objective){actions.push({type:'new-board'});state=game.newBoard(state);}
    assert.ok(state.objective);cards.push(state.objective.bankCard);
    const goal=copy(state.objective),beforeCompleted=state.completed;
    assert.ok(goal.span>=2);
    for(const chain of goal.witness){assert.equal(game.valid(state,chain),true);actions.push({type:'move',chain});state=game.move(state,chain);}
    assert.equal(state.completed,beforeCompleted+1);
    assert.equal(state.log.at(-1).number,goal.number);
  }
  assert.equal(cards[0],1);assert.equal(cards[24],1);assert.equal(state.completed,32);
  assert.deepEqual(game.replay('continuous',actions),state);
});

test('skip, new board, undo, feedback, and invalid actions are replayed accurately',()=>{
  const initial=game.create(),skipped=game.skip(initial);
  assert.deepEqual(skipped.grid,initial.grid);assert.equal(skipped.skipped,1);assert.equal(skipped.completed,0);
  assert.equal(skipped.objective.number,2);
  assert.deepEqual(game.replay('continuous',[{type:'skip'},{type:'undo'}]),initial);
  const next=game.newBoard(skipped);assert.equal(next.boardNumber,1);assert.equal(next.skipped,2);
  assert.equal(next.log.at(-1).status,'new-board');assert.equal(next.objective.number,3);
  const actions=[{type:'skip'},{type:'new-board'},{type:'feedback',objective:3,rating:'interesting',note:'QA only'}];
  const replay=game.replay('continuous',actions);assert.equal(replay.notes[0].objective,3);
  assert.deepEqual(replay.grid,next.grid);
  assert.throws(()=>game.replay('continuous',[{type:'move',chain:[[0,0]]}]));
  assert.throws(()=>game.replay('continuous',[{type:'feedback',objective:99,rating:'interesting',note:''}]));
  assert.throws(()=>game.replay('continuous',[{type:'undo'}]));
  assert.throws(()=>game.replay('wrong',[]));
});
