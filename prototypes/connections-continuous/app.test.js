const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const game=require('./model');

// Runs the actual page/script; this is not a layout or native-input browser test.
async function openApp({rules=game,saved=null,resumeId=''}={}){
  function element(){return{textContent:'',value:'',dataset:{},style:{},children:[],listeners:{},classList:{add(){},remove(){},toggle(){}},append(...v){this.children.push(...v);},replaceChildren(...v){this.children=v;},setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;},closest(){return this;}};}
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),saves=[];
  const document={body:element(),getElementById:id=>nodes[id],createElement:element,createElementNS:element,createTextNode:text=>({textContent:String(text)})};
  const scripts=['combinations.js','app.js'].map(name=>fs.readFileSync(path.join(__dirname,name),'utf8')).join('\n');
  await vm.runInNewContext(scripts,{window:{Continuous:rules,addEventListener(){},location:{search:resumeId?`?session=${resumeId}`:''},history:{replaceState(){}}},document,URLSearchParams,crypto:{randomUUID:()=> '00000000-0000-0000-0000-000000000000'},fetch:async(url,options)=>{if(options)saves.push(JSON.parse(options.body));return{ok:true,json:async()=>url.startsWith('/api/session/')?saved:{identity:'test'}};}});
  return{nodes,saves,select(chain){for(const[x,y]of chain){const tile=nodes.board.children.find(n=>n.dataset.x===x&&n.dataset.y===y);assert.ok(tile);nodes.board.listeners.pointerdown({target:tile,preventDefault(){}});}},async flush(){await new Promise(resolve=>setImmediate(resolve));}};
}
test('actual UI permits non-objective merges, shows live sum, previews, advances, and undoes',async()=>{
  const app=await openApp(),{nodes}=app;let state=game.create();
  assert.equal(nodes.board.children.length,30);assert.match(nodes['objective-number'].textContent,/Challenge 1/);
  nodes['show-combinations'].onclick();assert.equal(nodes.combinations.hidden,false);
  for(const chain of state.objective.witness){
    const success=game.matches(state,chain),sum=chain.reduce((n,[x,y])=>n+state.grid[y][x].value,0);
    app.select(chain);assert.equal(nodes['chain-sum'].textContent,sum.toLocaleString());assert.equal(nodes.merge.disabled,false);
    assert.match(nodes.selection.textContent,success?/Completes challenge/:/challenge stays active/);
    nodes.preview.onclick();assert.equal(nodes.board.children[0].disabled,true);assert.match(nodes['objective-number'].textContent,/Challenge 1/);assert.equal(nodes.combinations.hidden,false);
    nodes.preview.onclick();nodes.merge.onclick();state=game.move(state,chain);
  }
  assert.match(nodes['objective-number'].textContent,/Challenge 2/);assert.equal(nodes.completed.textContent,1);
  assert.equal(nodes.combinations.hidden,true);
  assert.equal(nodes['feedback-target'].value,'1');nodes['rate-interesting'].onclick();
  nodes.undo.onclick();assert.match(nodes['objective-number'].textContent,/Challenge 1/);assert.equal(nodes.completed.textContent,0);
  nodes.skip.onclick();assert.equal(nodes.skipped.textContent,1);nodes['new-board'].onclick();assert.equal(nodes.skipped.textContent,2);
  await app.flush();const saved=app.saves.at(-1),replayed=game.replay(saved.level,saved.actions);
  assert.equal(replayed.skipped,2);assert.equal(replayed.completed,0);assert.equal(nodes.moves.textContent,replayed.totalMoves);
});

test('352 arithmetic reference and live remainder do not imply a legal route',async()=>{
  const state=game.create();state.objective.target=352;state.objective.ends=[[0,0],[2,0]];
  [88,88,176,176].forEach((value,x)=>state.grid[0][x].value=value);
  const app=await openApp({rules:{...game,create:()=>JSON.parse(JSON.stringify(state))}}),{nodes}=app;
  assert.equal(nodes['target-halves'].textContent,'352 → 176 → 88 → 44 → 22 → 11');
  assert.equal(nodes['target-balance'].textContent,'352 remaining');
  app.select([[0,0]]);assert.equal(nodes['target-balance'].textContent,'264 remaining');assert.equal(nodes.merge.disabled,true);
  app.select([[1,0]]);assert.equal(nodes['chain-sum'].textContent,'176');assert.equal(nodes['target-balance'].textContent,'176 remaining');
  app.select([[2,0]]);assert.equal(nodes['target-balance'].textContent,'Exact sum · check the endpoints');assert.equal(nodes.merge.disabled,false);
  nodes.preview.onclick();assert.equal(nodes['target-balance'].textContent,'Exact sum · check the endpoints');
  nodes.preview.onclick();app.select([[3,0]]);assert.equal(nodes['target-balance'].textContent,'176 over target');assert.equal(nodes.merge.disabled,false);
  assert.match(nodes.selection.textContent,/challenge stays active/);
  nodes.clear.onclick();assert.equal(nodes['target-balance'].textContent,'352 remaining');
  assert.match(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),/Arithmetic reference, not a required chain/);
});

