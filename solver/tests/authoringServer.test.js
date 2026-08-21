const { afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  createAuthoringServer,
  recordingIdentity,
  serializeRecording,
} = require('../authoring-server');
const candidateStore = require('../candidate-levels.json');
const candidateReceipt = require('../candidate-levels.receipt.json');

const openServers = [];

afterEach(async () => {
  await Promise.all(openServers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

async function start() {
  const recordingsDir = fs.mkdtempSync(path.join(os.tmpdir(), '2248-recordings-'));
  const server = createAuthoringServer({ recordingsDir });
  openServers.push(server);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  return { server, recordingsDir, base: `http://127.0.0.1:${port}` };
}

// The live candidate store is a WORKING file -- whichever candidate is being
// authored or played sits in it -- so these tests must read the level number
// from the store rather than hard-code one. They previously hard-coded 51 while
// reading the store for everything else, which meant authoring any new
// candidate turned this suite red for a reason that had nothing to do with the
// server.
const boundLevel = candidateStore.candidates[0].level;

function validRecording() {
  return {
    schemaVersion: 1,
    candidateIdentity: candidateReceipt.candidateIdentity,
    candidateLevel: boundLevel,
    seed: 1,
    outcome: 'win',
    reason: 'target reached',
    score: candidateStore.candidates[0].target,
    movesUsed: 1,
    chains: [
      {
        tiles: [
          { x: 0, y: 0, value: 64 },
          { x: 1, y: 0, value: 64 },
          { x: 2, y: 1, value: 128 },
          { x: 3, y: 2, value: 128 },
        ],
        points: 576,
      },
    ],
  };
}

test('serves only the game assets and exposes the bound candidate', async () => {
  const { base } = await start();
  const page = await fetch(`${base}/index.html`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.match(await page.text(), /2248 Challenge/);

  const game = await fetch(`${base}/game.js`);
  assert.equal(game.status, 200);
  assert.match(game.headers.get('content-type'), /^text\/javascript/);

  const candidate = await fetch(`${base}/api/candidates/${boundLevel}`);
  assert.equal(candidate.status, 200);
  assert.deepEqual(await candidate.json(), {
    candidate: candidateStore.candidates[0],
    candidateIdentity: candidateReceipt.candidateIdentity,
  });
});

test('writes a schema-valid recording and treats an exact duplicate as idempotent', async () => {
  const { base, recordingsDir } = await start();
  const body = validRecording();
  const first = await fetch(`${base}/api/recordings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(first.status, 201);
  const firstResult = await first.json();
  assert.equal(firstResult.status, 'saved');
  assert.equal(firstResult.recordingIdentity, recordingIdentity(body));
  assert.deepEqual(fs.readdirSync(recordingsDir), [`${firstResult.recordingIdentity}.json`]);
  assert.equal(fs.readFileSync(path.join(recordingsDir, `${firstResult.recordingIdentity}.json`), 'utf8'), serializeRecording(body));

  const duplicate = await fetch(`${base}/api/recordings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).status, 'already-saved');
});

test('fails closed for traversal and unknown candidates', async () => {
  const { base } = await start();
  const traversal = await fetch(`${base}/..%2Fsrc%2Fgame.js`);
  assert.equal(traversal.status, 400);

  const unknown = validRecording();
  unknown.candidateIdentity = '0'.repeat(64);
  unknown.candidateLevel = 999;
  const response = await fetch(`${base}/api/recordings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(unknown),
  });
  assert.equal(response.status, 404);
});

test('rejects malformed, oversized, and schema-invalid recording bodies', async () => {
  const { base } = await start();
  const malformed = await fetch(`${base}/api/recordings`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
  });
  assert.equal(malformed.status, 400);

  const oversized = await fetch(`${base}/api/recordings`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(300000),
  });
  assert.equal(oversized.status, 413);

  const invalid = validRecording();
  invalid.chains[0].tiles[0].x = -1;
  const invalidResponse = await fetch(`${base}/api/recordings`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(invalid),
  });
  assert.equal(invalidResponse.status, 422);
});

test('refuses to overwrite conflicting bytes at a recording identity', async () => {
  const { base, recordingsDir } = await start();
  const body = validRecording();
  const id = recordingIdentity(body);
  fs.writeFileSync(path.join(recordingsDir, `${id}.json`), '{"conflict":true}\n');

  const response = await fetch(`${base}/api/recordings`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  assert.equal(response.status, 409);
  assert.equal(fs.readFileSync(path.join(recordingsDir, `${id}.json`), 'utf8'), '{"conflict":true}\n');
});
