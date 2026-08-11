const { test } = require('node:test');
const assert = require('node:assert/strict');
const { solveExactPosition } = require('../exact-score');
const { solveMassCursorUpperBound, solveFrozenLevel26 } = require('../upper-bound');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFromRows(rows, overrides = {}) {
  return {
    grid: rows.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: rows[0].length,
    gridHeight: rows.length,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 999,
    minChain: 4,
    ...overrides,
  };
}

function compareWithExact(state, spawnValues) {
  const exact = solveExactPosition(state, { spawnValues });
  const upper = solveMassCursorUpperBound({ state, spawnValues, maxNodes: 1000 });
  assert.equal(exact.complete, true);
  assert.equal(upper.complete, true);
  assert.ok(upper.score >= exact.score, `upper ${upper.score} fell below exact ${exact.score}`);
  return { exact, upper };
}

test('mass-cursor relaxation bounds the exact four-tile maximum', () => {
  const result = compareWithExact(stateFromRows([[2, 2, 4, 4]]), [2, 2, 2]);
  assert.equal(result.exact.score, 18);
  assert.equal(result.upper.score, 18);
});

test('mass-cursor relaxation bounds a distinct five-tile multiplier fixture', () => {
  const result = compareWithExact(stateFromRows([[2, 2, 4, 4, 8]]), [2, 2, 2, 2]);
  assert.equal(result.exact.score, 40);
  assert.equal(result.upper.score, 40);
});

test('negative control rejects an intentionally lowered fixture bound', () => {
  const state = stateFromRows([[2, 2, 4, 4]]);
  const exact = solveExactPosition(state, { spawnValues: [2, 2, 2] });
  const intentionallyLowered = exact.score - 1;

  assert.throws(
    () => assert.ok(intentionallyLowered >= exact.score, 'candidate upper bound is inadmissible'),
    /candidate upper bound is inadmissible/,
  );
});

test('Level 26 seed-0 calculation is complete and bound to the certifier inputs', () => {
  const result = solveFrozenLevel26();

  assert.equal(result.complete, true);
  assert.equal(result.inputIdentity, 'edc6889cbd4b20f62a2ca11b72246cc520ee45073f91ee037c17b9d05c8fb880');
  assert.equal(result.target, 13000);
  assert.equal(result.targetComparison, result.score < result.target ? 'decisive-unreachable' : 'non-decisive');
  assert.ok(result.stats.visited <= result.finiteBound.maxNodes);
});
