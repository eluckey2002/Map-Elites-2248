const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {randomUUID} = require('node:crypto');
const {createServer} = require('./serve');
const game = require('./model');
const routes = require('./witnesses.json');

test('actual served rules replay turns and HTTP capture rejects invalid actions and stale identities',async t=>{
  const sessionsDir=fs.mkdtempSync(path.join(os.tmpdir(),'turn-board-test-'));
  const server=createServer({sessionsDir});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(origin+'/'); assert.equal(response.status,200);
  assert.match(await response.text(),/Turn the Board/);
  const browser={}; browser.window=browser;
  vm.runInNewContext(await(await fetch(origin+'/core.js')).text(),browser);
  vm.runInNewContext(await(await fetch(origin+'/model.js')).text(),browser);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.Archetypes.replay('turn',routes.turnFirst))),game.replay('turn',routes.turnFirst));
  const {identity}=await(await fetch(origin+'/api/identity')).json();
  const sessionId=randomUUID(), payload={sessionId,identity,level:'turn',actions:routes.turnFirst,feedback:'test capture',revision:2};
  const post=body=>fetch(origin+'/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post(payload)).status,200);
  const file=path.join(sessionsDir,sessionId+'.json');
  const original=fs.readFileSync(file,'utf8'), record=JSON.parse(original);
  assert.deepEqual(record.finalState,game.replay('turn',routes.turnFirst));
  assert.deepEqual(record.actions,routes.turnFirst);
  assert.equal((await post({...payload,revision:1,actions:[]})).status,200);
  assert.equal(fs.readFileSync(file,'utf8'),original,'Older revision cannot overwrite');
  for(const changes of [{identity:'stale'},{actions:[{type:'rotate',direction:'left'}]},
    {actions:[{type:'move',chain:[[0,0],[0,0],[0,0]]}]},{actions:[{type:'undo'}]}]) {
    assert.equal((await post({...payload,...changes,revision:3})).status,400);
    assert.equal(fs.readFileSync(file,'utf8'),original);
  }
  const undo={...payload,revision:3,actions:[...routes.turnFirst,{type:'undo'}]};
  assert.equal((await post(undo)).status,200);
  assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).finalState.outcome,'playing');
});
