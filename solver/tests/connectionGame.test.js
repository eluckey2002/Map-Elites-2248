const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const witnesses=require('../../docs/game-design/levels/connection-pack/witnesses.json');
const rules=require('../../src/connection-rules');
const levels=require('../../src/connection-levels');
async function openGame(id,{saved=null}={}){
  const element=()=>({textContent:'',value:'',dataset:{},style:{},children:[],listeners:{},attributes:{},classList:{add(){},remove(){},toggle(){}},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},closest(){return this;},focus(){},querySelector(){return null;}});
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,element()]));
  const saves=[],storage=new Map([['unlockedLevel','42']]);
  const context={URLSearchParams,URL,crypto:{randomUUID:()=> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
    document:{getElementById:id=>nodes[id],createElement:element,createElementNS:element,createTextNode:value=>({textContent:String(value)}),body:element()},
    location:{search:`?mode=connections&puzzle=${id}${saved?'&attempt='+saved.attemptId:''}`},history:{replaceState(){}},addEventListener(){},
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
    fetch:async(url,options)=>{if(options)saves.push(JSON.parse(options.body));return {ok:true,json:async()=>url.startsWith('/api/connection-attempts/')?saved:({identity:'f'.repeat(64)})};}};
  context.window=context;vm.createContext(context);
  context.ChainCore=require('../engine');
  for(const file of ['connection-levels.js','connection-rules.js','connection-math.js','connection-game.js'])await vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context);
  return {nodes,saves,storage,select(chain){for(const[x,y]of chain){const cell=nodes['cx-board'].children.find(node=>+node.dataset.x===x&&+node.dataset.y===y);assert.ok(cell);nodes['cx-board'].listeners.click({target:cell,detail:0});}},async flush(){await new Promise(resolve=>setImmediate(resolve));}};
}

test('actual page shows live arithmetic and free preview/cancel without spending',async()=>{
  const app=await openGame('crosscurrent'),{nodes}=app;
  const first=witnesses[0].actions[0];app.select(first.chain);
  assert.equal(nodes['cx-sum'].textContent,'512');
  assert.equal(nodes['cx-moves'].textContent,'9');
  nodes['cx-preview'].onclick();assert.equal(nodes['cx-moves'].textContent,'9');
  assert.ok(nodes['cx-board'].children.every(cell=>cell.disabled));
  nodes['cx-clear'].onclick();assert.equal(nodes['cx-sum'].textContent,'0');
  assert.equal(nodes['cx-moves'].textContent,'9');
  app.select(first.chain);nodes['cx-merge'].onclick();assert.equal(nodes['cx-moves'].textContent,'8');
  nodes['cx-undo'].onclick();assert.equal(nodes['cx-moves'].textContent,'9');
  assert.equal(app.storage.get('unlockedLevel'),'42');
});

test('actual controls earn/remove, finish all goals, undo the result and retry identically',async()=>{
  const witness=witnesses[2],app=await openGame(witness.id),{nodes}=app;
  for(const action of witness.actions){
    if(action.type==='remove'){nodes['cx-remove'].onclick();app.select([action.position]);}
    else{app.select(action.chain);nodes['cx-merge'].onclick();}
  }
  assert.equal(nodes['cx-progress'].textContent,'3 / 3');
  assert.equal(nodes['cx-charges'].textContent,'0 / 3');
  assert.match(nodes['cx-result-title'].textContent,/complete/i);
  assert.equal(nodes['cx-result'].hidden,false);
  assert.equal(app.storage.get('unlockedLevel'),'42');
  nodes['cx-undo'].onclick();assert.equal(nodes['cx-result'].hidden,true);
  assert.equal(nodes['cx-progress'].textContent,'2 / 3');
  await app.flush();
  const level=levels.find(level=>level.id===witness.id);
  assert.equal(rules.replay(level,app.saves.at(-1).actions).completed,2);
  nodes['cx-retry'].onclick();
  assert.equal(nodes['cx-progress'].textContent,'0 / 3');assert.equal(nodes['cx-moves'].textContent,'10');
  assert.equal(nodes['cx-charges'].textContent,'0 / 3');
  assert.deepEqual(nodes['cx-board'].children.map(cell=>+cell.children[0].textContent),level.grid.flat());
});

test('actual controller resumes by replay into a new attempt and retains full undo state',async()=>{
  const witness=witnesses[2],level=levels.find(item=>item.id===witness.id);
  const saved={attemptId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',identity:'f'.repeat(64),levelId:level.id,actions:witness.actions.slice(0,2),feedback:'Saved QA note'};
  const original=JSON.stringify(saved),app=await openGame(level.id,{saved});
  const expected=rules.replay(level,saved.actions);
  assert.equal(app.nodes['cx-moves'].textContent,String(level.moves-2));
  assert.equal(app.nodes['cx-feedback'].value,saved.feedback);
  assert.deepEqual(app.nodes['cx-board'].children.map(cell=>+cell.children[0].textContent),expected.grid.flat().map(tile=>tile.value));
  await app.flush();assert.notEqual(app.saves.at(-1).attemptId,saved.attemptId);
  app.nodes['cx-undo'].onclick();await app.flush();
  assert.equal(app.nodes['cx-moves'].textContent,String(level.moves-1));
  assert.equal(app.nodes['cx-charges'].textContent,'1 / 3');
  assert.deepEqual(rules.replay(level,app.saves.at(-1).actions),rules.replay(level,saved.actions.slice(0,1)));
  assert.equal(JSON.stringify(saved),original,'resumption must not mutate the saved source');
});

test('arithmetic aid covers actual targets without giving board paths',()=>{
  const math=require('../../src/connection-math');
  for(const target of [...levels.flatMap(level=>level.objectives.map(goal=>goal.target)),352]){
    const examples=math.recipes(target);
    assert.ok(examples.length>0&&examples.length<=6);
    for(const values of examples){
      assert.ok(values.length>=3&&values.length<=30);
      assert.equal(values.reduce((sum,value)=>sum+value,0),target);
      assert.equal(values[0],values[1]);
      assert.ok(values.every(value=>Number.isInteger(Math.log2(value))));
      assert.ok(values.slice(2).every((value,index)=>value===values[index+1]||value===2*values[index+1]));
    }
  }
});
