const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const levels=require('../../src/connection-levels');
const rules=require('../../src/connection-rules');
const author=require('../../tools/author-connection-levels');
const witnessPath=path.resolve(__dirname,'../../docs/game-design/levels/connection-pack/witnesses.json');

test('actual catalog has three distinct puzzles, three separated goals, independent inventory',()=>{
  assert.equal(levels.length,3);assert.equal(new Set(levels.map(level=>level.id)).size,3);
  for(const level of levels){
    const state=rules.create(level);assert.equal(state.charges,0);
    assert.equal(level.objectives.length,3);assert.equal(state.outcome,'playing');
    for(const goal of level.objectives){
      assert.ok(Math.max(Math.abs(goal.ends[0][0]-goal.ends[1][0]),Math.abs(goal.ends[0][1]-goal.ends[1][1]))>=2);
    }
  }
});

test('actual whole-level witnesses win, including useful earned removal before completion',()=>{
  const witnesses=JSON.parse(fs.readFileSync(witnessPath,'utf8'));
  const result=author.qualify(levels,witnesses);
  assert.equal(result.length,3);
  assert.ok(result.some(entry=>entry.removals>0));
  for(const entry of result){assert.equal(entry.outcome,'won');assert.ok(entry.moves<=entry.budget);}
});

test('qualification rejects absent catalog, absent witnesses and a genuinely corrupted route',()=>{
  const witnesses=JSON.parse(fs.readFileSync(witnessPath,'utf8'));
  assert.throws(()=>author.qualify([],witnesses));
  assert.throws(()=>author.qualify(levels,[]));
  const bad=JSON.parse(JSON.stringify(witnesses));bad[0].actions[0]={type:'move',chain:[[0,0],[0,0],[0,0]]};
  assert.throws(()=>author.qualify(levels,bad),/Invalid chain/);
  const result=cp.spawnSync(process.execPath,[path.resolve(__dirname,'../../tools/author-connection-levels.js'),'--witnesses',path.join(__dirname,'absent-connection-witness.json')],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/ENOENT/);
});

test('bounded shortcut reports declare scope and unknowns rather than proving difficulty',()=>{
  for(const level of levels){
    const report=author.shortcutReport(level,{maxStates:50,maxChainNodes:500});
    assert.equal(report.depth,2);assert.ok(report.states<=50);
    assert.ok(['FOUND','NONE_WITHIN_BOUND','UNKNOWN'].includes(report.status));
    assert.equal(report.humanDifficulty,'unmeasured');
  }
});

test('Keep a Line decision scene reads the real board and distinguishes equal-sum placements',()=>{
  const level=levels.find(level=>level.id==='keep-a-line');
  const witness=JSON.parse(fs.readFileSync(witnessPath,'utf8')).find(entry=>entry.id===level.id);
  const state=rules.replay(level,witness.actions.slice(0,2));
  const primary=witness.actions[2].chain;
  const alternative=[[2,2],[1,3],[0,2],[0,3],[1,4],[2,4],[3,5]];
  assert.deepEqual(primary.map(([x,y])=>state.grid[y][x].value),[4,4,8,16,32]);
  assert.deepEqual(alternative.map(([x,y])=>state.grid[y][x].value),[4,4,8,8,8,16,16]);
  const useful=rules.move(state,primary),other=rules.move(state,alternative);
  assert.equal(useful.last.landing.value,64);assert.equal(other.last.landing.value,64);
  assert.equal(author.findGoal(useful).status,'FOUND');
  assert.equal(author.findGoal(other).status,'NONE');
});
