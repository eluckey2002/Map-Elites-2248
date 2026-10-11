const test=require('node:test');const assert=require('node:assert');
const rules=require('./model'),levels=require('./levels'),{solve,harvest}=require('./search');

test('a chain completes an order only when every tile is the ingredient and the sum is exact',()=>{
  const level={id:'t',seed:1,moves:5,spawnValues:[8],orders:[{make:512,from:128}],
    grid:[[128,128,128,128],[128,128,256,8],[8,8,8,8]]};
  const state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,0],[1,0],[2,0],[3,0]]),0);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1]]),-1,'128+128+256 is 512 but mixed');
  assert.equal(rules.completes(level,state,[[0,0],[1,0],[2,0]]),-1,'three 128s is 384, not 512');
  const after=rules.move(level,state,[[0,0],[1,0],[2,0],[3,0]]);
  assert.equal(after.outcome,'won');assert.equal(after.grid[0][3].value,512);
});

test('each shipped board opens without an immediate win, has a solver win in budget, and the harvest proxy loses',()=>{
  for(const level of levels){
    const state=rules.create(level);
    assert.ok(!rules.chains(state,8).some(c=>rules.completes(level,state,c)>=0),level.id+' opens with a win');
    const sol=solve(level,{beam:150,maxLength:6});
    assert.ok(sol&&sol.moves<=level.moves,level.id+' has no solver win');
    assert.equal(rules.replay(level,sol.path.map(chain=>({type:'move',chain}))).outcome,'won');
    assert.notEqual(harvest(level).outcome,'won',level.id+' is won by the harvest proxy');
  }
});
