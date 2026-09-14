const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

const { buildVariants } = require('../../prototypes/bank-and-break/variants');
const {
  chooseBot,
  chooseBoundedLongest,
  playPolicy,
  screenSeeds,
  selectValidationSeeds,
} = require('../../prototypes/bank-and-break/select-seeds');
const {
  CHALLENGES,
  SOURCE_SEED_COUNT,
} = require('../../prototypes/bank-and-break/validation');
const {
  createEntries,
  startServers,
} = require('../../prototypes/bank-and-break/serve');

const candidate = buildVariants()[0];

test('reproduces the known seed-316 bot result through the seed screener', () => {
  const result = playPolicy(candidate, 316, chooseBot);

  assert.deepEqual(
    { outcome: result.outcome, moves: result.moves, score: result.score },
    { outcome: 'win', moves: 10, score: 40768 },
  );
});

test('launcher keeps validation roles separate in ports and recording paths', () => {
  const entries = createEntries(8300);

  assert.deepEqual(entries.map(({ port }) => port), [8300, 8301, 8302]);
  assert.deepEqual(
    entries.map(({ recordingsDir }) => recordingsDir.split('/').slice(-2)),
    CHALLENGES.map(({ role, seed }) => ['validation-2026-09-12', `${role}-seed-${seed}`]),
  );
});

test('launcher turns a port collision into one actionable startup error', async () => {
  const blocker = net.createServer();
  await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
  const { port } = blocker.address();

  try {
    await assert.rejects(
      startServers(port),
      new RegExp(`Could not start the validation set: EADDRINUSE on port ${port}`),
    );
  } finally {
    await new Promise((resolve) => blocker.close(resolve));
  }
});

test('selects setup-favorable, neutral, and hypothesis-hostile seeds by declared rules', () => {
  const row = (seed, botOutcome, botMoves, botScore, baselineOutcome, baselineMoves, baselineScore) => ({
    seed,
    bot: { outcome: botOutcome, moves: botMoves, score: botScore },
    boundedLongest: { outcome: baselineOutcome, moves: baselineMoves, score: baselineScore },
  });
  const rows = [
    row(10, 'win', 8, 41000, 'lose', 16, 30000),
    row(11, 'win', 9, 40500, 'win', 9, 40800),
    row(12, 'win', 10, 42000, 'win', 10, 42100),
    row(13, 'lose', 16, 39000, 'win', 14, 40200),
    row(14, 'win', 11, 40100, 'win', 11, 43000),
  ];

  const selected = selectValidationSeeds(rows, { moves: 16 });

  assert.deepEqual(
    selected.map(({ role, seed }) => ({ role, seed })),
    [
      { role: 'setup-favorable', seed: 10 },
      { role: 'neutral', seed: 12 },
      { role: 'hypothesis-hostile', seed: 13 },
    ],
  );
});

test('never assigns the same seed to two validation roles', () => {
  const rows = [
    {
      seed: 20,
      bot: { outcome: 'win', moves: 8, score: 41000 },
      boundedLongest: { outcome: 'win', moves: 8, score: 41000 },
    },
    {
      seed: 21,
      bot: { outcome: 'win', moves: 9, score: 42000 },
      boundedLongest: { outcome: 'win', moves: 9, score: 42000 },
    },
    {
      seed: 22,
      bot: { outcome: 'lose', moves: 16, score: 39000 },
      boundedLongest: { outcome: 'win', moves: 15, score: 40500 },
    },
  ];

  const selected = selectValidationSeeds(rows, { moves: 16 });

  assert.equal(new Set(selected.map(({ seed }) => seed)).size, 3);
});

test('rejects a neutral role that would reuse the setup-favorable seed', () => {
  const rows = [
    {
      seed: 20,
      bot: { outcome: 'win', moves: 8, score: 41000 },
      boundedLongest: { outcome: 'win', moves: 8, score: 41000 },
    },
    {
      seed: 21,
      bot: { outcome: 'win', moves: 9, score: 42000 },
      boundedLongest: { outcome: 'win', moves: 7, score: 43000 },
    },
    {
      seed: 22,
      bot: { outcome: 'lose', moves: 16, score: 39000 },
      boundedLongest: { outcome: 'win', moves: 15, score: 40500 },
    },
  ];

  assert.throws(
    () => selectValidationSeeds(rows, { moves: 16 }),
    /source population has no equal-pace neutral seed/,
  );
});

test('frozen playable challenges reproduce their declared bot and baseline references', () => {
  assert.equal(SOURCE_SEED_COUNT, 512);
  assert.equal(CHALLENGES.length, 3);
  assert.deepEqual(
    CHALLENGES.map(({ role }) => role),
    ['setup-favorable', 'neutral', 'hypothesis-hostile'],
  );
  assert.equal(new Set(CHALLENGES.map(({ seed }) => seed)).size, CHALLENGES.length);

  for (const challenge of CHALLENGES) {
    const bot = playPolicy(candidate, challenge.seed, chooseBot);
    const boundedLongest = playPolicy(candidate, challenge.seed, chooseBoundedLongest);
    assert.deepEqual(challenge.bot, {
      outcome: bot.outcome,
      moves: bot.moves,
      score: bot.score,
    });
    assert.deepEqual(challenge.boundedLongest, {
      outcome: boundedLongest.outcome,
      moves: boundedLongest.moves,
      score: boundedLongest.score,
    });
  }
});

test('frozen roles still win their declared 512-seed population selection', {
  skip: process.env.BANK_BREAK_FULL_SCREEN !== '1'
    ? 'set BANK_BREAK_FULL_SCREEN=1 to run the 512-seed verification'
    : false,
}, () => {
  const selected = selectValidationSeeds(screenSeeds(candidate, SOURCE_SEED_COUNT), candidate);
  const reference = (challenge) => ({
    role: challenge.role,
    seed: challenge.seed,
    selectionRule: challenge.selectionRule,
    bot: {
      outcome: challenge.bot.outcome,
      moves: challenge.bot.moves,
      score: challenge.bot.score,
    },
    boundedLongest: {
      outcome: challenge.boundedLongest.outcome,
      moves: challenge.boundedLongest.moves,
      score: challenge.boundedLongest.score,
    },
  });

  assert.deepEqual(selected.map(reference), CHALLENGES.map(reference));
});
