'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createNemesisRunner, ResultCache } = require('../../tools/nemesis-worker');
const { createPlayServer } = require('../../tools/play-server');

test('result cache evicts the least recently used key across policies without changing results', () => {
  const cache = new ResultCache(2);
  cache.set('shipped:54:1',{moves:15}); cache.set('wider-search:54:1',{moves:14});
  assert.deepEqual(cache.get('shipped:54:1'),{moves:15});
  cache.set('shipped:54:2',{moves:16});
  assert.equal(cache.size,2);
  assert.equal(cache.has('wider-search:54:1'),false);
  assert.deepEqual(cache.get('shipped:54:1'),{moves:15});
});

test('cold wider-search computation leaves static HTTP requests responsive and shares duplicate jobs', async t => {
  const store = fs.mkdtempSync(path.join(os.tmpdir(),'nemesis-worker-http-'));
  const server = createPlayServer({store,connectionsStore:path.join(store,'connections'),challengeSources:[]});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.close(); fs.rmSync(store,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}`;
  const cold=fetch(base+'/api/nemesis?level=54&seed=3310936729&policy=wider-search').then(async r=>({status:r.status,body:await r.json()}));
  // Wait until the cold request has had a chance to reach the server.
  await new Promise(resolve=>setTimeout(resolve,100));
  const page=fetch(base+'/index.html').then(async r=>{assert.equal(r.status,200);await r.text();return 'page';});
  assert.equal(await Promise.race([page,cold.then(()=>'cold')]),'page');
  const result=await cold;
  assert.equal(result.status,200); assert.equal(result.body.challenge.policy.id,'wider-search');
  const runner=createNemesisRunner({sources:[]});t.after(()=>runner.close());
  const query={policy:'wider-search',level:54,seed:3310936729};
  const first=runner.run(query),duplicate=runner.run({...query});
  assert.equal(first,duplicate);
  assert.deepEqual((await first).challenge.bot,result.body.challenge.bot);
});

test('each active deadline rejects stalled work; overload and close produce no fake bot result', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nemesis-worker-stall-'));
  const workerFile=path.join(dir,'stall.cjs');
  fs.writeFileSync(workerFile,"require('node:worker_threads').parentPort.on('message',()=>{while(true){}});");
  const runner=createNemesisRunner({workerFile,timeoutMs:300,maxPending:2});
  t.after(()=>{runner.close();fs.rmSync(dir,{recursive:true,force:true});});
  const active=assert.rejects(runner.run({policy:'wider-search',level:54,seed:1}),/timed out/);
  const queued=assert.rejects(runner.run({policy:'wider-search',level:54,seed:2}),/timed out/);
  await assert.rejects(runner.run({policy:'wider-search',level:54,seed:3}),/busy/);
  await Promise.all([active,queued]);
  // Both queue slots are released, and a new worker may be started.
  const retry=assert.rejects(runner.run({policy:'wider-search',level:54,seed:1}),/timed out/);
  await retry;
  const waiting=assert.rejects(runner.run({policy:'wider-search',level:54,seed:2}),/closed/);
  runner.close();await waiting;
  await assert.rejects(runner.run({policy:'shipped',level:54,seed:1}),/closed/);
});

test('Nemesis rejects a partial board identity rather than silently substituting seed zero', async t => {
  const store=fs.mkdtempSync(path.join(os.tmpdir(),'nemesis-query-'));
  const server=createPlayServer({store,connectionsStore:path.join(store,'connections'),challengeSources:[]});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.close();fs.rmSync(store,{recursive:true,force:true});});
  const base=`http://127.0.0.1:${server.address().port}/api/nemesis`;
  for(const query of ['?level=54','?seed=1','?level=54&seed=','?level=54&seed=4294967296','?level=54&seed=-1']) {
    assert.equal((await fetch(base+query)).status,400,query);
  }
});

test('closing the play server cancels active Nemesis work before waiting for HTTP drain', async t => {
  const store=fs.mkdtempSync(path.join(os.tmpdir(),'nemesis-shutdown-'));
  const server=createPlayServer({store,connectionsStore:path.join(store,'connections'),challengeSources:[]});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.close();fs.rmSync(store,{recursive:true,force:true});});
  const requested=new Promise(resolve=>server.once('request',resolve));
  const request=fetch(`http://127.0.0.1:${server.address().port}/api/nemesis?level=54&seed=3310936729&policy=wider-search`);
  await requested;
  const closed=new Promise(resolve=>server.close(resolve));
  const response=await request;
  const body=await response.json();
  await closed;
  assert.equal(response.status,503);
  assert.match(body.error,/runner closed/);
});

test('a queued policy receives its full execution deadline after prior work completes', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nemesis-worker-queue-'));
  const workerFile=path.join(dir,'delayed.cjs');
  fs.writeFileSync(workerFile,`const {parentPort}=require('node:worker_threads');
parentPort.on('message',({id,query})=>{
  const end=Date.now()+(query.seed===0?0:650);
  while(Date.now()<end){}
  parentPort.postMessage({id,result:{policy:query.policy}});
});`);
  const runner=createNemesisRunner({workerFile,timeoutMs:1000,maxPending:2});
  t.after(()=>{runner.close();fs.rmSync(dir,{recursive:true,force:true});});
  await runner.run({policy:'shipped',level:54,seed:0});
  const obsolete=runner.run({policy:'shipped',level:null,seed:1});
  const selected=runner.run({policy:'wider-search',level:null,seed:2});
  const [first,second]=await Promise.all([obsolete,selected]);
  assert.equal(first.policy,'shipped');
  assert.equal(second.policy,'wider-search');
});
