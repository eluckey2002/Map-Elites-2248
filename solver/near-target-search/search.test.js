const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { runFixture, replayFixture } = require('./cli');
const { loadStartingWitness } = require('./index');

test('fixture improves a replayed 18-point witness to the known 40-point optimum', () => {
  const result = runFixture();
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.baseScore, 18);
  assert.equal(result.recoveredScore, 40);
  assert.equal(replayFixture(result.witness).score, 40);
});

test('independent fixture replay rejects a repeated-cell candidate', () => {
  assert.throws(
    () => replayFixture([[[0, 0], [1, 0], [1, 0], [3, 0]]]),
    /reuses a tile/,
  );
});

test('frozen starting witness hash and independent replay match 12,336', () => {
  const loaded = loadStartingWitness(path.resolve(__dirname, '../target-witness-search/frozen-run.json'));
  assert.equal(loaded.replay.score, 12336);
  assert.equal(loaded.replay.moves, 32);
  assert.equal(loaded.replay.cursor, 520);
  assert.equal(loaded.replay.reachesTarget, false);
});
