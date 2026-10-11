const test=require('node:test');const assert=require('node:assert');
const rules=require('./model'),levels=require('./levels'),{solve,harvest,obvious,scrapeHarvest,necessity}=require('./search');

const SPAWN=[2,4,8,16,32,64];
const ADVANCED='feed-the-next-advanced';
const isPow2=v=>Number.isSafeInteger(v)&&v>0&&(v&(v-1))===0;
const isThreeLine=v=>{if(!Number.isSafeInteger(v)||v<3)return false;let n=v;while(n%2===0)n/=2;return n===3;};

test('an order with a spot counts only when its chain ends on the spot',()=>{
  const level={id:'t',seed:1,moves:5,spawnValues:[8],goal:{type:'orders',orders:[{make:144,from:48,at:[2,0]}]},
    grid:[[48,48,48,8],[8,8,8,8]]};
  const state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,0],[1,0],[2,0]]),0);
  assert.equal(rules.completes(level,state,[[2,0],[1,0],[0,0]]),-1,'right recipe, wrong spot');
  assert.equal(rules.recipeOnly(level,state,[[2,0],[1,0],[0,0]]),0);
  assert.equal(rules.move(level,state,[[0,0],[1,0],[2,0]]).outcome,'won');
});

test('stone stops gravity and diagonal squeezes; no-refill boards do not refill; forecast fills columns from their queue',()=>{
  const level={id:'t',seed:2,moves:5,spawnValues:[4,8],refill:false,stone:[[1,1]],goal:{type:'exact',make:1024},
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

test('the board list is the nine v2 boards in order',()=>{
  assert.deepEqual(levels.map(l=>l.id),['make-it-here','feed-the-next',ADVANCED,'shared-material','three-separate','see-it-coming',
    'the-drought','through-the-gate','rust']);
});

test('one refill rule: every normal board refills from 2..64; only Advanced (v1 kept) and the boss differ',()=>{
  for(const level of levels){
    if(level.id===ADVANCED)continue;
    if(level.boss){assert.equal(level.refill,false,level.id+': the boss changes refills to none');continue;}
    assert.deepEqual(level.spawnValues,SPAWN,level.id+' has its own spawn list');
    assert.notEqual(level.refill,false,level.id+' turns refills off without being a boss');
  }
});

test('numbers players compute are powers of two (except Advanced, and green tiles placed on Shared Material); no leave-N goals',()=>{
  for(const level of levels){
    if(level.id===ADVANCED)continue;
    const g=level.goal,green=level.id==='shared-material',nums=[];
    assert.notEqual(g.type,'leftover',level.id+' has a leave-N goal');
    if(g.type==='orders')g.orders.forEach(o=>{nums.push(o.make,o.from);assert.equal(o.make/o.from,4,level.id+': orders are × 4');});
    if(g.type==='exact')nums.push(g.make);
    if(g.type==='relay')nums.push(...g.stages);
    if(level.gate)nums.push(level.gate.sum);
    if(level.rust&&level.rust.scrape)nums.push(level.rust.scrape);
    for(const v of nums)assert.ok(isPow2(v)||green&&isThreeLine(v),`${level.id}: ${v} is not a power of two`);
    for(const v of level.grid.flat())if(v)assert.ok(isPow2(v)||green&&isThreeLine(v),`${level.id}: start tile ${v}`);
  }
});

test('refills never produce a value outside spawnValues (first 200 refills per board)',()=>{
  for(const level of levels){
    const lvl={...level,moves:1e6};let state=rules.create(lvl),seen=[],rng=1;
    for(let n=0;seen.length<200&&n<3000;n++){
      const all=state.outcome==='playing'?rules.chains(state,4):[];
      if(!all.length){if(level.refill===false&&n>50)break;state=rules.create(lvl);continue;}
      rng=(rng*1103515245+12345)%2147483648;
      state=rules.move(lvl,state,all[rng%all.length]);
      seen.push(...state.last.refill.map(p=>p.value));
    }
    if(level.refill===false){assert.equal(seen.length,0,level.id+' refilled');continue;}
    assert.ok(seen.length>=200,level.id+': fewer than 200 refills seen');
    for(const v of seen.slice(0,200))assert.ok(level.spawnValues.includes(v),`${level.id}: refill ${v}`);
    if(level.id!==ADVANCED)assert.ok(seen.every(v=>!isThreeLine(v)),level.id+': a green tile fell in');
  }
});

test('each board opens without a win and with at least 60 legal chains; a solver witness in budget takes 4+ moves; both shortcut proxies lose; its twist binds',()=>{
  for(const level of levels){
    const state=rules.create(level),open=rules.chains(state,8);
    assert.ok(!open.some(c=>rules.move(level,state,c).outcome==='won'),level.id+' opens with a win');
    // Advanced keeps its v1 screen (it predates the opening-chain floor).
    if(level.id!==ADVANCED)assert.ok(open.length>=60,`${level.id} opens with only ${open.length} chains`);
    const sol=solve(level,{beam:200,maxLength:7});
    assert.ok(sol&&sol.moves<=level.moves-2,level.id+' has no solver win with two spare moves');
    assert.ok(sol.moves>=4,level.id+': the solver witness takes under 4 moves');
    assert.equal(rules.replay(level,sol.path.map(chain=>({type:'move',chain}))).outcome,'won');
    assert.notEqual(harvest(level).outcome,'won',level.id+' is won by the harvest proxy');
    assert.notEqual(obvious(level).outcome,'won',level.id+' is won by the do-the-obvious proxy');
    const nec=necessity(level,{beam:200,maxLength:7});
    assert.notEqual(nec.spotBlindWins,true,level.id+': ignoring the spot still wins');
    assert.notEqual(nec.winsWithoutRefills,true,level.id+': the refills are not needed');
    // The owner beat v1 Rust by scraping a few times, then one long chain: that line must lose too.
    if(level.rust&&level.rust.scrape)assert.notEqual(scrapeHarvest(level).outcome,'won',level.id+' is won by scrape-then-long-chain');
    if(level.rust&&level.rust.every)assert.equal(nec.rustBlindWins,false,level.id+': no plan made without the rust that then fails with it');
  }
});

test('Advanced is v1 Feed the Next kept as built',()=>{
  const level=levels.find(l=>l.id===ADVANCED);
  assert.equal(level.seed,61);assert.equal(level.moves,7);assert.ok(level.goal.feeds);
  assert.ok(/Advanced/.test(level.name)&&/Advanced/.test(level.focus));
  assert.deepEqual(level.spawnValues,[4,6,8,12,16,24,32]);
  assert.deepEqual(level.goal.orders,[{make:24,from:8},{make:72,from:24},{make:216,from:72}]);
  assert.deepEqual(level.grid,[[8,48,8,8,8],[8,12,16,4,4],[12,8,72,8,8],[48,8,4,8,24],[24,8,12,8,16],[8,72,48,8,8]]);
  const count=v=>level.grid.flat().filter(x=>x===v).length;
  assert.ok(count(24)<3&&count(72)<3,'starts one ingredient short for orders B and C');
});

test('Shared Material: both orders want the same green tile, which is placed only, can never be made, and is scarce',()=>{
  const level=levels.find(l=>l.id==='shared-material'),flat=level.grid.flat(),[a,b]=level.goal.orders;
  assert.ok(isThreeLine(a.from)&&a.from===b.from,'both orders want the same green tile');
  assert.ok(level.spawnValues.every(isPow2),'refills are all 2 line');
  // A chain has at least three tiles, so its sum is at least three times the smallest tile anywhere: below that, no chain
  // can make the ingredient.
  const smallest=Math.min(...flat,...level.spawnValues);
  assert.ok(a.from<3*smallest,'a chain can never make the shared ingredient');
  const have=flat.filter(v=>v===a.from).length,need=a.make/a.from+b.make/b.from;
  assert.ok(have>=need&&have<=need+1,`${have} placed for ${need} needed: at most one spare`);
});

test('The Drought is the only boss: announced, no refills, no ice, one power-of-two target',()=>{
  const level=levels.find(l=>l.id==='the-drought');
  assert.ok(level.boss&&/Boss/.test(level.boss.title)&&/refill/i.test(level.boss.text),'boss banner flag');
  assert.equal(level.refill,false);assert.equal(level.goal.type,'exact');assert.ok(isPow2(level.goal.make));
  assert.ok(!level.rust,'no ice');
  assert.equal(levels.filter(l=>l.boss).length,1,'only the boss is a boss');
});

test('Through the Gate is 7 × 6 with a stone wall in the middle column and the forecast on',()=>{
  const level=levels.find(l=>l.id==='through-the-gate');
  assert.equal(level.grid[0].length,7);assert.equal(level.grid.length,6);
  assert.deepEqual(level.stone.map(String).sort(),[0,1,2,3,4,5].map(y=>'3,'+y).sort());
  assert.equal(level.gate.at[0],3);assert.ok(level.forecast);
});

test('the gate opens on a chain whose sum is at least gate.sum ending beside it, and not on a smaller one',()=>{
  const base={id:'g',seed:1,moves:9,spawnValues:[2],stone:[[1,0],[1,1],[1,2]],gate:{at:[1,1],sum:16},goal:{type:'connect',marks:[[0,0],[2,2]]},
    grid:[[4,0,8],[4,0,8],[8,0,16]]};
  assert.ok(rules.opensGate(base,16)&&rules.opensGate(base,32)&&!rules.opensGate(base,8));
  const equal=rules.move(base,rules.create(base),[[0,0],[0,1],[0,2]]);
  assert.ok(equal.gateOpen,'4+4+8 = 16 opens it');
  const more=rules.move(base,rules.create(base),[[2,0],[2,1],[2,2]]);
  assert.ok(more.gateOpen&&more.last.opened,'8+8+16 = 32 opens it');
  const small={...base,grid:[[2,0,8],[2,0,8],[4,0,16]]};
  assert.ok(!rules.move(small,rules.create(small),[[0,0],[0,1],[0,2]]).gateOpen,'2+2+4 = 8 does not');
});

test('scrape: a chain whose sum is at least `scrape` ending beside rust clears it; a smaller one does not',()=>{
  const level={id:'r',seed:4,moves:9,spawnValues:[2],rust:{cells:[[3,0]],every:0,scrape:32},goal:{type:'exact',make:1024},
    grid:[[8,8,16,8],[2,2,4,4]]};
  assert.ok(rules.move(level,rules.create(level),[[0,0],[1,0],[2,0]]).last.cleared.some(([x,y])=>x===3&&y===0),'8+8+16 = 32 scrapes');
  const more={...level,grid:[[16,16,32,8],[2,2,4,4]]};
  assert.ok(rules.move(more,rules.create(more),[[0,0],[1,0],[2,0]]).last.cleared.length,'16+16+32 = 64 scrapes');
  assert.equal(rules.move(level,rules.create(level),[[0,1],[1,1],[2,1]]).last.cleared.length,0,'2+2+4 = 8 does not');
});

test('parts: an order makes a part; later orders must include a part; a fill that would make a third part is refused',()=>{
  const level={id:'p',seed:1,moves:9,spawnValues:[2],goal:{type:'orders',parts:true,orders:[{make:16,from:4},{make:64,from:16}]},
    grid:[[4,4,4,4,2],[16,16,16,16,2],[16,2,2,2,2]]};
  let state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1],[3,1]]),-1,'B before A');
  state=rules.move(level,state,[[0,0],[1,0],[2,0],[3,0]]);
  assert.equal(rules.partCount(state),1,'A’s 16 is a part');
  const plain=[];state.grid.forEach((row,y)=>row.forEach((t,x)=>{if(t&&t.value===16&&!t.made)plain.push([x,y]);}));
  assert.equal(rules.completes(level,state,plain.slice(0,4)),-1,'four 16s without a part do not count');
  // Two parts already on the board: filling the first order (which needs no part) would make a third.
  const crowded=rules.create(level);crowded.grid[1][0].made=true;crowded.grid[2][0].made=true;
  assert.equal(rules.partCount(crowded),2);
  assert.equal(rules.partsAfter(crowded,[[0,0],[1,0],[2,0],[3,0]]),3);
  assert.equal(rules.completes(level,crowded,[[0,0],[1,0],[2,0],[3,0]]),-1,'a third part is not allowed');
  const one=rules.create(level);one.grid[2][0].made=true;
  assert.equal(rules.completes(level,one,[[0,0],[1,0],[2,0],[3,0]]),0,'a second part is allowed');
});

test('feeding orders (Advanced) fill in turn, and each later order must include the tile the previous one made',()=>{
  const level={id:'f',seed:1,moves:5,spawnValues:[4],goal:{type:'orders',feeds:true,orders:[{make:24,from:8},{make:72,from:24}]},
    grid:[[8,8,8,4],[24,24,24,4]]};
  let state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1]]),-1,'B before A');
  state=rules.move(level,state,[[0,0],[1,0],[2,0]]);
  assert.ok(state.done[0]&&state.grid.flat().some(t=>t&&t.made&&t.value===24),'A’s 24 is marked');
  const plain=[];state.grid.forEach((row,y)=>row.forEach((t,x)=>{if(t&&t.value===24&&!t.made)plain.push([x,y]);}));
  assert.equal(rules.completes(level,state,plain.slice(0,3)),-1,'three 24s without the ● do not count');
});
