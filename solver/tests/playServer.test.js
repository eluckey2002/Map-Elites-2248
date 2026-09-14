const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { collect } = require('../human-benchmark');
const { createPlayServer } = require('../../tools/play-server');

const ROOT = path.join(__dirname, '..', '..');

test('an identical fixed-seed play remains one stored session and one benchmark row', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'play-server-'));
  const server = createPlayServer({ store: directory, now: () => '2026-09-14T00:00:00.000Z' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const source = path.join(
    ROOT,
    'play-sessions',
    'bf12acf631bbfed1603d20b449c00d9df3d11bf2405d4020aaeed1f025716e02.json',
  );
  const captured = JSON.parse(fs.readFileSync(source, 'utf8'));
  const { capturedAt: ignoredCapturedAt, source: ignoredSource, ...session } = captured;
  const legacyId = 'f'.repeat(64);
  fs.writeFileSync(path.join(directory, `${legacyId}.json`), `${JSON.stringify(captured, null, 2)}\n`);
  const url = `http://127.0.0.1:${server.address().port}/api/play-sessions`;
  const submit = () => fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(session),
  }).then((response) => response.json());

  const first = await submit();
  const second = await submit();
  assert.equal(first.id, legacyId);
  assert.equal(first.id, second.id);
  const files = fs.readdirSync(directory);
  assert.deepEqual(files, [`${first.id}.json`]);

  const { rows, unresolved } = collect({ recordingPath: path.join(directory, files[0]) });
  assert.deepEqual(unresolved, []);
  assert.equal(rows.length, 1);
});
