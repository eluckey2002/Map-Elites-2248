const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const library=require('../../src/game-library');
const levels=require('../../src/connection-levels');
const root=path.resolve(__dirname,'../..');

test('legacy queries keep their original meaning; Connections uses stable puzzle IDs',()=>{
  for(const query of ['', '?level=54&seed=3310936729','?candidate=51&seed=1&familyBoardStudies=1']){
    assert.equal(library.resolveRoute(query,levels).mode,'legacy');
    const link=library.connectionsUrl(query);
    assert.equal(library.legacyUrl(new URL(link,'http://localhost').search),query||'?mode=legacy');
  }
  assert.equal(library.resolveRoute('?mode=connections&puzzle=crosscurrent',levels).puzzle.id,'crosscurrent');
  assert.equal(library.resolveRoute('?mode=connections',levels).mode,'library');
  assert.equal(library.resolveRoute('?mode=connections&puzzle=missing',levels).mode,'error');
});

test('actual app entry and router load only the chosen controller in original order',async()=>{
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  assert.match(html,/id="connections-entry"/);
  assert.match(html,/id="legacy-app"/);
  assert.match(html,/<script src="game-library.js"><\/script>/);
  assert.doesNotMatch(html,/<script src="game.js"><\/script>/,'legacy boot must be conditional');
  for(const [search,expected]of [['?level=54&seed=1',['game.js','more-levels.js']],['?mode=connections&puzzle=crosscurrent',['connection-levels.js','connection-core.js','connection-rules.js','connection-math.js','connection-game.js']]]){
    const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{hidden:false,children:[],append(child){this.children.push(child);},replaceChildren(){this.children=[];}}]));
    const scripts=[];
    const document={getElementById:id=>nodes[id],createElement:()=>({}),body:{classList:{add(){}}},head:{append(node){if(node.src){scripts.push(node.src);queueMicrotask(()=>node.onload());}}}};
    const context={document,URLSearchParams,URL,location:{search},ConnectionLevels:levels};context.window=context;context.globalThis=context;
    vm.createContext(context);await vm.runInContext(fs.readFileSync(path.join(root,'src/game-library.js'),'utf8'),context);
    assert.deepEqual(scripts,expected);
  }
});

test('legacy script-load failure puts its alert in the visible original view',async()=>{
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)].map(([tag,id])=>[id,{hidden:/\shidden(?:\s|>)/.test(tag),children:[],append(child){this.children.push(child);}}]));
  const document={getElementById:id=>nodes[id],createElement:()=>({}),head:{append(script){queueMicrotask(()=>script.onerror());}}};
  await library.boot({document,location:{search:''}});
  assert.equal(nodes['connections-app'].hidden,true);
  assert.equal(nodes['cx-error'].hidden,false);
  assert.match(nodes['cx-error'].textContent,/Could not load game.js/);
  assert.ok(nodes['legacy-app'].children.includes(nodes['cx-error']),'alert must not remain inside the hidden variant');
});

test('a static server without connection-core.js falls back to the solver engine',async()=>{
  const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([,id])=>[id,{hidden:false,children:[],append(child){this.children.push(child);},replaceChildren(){this.children=[];}}]));
  const scripts=[],engine=fs.readFileSync(path.join(root,'solver/engine.js'),'utf8');
  let context,coreSeen;
  const document={getElementById:id=>nodes[id],createElement:()=>({}),body:{classList:{add(){}}},head:{append(node){if(!node.src)return;scripts.push(node.src);queueMicrotask(()=>{
    if(node.src==='connection-core.js')return node.onerror();
    if(node.src==='../solver/engine.js')vm.runInContext(engine,context);
    if(node.src==='connection-rules.js')coreSeen={core:context.ChainCore,module:context.module};
    node.onload();
  });}}};
  context={document,URLSearchParams,URL,location:{search:'?mode=connections&puzzle=crosscurrent'},ConnectionLevels:levels};context.window=context;context.globalThis=context;
  vm.createContext(context);await vm.runInContext(fs.readFileSync(path.join(root,'src/game-library.js'),'utf8'),context);
  assert.deepEqual(scripts,['connection-levels.js','connection-core.js','../solver/engine.js','connection-rules.js','connection-math.js','connection-game.js']);
  assert.deepEqual(Object.keys(coreSeen.core).sort(),Object.keys(require('../engine')).sort());
  assert.equal(coreSeen.module,undefined,'the CommonJS shim must be gone before the browser modules load');
  assert.equal(nodes['cx-error'].textContent,undefined,'no load error shown');
});
