const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const crypto=require('node:crypto');
const game=require('./model');
const {createServer}=require('./serve');
const witness=require('./earn-witness.json');

test('actual served rules, browser script, capture and resumed undo agree on earned removals',async t=>{
  const sessionsDir=fs.mkdtempSync(path.join(os.tmpdir(),'connections-powerup-qa-'));
  const server=createServer({sessionsDir});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const {identity}=await(await fetch(origin+'/api/identity')).json();
  const html=await(await fetch(origin)).text();
  assert.match(html,/<title>2248 · Connection Run \+ Power-up<\/title>/);
  assert.match(html,/id="remove"/);assert.match(html,/id="charges"/);
  assert.equal(await(await fetch(origin+'/app.js')).text(),
    fs.readFileSync(path.join(__dirname,'../connections-continuous/combinations.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'app.js'),'utf8'));
  const browser={};browser.window=browser;vm.createContext(browser);
  for(const asset of ['core.js','model.js'])vm.runInContext(await(await fetch(origin+'/'+asset)).text(),browser);
  const actions=[...witness,{type:'remove',position:[1,3]},{type:'undo'},
    {type:'remove',position:[1,3]},{type:'feedback',objective:1,rating:'interesting',note:'Agent QA, not owner play'}];
  const expected=game.replay('continuous',actions);
  assert.equal(expected.charges,0);assert.equal(expected.totalMoves,28);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.Continuous.replay('continuous',actions))),expected);
  const oldRules=fs.readFileSync(path.join(__dirname,'../archetype-trio/model.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'../connections-continuous/model.js'),'utf8');
  const oldIdentity=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../../solver/engine.js'))).update(oldRules).digest('hex');
  assert.notEqual(identity,oldIdentity,'Prior Connection Run captures have a separate identity');
  const payload={sessionId:crypto.randomUUID(),identity,level:'continuous',actions,revision:2,feedback:'QA only',finalState:{charges:99}};
  const post=body=>fetch(origin+'/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await post(payload)).status,200);
  const file=path.join(sessionsDir,payload.sessionId+'.json'),raw=fs.readFileSync(file,'utf8');
  assert.deepEqual(JSON.parse(raw).finalState,expected,'Server derives state from actions, not supplied bank');
  const saved=await(await fetch(origin+'/api/session/'+payload.sessionId)).json();
  assert.deepEqual(game.replay(saved.level,saved.actions),expected);
  assert.deepEqual(game.replay(saved.level,[...saved.actions,{type:'undo'}]).grid,game.replay('continuous',witness).grid);
  assert.equal(game.replay(saved.level,[...saved.actions,{type:'undo'}]).charges,1);
  assert.equal((await post({...payload,revision:1,actions:[]})).status,200);
  assert.equal(fs.readFileSync(file,'utf8'),raw);
  for(const invalid of [
    {...payload,identity:oldIdentity},
    {...payload,actions:[{type:'remove',position:[0,0]}]},
    {...payload,actions:[...actions,{type:'remove',position:[0,0]}]},
    {...payload,actions:[...witness,{type:'remove',position:[-1,0]}]},
  ]){
    assert.equal((await post({...invalid,revision:3})).status,400);
    assert.equal(fs.readFileSync(file,'utf8'),raw,'Rejected payload must not overwrite valid capture');
  }
  assert.equal((await fetch(origin+'/api/session/11111111-1111-1111-1111-111111111111')).status,404);
});
