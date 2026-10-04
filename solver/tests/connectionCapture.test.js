const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {createPlayServer}=require('../../tools/play-server');
const rules=require('../../src/connection-rules');
const levels=require('../../src/connection-levels');
const witnesses=require('../../docs/game-design/levels/connection-pack/witnesses.json');
const root=path.resolve(__dirname,'../..');

test('real served browser model and separate authoritative capture agree; forged/stale saves do not write',async t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'finite-connections-'));
  const legacy=path.join(directory,'legacy'),connections=path.join(directory,'connections');
  const server=createPlayServer({store:legacy,connectionsStore:connections});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  t.after(()=>new Promise(resolve=>server.close(()=>{fs.rmSync(directory,{recursive:true,force:true});resolve();})));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(origin+'/api/connection-identity');assert.equal(response.status,200);
  const {identity}=await response.json();assert.match(identity,/^[0-9a-f]{64}$/);
  const browser={};browser.window=browser;vm.createContext(browser);
  for(const asset of ['connection-core.js','connection-levels.js','connection-rules.js']){
    const served=await fetch(origin+'/'+asset);assert.equal(served.status,200);vm.runInContext(await served.text(),browser);
  }
  const witness=witnesses[2],level=levels.find(level=>level.id===witness.id),expected=rules.replay(level,witness.actions);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.ConnectionRules.replay(browser.ConnectionLevels[2],witness.actions))),expected);
  const payload={schemaVersion:1,attemptId:crypto.randomUUID(),identity,levelId:level.id,revision:1,actions:witness.actions,feedback:'Agent QA only'};
  const post=body=>fetch(origin+'/api/connection-attempts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post(payload)).status,200);
  const file=path.join(connections,payload.attemptId+'.json'),raw=fs.readFileSync(file,'utf8');
  assert.deepEqual(JSON.parse(raw).finalState,expected);assert.deepEqual(fs.readdirSync(legacy),[]);
  const stored=await(await fetch(origin+'/api/connection-attempts/'+payload.attemptId)).json();
  assert.deepEqual(stored.actions,witness.actions);
  for(const invalid of [
    {...payload,identity:'0'.repeat(64)},
    {...payload,finalState:{...expected,charges:99}},
    {...payload,levelId:'missing'},
    {...payload,actions:[{type:'remove',position:[0,0]}]},
    {...payload,actions:[{type:'skip'}]},
    {...payload,actions:[null]},
  ]){
    assert.equal((await post({...invalid,revision:2})).status,400);
    assert.equal(fs.readFileSync(file,'utf8'),raw);
  }
  const undone={...payload,revision:2,actions:[...witness.actions,{type:'undo'}]};
  assert.equal((await post(undone)).status,200);
  const current=fs.readFileSync(file,'utf8');assert.equal(JSON.parse(current).finalState.outcome,'playing');
  assert.equal((await post(payload)).status,409);assert.equal(fs.readFileSync(file,'utf8'),current);
  assert.equal((await post(undone)).status,200,'exact retry is idempotent');
  assert.equal((await post({...undone,feedback:'conflicting same revision'})).status,409);
  assert.equal(fs.readFileSync(file,'utf8'),current);
  assert.equal((await fetch(origin+'/docs/game-design/levels/connection-pack/witnesses.json')).status,404);
  assert.equal(await(await fetch(origin+'/game.js')).text(),fs.readFileSync(path.join(root,'src/game.js'),'utf8'));
  const old=JSON.parse(fs.readFileSync(path.join(root,'play-sessions/bf12acf631bbfed1603d20b449c00d9df3d11bf2405d4020aaeed1f025716e02.json'),'utf8'));
  assert.equal((await fetch(origin+'/api/play-sessions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(old)})).status,200);
  assert.equal(fs.readdirSync(legacy).length,1);assert.equal(fs.readdirSync(connections).length,1);
});
