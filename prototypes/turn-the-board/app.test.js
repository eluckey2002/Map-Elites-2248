const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const game = require('./model');
const routes = require('./witnesses.json');

// Real page and script; DOM stand-in does not verify native layout or touch.
async function openApp() {
  const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8'), saved=[];
  function element(tag='div') {
    return {tag,textContent:'',value:'',dataset:{},style:{},children:[],listeners:{},
      classList:{add(){},remove(){},toggle(){}},
      append(...children){this.children.push(...children);},
      replaceChildren(...children){this.children=children;},
      setAttribute(){},addEventListener(type,fn){this.listeners[type]=fn;},
      closest(){return this;},focus(){}};
  }
  const nodes=Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
  const document={body:element(),getElementById:id=>nodes[id],createElement:element,
    createElementNS:(_,tag)=>element(tag),createTextNode:text=>({textContent:String(text)})};
  let sequence=0;
  await vm.runInNewContext(fs.readFileSync(path.join(__dirname,'app.js'),'utf8'),{
    window:{Archetypes:game,addEventListener(){}},document,
    crypto:{randomUUID:()=>`test-${++sequence}`},
    fetch:async(url,options)=>{
      if(options?.body)saved.push(JSON.parse(options.body));
      return {ok:true,json:async()=>({identity:'ui-test'})};
    },
  });
  const flush=()=>new Promise(resolve=>setImmediate(resolve));
  await flush();
  return {nodes,saved,flush,select(x,y){
    const tile=nodes.board.children.find(cell=>cell.dataset.x===x&&cell.dataset.y===y);
    assert.ok(tile&&tile.tag==='button',`Actual rendered tile ${x},${y}`);
    nodes.board.listeners.pointerdown({target:tile,preventDefault(){}});
  }};
}

test('actual controls preview both turns freely, cancel, display live sum, merge, undo and restart',async()=>{
  const {nodes,saved,select,flush}=await openApp();
  assert.equal(nodes.board.children.length,25);
  assert.equal(nodes.board.children.filter(cell=>cell.tag==='button').length,17);
  assert.equal(nodes.gravity.textContent,'↓ Down'); assert.equal(nodes.moves.textContent,8);
  nodes['turn-cw'].onclick();
  assert.equal(nodes.gravity.textContent,'← Left'); assert.equal(nodes.moves.textContent,7);
  assert.match(nodes.merge.textContent,/Commit turn/); assert.match(nodes.selection.textContent,/PREVIEW/);
  nodes.clear.onclick(); assert.equal(nodes.gravity.textContent,'↓ Down'); assert.equal(nodes.moves.textContent,8);
  nodes['turn-ccw'].onclick(); assert.equal(nodes.gravity.textContent,'→ Right');
  nodes.preview.onclick(); assert.equal(nodes.gravity.textContent,'↓ Down');
  await flush(); assert.equal(saved.length,1,'Previews do not save actions');
  select(3,2); assert.equal(nodes['chain-sum'].textContent,'32'); assert.equal(nodes.merge.disabled,true);
  select(4,3); select(4,4); assert.equal(nodes['chain-sum'].textContent,'128');
  nodes.preview.onclick(); assert.equal(nodes['chain-sum'].textContent,'128'); assert.equal(nodes.score.textContent,'192 / 550');
  nodes.preview.onclick(); assert.equal(nodes.score.textContent,'0 / 550');
  nodes.merge.onclick(); assert.equal(nodes.score.textContent,'192 / 550'); assert.equal(nodes.moves.textContent,7);
  assert.equal(nodes['chain-sum'].textContent,'0');
  nodes.undo.onclick(); assert.equal(nodes.score.textContent,'0 / 550'); assert.equal(nodes.moves.textContent,8);
  await flush(); assert.deepEqual(game.replay('turn',saved.at(-1).actions),game.create());
  const prior=saved.at(-1).sessionId; nodes.restart.onclick(); await flush();
  assert.notEqual(saved.at(-1).sessionId,prior); assert.deepEqual(saved.at(-1).actions,[]);
});

for(const name of ['turnFirst','harvestFirst']) test(`${name}: actual UI commits route, captures turns and undoes terminal state`,async()=>{
  const {nodes,select,saved,flush}=await openApp();
  for(const action of routes[name]) {
    if(action.type==='rotate')nodes['turn-'+action.direction].onclick();
    else action.chain.forEach(([x,y])=>select(x,y));
    assert.equal(nodes.merge.disabled,false); nodes.merge.onclick();
  }
  assert.match(nodes.outcome.textContent,/Complete in 4 actions/);
  assert.equal(nodes.moves.textContent,4); assert.equal(nodes['turn-cw'].disabled,true);
  await flush(); assert.deepEqual(saved.at(-1).actions,routes[name]);
  assert.equal(game.replay('turn',saved.at(-1).actions).outcome,'won');
  nodes.undo.onclick(); assert.equal(nodes.outcome.hidden,true); assert.equal(nodes.moves.textContent,5);
  assert.equal(nodes['turn-cw'].disabled,false); await flush();
  assert.equal(game.replay('turn',saved.at(-1).actions).outcome,'playing');
});
