const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { parseArgs, selectElite, createEliteServer } = require('../../tools/board-elite-server');
const { identity } = require('../level-author');
const { LEVELS } = require('../../src/game');

// A one-elite archive built from a shipped level; the authoring server only
// checks that the receipt names the candidate's identity.
function archiveFor(candidate) {
  const boardIdentity = 'ab'.repeat(32);
  return {
    config: { descriptorSeeds: [7] },
    evaluations: [{ boardIdentity, eligible: true, receipt: { candidateIdentity: identity(candidate) } }],
    archive: [{ cell: '1,2', elites: [{ boardIdentity, candidate, rank: 0 }] }],
  };
}

async function get(server, url) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${url}`);
    return { status: response.status, body: await response.text() };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('serves the game library the page now needs, plus the elite through the real authoring API', async () => {
  const candidate = { schemaVersion: 1, ...LEVELS[0], level: 56, name: 'fixture', tileScale: 1, sourceShapeIdentity: 'cd'.repeat(32) };
  const elite = selectElite(archiveFor(candidate), 'ababab');
  const recordingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'elite-'));
  const library = await get(createEliteServer(elite, { recordingsDir }), '/game-library.js');
  assert.equal(library.status, 200);
  assert.match(library.body, /resolveRoute/);
  const api = await get(createEliteServer(elite, { recordingsDir }), '/api/candidates/56');
  assert.equal(api.status, 200);
  assert.equal(JSON.parse(api.body).candidateIdentity, identity(candidate));
  const page = await get(createEliteServer(elite, { recordingsDir }), '/index.html');
  assert.match(page.body, /game-library\.js/);
});

test('board selection and arguments fail closed', () => {
  const candidate = { schemaVersion: 1, ...LEVELS[0], level: 56, name: 'fixture', tileScale: 1, sourceShapeIdentity: 'cd'.repeat(32) };
  assert.throws(() => selectElite(archiveFor(candidate), 'cd'), /at least 6/);
  assert.throws(() => selectElite(archiveFor(candidate), 'cdcdcd'), /matches 0 elites/);
  assert.throws(() => parseArgs(['--board', 'abc']), /--archive is required/);
  assert.throws(() => parseArgs(['--archive', 'a.json', '--port', 'x']), /--port/);
});
