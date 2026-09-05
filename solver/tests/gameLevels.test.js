const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LEVELS } = require('../../src/game.js');

test('game.js exports LEVELS for headless use, unchanged from the shipped data', () => {
  // 58 since levels 54-58 shipped on 2026-09-05. This number is a deliberate
  // pin: it changes only when a level ships, and a level shipping should
  // require touching this line.
  assert.equal(LEVELS.length, 58);
  assert.equal(LEVELS[39].level, 40);
  assert.deepEqual(LEVELS[39].blockers, [{ type: 'bomb', x: 2, y: 3, timer: 8 }]);
});
