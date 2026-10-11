const { test } = require('node:test');
const assert = require('node:assert/strict');
const { REGRET_BINS, regretBin, baselineRegret, measureRegret } = require('../board-regret');
const { playBot } = require('../human-benchmark');
const { LEVELS } = require('../../src/game');

const pair = (seed, immediateCost, harvestCost) => ({ seed, immediateCost, harvestCost });

test('zero control: a baseline that matches the best witness has zero regret', () => {
  const result = baselineRegret([{ seed: 1, outcome: 'win', moves: 7 }], [pair(1, 9, 7)], 20);
  assert.equal(result.value, 0);
  assert.equal(result.bin, 0);
  assert.equal(result.rows[0].bestSource, 'baseline');
});

test('positive control: a cheaper replayed witness gives regret as a share of the move budget', () => {
  const result = baselineRegret(
    [{ seed: 1, outcome: 'win', moves: 10 }, { seed: 2, outcome: 'win', moves: 8 }],
    [pair(1, 12, 6), pair(2, 8, 8)], 20,
  );
  assert.equal(result.rows[0].regret, 0.2);
  assert.equal(result.rows[0].bestSource, 'harvest witness');
  assert.equal(result.value, 0.1);
  assert.equal(result.bin, REGRET_BINS.find(({ label }) => label === 'baseline 10–15% behind').index);
});

test('a baseline loss costs the budget plus one, and regret is never negative', () => {
  const lost = baselineRegret([{ seed: 3, outcome: 'lose', moves: 20 }], [pair(3, 15, 21)], 20);
  assert.equal(lost.rows[0].baselineCost, 21);
  assert.equal(lost.rows[0].bestSource, 'immediate witness');
  assert.equal(lost.value, 6 / 20);
  const bothUnknown = baselineRegret([{ seed: 4, outcome: 'win', moves: 12 }], [pair(4, 21, 21)], 20);
  assert.equal(bothUnknown.value, 0);
});

test('unpaired, duplicate or out-of-range input fails closed', () => {
  assert.throws(() => baselineRegret([{ seed: 1, outcome: 'win', moves: 5 }], [pair(2, 5, 5)], 10), /no harvest pair/);
  assert.throws(() => baselineRegret([{ seed: 1, outcome: 'win', moves: 5 }, { seed: 1, outcome: 'win', moves: 5 }], [pair(1, 5, 5)], 10), /duplicate baseline/);
  assert.throws(() => baselineRegret([{ seed: 1, outcome: 'win', moves: 5 }], [pair(1, 5, 5), pair(2, 5, 5)], 10), /panels differ/);
  assert.throws(() => regretBin(-0.01), /non-negative/);
  assert.throws(() => regretBin(Number.NaN), /non-negative/);
});

test('bins tile [0, 1] without gaps or overlaps', () => {
  for (let index = 1; index < REGRET_BINS.length; index++) assert.equal(REGRET_BINS[index].minimum, REGRET_BINS[index - 1].maximum);
  assert.equal(REGRET_BINS[0].minimum, 0);
  assert.equal(regretBin(1), REGRET_BINS.length - 1);
});

test('measureRegret plays the real shipped-bot baseline deterministically on a shipped level', () => {
  const level = LEVELS.find(({ level: id }) => id === 1);
  const harvest = { pairs: [pair(5, level.moves + 1, level.moves + 1)] };
  const first = measureRegret(level, [5], harvest);
  const second = measureRegret(level, [5], harvest);
  assert.deepEqual(first, second);
  assert.equal(first.baselineRows[0].outcome, playBot(level, 5).outcome);
  assert.equal(first.value, 0, 'with no cheaper witness the baseline is the best found');
});
