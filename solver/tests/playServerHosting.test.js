const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createPlayServer } = require('../../tools/play-server');
const { createGithubInbox } = require('../../tools/github-inbox');

const ROOT = path.join(__dirname, '..', '..');
const SAMPLE = path.join(ROOT, 'play-sessions', 'bf12acf631bbfed1603d20b449c00d9df3d11bf2405d4020aaeed1f025716e02.json');

function sampleSession() {
  const { capturedAt: ignoredCapturedAt, source: ignoredSource, ...session } = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
  return session;
}

// Just enough of the GitHub REST API to exercise the inbox: refs and contents.
function fakeGithub({ branchExists = false, failPuts = 0 } = {}) {
  const calls = [];
  const files = new Map();
  let branch = branchExists;
  let failures = failPuts;
  const reply = (status, body = {}) => new Response(JSON.stringify(body), { status });
  const fetchImpl = async (url, options = {}) => {
    const method = options.method || 'GET';
    const route = url.replace('https://api.github.test/repos/owner/repo', '');
    calls.push({ method, route, auth: options.headers.authorization });
    if (method === 'GET' && route === '') return reply(200, { default_branch: 'main' });
    if (method === 'GET' && route === '/git/ref/heads/main') return reply(200, { object: { sha: 'abc' } });
    if (method === 'GET' && route === '/git/ref/heads/play-inbox') return branch ? reply(200, {}) : reply(404);
    if (method === 'POST' && route === '/git/refs') { branch = true; return reply(201, {}); }
    if (method === 'PUT' && route.startsWith('/contents/')) {
      if (failures > 0) { failures -= 1; return reply(409); }
      const name = decodeURIComponent(route.slice('/contents/'.length));
      if (files.has(name)) return reply(422);
      const body = JSON.parse(options.body);
      assert.equal(body.branch, 'play-inbox');
      files.set(name, Buffer.from(body.content, 'base64').toString('utf8'));
      return reply(201, {});
    }
    return reply(500);
  };
  return { fetchImpl, calls, files };
}

const inboxWith = (github, extra = {}) => createGithubInbox({
  token: 't0ken', repo: 'owner/repo', apiBase: 'https://api.github.test', fetchImpl: github.fetchImpl,
  retryDelayMs: 1, log: () => {}, ...extra,
});

test('inbox creates the branch from the default branch, then commits the file there', async () => {
  const github = fakeGithub();
  assert.equal(await inboxWith(github).publish('play-sessions/a.json', '{"x":1}\n'), 'committed');
  assert.equal(github.files.get('play-sessions/a.json'), '{"x":1}\n');
  assert.ok(github.calls.some((c) => c.method === 'POST' && c.route === '/git/refs'));
  assert.ok(github.calls.every((c) => c.auth === 'Bearer t0ken'));
});

test('inbox treats an existing file as done and retries a transient failure', async () => {
  const github = fakeGithub({ branchExists: true, failPuts: 1 });
  const inbox = inboxWith(github);
  assert.equal(await inbox.publish('play-sessions/a.json', '{}\n'), 'committed');
  assert.equal(await inbox.publish('play-sessions/a.json', '{}\n'), 'already present');
  assert.ok(!github.calls.some((c) => c.method === 'POST'));
});

test('inbox gives up after its attempts and reports the failure', async () => {
  const github = fakeGithub({ branchExists: true, failPuts: 99 });
  await assert.rejects(inboxWith(github, { attempts: 2 }).publish('play-sessions/a.json', '{}\n'), /HTTP 409/);
});

async function startServer(t, options) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'play-hosting-'));
  const server = createPlayServer({ store: directory, ...options });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  return { base: `http://127.0.0.1:${server.address().port}`, directory };
}

test('a new session is saved locally and committed once to the inbox branch', async (t) => {
  const published = [];
  const inbox = { publish: async (file, body) => { published.push({ file, body }); return 'committed'; } };
  const { base, directory } = await startServer(t, { inbox, accessKey: null });
  const post = () => fetch(`${base}/api/play-sessions`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sampleSession()),
  }).then((r) => r.json());
  const first = await post();
  await post();
  assert.equal(first.status, 'saved');
  assert.equal(published.length, 1);
  assert.equal(published[0].file, `play-sessions/${first.id}.json`);
  assert.equal(published[0].body, fs.readFileSync(path.join(directory, `${first.id}.json`), 'utf8'));
});

test('a failing inbox never fails the player', async (t) => {
  const inbox = { publish: async () => { throw new Error('GitHub down'); } };
  const { base } = await startServer(t, { inbox, accessKey: null });
  const response = await fetch(`${base}/api/play-sessions`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sampleSession()),
  });
  assert.equal(response.status, 200);
});

test('with an access key, only the key link or its cookie gets in', async (t) => {
  const { base } = await startServer(t, { inbox: null, accessKey: 'sesame' });
  assert.equal((await fetch(`${base}/index.html`)).status, 401);
  assert.equal((await fetch(`${base}/api/play-sessions`, { method: 'POST', body: '{}' })).status, 401);
  assert.equal((await fetch(`${base}/index.html?key=wrong`)).status, 401);
  assert.equal((await fetch(`${base}/healthz`)).status, 200);

  const entry = await fetch(`${base}/index.html?key=sesame&level=3`, { redirect: 'manual' });
  assert.equal(entry.status, 302);
  assert.equal(entry.headers.get('location'), '/index.html?level=3');
  const cookie = entry.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(`${base}/index.html`, { headers: { cookie } })).status, 200);
  assert.equal((await fetch(`${base}/index.html`, { headers: { cookie: 'play_key=wrong' } })).status, 401);
});

test('without an access key the server stays open, as it is locally', async (t) => {
  const { base } = await startServer(t, { inbox: null, accessKey: null });
  assert.equal((await fetch(`${base}/index.html`)).status, 200);
});
