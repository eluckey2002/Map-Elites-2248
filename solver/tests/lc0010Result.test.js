const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { summaryFromArtifact } = require('../../tools/diagnose-lc0010-route-readiness-repair');

const ROOT = path.join(__dirname, '..', '..');
const cycles = path.join(ROOT, 'docs', 'learning-cycles');

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(cycles, name), 'utf8'));
}

test('closed repaired timeline has the frozen eight first-ready continuations', () => {
  const closure = read('LC-0010-route-readiness-repair-closure.json');
  const raw = read('LC-0010-route-readiness-repair-raw.json');
  assert.equal(closure.closure_status, 'CLOSED');
  assert.equal(closure.primary_outcome, 'REPAIRED_TIMELINE_CONFIRMED');
  assert.equal(raw.artifactIdentity, '452ba78783b6254110b25b23fdfa180e47062b324973010de18b987e45408a95');
  assert.deepEqual(raw.cells.flatMap((cell) => [
    [cell.move, 'owner', cell.arms.owner.firstReadyContinuation],
    [cell.move, 'champion', cell.arms.champion.firstReadyContinuation],
  ]), [
    [4, 'owner', 4], [4, 'champion', 4],
    [6, 'owner', 5], [6, 'champion', 5],
    [9, 'owner', 4], [9, 'champion', 4],
    [11, 'owner', 3], [11, 'champion', 4],
  ]);
});

test('repaired move-9 timeline contains none of the three false value links', () => {
  const raw = read('LC-0010-route-readiness-repair-raw.json');
  const champion = raw.cells.find(({ move }) => move === 9).arms.champion;
  assert.deepEqual(champion.timeline.flatMap((entry) => entry.readiness.missingValueLinks), []);
});

test('move-11 owner holds an executable route intact for one different move', () => {
  const raw = read('LC-0010-route-readiness-repair-raw.json');
  const timeline = raw.cells.find(({ move }) => move === 11).arms.owner.timeline;
  const third = timeline.find(({ continuationMoves }) => continuationMoves === 3);
  const fourth = timeline.find(({ continuationMoves }) => continuationMoves === 4);
  assert.equal(third.readiness.routeExecutable, true);
  assert.equal(fourth.readiness.routeExecutable, true);
  assert.equal(third.selectedPoints, 3072);
  assert.deepEqual(third.createdContributingRootIds, []);
  assert.deepEqual(third.createdContributingMergeNodeIds, []);
  assert.deepEqual(third.movedDirectInputs, []);
  assert.equal(fourth.selectedPoints, 56320);
  assert.deepEqual(fourth.selectedChain.map(({ value }) => value), [1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 1024, 2048]);
});

test('registered primary recomputation is byte-identical to the live summary', () => {
  const raw = read('LC-0010-route-readiness-repair-raw.json');
  const expected = fs.readFileSync(path.join(cycles, 'LC-0010-route-readiness-repair-recomputed.json'));
  const observed = Buffer.from(`${JSON.stringify(summaryFromArtifact(raw), null, 2)}\n`);
  assert.deepEqual(observed, expected);
});

test('protected gameplay sources retain their frozen identities', () => {
  const expected = {
    'solver/bot.js': '3efd50ce4b4cc8adda8874361fbc009d04716364d0f34c832515b80d6cbd2e65',
    'solver/engine.js': '0ed4b31004df13e3eae45b1cd0ad692f5956c636630b89e1f96f068e5a451873',
    'src/game.js': '3d405595707621ce28ab2ff4a8f509b8e3099462d42e8e0b304d3459907936c1',
  };
  for (const [relative, identity] of Object.entries(expected)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
    assert.equal(actual, identity, relative);
  }
});
