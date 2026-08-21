const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createInitialGrid, rngForLevel, validatePlayableLevel, LEVELS } = require('../../src/game.js');

const BASE = {
  level: 52,
  target: 90000,
  tileScale: 32,
  moves: 16,
  minChain: 3,
  gridW: 4,
  gridH: 7,
  blockers: [],
};

const values = (level) => createInitialGrid(level, rngForLevel(level)).flat().map((tile) => tile.value);

// The whole point of a fixed board: two players, or the same player twice, get
// the identical opening position.
test('a level that names a seed deals the same board every time', () => {
  const seeded = { ...BASE, seed: 777 };
  assert.deepEqual(values(seeded), values(seeded));
});

test('different seeds are different boards', () => {
  assert.notDeepEqual(values({ ...BASE, seed: 777 }), values({ ...BASE, seed: 778 }));
});

// The 51 shipped levels carry no seed and must keep drawing fresh boards, so
// adding fixed boards cannot silently freeze the existing game.
test('a level with no seed still draws a fresh board each time', () => {
  const unseeded = { ...BASE };
  const draws = new Set();
  for (let i = 0; i < 8; i++) draws.add(values(unseeded).join(','));
  assert.ok(draws.size > 1, 'an unseeded level dealt the same board every time');
});

test('every shipped level is currently unseeded, so none of them changed', () => {
  const seeded = LEVELS.filter((level) => Object.hasOwn(level, 'seed'));
  assert.deepEqual(seeded, [], 'a shipped level gained a seed without its target being re-derived for that board');
});

// A seed is part of the level data, so it goes through the same validation as
// every other field rather than being trusted.
test('an unusable seed is rejected rather than silently ignored', () => {
  assert.throws(() => validatePlayableLevel({ ...BASE, seed: -1 }), /seed/);
  assert.throws(() => validatePlayableLevel({ ...BASE, seed: 1.5 }), /seed/);
  assert.throws(() => validatePlayableLevel({ ...BASE, seed: '777' }), /seed/);
  assert.doesNotThrow(() => validatePlayableLevel({ ...BASE, seed: 0 }));
});
