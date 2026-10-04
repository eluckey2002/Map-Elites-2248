const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {once} = require('node:events');
const {randomUUID} = require('node:crypto');
const vm = require('node:vm');
const {createServer} = require('./serve');
const {createServer: originalServer} = require('../archetype-trio/serve');

test('separate server serves matching browser rules and saves a winning variant replay', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'pair-drop-'));
  const next = createServer({sessionsDir:path.join(directory,'next')});
  const original = originalServer({sessionsDir:path.join(directory,'original')});
  t.after(() => {
    for (const server of [next,original]) { server.closeAllConnections(); server.close(); }
    fs.rmSync(directory,{recursive:true,force:true});
  });
  for (const server of [next,original]) { server.listen(0,'127.0.0.1'); await once(server,'listening'); }
  const url = `http://127.0.0.1:${next.address().port}`;
  const oldUrl = `http://127.0.0.1:${original.address().port}`;
  const identity = (await (await fetch(url+'/api/identity')).json()).identity;
  const oldIdentity = (await (await fetch(oldUrl+'/api/identity')).json()).identity;
  assert.notEqual(identity,oldIdentity);
  const page = await (await fetch(url)).text();
  assert.match(page,/One move prepares the next/);
  assert.match(page,/id="chain-sum"/);
  assert.doesNotMatch(page,/data-level="gates"/);
  const browser = {}; browser.window = browser;
  vm.createContext(browser);
  vm.runInContext(await (await fetch(url+'/core.js')).text(),browser);
  vm.runInContext(await (await fetch(url+'/model.js')).text(),browser);
  assert.equal(browser.Archetypes.LEVELS.delivery.name,'Delivery · Pair Drop');
  const actions = [
    [[0,2],[0,3],[1,3]], [[2,3],[2,2],[3,1]],
    [[0,3],[1,3],[2,4],[3,4]], [[2,5],[1,5],[0,5]],
  ].map(chain => ({type:'move',chain,swapped:false}));
  const payload = {identity,level:'delivery',sessionId:randomUUID(),revision:1,actions,feedback:'QA only'};
  const post = (base,body) => fetch(base+'/api/session',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),
  });
  assert.equal((await post(url,payload)).status,200);
  const record = JSON.parse(fs.readFileSync(path.join(directory,'next',payload.sessionId+'.json'),'utf8'));
  assert.equal(record.finalState.outcome,'won');
  assert.equal(record.finalState.moves,4);
  assert.deepEqual(record.finalState,JSON.parse(JSON.stringify(browser.Archetypes.replay('delivery',actions))));
  assert.equal((await post(oldUrl,payload)).status,400,'Variant identity cannot be saved as an original play');
  assert.equal((await post(url,{...payload,identity:oldIdentity})).status,400);
});
