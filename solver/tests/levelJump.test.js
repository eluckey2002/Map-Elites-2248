const { test } = require('node:test');
const assert = require('node:assert/strict');
const { levelFromQuery, LEVELS } = require('../../src/game.js');

/**
 * `?level=N` is the developer's way past the unlock gate — the whole point is
 * to open a late level without playing 25 of them first. It decides what the
 * player is dropped into, so a bad value must land on nothing rather than on
 * level 1 pretending it was asked for.
 */

test('a level in range is the level you get', () => {
  assert.equal(levelFromQuery('?level=26', LEVELS.length), 26);
});

test('the first and last levels are both reachable', () => {
  assert.equal(levelFromQuery('?level=1', 50), 1);
  assert.equal(levelFromQuery('?level=50', 50), 50);
});

test('no level parameter means no jump', () => {
  assert.equal(levelFromQuery('', 50), null);
  assert.equal(levelFromQuery('?seed=9', 50), null);
});

test('a level past the end is refused rather than clamped', () => {
  assert.equal(levelFromQuery('?level=51', 50), null);
  assert.equal(levelFromQuery('?level=9999', 50), null);
});

test('zero and negative levels are refused', () => {
  assert.equal(levelFromQuery('?level=0', 50), null);
  assert.equal(levelFromQuery('?level=-3', 50), null);
});

test('a value that is not a whole number is refused, not truncated', () => {
  assert.equal(levelFromQuery('?level=abc', 50), null);
  assert.equal(levelFromQuery('?level=26abc', 50), null);
  assert.equal(levelFromQuery('?level=26.5', 50), null);
  assert.equal(levelFromQuery('?level=', 50), null);
});

test('the jump survives other query parameters', () => {
  assert.equal(levelFromQuery('?seed=9&level=26&debug=1', 50), 26);
});
