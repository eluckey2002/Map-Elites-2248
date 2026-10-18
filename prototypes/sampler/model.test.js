const test=require('node:test');const assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path');
const rules=require('./model'),levels=require('./levels'),{solve,exhaustive,ordinary,necessity}=require('./search');

const SPAWN=[2,4,8,16,32,64];
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

test('oneAtATime boards refuse an order out of turn',()=>{
  const level={id:'t',seed:1,moves:5,spawnValues:[8],oneAtATime:true,goal:{type:'orders',orders:[{make:64,from:16},{make:32,from:8}]},
    grid:[[16,16,16,16],[8,8,8,8],[8,8,8,8]]};
  const state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1],[3,1]]),-1,'B before A');
  assert.equal(rules.recipeOnly(level,state,[[0,1],[1,1],[2,1],[3,1]]),-1);
  assert.equal(rules.completes(level,state,[[0,0],[1,0],[2,0],[3,0]]),0);
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

test('no rust anywhere: Rust is retired (PDL-040), boards that ask for rust or v1 feeds are refused',()=>{
  for(const level of levels){
    assert.equal(level.rust,undefined,level.id+' has rust');
    assert.ok(!/rust/i.test(JSON.stringify(level)),level.id+' mentions rust');
    assert.ok(!level.goal.feeds,level.id+' uses the v1 feeds rule');
  }
  const base={id:'r',seed:4,moves:9,spawnValues:[4],goal:{type:'exact',make:999},grid:[[8,8,8,8],[6,6,6,6]]};
  assert.doesNotThrow(()=>rules.create(base));
  assert.throws(()=>rules.create({...base,rust:{cells:[[3,0]],every:1}}),/Invalid/);
  assert.throws(()=>rules.create({...base,goal:{type:'orders',feeds:true,orders:[{make:24,from:8}]}}),/Invalid/);
  for(const file of ['model.js','search.js','app.js','page.html'])
    assert.ok(!/\brust/i.test(fs.readFileSync(path.join(__dirname,file),'utf8').split('\n').filter(line=>!/Rust was retired|level\.rust===undefined/.test(line)).join('\n')),file+' still has rust code (only the refusal guard may mention it)');
});

test('the board list is the six v5 keepers in order, the boss last',()=>{
  assert.deepEqual(levels.map(l=>l.id),['feed-the-next','make-it-here','shared-material','see-it-coming','through-the-gate','the-drought']);
});

test('v5: only See It Coming shows next tiles, one per column; every other board uses normal shared refills',()=>{
  for(const level of levels){
    if(level.id==='see-it-coming'){assert.ok(level.forecast&&level.forecastShow===1,'See It Coming shows one tile per column');continue;}
    assert.ok(!level.forecast,level.id+' shows next tiles');
    assert.ok(!/next tile/i.test(level.rule),level.id+': rule text names next tiles');
  }
  const level=levels.find(l=>l.id==='see-it-coming'),a=rules.create(level),b=rules.create(level);
  assert.deepEqual([0,1,2,3,4].map(x=>rules.upcoming(level,a,x,1)),[0,1,2,3,4].map(x=>rules.upcoming(level,b,x,1)));
  assert.ok(/forecastShow/.test(fs.readFileSync(path.join(__dirname,'app.js'),'utf8')),'the page honours forecastShow');
});

test('no Advanced board and no two-part cap left in the boards (owner dropped BL-0032)',()=>{
  for(const level of levels){assert.ok(!level.goal.anyOrder,level.id+' is any-order');assert.ok(!/Advanced/.test(level.name));assert.equal(level.goal.cap,undefined,level.id+' sets a cap');}
  const level={id:'nc',seed:1,moves:9,spawnValues:[2],goal:{type:'orders',parts:true,orders:[{make:16,from:4},{make:64,from:16}]},
    grid:[[4,4,4,4,2],[16,16,16,16,2],[16,2,2,2,2]]};
  const crowded=rules.create(level);crowded.grid[1][0].made=true;crowded.grid[2][0].made=true;
  assert.equal(rules.completes(level,crowded,[[0,0],[1,0],[2,0],[3,0]]),0,'without a cap a third part is fine');
  assert.throws(()=>rules.create({...level,goal:{...level.goal,anyOrder:true}}),/Invalid/,'any-order parts boards are refused');
});

