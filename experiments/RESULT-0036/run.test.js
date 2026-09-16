const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const { playPercentile } = require('../../solver/greed-descriptor-screen');

test('exact measurement leaves the scripted player outcome unchanged', () => {
  const level = LEVELS.find(({ level: number }) => number === 54);
  const proxy = playPercentile(level, 33100000, 0.75);
  const exact = playPercentile(level, 33100000, 0.75, {
    denominator: 'exact',
    exactTimeoutMs: 2000,
  });
  assert.deepEqual(
    { score: exact.score, win: exact.win, moves: exact.moves, terminal: exact.terminal },
    { score: proxy.score, win: proxy.win, moves: proxy.moves, terminal: proxy.terminal },
  );
});
