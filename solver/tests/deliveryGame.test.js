const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const levels=require('../../src/delivery-levels');
const library=require('../../src/game-library');
const witnesses=require('../../docs/game-design/levels/delivery-pack/witnesses.json');

function openGame(id,{confirm=()=>true}={}){
  const element=()=>({textContent:'',value:'',dataset:{},style:{},children:[],listeners:{},attributes:{},classList:{add(){},remove(){},toggle(){}},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},closest(){return this;},focus(){},querySelector(){return null;}});
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,element()]));
  const storage=new Map([['unlockedLevel','42']]);
  const context={URLSearchParams,URL,confirm,
    document:{getElementById:id=>nodes[id],createElement:element,createElementNS:element,createTextNode:value=>({textContent:String(value)}),body:element()},
    location:{search:`?mode=delivery&puzzle=${id}`},addEventListener(){},GameLibrary:library,
    localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}};
  context.window=context;vm.createContext(context);
  context.ChainCore=require('../engine');
  for(const file of ['delivery-levels.js','delivery-rules.js','delivery-game.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),context);
  return {nodes,storage,select(chain){for(const[x,y]of chain){const cell=nodes['dx-board'].children.find(node=>+node.dataset.x===x&&+node.dataset.y===y);assert.ok(cell);nodes['dx-board'].listeners.click({target:cell,detail:0});}}};
}

test('actual page plays every authored route to delivery and records the win without touching level progress',()=>{
  for(const board of witnesses.boards)for(const route of Object.values(board.routes)){
    const app=openGame(board.id),{nodes}=app;
    assert.equal(nodes['dx-play'].hidden,false);assert.equal(nodes['dx-error'].hidden,undefined);
    for(const chain of route){app.select(chain);nodes['dx-merge'].onclick();}
    assert.equal(nodes['dx-result-title'].textContent,'Parcel delivered');
    assert.equal(nodes['dx-parcel'].textContent,'Delivered');
    assert.equal(JSON.parse(app.storage.get('deliveryPuzzleWins'))[board.id],true);
    assert.equal(app.storage.get('unlockedLevel'),'42');
  }
});

test('preview and clear spend nothing, undo restores, and the parcel cannot be selected',()=>{
  const app=openGame('staggered'),{nodes}=app,first=witnesses.boards[1].routes.bottomFirst[0];
  const parcel=nodes['dx-board'].children.find(cell=>+cell.dataset.x===2&&+cell.dataset.y===1);
  assert.equal(parcel.disabled,true);
  assert.match(nodes['dx-parcel'].textContent,/4 rows to go/);
  app.select(first);assert.match(nodes['dx-selection'].textContent,/drops 1 row/);
  nodes['dx-preview'].onclick();assert.match(nodes['dx-selection'].textContent,/PREVIEW ONLY/);assert.equal(nodes['dx-moves'].textContent,'7');
  nodes['dx-preview'].onclick();assert.equal(nodes['dx-moves'].textContent,'8');
  nodes['dx-clear'].onclick();assert.equal(nodes['dx-merge'].disabled,true);
  app.select(first);nodes['dx-merge'].onclick();assert.equal(nodes['dx-moves'].textContent,'7');
  nodes['dx-undo'].onclick();assert.equal(nodes['dx-moves'].textContent,'8');assert.equal(nodes['dx-undo'].disabled,true);
});

test('retry asks before discarding moves, and the result links to the next board in order',()=>{
  let asked=0;const app=openGame('pair-drop',{confirm:()=>{asked++;return false;}}),{nodes}=app;
  app.select(witnesses.boards[0].routes.witness[0]);nodes['dx-merge'].onclick();
  nodes['dx-retry'].onclick();assert.equal(asked,1);assert.equal(nodes['dx-moves'].textContent,'7');
  assert.match(nodes['dx-next'].href,/mode=delivery/);assert.match(nodes['dx-next'].href,/puzzle=staggered/);
  assert.match(openGame('landing').nodes['dx-next'].textContent,/Back to the Delivery puzzles/);
});

test('router opens the Delivery library and loads only the Delivery controller',async()=>{
  assert.equal(library.resolveRoute('?mode=delivery',levels).mode,'library');
  assert.equal(library.resolveRoute('?mode=delivery&puzzle=landing',levels).puzzle.id,'landing');
  assert.equal(library.resolveRoute('?mode=delivery&puzzle=missing',levels).mode,'error');
  assert.equal(library.legacyUrl(new URL(library.deliveryUrl('?level=7'),'http://localhost').search),'?level=7');
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  assert.match(html,/id="delivery-entry"/);
  for(const [search,expected] of [['?mode=delivery',['delivery-levels.js']],['?mode=delivery&puzzle=staggered',['delivery-levels.js','connection-core.js','delivery-rules.js','delivery-game.js']]]){
    const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{hidden:false,children:[],append(child){this.children.push(child);},replaceChildren(){this.children=[];}}]));
    const scripts=[];
    const document={getElementById:id=>nodes[id],createElement:()=>({append(){}}),body:{classList:{add(){}}},head:{append(node){if(node.src){scripts.push(node.src);queueMicrotask(()=>node.onload());}}}};
    const context={document,URLSearchParams,URL,location:{search},DeliveryLevels:levels,localStorage:{getItem:()=>null}};context.window=context;context.globalThis=context;
    vm.createContext(context);await vm.runInContext(fs.readFileSync(path.join(root,'src/game-library.js'),'utf8'),context);
    assert.deepEqual(scripts,expected);
    assert.equal(nodes['delivery-app'].hidden,false);assert.equal(nodes['legacy-app'].hidden,true);
    if(expected.length===1)assert.equal(nodes['dx-level-list'].children.length,3);
  }
});
