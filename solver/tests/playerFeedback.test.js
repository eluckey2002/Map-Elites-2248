const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  describeChainFeedback,
  PlayerStudy,
} = require('../../src/game.js');

const ROOT = path.join(__dirname, '..', '..');

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
    values,
  };
}

test('live chain feedback explains exact on-lattice outcomes without judging the choice', () => {
  assert.deepEqual(describeChainFeedback([8, 8, 16], 3, 1), {
    values: [8, 8, 16],
    resultTile: 32,
    multiplier: 1.5,
    projectedPoints: 48,
    ready: true,
    futureMatchability: 'matchable',
  });

  assert.deepEqual(describeChainFeedback([2, 2, 4, 4, 4, 8, 8], 4, 1), {
    values: [2, 2, 4, 4, 4, 8, 8],
    resultTile: 32,
    multiplier: 3,
    projectedPoints: 96,
    ready: true,
    futureMatchability: 'matchable',
  });
});

test('live chain feedback names an off-lattice result neutrally', () => {
  assert.deepEqual(describeChainFeedback([2, 2, 4, 4], 4, 1), {
    values: [2, 2, 4, 4],
    resultTile: 12,
    multiplier: 1.5,
    projectedPoints: 18,
    ready: true,
    futureMatchability: 'off-lattice',
  });
});

test('player study is off by default and records only after explicit start', () => {
  const storage = memoryStorage();
  const study = new PlayerStudy({ storage, now: () => 1_700_000_000_000 });
  const move = {
    chain: [{ x: 2, y: 4, value: 8 }, { x: 3, y: 4, value: 8 }, { x: 4, y: 3, value: 16 }],
    boardBefore: [[{ x: 0, y: 0, value: 2 }]],
    boardAfter: [[{ x: 0, y: 0, value: 4 }]],
    context: {
      level: 1,
      moveNumber: 1,
      moveBudget: 25,
      scoreBefore: 0,
      scoreAfter: 48,
      resultTile: 32,
      multiplier: 1.5,
      projectedPoints: 48,
    },
  };

  assert.equal(study.isRecording(), false);
  assert.equal(study.recordMove(move), false);
  assert.equal(storage.values.size, 0);

  study.start();
  assert.equal(study.isRecording(), true);
  assert.equal(study.recordMove(move), true);
  assert.deepEqual(study.getStudy().moves[0], {
    ordinal: 1,
    recordedAt: '2023-11-14T22:13:20.000Z',
    chain: move.chain,
    boardBefore: move.boardBefore,
    boardAfter: move.boardAfter,
    context: move.context,
  });
  assert.deepEqual(JSON.parse(storage.values.get('2248.playerStudy.v1')), study.getStudy());
});

test('player study supports local review, JSON export, and clear', () => {
  const storage = memoryStorage();
  const study = new PlayerStudy({ storage, now: () => 1_700_000_000_000 });
  study.start();
  study.recordMove({
    chain: [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 2 }],
    boardBefore: [[2, 2]],
    boardAfter: [[null, 4]],
    context: { level: 1, moveNumber: 1, moveBudget: 25, multiplier: 1 },
  });

  const exported = JSON.parse(study.exportJson());
  assert.deepEqual(exported, study.getStudy());
  assert.equal(exported.moves.length, 1);

  study.clear();
  assert.equal(study.isRecording(), false);
  assert.deepEqual(study.getStudy(), { schemaVersion: 1, moves: [] });
  assert.equal(storage.values.has('2248.playerStudy.v1'), false);
});

test('player-study UI exposes explicit local controls and the study class has no network path', () => {
  const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
  const source = fs.readFileSync(path.join(ROOT, 'src', 'game.js'), 'utf8');
  const studySource = source.slice(source.indexOf('class PlayerStudy'), source.indexOf('class Game'));

  assert.match(html, /<button[^>]+id="recordToggleBtn"[^>]*>[^<]*Start recording[^<]*<\/button>/i);
  assert.match(html, /id="reviewStudyBtn"/);
  assert.match(html, /id="exportStudyBtn"/);
  assert.match(html, /id="clearStudyBtn"/);
  assert.doesNotMatch(studySource, /\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/);
});
