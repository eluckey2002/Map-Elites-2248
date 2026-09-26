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

const { verdict } = require('../../tools/nemesis');

test('nemesis labels a race to the target: fewer moves beats, equal ties, no win loses', () => {
  const bot = { outcome: 'win', moves: 15 };
  assert.equal(verdict({ outcome: 'win', moves: 14 }, bot), 'beat');
  assert.equal(verdict({ outcome: 'win', moves: 15 }, bot), 'tie');
  assert.equal(verdict({ outcome: 'win', moves: 16 }, bot), 'loss');
  assert.equal(verdict({ outcome: 'lose', moves: 10 }, bot), 'loss');
  assert.equal(verdict({ outcome: 'win', moves: 24 }, { outcome: 'lose', moves: 24 }), 'beat');
});

test('nemesis serves shipped boards with the bot result and counts a new capture', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nemesis-'));
  const shippedPlay = 'bf12acf631bbfed1603d20b449c00d9df3d11bf2405d4020aaeed1f025716e02.json';
  const candidateOnly = '3d3ba1f05b08030337e805c61c0584e99d157caade3e7e62298769219806258a.json';
  fs.copyFileSync(path.join(ROOT, 'play-sessions', shippedPlay), path.join(directory, shippedPlay));
  const sameLevelOtherBoard = 'ed62dd5655e8a568b4f54a956c671fcfc9739d9871c81d1d146b2ebbfba6e9bf.json';
  fs.copyFileSync(path.join(ROOT, 'recordings', candidateOnly), path.join(directory, candidateOnly));
  fs.copyFileSync(path.join(ROOT, 'play-sessions', sameLevelOtherBoard), path.join(directory, sameLevelOtherBoard));
  // A claimed faster win whose chains do not replay to it must not count as a best.
  const tampered = JSON.parse(fs.readFileSync(path.join(ROOT, 'play-sessions', shippedPlay), 'utf8'));
  fs.writeFileSync(path.join(directory, 'tampered.json'), JSON.stringify({ ...tampered, movesUsed: 9 }));
  const server = createPlayServer({ store: directory, challengeSources: [directory] });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.close();
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const { challenges } = await (await fetch(`${base}/api/nemesis`)).json();
  // Level 54 seed 1 was recorded on a candidate board that did not ship, so it
  // cannot be replayed with ?level=54&seed=1 and must not be offered.
  assert.deepEqual(challenges.map((c) => [c.level, c.seed]), [[54, 3310936729], [54, 2832419099]]);
  const [board, other] = challenges;
  assert.deepEqual([other.bot.moves, other.best.moves, other.attempts, other.status], [16, 16, 1, 'tie']);
  assert.deepEqual([board.bot.outcome, board.bot.moves], ['win', 15]);
  assert.deepEqual([board.best.moves, board.attempts, board.status], [16, 1, 'open']);

  const captured = JSON.parse(fs.readFileSync(path.join(ROOT, 'play-sessions', shippedPlay), 'utf8'));
  const { capturedAt: ignoredCapturedAt, source: ignoredSource, ...session } = captured;
  const chains = session.chains.slice(0, 3);
  const slower = { ...session, outcome: 'lose', reason: 'out of moves', chains, movesUsed: 3, score: chains.reduce((sum, c) => sum + c.points, 0) };
  await fetch(`${base}/api/play-sessions`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(slower) });

  const one = await (await fetch(`${base}/api/nemesis?level=54&seed=3310936729`)).json();
  assert.equal(one.challenge.attempts, 2);
  assert.equal(one.challenge.best.moves, 16);
  assert.equal(one.challenge.latest.verdict, 'loss');

  assert.equal((await fetch(`${base}/api/nemesis?level=999&seed=1`)).status, 400);
});