test('one refill rule: every normal board refills from 2..64; only the announced boss differs',()=>{
  for(const level of levels){
    if(level.boss){assert.equal(level.refill,false,level.id+': the boss changes refills to none');continue;}
    assert.deepEqual(level.spawnValues,SPAWN,level.id+' has its own spawn list');
    assert.notEqual(level.refill,false,level.id+' turns refills off without being a boss');
  }
});

test('numbers players compute are powers of two (except green tiles placed on Shared Material); no leave-N goals',()=>{
  for(const level of levels){
    const g=level.goal,green=level.id==='shared-material',nums=[];
    assert.notEqual(g.type,'leftover',level.id+' has a leave-N goal');
    if(g.type==='orders')g.orders.forEach(o=>{nums.push(o.make,o.from);assert.equal(o.make/o.from,4,level.id+': orders are × 4');});
    if(g.type==='exact')nums.push(g.make);
    if(g.type==='relay')nums.push(...g.stages);
    if(level.gate)nums.push(level.gate.sum!==undefined?level.gate.sum:level.gate.tile);
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
    assert.ok(seen.every(v=>!isThreeLine(v)),level.id+': a green tile fell in');
  }
});

test('chainsWithSum finds exactly the legal chains with that sum (checked against brute force on every board)',()=>{
  for(const level of levels){
    const state=rules.create(level),all=rules.chains(state,state.gridWidth*state.gridHeight),by=new Map();
    for(const c of all){const v=c.reduce((a,[x,y])=>a+state.grid[y][x].value,0);by.set(v,(by.get(v)||0)+1);}
    for(const [v,n] of by){
      const got=rules.chainsWithSum(state,v);
      assert.equal(got.length,n,`${level.id}: ${n} chains sum to ${v}, chainsWithSum found ${got.length}`);
      assert.ok(got.every(c=>rules.valid(state,c)),level.id+': an illegal chain');
    }
  }
});

test('exhaustive short-win check finds a planted 2-move win and a 3-move win made of long chains',()=>{
  const two={id:'w2',seed:1,moves:9,refill:false,spawnValues:[2],goal:{type:'orders',orders:[{make:16,from:4},{make:64,from:16}]},
    grid:[[4,4,4,4],[16,16,16,2],[2,2,2,2]]};
  const r=exhaustive(two,3);
  assert.ok(r.win&&r.win.length===2,'finds the 2-move win');
  assert.equal(rules.replay(two,r.win.map(chain=>({type:'move',chain}))).outcome,'won');
  assert.equal(exhaustive(two,1).win,null,'and no 1-move win');
  // v2 The Drought had a 3-move win through 7-tile chains that the beam (chains of up to 7 tiles) never reported.
  const drought={id:'d',seed:22,moves:8,spawnValues:SPAWN,refill:false,goal:{type:'exact',make:512},
    grid:[[128,8,64,8,64],[32,4,8,4,8],[16,8,64,128,16],[128,32,8,32,32],[128,2,8,2,64],[8,32,32,64,16]]};
  const d=exhaustive(drought,3);
  assert.ok(d.win&&d.win.length===3,'finds v2 Drought’s 3-move win');
  assert.equal(rules.replay(drought,d.win.map(chain=>({type:'move',chain}))).outcome,'won');
});

