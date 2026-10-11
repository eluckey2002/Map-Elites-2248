const test=require('node:test');const assert=require('node:assert');
const fs=require('node:fs'),path=require('node:path');
const rules=require('./model'),levels=require('./levels'),{solve,exhaustive,harvest,obvious,necessity}=require('./search');

const SPAWN=[2,4,8,16,32,64];
const ADVANCED='feed-the-next-advanced';
const isPow2=v=>Number.isSafeInteger(v)&&v>0&&(v&(v-1))===0;
const isThreeLine=v=>{if(!Number.isSafeInteger(v)||v<3)return false;let n=v;while(n%2===0)n/=2;return n===3;};
// Budget rule (PDL-040): the best known line plus four spare moves.
const SPARE=4;
const BEAMS=[{beam:1000,maxLength:8},{beam:200,maxLength:7}];

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

test('the board list is the eight v3 boards in order',()=>{
  assert.deepEqual(levels.map(l=>l.id),['make-it-here','feed-the-next',ADVANCED,'shared-material','three-separate','see-it-coming',
    'the-drought','through-the-gate']);
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
    if(level.gate)nums.push(level.gate.sum);
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

test('each board: no win in 3 moves or fewer (exhaustive), budget = best known line + 4, at least 60 opening chains, both proxies lose, and its twist binds',()=>{
  for(const level of levels){
    const state=rules.create(level),open=rules.chains(state,8);
    assert.ok(open.length>=60,`${level.id} opens with only ${open.length} chains`);
    const short=exhaustive(level,3);
    assert.equal(short.win,null,`${level.id} can be won in ${short.win&&short.win.length} moves`);
    // Best known: the shortest line any of the screening beams finds (the wide beam of PDL-040, plus the v2 beam, which
    // on See It Coming finds a line the wide one misses; exhaustive search already rules out 3 or fewer). It must be
    // exactly the budget minus four.
    const best=level.moves-SPARE;
    assert.ok(best>=4,level.id+': best known line under 4 moves');
    const lines=BEAMS.map(o=>solve(level,{...o,budget:best})).filter(Boolean);
    assert.ok(lines.length,`${level.id}: no line of ${best} moves (budget ${level.moves} = best + ${SPARE})`);
    const sol=lines.reduce((a,b)=>b.moves<a.moves?b:a);
    assert.equal(sol.moves,best,`${level.id}: a beam finds ${sol.moves} moves, so the budget should be ${sol.moves+SPARE}`);
    assert.equal(rules.replay(level,sol.path.map(chain=>({type:'move',chain}))).outcome,'won');
    assert.notEqual(harvest(level).outcome,'won',level.id+' is won by the harvest proxy');
    assert.notEqual(obvious(level).outcome,'won',level.id+' is won by the do-the-obvious proxy');
    const nec=necessity(level,{beam:200,maxLength:7});
    assert.notEqual(nec.spotBlindWins,true,level.id+': ignoring the spot still wins');
    assert.notEqual(nec.winsWithoutRefills,true,level.id+': the refills are not needed');
  }
});

test('parts (Feed the Next): an order makes a part; later orders must include a part; a fill that would make a third part is refused',()=>{
  const level={id:'p',seed:1,moves:9,spawnValues:[2],goal:{type:'orders',parts:true,orders:[{make:16,from:4},{make:64,from:16}]},
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

test('any-order parts (Advanced): orders fill in any order, every fill makes a part, the cap refuses a third, and an order can need two parts',()=>{
  const level={id:'a',seed:1,moves:9,spawnValues:[2],goal:{type:'orders',parts:true,anyOrder:true,
    orders:[{make:64,from:16},{make:32,from:8},{make:64,from:16},{make:256,from:64,parts:2}]},
    grid:[[16,16,16,16,2],[8,8,8,8,2],[16,16,16,16,2],[64,64,2,2,2]]};
  let s=rules.create(level);
  assert.equal(rules.completes(level,s,[[0,1],[1,1],[2,1],[3,1]]),1,'B can go first');
  s=rules.move(level,s,[[0,1],[1,1],[2,1],[3,1]]);
  assert.equal(rules.partCount(s),1,'B’s 32 is a part');
  // two parts on the board now: a third plain fill is refused, with either 16 order
  const two=rules.create(level);two.grid[3][4].made=true;two.grid[3][3].made=true;
  assert.equal(rules.completes(level,two,[[0,0],[1,0],[2,0],[3,0]]),-1,'a fill that would make a third part is refused');
  // D needs two parts: four 64s with one part do not count, with two they do
  assert.equal(rules.partsNeeded(level,3),2);
  const dd=rules.create({...level,grid:[[64,64,64,64,2],[8,8,8,8,2],[16,16,16,16,2],[2,2,2,2,2]]});
  dd.grid[0][0].made=true;
  assert.equal(rules.completes(level,dd,[[0,0],[1,0],[2,0],[3,0]]),-1,'one part is not enough for D');
  dd.grid[0][1].made=true;
  assert.equal(rules.completes(level,dd,[[0,0],[1,0],[2,0],[3,0]]),3,'two parts fill D');
  // the strictTurn screening flag only allows the first unfinished order
  const strict={...level,goal:{...level.goal,strictTurn:true}};
  assert.equal(rules.completes(strict,rules.create(level),[[0,1],[1,1],[2,1],[3,1]]),-1,'strict turn: B waits for A');
});

test('Feed the Next — Advanced (v3, proposed rule): four orders in any order, cap of two parts, D needs two parts; the cap bites',()=>{
  const level=levels.find(l=>l.id===ADVANCED),g=level.goal;
  assert.ok(g.parts&&g.anyOrder&&g.orders.length===4);
  assert.deepEqual(g.orders.map((o,i)=>rules.partsNeeded(level,i)),[0,0,0,2]);
  assert.ok(/Advanced/.test(level.name));
  // The two parts D needs are the tiles two other orders make; the third plain order makes something else.
  const D=g.orders[3],makers=g.orders.slice(0,3).filter(o=>o.make===D.from);
  assert.equal(makers.length,2,'exactly two orders make D’s ingredient');
  const nec=necessity(level,{beam:200,maxLength:7});
  // Strictly in list order (A, B, C, D) the board is lost or needs more moves than the best known line.
  assert.ok(!nec.strictOrderWin||nec.strictOrderWin.moves>level.moves-SPARE,'in-order play is as quick as the witness');
  assert.notEqual(nec.strictOrderGreedy,'won','a greedy in-order player wins');
  // The best known line fills an order out of list order.
  const sol=BEAMS.map(o=>solve(level,{...o,budget:level.moves-SPARE})).find(Boolean);
  let s=rules.create(level);const filled=[];
  for(const c of sol.path){s=rules.move(level,s,c);if(s.last.order>=0)filled.push(s.last.order);}
  assert.notDeepEqual(filled,[0,1,2,3],'the witness fills the orders in list order');
});

test('See It Coming: the forecast is shown, and a forecast-blind player loses where the forecast-aware witness wins',()=>{
  const level=levels.find(l=>l.id==='see-it-coming');
  assert.ok(level.forecast&&level.goal.type==='relay');
  assert.ok(/^Next tiles/i.test(level.rule),'the rule mentions the forecast first');
  const nec=necessity(level,{beam:200,maxLength:7});
  assert.deepEqual(nec.blindPlanWins,nec.blindPlanWins.map(()=>false),'a plan made with other refills still wins');
  assert.deepEqual(nec.blindReplanWins,nec.blindReplanWins.map(()=>false),'a player re-planning without the forecast still wins');
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

test('Through the Gate is 7 × 6 with a stone wall in the middle column, the forecast on, and a ★ in each room',()=>{
  const level=levels.find(l=>l.id==='through-the-gate');
  assert.equal(level.grid[0].length,7);assert.equal(level.grid.length,6);
  assert.deepEqual(level.stone.map(String).sort(),[0,1,2,3,4,5].map(y=>'3,'+y).sort());
  assert.equal(level.gate.at[0],3);assert.ok(level.forecast);
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
