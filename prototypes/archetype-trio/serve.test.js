const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { createServer } = require('./serve');
const model = require('./model');
const witnesses = require('./witnesses.json');

test('real HTTP capture persists authoritative replay and rejects corrupt input', async t => {
  const sessionsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archetype-capture-'));
  const server = createServer({sessionsDir});
  t.after(() => {
    server.closeAllConnections();
    server.close();
    fs.rmSync(sessionsDir, {recursive:true, force:true});
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const {identity} = await (await fetch(`${base}/api/identity`)).json();
  assert.match(identity, /^[0-9a-f]{64}$/);
  for (const asset of ['/', '/model.js', '/app.js', '/style.css', '/core.js']) {
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).length > 100);
  }
  const post = payload => fetch(`${base}/api/session`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(payload),
  });
  const payload = {
    identity, sessionId:randomUUID(), level:'gates', revision:2, feedback:'QA capture, not owner play',
    actions:witnesses.gates.map(chain => ({type:'move', chain, swapped:false})),
    finalState:{score:999999},
  };
  assert.equal((await post(payload)).status, 200);
  const file = path.join(sessionsDir, `${payload.sessionId}.json`);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(saved.finalState, model.replay('gates', payload.actions));
  assert.equal(saved.finalState.outcome, 'won');
  assert.equal(saved.feedback, payload.feedback);
  assert.equal((await post({...payload, revision:1, actions:[], feedback:'stale'})).status, 200);
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), saved);
  const corrupt = {...payload, sessionId:randomUUID(), actions:[{type:'move',chain:[[0,0],[6,5],[1,0]]}]};
  assert.equal((await post(corrupt)).status, 400);
  assert.equal(fs.existsSync(path.join(sessionsDir, `${corrupt.sessionId}.json`)), false);
  assert.equal((await post({...payload, identity:'stale-model'})).status, 400);
  assert.equal((await post({...payload, sessionId:'../escape'})).status, 400);
});
