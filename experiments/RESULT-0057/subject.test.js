const assert = require('node:assert/strict');
const test = require('node:test');

const { LEVELS } = require('../../src/game');
const { chooseMove } = require('../../solver/bot');
const { continuationDensity } = require('../../solver/continuation-density-probe');
const {
  artifactWithIdentity,
  buildCorpus,
  evaluatePair,
  identity,
  sourceHashes,
  summarize,
  validateCorpus,
} = require('./subject');

const registration = { exploratory: false, protocol: 'RESULT-0057', protocolCommit: 'a'.repeat(40) };

function board(points, { scale = 1, extras = [] } = {}) {
  const grid = Array.from({ length: 5 }, () => Array(5).fill(null));
  for (const [x, y, value = 2] of [...points, ...extras]) {
    grid[y][x] = { x, y, value: value * scale };
  }
  return { gridWidth: 5, gridHeight: 5, minChain: 3, tileScale: scale, grid };
}

function outcome({
  win = true,
  moves = 10,
  score = 100,
  trace = '1',
  durationNs = 1_000,
} = {}) {
  return {
    win,
    movesToTarget: win ? moves : null,
    movesUsed: moves,
    moveBudget: 20,
    score,
    reason: win ? 'target' : 'out_of_moves',
    traceIdentity: trace.repeat(64),
    durationNs,
  };
}

function corpusFor(cell) {
  return buildCorpus([{ level: 1, seed: 46_000_000, ...cell }], registration, {
    levelNumbers: [1],
    seeds: [46_000_000],
  });
}

test('controlled topology moves the proxy while scale and isolated mass do not', () => {
  const line = board([[0, 0], [1, 0], [2, 0], [4, 4]]);
  const cluster = board([[0, 0], [1, 0], [0, 1], [1, 1]]);
  const scaled = board([[0, 0], [1, 0], [0, 1], [1, 1]], { scale: 64 });
  const isolated = board([[0, 0], [1, 0], [0, 1], [1, 1]], {
    extras: [[4, 4, 8]],
  });

  assert.equal(continuationDensity(line).density, 1);
  assert.equal(continuationDensity(cluster).density, 6);
  assert.equal(continuationDensity(scaled).density, 6);
  assert.equal(continuationDensity(isolated).density, 6);
});

test('A/A through the real collector is deterministic and inconclusive', () => {
  const level = LEVELS.find(({ level: number }) => number === 1);
  const pair = evaluatePair(level, 45_999_999, {
    championChooser: chooseMove,
    challengerChooser: chooseMove,
  });
  const corpus = buildCorpus([pair], registration, {
    levelNumbers: [1],
    seeds: [45_999_999],
  });

  validateCorpus(corpus, { levelNumbers: [1], seeds: [45_999_999] });
  const summary = summarize(corpus);
  assert.equal(summary.primaryOutcome, 'INCONCLUSIVE');
  assert.equal(summary.counts.changedTrace, 0);
});

test('a planted challenger regression is killed as FALSIFIED', () => {
  const corpus = corpusFor({
    champion: outcome({ moves: 9, trace: '2' }),
    challenger: outcome({ moves: 10, trace: '3' }),
  });
  const summary = summarize(corpus);
  assert.equal(summary.primaryOutcome, 'FALSIFIED');
  assert.equal(summary.counts.championFaster, 1);
});

test('safe benefit on two levels with bounded compute is SUPPORTED', () => {
  const cells = [1, 2].map((level, index) => ({
    level,
    seed: 46_000_000,
    champion: outcome({ moves: 10, trace: String(index + 4), durationNs: 1_000 }),
    challenger: outcome({ moves: 9, trace: String(index + 6), durationNs: 1_500 }),
  }));
  const corpus = buildCorpus(cells, registration, {
    levelNumbers: [1, 2],
    seeds: [46_000_000],
  });
  assert.equal(summarize(corpus).primaryOutcome, 'SUPPORTED');
});

test('safe but narrow benefit or excess compute is INCONCLUSIVE', () => {
  const narrow = corpusFor({
    champion: outcome({ moves: 10, trace: '8' }),
    challenger: outcome({ moves: 9, trace: '9' }),
  });
  assert.equal(summarize(narrow).primaryOutcome, 'INCONCLUSIVE');

  const expensiveCells = [1, 2].map((level, index) => ({
    level,
    seed: 46_000_000,
    champion: outcome({ moves: 10, trace: String(index + 1), durationNs: 1_000 }),
    challenger: outcome({ moves: 9, trace: String(index + 3), durationNs: 2_001 }),
  }));
  const expensive = buildCorpus(expensiveCells, registration, {
    levelNumbers: [1, 2],
    seeds: [46_000_000],
  });
  assert.equal(summarize(expensive).primaryOutcome, 'INCONCLUSIVE');
});

test('missing pairs and coherent source substitution are rejected', () => {
  const valid = corpusFor({
    champion: outcome({ trace: 'a' }),
    challenger: outcome({ trace: 'b' }),
  });
  assert.equal(validateCorpus(valid, { levelNumbers: [1], seeds: [46_000_000] }).pairs, 1);

  const missing = structuredClone(valid);
  missing.cells = [];
  const { artifactIdentity: _missingIdentity, registration: missingRegistration, ...missingBody } = missing;
  assert.throws(() => validateCorpus(artifactWithIdentity(missingBody, missingRegistration), {
    levelNumbers: [1], seeds: [46_000_000],
  }), /incomplete paired matrix/);

  const substituted = structuredClone(valid);
  substituted.sources['solver/bot.js'] = '0'.repeat(64);
  substituted.finalSubjectIdentity = identity(substituted.sources);
  const { artifactIdentity: _old, registration: substitutedRegistration, ...substitutedBody } = substituted;
  assert.notDeepEqual(substituted.sources, sourceHashes());
  assert.throws(() => validateCorpus(artifactWithIdentity(substitutedBody, substitutedRegistration), {
    levelNumbers: [1], seeds: [46_000_000],
  }), /source identity closure mismatch/);
});
