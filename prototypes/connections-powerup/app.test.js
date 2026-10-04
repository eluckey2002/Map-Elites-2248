const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const game=require('./model');
const witness=require('./earn-witness.json');
const copy=v=>JSON.parse(JSON.stringify(v));

// Executes the actual page and script. It does not prove rendering or native touch input.
async function openApp({rules=game,saved=null}={}){
  function element(){return{textContent:'',value:'',dataset:{},style:{},children:[],listeners:{},attributes:{},classList:{add(){},remove(){},toggle(){}},append(...v){this.children.push(...v);},replaceChildren(...v){this.children=v;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(type,fn){this.listeners[type]=fn;},closest(){return this;},focus(){},querySelector(selector){const p=selector.match(/data-x="(\d+)".*data-y="(\d+)"/);return p?this.children.find(n=>n.dataset.x===+p[1]&&n.dataset.y===+p[2]):null;}};}
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),saves=[];
  let pointed=null;const events={};
  const document={body:element(),getElementById:id=>nodes[id],createElement:element,createElementNS:element,createTextNode:text=>({textContent:String(text)}),elementFromPoint:()=>pointed};
  const script=fs.readFileSync(path.join(__dirname,'../connections-continuous/combinations.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'app.js'),'utf8');
  const window={Continuous:rules,addEventListener:(type,fn)=>events[type]=fn,location:{search:saved?`?session=${saved.sessionId}`:''},history:{replaceState(){}}};
  await vm.runInNewContext(script,{window,document,URLSearchParams,crypto:{randomUUID:()=> '00000000-0000-0000-0000-000000000000'},fetch:async(url,options)=>{if(options)saves.push(JSON.parse(options.body));return{ok:true,json:async()=>url.startsWith('/api/session/')?saved:{identity:'test'}};}});
  return{nodes,saves,select(chain,keyboard=false){for(const[x,y]of chain){const tile=nodes.board.children.find(n=>n.dataset.x===x&&n.dataset.y===y);assert.ok(tile);if(keyboard)nodes.board.listeners.click({target:tile,detail:0});else nodes.board.listeners.pointerdown({target:tile,preventDefault(){}});}},moveOver(x,y){pointed=nodes.board.children.find(n=>n.dataset.x===x&&n.dataset.y===y);events.pointermove({clientX:0,clientY:0});},async flush(){await new Promise(resolve=>setImmediate(resolve));}};
}

test('actual UI earns, banks, arms/cancels, spends by keyboard, and undoes one charge',async()=>{
  const app=await openApp(),{nodes}=app;
  assert.ok(nodes.remove,'Actual page must expose the power-up');
  assert.equal(nodes.charges.textContent,'0 / 3');assert.equal(nodes.remove.disabled,true);
  nodes.remove.onclick();assert.equal(nodes.remove.attributes['aria-pressed'],'false');
  for(const action of witness){app.select(action.chain);nodes.merge.onclick();}
  assert.equal(nodes.charges.textContent,'1 / 3');assert.equal(nodes.remove.disabled,false);
  assert.match(nodes.selection.textContent,/Earned/);
  await app.flush();const earned=game.replay('continuous',app.saves.at(-1).actions);
  assert.equal(earned.charges,1);
  app.select([[0,0]]);nodes.remove.onclick();assert.equal(nodes['chain-sum'].textContent,'0');
  assert.equal(nodes.remove.attributes['aria-pressed'],'true');assert.equal(nodes.merge.disabled,true);
  nodes.remove.onclick();assert.equal(nodes.charges.textContent,'1 / 3');
  assert.equal(nodes.remove.attributes['aria-pressed'],'false');
  nodes.remove.onclick();app.select([[1,3]],true);await app.flush();
  const spent=game.replay('continuous',app.saves.at(-1).actions);
  assert.equal(spent.charges,0);assert.equal(nodes.charges.textContent,'0 / 3');
  assert.equal(spent.score,earned.score);assert.deepEqual(spent.objective,earned.objective);
  assert.equal(nodes.moves.textContent,earned.totalMoves+1);
  nodes.undo.onclick();await app.flush();
  assert.equal(nodes.charges.textContent,'1 / 3');
  assert.deepEqual(game.replay('continuous',app.saves.at(-1).actions),earned);
});

test('preview displays a possible award, but the actual bank stays empty and unspendable',async()=>{
  const state=game.create();[512,512,1024].forEach((value,x)=>state.grid[0][x].value=value);
  const app=await openApp({rules:{...game,create:()=>copy(state)}}),{nodes}=app;
  app.select([[0,0],[1,0],[2,0]]);nodes.preview.onclick();
  assert.equal(nodes.charges.textContent,'0 / 3');assert.equal(nodes.remove.disabled,true);
  assert.match(nodes['powerup-status'].textContent,/would earn/i);
  assert.ok(nodes.board.children.every(c=>c.disabled));
  nodes.preview.onclick();nodes.merge.onclick();assert.equal(nodes.charges.textContent,'1 / 3');
});

test('a saved charge can be spent from the no-chain UI, without dragging away a second tile',async()=>{
  const state=game.create();state.charges=2;state.outcome='no-chains';
  state.grid.flat().forEach((tile,i)=>tile.value=3+i*6);
  const app=await openApp({rules:{...game,create:()=>copy(state)}}),{nodes}=app;
  assert.ok(nodes.board.children.every(c=>c.disabled));assert.equal(nodes.remove.disabled,false);
  nodes.remove.onclick();assert.ok(nodes.board.children.every(c=>!c.disabled));
  app.select([[0,0]]);assert.equal(nodes.charges.textContent,'1 / 3');
  app.moveOver(1,0);assert.equal(nodes['chain-sum'].textContent,'0');
  assert.equal(nodes.charges.textContent,'1 / 3');
  assert.equal(nodes.remove.attributes['aria-pressed'],'false');
  await app.flush();assert.equal(app.saves.at(-1).actions.filter(a=>a.type==='remove').length,1);
});

test('resumed removal history restores bank and board on undo; stale rules are rejected',async()=>{
  const actions=[...witness,{type:'remove',position:[1,3]}];
  const saved={sessionId:'11111111-1111-1111-1111-111111111111',identity:'test',level:'continuous',actions,feedback:'Draft'};
  const app=await openApp({saved}),{nodes}=app;
  assert.equal(nodes.charges.textContent,'0 / 3');assert.equal(nodes.undo.disabled,false);
  nodes.undo.onclick();await app.flush();
  assert.equal(nodes.charges.textContent,'1 / 3');
  assert.deepEqual(game.replay('continuous',app.saves.at(-1).actions),game.replay('continuous',witness));
  nodes.undo.onclick();assert.equal(nodes.charges.textContent,'0 / 3');
  const rejected=await openApp({saved:{...saved,identity:'old-rules'}});
  assert.equal(rejected.nodes.charges.textContent,'0 / 3');
  assert.match(rejected.nodes['resume-status'].textContent,/Could not restore/);
});
