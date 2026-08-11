const { test } = require('node:test');
const assert = require('node:assert/strict');
const { solveExactPosition } = require('../exact-score');
const {
  solveValueCompatibleTailBound,
  searchPhysicalTarget,
  assertAdmissibleTail,
} = require('./index');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFromRow(row, overrides = {}) {
  return {
    grid: [row.map((value, x) => tile(x, 0, value))],
    gridWidth: row.length,
    gridHeight: 1,
    score: 0,
    moves: 0,
    maxMoves: 1,
    targetScore: 999,
    minChain: 4,
    ...overrides,
  };
}

function proveFixtureMaximum(state, spawnValues) {
  const oracle = solveExactPosition(state, { spawnValues });
  const reachesMaximum = searchPhysicalTarget({
    state,
    spawnValues,
    target: oracle.score,
    compatibilityDepth: state.maxMoves,
  });
  const rejectsNextPoint = searchPhysicalTarget({
    state,
    spawnValues,
    target: oracle.score + 1,
    compatibilityDepth: state.maxMoves,
  });
  assert.equal(reachesMaximum.verdict, 'SAT');
  assert.equal(reachesMaximum.scoreClaim, oracle.score);
  assert.equal(rejectsNextPoint.verdict, 'UNSAT');
  assert.equal(rejectsNextPoint.complete, true);
  return oracle.score;
}

test('physical branch search reproduces the exact one-move maximum', () => {
  const state = stateFromRow([2, 2, 4, 4]);
  assert.equal(proveFixtureMaximum(state, [2, 2, 2]), 18);
});

test('physical branch search reproduces a two-move frozen maximum', () => {
  const state = stateFromRow([2, 2, 4, 4, 8], { maxMoves: 2 });
  assert.equal(proveFixtureMaximum(state, Array(8).fill(2)), 52);
});

test('value-compatible tails are admissible on both exact fixtures', () => {
  const fixtures = [
    { state: stateFromRow([2, 2, 4, 4]), spawns: [2, 2, 2] },
    { state: stateFromRow([2, 2, 4, 4, 8], { maxMoves: 2 }), spawns: Array(8).fill(2) },
  ];
  for (const fixture of fixtures) {
    const exact = solveExactPosition(fixture.state, { spawnValues: fixture.spawns });
    const tail = solveValueCompatibleTailBound({
      state: fixture.state,
      spawnValues: fixture.spawns,
      compatibilityDepth: fixture.state.maxMoves,
    });
    assert.equal(tail.complete, true);
    assertAdmissibleTail(exact.score, tail.score);
  }
});

test('negative control rejects a deliberately too-low tail', () => {
  const state = stateFromRow([2, 2, 4, 4]);
  const exact = solveExactPosition(state, { spawnValues: [2, 2, 2] });
  assert.throws(
    () => assertAdmissibleTail(exact.score, exact.score - 1),
    /inadmissible tail bound 17 below exact 18/,
  );
});

test('every target prune has a complete strict bound below the remaining target', () => {
  const state = stateFromRow([2, 2, 4, 4]);
  const tail = solveValueCompatibleTailBound({
    state,
    spawnValues: [2, 2, 2],
    compatibilityDepth: 1,
  });
  const result = searchPhysicalTarget({
    state,
    spawnValues: [2, 2, 2],
    target: tail.score + 1,
    compatibilityDepth: 1,
  });
  assert.equal(result.verdict, 'UNSAT');
  assert.equal(result.stats.prunedBranches, 1);
  assert.ok(result.pruneReceipts.every((receipt) => receipt.strict));
  assert.ok(result.pruneReceipts.every((receipt) => receipt.tailUpperBound < receipt.remainingTarget));
});

test('a resource cap fails closed and cannot create a prune', () => {
  const state = stateFromRow([2, 2, 4, 4]);
  assert.throws(
    () => solveValueCompatibleTailBound({
      state,
      spawnValues: [2, 2, 2],
      compatibilityDepth: 1,
      maxValueStates: 0,
    }),
    /no bound produced/,
  );
  const result = searchPhysicalTarget({
    state,
    spawnValues: [2, 2, 2],
    target: 19,
    compatibilityDepth: 1,
    maxValueStates: 0,
  });
  assert.equal(result.stats.boundUnavailable > 0, true);
  assert.equal(result.stats.prunedBranches, 0);
  assert.equal(result.verdict, 'UNSAT');
});
