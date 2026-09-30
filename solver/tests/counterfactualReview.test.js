const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const { recordSession } = require('../record-session');
const { branchCounterfactual } = require('../counterfactual-review');

test('a replayed champion route produces the recorded terminal outcome from the exact branch state', () => {
  const level = LEVELS.find(({ level: number }) => number === 52);
  const session = recordSession(level, 2);
  const recorded = session.moves[0];
  const result = branchCounterfactual({
    levelNumber: level.level,
    seed: 2,
    moveIndex: 0,
    chain: recorded.chain.map(({ x, y }) => ({ x, y })),
  });

  assert.deepEqual(result.boardBefore, recorded.boardBefore);
  assert.equal(result.points, recorded.points);
  assert.deepEqual(result.outcome, session.outcome);
});

test('counterfactual review rejects a repeated, disconnected, or too-short manual chain', () => {
  const level = LEVELS.find(({ level: number }) => number === 52);
  const chain = recordSession(level, 2).moves[0].chain.map(({ x, y }) => ({ x, y }));
  assert.throws(() => branchCounterfactual({
    levelNumber: 52,
    seed: 2,
    moveIndex: 0,
    chain: [chain[0], chain[0], ...chain.slice(2)],
  }), /cannot reuse a tile/);
  assert.throws(() => branchCounterfactual({
    levelNumber: 52,
    seed: 2,
    moveIndex: 0,
    chain: [chain[0], { x: 0, y: 0 }, ...chain.slice(2)],
  }), /legal extension/);
  assert.throws(() => branchCounterfactual({
    levelNumber: 52,
    seed: 2,
    moveIndex: 0,
    chain: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  }), /needs at least/);
});