// v5 budgets come from calibrate.js (30 refill draws per board, the Drought on its own board): the larger of the beam's
// 90th percentile + 2, its median + 8, and the ordinary player's 80th percentile + 2 where it wins at least half the draws.
// Here each board is checked on its own seed only: a solver line and a short opening fit inside the budget.
test('each board on its own seed: the solver wins inside the budget with room to spare, and there are plenty of opening chains',()=>{
  for(const level of levels){
    const open=rules.chains(rules.create(level),8);
    assert.ok(open.length>=40,`${level.id} opens with only ${open.length} chains`);
    const sol=solve(level,{beam:200,maxLength:level.refill===false?12:7,budget:level.moves});
    assert.ok(sol,`${level.id}: no solver line inside ${level.moves} moves`);
    assert.equal(rules.replay(level,sol.path.map(chain=>({type:'move',chain}))).outcome,'won');
    assert.ok(level.moves>=sol.moves+4,`${level.id}: budget ${level.moves} leaves under 4 spare moves over the solver's ${sol.moves}`);
  }
});

test('ordinary-player baseline (game, not brain teaser): it wins Feed the Next and Make It Here at the budget on their own seeds',()=>{
  for(const id of ['feed-the-next','make-it-here']){
    const level=levels.find(l=>l.id===id),r=ordinary(level);
    assert.equal(r.outcome,'won',id+': an ordinary one-move-at-a-time player loses at the budget');
    assert.equal(rules.replay(level,r.path.map(chain=>({type:'move',chain}))).outcome,'won');
  }
});

test('parts (Feed the Next): an order makes a part; later orders must include a part; with a cap set, a fill that would make one too many is refused',()=>{
  const level={id:'p',seed:1,moves:9,spawnValues:[2],goal:{type:'orders',parts:true,cap:2,orders:[{make:16,from:4},{make:64,from:16}]},
    grid:[[4,4,4,4,2],[16,16,16,16,2],[16,2,2,2,2]]};
  let state=rules.create(level);
  assert.equal(rules.completes(level,state,[[0,1],[1,1],[2,1],[3,1]]),-1,'B before A');
  state=rules.move(level,state,[[0,0],[1,0],[2,0],[3,0]]);
  assert.equal(rules.partCount(state),1,'A’s 16 is a part');
  const plain=[];state.grid.forEach((row,y)=>row.forEach((t,x)=>{if(t&&t.value===16&&!t.made)plain.push([x,y]);}));
  assert.equal(rules.completes(level,state,plain.slice(0,4)),-1,'four 16s without a part do not count');
  const crowded=rules.create(level);crowded.grid[1][0].made=true;crowded.grid[2][0].made=true;
  assert.equal(rules.partCount(crowded),2);
  assert.equal(rules.partsAfter(crowded,[[0,0],[1,0],[2,0],[3,0]]),3);
  assert.equal(rules.completes(level,crowded,[[0,0],[1,0],[2,0],[3,0]]),-1,'a third part is not allowed');
  const one=rules.create(level);one.grid[2][0].made=true;
  assert.equal(rules.completes(level,one,[[0,0],[1,0],[2,0],[3,0]]),0,'a second part is allowed');
});

test('See It Coming: the strip is shown, and a plan made without it fails on other refills (re-planning without it is reported)',()=>{
  const level=levels.find(l=>l.id==='see-it-coming');
  assert.ok(level.forecast&&level.goal.type==='relay');
  assert.ok(/^Next tiles/i.test(level.rule)&&/each column/.test(level.rule),'the rule names the one-per-column strip first');
  const nec=necessity(level,{beam:200,maxLength:7});
  assert.ok(nec.blindPlanWins.every(w=>w===false||w===null),'a plan made with other refills still wins');
  assert.ok(nec.blindPlanWins.includes(false),'no alt seed produced a replayable plan, so the check proves nothing');
  // v5: reported, not gated. With the generous 22-move limit (calibrate.js; owner: limits must survive unlucky draws) a
  // player who re-plans each move without the strip can still win; the strip makes the board easier, not possible.
  assert.ok(nec.blindReplanWins.includes(true),'no blind re-planner wins: update the README, which says one can');
});

