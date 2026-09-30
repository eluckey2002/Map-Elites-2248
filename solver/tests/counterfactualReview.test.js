const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const { recordSession } = require('../record-session');
const { branchCounterfactual, takeoverReplay } = require('../counterfactual-review');

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

test('a full manual takeover exactly replays the recorded champion and is deterministic from a later move', () => {
  const level = LEVELS.find(({ level: number }) => number === 52);
  const session = recordSession(level, 2);
  const chains = session.moves.map(({ chain }) => chain.map(({ x, y }) => ({ x, y })));
  const first = takeoverReplay({ levelNumber: 52, seed: 2, moveIndex: 0, chains });
  const second = takeoverReplay({ levelNumber: 52, seed: 2, moveIndex: 0, chains });
  assert.deepEqual(first, second);
  assert.deepEqual(first.outcome, session.outcome);

  const later = takeoverReplay({ levelNumber: 52, seed: 2, moveIndex: 3, chains: chains.slice(3) });
  assert.deepEqual(later.outcome, session.outcome);
  assert.equal(later.turns.length, session.moves.length - 3);
});

test('manual takeover rejects an invalid later turn', () => {
  const level = LEVELS.find(({ level: number }) => number === 52);
  const session = recordSession(level, 2);
  const chains = session.moves.slice(0, 2).map(({ chain }) => chain.map(({ x, y }) => ({ x, y })));
  chains[1] = [chains[1][0], chains[1][0], ...chains[1].slice(2)];
  assert.throws(() => takeoverReplay({ levelNumber: 52, seed: 2, moveIndex: 0, chains }), /cannot reuse a tile/);
});
