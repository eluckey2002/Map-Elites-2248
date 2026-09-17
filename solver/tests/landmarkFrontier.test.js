const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { LEVELS } = require('../../src/game');
const {
  analyzeLandmarkFrontier,
  initialPuzzle,
  replayLandmarkRoute,
} = require('../landmark-frontier');
const { actionIdentity } = require('../targeted-chain-generator');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function fixture(rows, { moves = 1, minChain = 2 } = {}) {
  return {
    grid: rows.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: rows[0].length,
    gridHeight: rows.length,
    score: 0,
    moves: 0,
    maxMoves: moves,
    targetScore: Number.MAX_SAFE_INTEGER,
    minChain,
    tileScale: 1,
  };
}

function exact(state, landmark, overrides = {}) {
  return analyzeLandmarkFrontier({
    state,
    spawnValues: Array(100).fill(2),
    landmark,
    options: {
      mode: 'exact', maxNodes: 1_000, beamWidth: 1_000,
      maxPathStates: 10_000, maxResults: 100, ...overrides,
    },
  });
}

test('a one-route board reports one replayed landmark outcome', () => {
  const state = fixture([[2], [2]]);
  const result = exact(state, 4);

  assert.equal(result.standing, 'replayed_lower_bound');
  assert.equal(result.distinctOutcomeCountLowerBound, 1);
  assert.equal(result.routes[0].moves, 1);
  assert.equal(result.routes[0].score, 4);
  assert.deepEqual(
    replayLandmarkRoute({ state, spawnValues: Array(100).fill(2), landmark: 4 }, result.routes[0]).board,
    result.routes[0].board,
  );
});

test('different resulting boards remain separate landmark outcomes', () => {
  const result = exact(fixture([[2, 2], [2, 2]]), 4);
  assert.ok(result.distinctOutcomeCountLowerBound > 1);
  assert.equal(new Set(result.routes.map(({ outcomeIdentity }) => outcomeIdentity)).size, result.routes.length);
});

test('different chains that converge on the same board are deduplicated', () => {
  const result = exact(fixture([[2], [2]]), 4);
  assert.ok(result.diagnostics.landmarkActions > result.distinctOutcomeCountLowerBound);
  assert.equal(
    result.diagnostics.duplicateLandmarkOutcomes,
    result.diagnostics.landmarkActions - result.distinctOutcomeCountLowerBound,
  );
});

test('a capped miss stays UNKNOWN', () => {
  const result = exact(fixture([[2, 2], [2, 2]], { moves: 3 }), 64, { maxNodes: 1 });
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.complete, false);
  assert.ok(result.diagnostics.capReasons.includes('nodes'));
});

test('replay rejects a planted bad chain', () => {
  const state = fixture([[2], [2]]);
  const result = exact(state, 4);
  result.routes[0].chains[0][0].x = 99;
  assert.throws(
    () => replayLandmarkRoute({ state, spawnValues: Array(100).fill(2), landmark: 4 }, result.routes[0]),
    /unavailable tile/,
  );
});

test('landmark-aware enumeration recovers the owner-proven opening on level 58', () => {
  const level = LEVELS.find(({ level: number }) => number === 58);
  const puzzle = initialPuzzle(level, 4255346895);
  const recording = require('../../play-sessions/640f5c6450f8b8ac9e59ef1a2f452807c40cf3993422e2287fb0005a0ad72fb6.json');
  const ownerOpening = recording.chains[0].tiles;
  assert.equal(ownerOpening.reduce((sum, tile) => sum + tile.value, 0), 2048);

  const result = analyzeLandmarkFrontier({
    ...puzzle,
    landmark: 2048,
    options: {
      mode: 'bounded', maxNodes: 1, beamWidth: 1, actionsPerState: 32,
      pathWidth: 3, maxPathStates: 1_000_000, maxResults: 512, maxMoves: 1,
    },
  });

  assert.ok(result.routes.some(({ chains }) => actionIdentity(chains[0]) === actionIdentity(ownerOpening)));
});

test('the CLI accepts a serialized replayable board state', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'landmark-frontier-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const input = path.join(dir, 'position.json');
  fs.writeFileSync(input, JSON.stringify({
    state: fixture([[2], [2]]),
    spawnValues: Array(10).fill(2),
    spawnCursor: 0,
  }));
  const cli = path.join(__dirname, '..', 'landmark-frontier.js');
  const run = spawnSync(process.execPath, [
    cli, '--input', input, '--landmark', '4', '--mode', 'exact', '--json',
  ], { encoding: 'utf8' });

  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.distinctOutcomeCountLowerBound, 1);
  assert.equal(result.routes[0].moves, 1);
});
