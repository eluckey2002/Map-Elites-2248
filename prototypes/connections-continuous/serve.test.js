const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
const crypto=require('node:crypto');
const game=require('./model');
const {createServer}=require('./serve');

test('served browser rules and authoritative HTTP capture agree across the bank boundary',async t=>{
  const sessionsDir=fs.mkdtempSync(path.join(os.tmpdir(),'connections-continuous-qa-'));
  const server=createServer({sessionsDir});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const {identity}=await(await fetch(`${base}/api/identity`)).json();
  const html=await(await fetch(base)).text();assert.match(html,/Connection Run/);assert.match(html,/id="chain-sum"/);
  assert.match(html,/id="show-combinations"/);
  const servedApp=await(await fetch(`${base}/app.js`)).text();
  assert.equal(servedApp,fs.readFileSync(path.join(__dirname,'combinations.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'app.js'),'utf8'));
  const browser={};browser.window=browser;vm.createContext(browser);
  for(const asset of ['core.js','model.js'])vm.runInContext(await(await fetch(`${base}/${asset}`)).text(),browser);
  let state=game.create();const actions=[];
  for(let i=0;i<26;i++){
    if(!state.objective){actions.push({type:'new-board'});state=game.newBoard(state);}
    for(const chain of state.objective.witness){actions.push({type:'move',chain});state=game.move(state,chain);}
  }
  actions.push({type:'feedback',objective:1,rating:'interesting',note:'Agent QA only; not owner play'});
  const expected=game.replay('continuous',actions);
  assert.deepEqual(JSON.parse(JSON.stringify(browser.Continuous.replay('continuous',actions))),expected);
  const payload={sessionId:crypto.randomUUID(),identity,level:'continuous',actions,revision:1,feedback:'Agent QA only'};
  const post=body=>fetch(`${base}/api/session`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const response=await post(payload);assert.equal(response.status,200);assert.equal((await response.json()).saved,true);
  const stored=JSON.parse(fs.readFileSync(path.join(sessionsDir,`${payload.sessionId}.json`),'utf8'));
  assert.deepEqual(stored.finalState,expected);assert.equal(stored.finalState.completed,26);
  const resumed=await(await fetch(`${base}/api/session/${payload.sessionId}`)).json();
  assert.equal(resumed.identity,identity);assert.deepEqual(game.replay(resumed.level,resumed.actions),expected);
  assert.equal((await fetch(`${base}/api/session/11111111-1111-1111-1111-111111111111`)).status,404);
  assert.equal((await fetch(`${base}/api/session/not-a-session`)).status,404);
  assert.equal((await post({...payload,identity:'wrong'})).status,400);
  assert.equal((await post({...payload,actions:[{type:'move',chain:[[0,0]]}]})).status,400);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(sessionsDir,`${payload.sessionId}.json`),'utf8')).finalState,expected);
});
