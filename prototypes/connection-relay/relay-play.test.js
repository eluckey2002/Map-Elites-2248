// node --test prototypes/connection-relay/relay-play.test.js
const test=require('node:test'),assert=require('node:assert');
const rules=require('../../src/connection-rules');
const relay=require('./relay-play');
const {chains,rng,randomGrid}=require('./search');
const levels=(()=>{const window={};new Function('window',require('node:fs').readFileSync(require.resolve('./levels.js'),'utf8'))(window);return window.RelayLevels;})();
const witnesses=require('./witnesses.json');

test('followed positions match where the engine puts each tile',()=>{
  const random=rng(11);
  for(let trial=0;trial<200;trial++){
    const level={id:'t',moves:99,refillSeed:trial,grid:randomGrid(random),objectives:[{ends:[[0,0],[4,5]],target:1e9}]};
    const state=rules.create(level);
    const all=chains(state,5,800);if(!all.length)continue;
    const chain=all[Math.floor(random()*all.length)];
    const [x,y]=[Math.floor(random()*5),Math.floor(random()*6)];
    state.grid[y][x].tag='watched';
    const next=rules.move(state,chain),at=relay.followMove(chain,[x,y]);
    const merged=chain.some(p=>p[0]===x&&p[1]===y);
    if(merged)assert.strictEqual(at,null);
    else assert.strictEqual(next.grid[at[1]][at[0]].tag,'watched');
  }
});

test('removal drops the tiles above it by one',()=>{
  const level={id:'t',moves:99,refillSeed:3,grid:randomGrid(rng(5)),objectives:[{ends:[[0,0],[4,5]],target:1e9}]};
  const state=rules.create(level);state.charges=1;state.grid[1][2].tag='watched';
  const next=rules.remove(state,[2,4]);
  assert.strictEqual(next.grid[2][2].tag,'watched');
  assert.deepStrictEqual(relay.followRemove([2,4],[2,1]),[2,2]);
});

test('every board wins on its witness, and each linked marker sits on the tile that was made',()=>{
  for(const level of levels){
    const {actions}=witnesses.find(w=>w.id===level.id);
    let state=relay.create(level);
    for(const action of actions){
      state=relay.move(state,action.chain);
      const goal=state.objective;if(!goal)continue;
      for(const link of goal.follow||[])assert.deepStrictEqual(goal.ends[link.end],state.relay.made[link.made].at,level.id);
    }
    assert.strictEqual(state.outcome,'won',level.id);
  }
});

test('finishing a connection the other way round moves the next marker with the tile',()=>{
  // On some board, complete a goal whose next goal follows its tile with a chain that ends on ① instead of ②.
  const {goalChains}=require('./search');let checked=0;
  for(const level of levels){
    const {actions}=witnesses.find(w=>w.id===level.id);
    let state=relay.create(level);
    for(const action of actions){
      const k=state.completed,next=level.objectives[k+1];
      const link=next?.follow.find(l=>l.made===k);
      if(link&&rules.matches(state,action.chain)){
        const back=goalChains(state,state.objective,40).found.find(c=>c.at(-1)[0]===state.objective.ends[0][0]&&c.at(-1)[1]===state.objective.ends[0][1]);
        if(back){const after=relay.move(state,back);
          assert.deepStrictEqual(after.objective.ends[link.end],[after.last.landing.x,after.last.landing.y]);checked++;}
      }
      state=relay.move(state,action.chain);
    }
  }
  assert.ok(checked>0,'no reversed completion found on any board');
});

test('using a made tile in another chain leaves its marker in place, as the fixed-place rules do',()=>{
  // Keep Growing after its first connection: ① is a 32. The biggest merge on the board can run through it.
  const level=levels.find(l=>l.id==='keep-growing'),{actions}=witnesses.find(w=>w.id===level.id);
  let state=relay.create(level);
  for(const action of actions){state=relay.move(state,action.chain);if(state.completed===1)break;}
  const one=state.objective.ends[0],{chains}=require('./search');
  const uses=c=>c.some(p=>p[0]===one[0]&&p[1]===one[1])&&!rules.matches(state,c);
  const all=chains(state,8,20000),through=all.find(c=>uses(c)&&!(c.at(-1)[0]===one[0]&&c.at(-1)[1]===one[1]));
  const ending=all.find(c=>uses(c)&&c.at(-1)[0]===one[0]&&c.at(-1)[1]===one[1]);
  assert.ok(through&&ending);
  for(const chain of [through,ending]){
    const after=relay.move(state,chain);
    assert.deepStrictEqual(after.objective.ends[0],one);
    assert.strictEqual(after.relay.made[0].fixed,true);
  }
});

test('at the named baseline state, every biggest merge spends the made tile',()=>{
  const level=levels.find(l=>l.id==='keep-growing'),{actions}=witnesses.find(w=>w.id===level.id);
  let state=relay.create(level);
  for(const action of actions){state=relay.move(state,action.chain);if(state.completed===1)break;}
  const one=state.objective.ends[0],sum=c=>c.reduce((t,[x,y])=>t+state.grid[y][x].value,0);
  const {chains,truncated}=rules.enumerateChains(state,5e6);assert.strictEqual(truncated,false);
  const uses=c=>c.some(p=>p[0]===one[0]&&p[1]===one[1]),max=Math.max(...chains.map(sum));
  assert.strictEqual(max,512);
  assert.ok(chains.filter(c=>sum(c)===max).every(uses));
  assert.strictEqual(Math.max(...chains.filter(c=>!uses(c)).map(sum)),480);
});