test('Make It Here: one order on screen at a time, two short rule sentences, no hint line',()=>{
  const level=levels.find(l=>l.id==='make-it-here');
  assert.ok(level.oneAtATime);
  assert.ok(level.rule.split(/(?<=\.)\s+/).length<=2,'more than two sentences');
  assert.ok(!level.hint,'hint line kept');
});

test('Shared Material: both orders want the same green tile, which is placed only, can never be made, and is scarce',()=>{
  const level=levels.find(l=>l.id==='shared-material'),flat=level.grid.flat(),[a,b]=level.goal.orders;
  assert.ok(isThreeLine(a.from)&&a.from===b.from,'both orders want the same green tile');
  assert.ok(level.spawnValues.every(isPow2),'refills are all 2 line');
  const smallest=Math.min(...flat,...level.spawnValues);
  assert.ok(a.from<3*smallest,'a chain can never make the shared ingredient');
  const have=flat.filter(v=>v===a.from).length,need=a.make/a.from+b.make/b.from;
  assert.ok(have>=need&&have<=need+1,`${have} placed for ${need} needed: at most one spare`);
});

test('The Drought is the only boss: announced, no refills, one power-of-two target',()=>{
  const level=levels.find(l=>l.id==='the-drought');
  assert.ok(level.boss&&/Boss/.test(level.boss.title)&&/refill/i.test(level.boss.text),'boss banner flag');
  assert.equal(level.refill,false);assert.equal(level.goal.type,'exact');assert.ok(isPow2(level.goal.make));
  assert.equal(levels.filter(l=>l.boss).length,1,'only the boss is a boss');
});

test('Through the Gate is 7 × 6 with a stone wall in the middle column, a 128 tile gate, and a ★ in each room',()=>{
  const level=levels.find(l=>l.id==='through-the-gate');
  assert.equal(level.grid[0].length,7);assert.equal(level.grid.length,6);
  assert.deepEqual(level.stone.map(String).sort(),[0,1,2,3,4,5].map(y=>'3,'+y).sort());
  assert.equal(level.gate.at[0],3);assert.equal(level.gate.tile,128);assert.equal(level.gate.sum,undefined);
  // exhaustive() counts opening the gate as its own step; that holds only when the ★ are on opposite sides of the wall.
  const xs=level.goal.marks.map(m=>m[0]).sort((a,b)=>a-b);assert.ok(xs[0]<3&&xs[1]>3);
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

test('a tile gate opens when a tile of at least gate.tile sits beside it after a move, and not for a smaller tile',()=>{
  const base={id:'gt',seed:1,moves:9,refill:false,spawnValues:[2],stone:[[1,0],[1,1],[1,2]],gate:{at:[1,1],tile:16},goal:{type:'connect',marks:[[0,2],[2,2]]},
    grid:[[4,0,2],[4,0,2],[8,0,4]]};
  assert.throws(()=>rules.create({...base,gate:{at:[1,1],tile:16,sum:16}}),/Invalid/,'a gate takes a sum or a tile, not both');
  assert.throws(()=>rules.create({...base,gate:{at:[1,1],tile:16,sum:null}}),/Invalid/,'an empty sum next to a tile is refused too');
  assert.ok(!rules.opensGate(base,999),'a tile gate never opens on a chain sum');
  const big=rules.move(base,rules.create(base),[[0,0],[0,1],[0,2]]);
  assert.equal(big.grid[2][0].value,16);
  assert.ok(big.gateOpen&&big.last.opened,'a 16 beside the gate opens it');
  assert.ok(!big.stone.includes('1,1'),'the gate cell is no longer stone');
  const small=rules.move(base,rules.create(base),[[2,0],[2,1],[2,2]]);
  assert.equal(small.grid[2][2].value,8);
  assert.ok(!small.gateOpen,'an 8 beside the gate does not open it');
});
