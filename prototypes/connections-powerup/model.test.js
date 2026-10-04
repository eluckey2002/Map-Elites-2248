const {test}=require('node:test');
const assert=require('node:assert/strict');
const game=require('./model');
const base=require('../connections-continuous/model');
const copy=v=>JSON.parse(JSON.stringify(v));
const chain=[[0,0],[1,0],[2,0]];
function prepared(values,charges=0){
  const state=game.create();
  values.forEach((value,x)=>state.grid[0][x].value=value);
  state.charges=charges;
  state.objective={...state.objective,ends:[[0,5],[4,5]],target:12345};
  return state;
}

test('fresh bank is empty and ordinary play is identical to unchanged Connection Run',()=>{
  const state=game.create(),original=base.create();
  assert.equal(state.charges,0);
  assert.deepEqual(state.grid,original.grid);
  assert.deepEqual(state.objective,original.objective);
  for(const path of base.legalChains(original).slice(0,20)){
    const actual=game.move(state,path),expected=base.move(original,path);
    assert.deepEqual(actual.grid,expected.grid);
    assert.equal(actual.score,expected.score);
    assert.deepEqual(actual.objective,expected.objective);
    assert.equal(actual.charges,0);
  }
});

test('each merge producing 2048 or above earns one charge, including non-power results',()=>{
  for(const [values,result,earned]of [[[512,512,512],1536,0],[[512,512,1024],2048,1],[[768,768,768],2304,1],[[1024,1024,2048],4096,1]]){
    const state=prepared(values),before=copy(state);
    const next=game.move(state,chain);
    assert.equal(next.last.landing.value,result);
    assert.equal(next.charges,earned);
    assert.equal(next.last.powerupEarned,Boolean(earned));
    assert.deepEqual(next.objective,state.objective);
    assert.deepEqual(state,before);
  }
});

test('cap is three, and a standing large tile does not earn another charge',()=>{
  const full=game.move(prepared([512,512,1024],3),chain);
  assert.equal(full.charges,3);assert.equal(full.last.powerupEarned,false);
  assert.equal(full.last.powerupFull,true);
  const ordinary=prepared([2,2,4],2);ordinary.grid[5][4].value=4096;
  assert.equal(game.move(ordinary,chain).charges,2);
});

test('preview predicts the award without spending, granting or changing real state',()=>{
  const state=prepared([512,512,1024],1),before=copy(state);
  const predicted=game.preview(state,chain),actual=game.move(state,chain);
  assert.equal(predicted.charges,2);assert.equal(actual.charges,2);
  assert.deepEqual(predicted.grid,actual.grid);
  assert.deepEqual(state,before);
});

test('remove spends exactly one charge, settles/refills one tile, and never scores or completes a goal',()=>{
  const state=prepared([512,512,1024],2),before=copy(state);
  state.objective.ends=[[1,3],[4,5]];before.objective=copy(state.objective);
  const removed=game.remove(state,[1,3]);
  assert.equal(removed.charges,1);assert.equal(removed.score,state.score);
  assert.equal(removed.totalMoves,state.totalMoves+1);assert.equal(removed.moves,state.moves+1);
  assert.equal(removed.completed,state.completed);assert.equal(removed.issued,state.issued);
  assert.deepEqual(removed.objective,state.objective);assert.deepEqual(removed.log,state.log);
  assert.deepEqual(removed.last.removed,{x:1,y:3,value:state.grid[3][1].value});
  assert.equal(removed.last.points,0);assert.equal(removed.last.completedObjective,null);
  assert.equal(removed.last.refill.length,1);assert.equal(removed.randomCursor,state.randomCursor+1);
  for(let y=1;y<=3;y++)assert.equal(removed.grid[y][1].value,state.grid[y-1][1].value);
  assert.ok(game.VALUES.includes(removed.grid[0][1].value));
  for(let x=0;x<5;x++)if(x!==1)for(let y=0;y<6;y++)assert.deepEqual(removed.grid[y][x],state.grid[y][x]);
  for(let y=0;y<6;y++)for(let x=0;x<5;x++)assert.deepEqual([removed.grid[y][x].x,removed.grid[y][x].y],[x,y]);
  assert.deepEqual(state,before);
});

