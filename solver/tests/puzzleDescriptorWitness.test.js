const { test } = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const {
  analyzeWitnessBounds,
  findBoundedWitness,
  makeScaledFrozenSpawnValues,
  replayWitnessAnalysis,
} = require('../puzzle-descriptor-witness');
const { createLevelState, makeRng } = require('../engine');

test('scaled frozen spawns preserve the level tile scale', () => {
  const level = { gridW: 2, gridH: 2, moves: 2, minChain: 2, tileScale: 32, blockers: [], target: 1 };
  const rng = makeRng(17);
  createLevelState(level, rng);
  const values = makeScaledFrozenSpawnValues(level, rng);
  assert.ok(values.length > 0);
  assert.ok(values.every((value) => [64, 128, 256].includes(value)));
});

test('successful bounded analysis publishes upper bounds, not exact descriptors', () => {
  const level = {
    level: 'upper-bound-fixture', target: 6, moves: 4, minChain: 2,
    tileScale: 1, gridW: 5, gridH: 8, blockers: [],
  };
  const analysis = analyzeWitnessBounds({
    level,
    seed: 11,
    caps: [2, 4],
    search: { width: 4, actionsPerState: 4, pathWidth: 1 },
  });
  assert.equal(analysis.standing, 'replayed_upper_bound');
  assert.ok(analysis.descriptors.minimumMovesUpperBound <= level.moves);
  assert.equal(
    analysis.descriptors.budgetTightnessUpperBound,
    analysis.descriptors.minimumMovesUpperBound / level.moves,
  );
  assert.ok(!Object.hasOwn(analysis.descriptors, 'minimumMoves'));
  assert.ok(!Object.hasOwn(analysis.descriptors, 'budgetTightness'));
  assert.ok(!Object.hasOwn(analysis.descriptors, 'chainLengthDependence'));
  assert.deepEqual(
    analysis,
    analyzeWitnessBounds({
      level,
      seed: 11,
      caps: [2, 4],
      search: { width: 4, actionsPerState: 4, pathWidth: 1 },
    }),
  );
  assert.equal(replayWitnessAnalysis(analysis), true);
});

test('the public replay seam rejects a planted unavailable witness tile', () => {
  const level = {
    level: 'bad-witness-fixture', target: 6, moves: 2, minChain: 2,
    tileScale: 1, gridW: 5, gridH: 8, blockers: [],
  };
  const analysis = analyzeWitnessBounds({
    level,
    seed: 11,
    caps: [2],
    search: { width: 4, actionsPerState: 4, pathWidth: 1 },
  });
  const successful = analysis.runs.find(({ reachesTarget }) => reachesTarget);
  assert.ok(successful);
  successful.witness[0][0] = [99, 99];
  assert.throws(() => replayWitnessAnalysis(analysis), /unavailable tile/);
});

test('a bounded miss remains UNKNOWN rather than becoming unreachable', () => {
  const level = {
    level: 'unknown-fixture', target: Number.MAX_SAFE_INTEGER, moves: 1, minChain: 2,
    tileScale: 1, gridW: 3, gridH: 3, blockers: [],
  };
  const result = findBoundedWitness({ level, seed: 3, width: 2, actionsPerState: 2, pathWidth: 1 });
  assert.equal(result.reachesTarget, false);
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.complete, false);
});

test('actionsPerState caps the combined candidate families', () => {
  const level = {
    level: 'candidate-cap-fixture', target: Number.MAX_SAFE_INTEGER, moves: 2, minChain: 2,
    tileScale: 1, gridW: 5, gridH: 8, blockers: [],
  };
  const result = findBoundedWitness({
    level,
    seed: 17,
    width: 4,
    actionsPerState: 3,
    pathWidth: 2,
  });
  assert.ok(result.diagnostics.expandedStates > 0);
  assert.ok(
    result.diagnostics.generatedActions <= result.diagnostics.expandedStates * 3,
    `${result.diagnostics.generatedActions} actions exceeded three per ${result.diagnostics.expandedStates} states`,
  );
});

test('the representative panel uses real 5x8, 5x7, 6x5, and 4x8 configurations', () => {
  const expected = new Map([[10, '5x8'], [31, '5x7'], [53, '6x5'], [54, '4x8']]);
  for (const [levelNumber, dimensions] of expected) {
    const level = LEVELS.find(({ level: candidate }) => candidate === levelNumber);
    assert.equal(`${level.gridW}x${level.gridH}`, dimensions);
  }
});
