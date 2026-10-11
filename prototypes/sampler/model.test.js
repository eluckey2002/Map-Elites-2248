const test=require('node:test');const assert=require('node:assert');
const rules=require('./model'),levels=require('./levels'),{solve,harvest,obvious,necessity}=require('./search');

test('an order with a spot counts only when its chain ends on the spot',()=>{
  const level={id:'t',seed:1,moves:5,spawnValues:[8],goal:{type:'orders',orders:[{make:144,from:48,at:[2,0]}]},
    grid:[[48,48,48,8],[8,8,8,8]]};
  const state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,0],[1,0],[2,0]]),0);
  assert.equal(rules.completes(level,state,[[2,0],[1,0],[0,0]]),-1,'right recipe, wrong spot');
  assert.equal(rules.recipeOnly(level,state,[[2,0],[1,0],[0,0]]),0);
  assert.equal(rules.move(level,state,[[0,0],[1,0],[2,0]]).outcome,'won');
});

test('stone stops gravity and diagonal squeezes; dry wells do not refill; forecast fills columns from their queue',()=>{
  const level={id:'t',seed:2,moves:5,spawnValues:[4,8],refill:false,stone:[[1,1]],goal:{type:'leftover',max:1},
    grid:[[8,8,8],[8,0,4],[4,4,4]]};
  let state=rules.create(level);
  state=rules.move(level,state,[[0,0],[1,0],[2,0]]);
  assert.equal(state.grid[0][0],null,'no refill');
  assert.equal(state.grid[1][1],null,'stone stays empty');
  const fc={id:'f',seed:3,moves:5,spawnValues:[4,6,8],forecast:true,goal:{type:'exact',make:999},grid:[[8,8,8],[4,6,4]]};
  const s0=rules.create(fc),next=[0,1,2].map(x=>rules.upcoming(fc,s0,x,1)[0]);
  const s1=rules.move(fc,s0,[[0,0],[1,0],[2,0]]);
  assert.deepEqual([s1.grid[0][0].value,s1.grid[0][1].value],[next[0],next[1]],'each column takes its own next tile');
});

test('rust blocks chaining, spreads after a move, and is scraped off by a chain ending beside it',()=>{
  const level={id:'r',seed:4,moves:9,spawnValues:[4],rust:{cells:[[3,0]],every:1},goal:{type:'exact',make:999},
    grid:[[8,8,8,8],[6,6,6,6]]};
  const state=rules.create(level);
  assert.ok(!rules.valid(state,[[1,0],[2,0],[3,0]]),'rusted tile cannot chain');
  const after=rules.move(level,state,[[0,1],[1,1],[2,1]]);
  assert.ok(after.last.cleared.some(([x,y])=>x===3&&y===0),'chain ending beside rust scrapes it');
});

test('each sampler board opens without a win, has a solver witness in budget that takes 4+ moves, both shortcut proxies lose, and its twist binds',()=>{
  for(const level of levels){
    const state=rules.create(level);
    assert.ok(!rules.chains(state,8).some(c=>rules.move(level,state,c).outcome==='won'),level.id+' opens with a win');
    const sol=solve(level,{beam:200,maxLength:7});
    assert.ok(sol&&sol.moves<=level.moves-2,level.id+' has no solver win with two spare moves');
    assert.ok(sol.moves>=4,level.id+': the solver witness takes under 4 moves');
    assert.equal(rules.replay(level,sol.path.map(chain=>({type:'move',chain}))).outcome,'won');
    assert.notEqual(harvest(level).outcome,'won',level.id+' is won by the harvest proxy');
    assert.notEqual(obvious(level).outcome,'won',level.id+' is won by the do-the-obvious proxy');
    const nec=necessity(level,{beam:200,maxLength:7});
    assert.notEqual(nec.spotBlindWins,true,level.id+': ignoring the spot still wins');
    assert.notEqual(nec.winsWithoutRefills,true,level.id+': the refills are not needed');
    assert.notEqual(nec.rustBlindWins,true,level.id+': ignoring the rust still wins');
  }
});

test('the feeding board needs each order’s output: it starts one ingredient short for orders B and C',()=>{
  const level=levels.find(l=>l.id==='feed-the-next'),count=v=>level.grid.flat().filter(x=>x===v).length;
  assert.ok(count(24)<3&&count(72)<3);
});

test('the shared-material board starts with fewer 24s than both orders need, and no 12s or 24s refill',()=>{
  const level=levels.find(l=>l.id==='shared-material'),need=level.goal.orders.reduce((n,o)=>n+o.make/o.from,0);
  assert.ok(level.grid.flat().filter(x=>x===24).length<need);
  assert.ok(!level.spawnValues.includes(12)&&!level.spawnValues.includes(24));
});

test('feeding orders fill in turn, and each later order must include the tile the previous one made',()=>{
  const level={id:'f',seed:1,moves:5,spawnValues:[4],goal:{type:'orders',feeds:true,orders:[{make:24,from:8},{make:72,from:24}]},
    grid:[[8,8,8,4],[24,24,24,4]]};
  let state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1]]),-1,'B before A');
  state=rules.move(level,state,[[0,0],[1,0],[2,0]]);
  assert.ok(state.done[0]&&state.grid.flat().some(t=>t&&t.made&&t.value===24),'A’s 24 is marked');
  const plain=[];state.grid.forEach((row,y)=>row.forEach((t,x)=>{if(t&&t.value===24&&!t.made)plain.push([x,y]);}));
  assert.equal(rules.completes(level,state,plain.slice(0,3)),-1,'three 24s without the ● do not count');
});