test('saved-run continuation preserves board, goal, notes, and undo history without overwriting source',async()=>{
  let state=game.create();const actions=[];
  for(const chain of state.objective.witness){actions.push({type:'move',chain});state=game.move(state,chain);}
  actions.push({type:'feedback',objective:1,rating:'interesting',note:'Test note'});
  const saved={sessionId:'11111111-1111-1111-1111-111111111111',identity:'test',level:'continuous',actions,feedback:'Keep this draft'};
  const expected=game.replay('continuous',actions),app=await openApp({saved,resumeId:saved.sessionId}),{nodes}=app;
  assert.equal(nodes.moves.textContent,expected.totalMoves);assert.equal(nodes.completed.textContent,expected.completed);
  assert.match(nodes['objective-number'].textContent,/Challenge 2/);assert.equal(nodes.undo.disabled,false);
  assert.equal(nodes.feedback.value,saved.feedback);assert.equal(nodes['resume-status'].hidden,false);
  for(const cell of nodes.board.children)assert.equal(cell.children[0].textContent,String(expected.grid[cell.dataset.y][cell.dataset.x].value));
  await app.flush();assert.notEqual(app.saves.at(-1).sessionId,saved.sessionId);assert.deepEqual(game.replay('continuous',app.saves.at(-1).actions),expected);
  nodes.undo.onclick();await app.flush();const undone=game.replay('continuous',[...actions,{type:'undo'}]);
  assert.equal(nodes.moves.textContent,undone.totalMoves);assert.match(nodes['objective-number'].textContent,/Challenge 1/);
  assert.deepEqual(game.replay('continuous',app.saves.at(-1).actions),undone);
  nodes.skip.onclick();nodes.undo.onclick();assert.equal(nodes.moves.textContent,undone.totalMoves);
});

test('invalid resume identity is visibly rejected instead of restoring another ruleset',async()=>{
  const app=await openApp({saved:{identity:'wrong',level:'continuous',actions:[]},resumeId:'11111111-1111-1111-1111-111111111111'});
  assert.match(app.nodes['resume-status'].textContent,/Could not restore/);assert.equal(app.nodes.moves.textContent,0);
});

test('optional combinations reveal arithmetic only and reset for the next objective',async()=>{
  const state=game.create();state.objective.target=352;
  const app=await openApp({rules:{...game,create:()=>JSON.parse(JSON.stringify(state))}}),{nodes}=app;
  assert.ok(nodes['show-combinations'],'Actual page has the optional control');
  assert.equal(nodes.combinations.hidden,true);assert.equal(nodes['combination-list'].children.length,0);
  await app.flush();const actionsBefore=JSON.stringify(app.saves.at(-1).actions),boardBefore=nodes.board.children.map(c=>c.children[0].textContent);
  nodes['show-combinations'].onclick();assert.equal(nodes.combinations.hidden,false);
  const text=node=>[node.textContent,...node.children.map(text)].join(' ');
  const recipes=nodes['combination-list'].children.map(text);
  assert.ok(recipes.some(s=>s.includes('6 tiles')&&s.includes('32 + 32 + 32 + 64 + 64 + 128 = 352')));
  assert.ok(recipes.some(s=>s.includes('7 tiles')&&s.includes('32 + 32 + 32 + 64 + 64 + 64 + 64 = 352')));
  assert.ok(recipes.every(s=>!s.includes('row')&&!s.includes('column')));
  assert.deepEqual(nodes.board.children.map(c=>c.children[0].textContent),boardBefore);
  app.select([[0,0]]);assert.equal(nodes.combinations.hidden,false);nodes.clear.onclick();
  nodes['show-combinations'].onclick();assert.equal(nodes.combinations.hidden,true);
  await app.flush();assert.equal(JSON.stringify(app.saves.at(-1).actions),actionsBefore);
  nodes['show-combinations'].onclick();nodes.skip.onclick();assert.equal(nodes.combinations.hidden,true);
  nodes.undo.onclick();assert.equal(nodes.combinations.hidden,true);
});
