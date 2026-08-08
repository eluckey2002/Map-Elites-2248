const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LEVELS } = require('../../src/game.js');

test('game.js exports LEVELS for headless use, unchanged from the shipped data', () => {
  assert.equal(LEVELS.length, 50);
  assert.equal(LEVELS[39].level, 40);
  assert.deepEqual(LEVELS[39].blockers, [{ type: 'bomb', x: 2, y: 3, timer: 8 }]);
});
