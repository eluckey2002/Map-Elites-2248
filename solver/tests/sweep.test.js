const { test } = require('node:test');
const assert = require('node:assert/strict');
const { playLevel } = require('../sweep');

test('playLevel: wins as soon as score reaches target', () => {
  const levelData = { level: 1, target: 4, moves: 5, minChain: 2, gridW: 2, gridH: 1, blockers: [] };
  const rng = () => 0; // r=0 -> value 2 for every spawn (initial and refill)

  const outcome = playLevel(levelData, rng);

  assert.equal(outcome.result, 'win');
  assert.equal(outcome.movesUsed, 1);
});

test('playLevel: loses out of moves when the target is unreachable in the budget', () => {
  const levelData = { level: 1, target: 1000000, moves: 1, minChain: 2, gridW: 2, gridH: 1, blockers: [] };
  const rng = () => 0;

  const outcome = playLevel(levelData, rng);

  assert.equal(outcome.result, 'lose');
  assert.equal(outcome.reason, 'out of moves');
});

test('playLevel: loses with no valid moves when the board has no legal chain', () => {
  // r=0 -> 2, r=0.99 -> 16: alternate so no two adjacent tiles match.
  let call = 0;
  const rng = () => (call++ % 2 === 0 ? 0 : 0.99);
  const levelData = { level: 1, target: 100, moves: 5, minChain: 2, gridW: 2, gridH: 1, blockers: [] };

  const outcome = playLevel(levelData, rng);

  assert.equal(outcome.result, 'lose');
  assert.equal(outcome.reason, 'no valid moves');
});

test('playLevel: loses when a bomb timer reaches zero unattended', () => {
  const levelData = {
    level: 1, target: 1000000, moves: 10, minChain: 2, gridW: 3, gridH: 1,
    blockers: [{ type: 'bomb', x: 0, y: 0, timer: 1 }],
  };
  // Bomb at (0,0) value defaults from spawn; tiles at (1,0)/(2,0) share a
  // value so the bot's best chain never needs to touch the bomb, and the
  // bomb's own value never matches a neighbor, so it's never reachable either.
  let call = 0;
  const rng = () => {
    // First 3 calls seed the initial grid; keep bomb-tile value distinct (8),
    // the other two matching (2) so the bot always has a non-bomb move.
    const v = call++;
    if (v === 0) return 0.99; // bomb tile -> 16 (irrelevant, blocker set separately)
    return 0; // -> 2
  };

  const outcome = playLevel(levelData, rng);

  assert.equal(outcome.result, 'lose');
  assert.equal(outcome.reason, 'bomb exploded');
});
