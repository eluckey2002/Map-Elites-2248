const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  analyzeRecording,
  collectPrototypeSessions,
} = require('../../prototypes/analyze-sessions');
const { identity } = require('../level-author');

const ROOT = path.join(__dirname, '..', '..');
const RELAY_RECORDING = path.join(
  ROOT,
  'prototypes',
  'sequential-defusal-relay',
  'sessions',
  '60f08f535aa3d6b16a7a6f65b2141c262a8f46b1a38ebb6c210db2b9e9a9bd14.json',
);

test('analyzes the real six-move max-chain relay play', () => {
  const { buildLevel } = require('../../prototypes/sequential-defusal-relay/level');
  const recording = JSON.parse(fs.readFileSync(RELAY_RECORDING, 'utf8'));
  const result = analyzeRecording(buildLevel(), recording);

  assert.equal(result.score, 57920);
  assert.equal(result.moves, 6);
  assert.equal(result.meanChainLength, 21.5);
  assert.deepEqual(result.chainLengths, [21, 21, 24, 21, 21, 21]);
  assert.equal(result.bombsCleared, 2);
  assert.equal(result.bombsClearedAsEndpoint, 1);
  assert.equal(result.bombsSweptThrough, 1);
  assert.equal(result.moveDetails[4].bombInteraction, 'swept-through');
  assert.deepEqual(
    result.moveDetails.map((move) => move.boundedLongChainLength),
    [23, 21, 24, 19, 15, 20],
  );
  assert.equal(result.atLeastBoundedLongChain, 5);
});

test('rejects a recording that is not bound to the supplied board', () => {
  const { buildLevel } = require('../../prototypes/sequential-defusal-relay/level');
  const recording = JSON.parse(fs.readFileSync(RELAY_RECORDING, 'utf8'));

  assert.throws(
    () => analyzeRecording({ ...buildLevel(), target: 1 }, recording),
    /candidate identity mismatch/,
  );
});

test('rejects a recording whose declared move count does not match its chains', () => {
  const { buildLevel } = require('../../prototypes/sequential-defusal-relay/level');
  const recording = JSON.parse(fs.readFileSync(RELAY_RECORDING, 'utf8'));

  assert.throws(
    () => analyzeRecording(buildLevel(), { ...recording, movesUsed: recording.movesUsed + 1 }),
    /recording replay failed.*used 6 moves, recording claims 7/,
  );
});

test('rejects a claimed win that continued after a bomb exploded', () => {
  const { buildLevel } = require('../../prototypes/sequential-defusal-relay/level');
  const recording = JSON.parse(fs.readFileSync(RELAY_RECORDING, 'utf8'));
  const candidate = {
    ...buildLevel(),
    target: 1,
    blockers: buildLevel().blockers.map((blocker) => (
      blocker.type === 'bomb' && blocker.x === 4 ? { ...blocker, timer: 1 } : blocker
    )),
  };

  assert.throws(
    () => analyzeRecording(candidate, { ...recording, candidateIdentity: identity(candidate) }),
    /bomb exploded after move 1/,
  );
});

test('the collector inspects every prototype session currently on disk', () => {
  const report = collectPrototypeSessions(path.join(ROOT, 'prototypes'));
  const recordedFiles = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name.endsWith('.json') && absolute.includes(`${path.sep}sessions${path.sep}`)) {
        recordedFiles.push(absolute);
      }
    }
  }

  walk(path.join(ROOT, 'prototypes'));
  assert.deepEqual(report.unresolved, []);
  assert.equal(report.sessions.length, recordedFiles.length);
  assert.ok(report.sessions.some((session) => (
    session.family === 'sequential-defusal-relay' && session.moves === 6
  )));
});