test('removal remains available without legal chains, and invalid or unearned spends cannot change state',()=>{
  const state=prepared([2,2,4],1);
  state.grid.flat().forEach((tile,i)=>tile.value=3+i*6);
  state.outcome='no-chains';const before=copy(state);
  assert.equal(game.canRemove(state,[0,0]),true);
  assert.equal(game.remove(state,[0,0]).charges,0);
  for(const position of [[-1,0],[0,6],[1.5,0],[0],null])assert.throws(()=>game.remove(state,position));
  assert.throws(()=>game.remove({...state,charges:0},[0,0]));
  assert.deepEqual(state,before);
});

test('skip and new board preserve the bank without granting charges',()=>{
  const state=prepared([2,2,4],2);
  assert.equal(game.skip(state).charges,2);
  const dealt=game.newBoard(state);assert.equal(dealt.charges,2);
  assert.equal(dealt.boardNumber,1);assert.equal(game.create().charges,0);
});

test('removal consumes the normal seeded stream, including subsequent deals and merges',()=>{
  const state=game.create();state.charges=2;
  const first=game.remove(state,[0,0]),second=game.remove(first,[0,0]);
  assert.equal(first.grid[0][0].value,2);assert.equal(second.grid[0][0].value,32);
  assert.equal(second.randomCursor,2);
  const dealt=game.newBoard(state),removed=game.remove(dealt,[0,0]);
  assert.equal(removed.grid[0][0].value,64,'Seed 9997, first ordinary refill');
  const path=game.legalChains(first)[0];assert.ok(path);
  assert.deepEqual(game.move(first,path).grid,base.move(first,path).grid);
});

test('one removal can restore legal play on a board without chains',()=>{
  const state=prepared([2,2,4],1);
  state.grid.flat().forEach((tile,i)=>tile.value=3+i*6);
  state.grid[0][1].value=2;state.grid[0][2].value=2;state.outcome='no-chains';
  assert.equal(game.legalChains(state).length,0);
  const next=game.remove(state,[0,0]);
  assert.equal(next.outcome,'playing');assert.equal(next.charges,0);
  assert.equal(game.valid(next,chain),true);
  assert.deepEqual(next.objective,state.objective);
});

test('a real untouched opening route earns a charge; spend, undo, feedback and replay are exact',()=>{
  const actions=require('./earn-witness.json'),earned=game.replay('continuous',actions);
  assert.equal(earned.charges,1);assert.equal(earned.last.landing.value,2048);
  assert.deepEqual(earned.grid,base.replay('continuous',actions).grid);
  const spending=[...actions,{type:'remove',position:[1,3]}];
  assert.deepEqual(game.replay('continuous',spending),game.remove(earned,[1,3]));
  assert.deepEqual(game.replay('continuous',[...spending,{type:'undo'}]),earned);
  const beforeEarn=game.replay('continuous',actions.slice(0,-1));
  assert.equal(beforeEarn.charges,0);
  assert.deepEqual(game.replay('continuous',[...actions,{type:'undo'}]),beforeEarn);
  const withNote=[...spending,{type:'feedback',objective:1,rating:'interesting',note:'Agent QA only'}];
  const result=game.replay('continuous',withNote);
  assert.equal(result.notes.at(-1).note,'Agent QA only');assert.equal(result.charges,0);
  assert.throws(()=>game.replay('continuous',[{type:'remove',position:[0,0]}]));
  assert.throws(()=>game.replay('continuous',[{type:'undo'}]));
  assert.throws(()=>game.replay('wrong',[]));
});
