/* Grader set v1 checks: 18 valid boards, 3 per v5 keeper, each kept rule intact, and each board winnable within its
   own move limit on its own refill draw (a screen, not owner evidence). */
const test=require('node:test'),assert=require('node:assert/strict');
const rules=require('../sampler/model'),search=require('../sampler/search'),keepers=require('../sampler/levels'),set=require('./levels');

test('three boards for each v5 keeper, all valid',()=>{
  assert.equal(set.length,18);
  for(const k of keepers)assert.equal(set.filter(l=>l.id.startsWith(k.id+'-')).length,3,k.id);
  assert.equal(new Set(set.map(l=>l.id)).size,18);
  for(const l of set)assert.doesNotThrow(()=>rules.create(l),l.id);
});

test('each board keeps its keeper\'s goal, walls, gate and tiles',()=>{
  const multiset=g=>g.flat().sort((a,b)=>a-b).join(',');
  for(const l of set){
    const k=keepers.find(b=>l.id.startsWith(b.id+'-'));
    for(const f of ['kind','goal','stone','gate','refill','forecast','forecastShow','spawnValues','rule','ruleTitle'])
      assert.deepEqual(l[f],k[f],`${l.id} ${f}`);
    assert.equal(multiset(l.grid),multiset(k.grid),`${l.id} has the same tiles`);
    assert.ok(l.moves>=l.pregrade.beamMoves+4,`${l.id} limit leaves 4 spare over its own beam line`);
  }
});

test('each board is won by the solver within its own limit',()=>{
  for(const l of set){
    const opts=l.refill===false?{beam:1000,maxLength:12}:{beam:60,maxLength:7};
    const win=search.solve(l,{...opts,budget:l.moves});
    assert.ok(win,`${l.id} has a win`);
    assert.equal(search.play(l,win.path).outcome,'won',`${l.id} win replays`);
  }
});
