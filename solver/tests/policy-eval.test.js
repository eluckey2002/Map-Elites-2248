const { test } = require('node:test');
const assert = require('node:assert/strict');
const { LEVELS } = require('../../src/game');
const { DEFAULT_PARAMS } = require('../bot');
const { summarizePostMoveTrace } = require('../behavior-descriptors');
const { makeRng } = require('../engine');
const {
  evaluatePolicy, pairedLift, playToBudget, recordBehaviorMove, summarizeBehavior,
} = require('../policy-eval');

// Cells are level-major: level 0's seeds, then level 1's, ...
function build(levelEffects, seedEffects) {
  const scores = [];
  const ref = [];
  for (const le of levelEffects) {
    for (const se of seedEffects) {
      ref.push(100);
      scores.push(100 * (1 + le + se));
    }
  }
  return { scores, ref, layout: { levelCount: levelEffects.length, seedCount: seedEffects.length } };
}

test('naive SE is returned unchanged when no layout is supplied', () => {
  const { scores, ref } = build([0.1, -0.1], [0, 0, 0, 0]);
  const r = pairedLift(scores, ref);
  assert.equal(r.se, r.seNaive);
  // The statistic is a log-ratio, so +10% and -10% do NOT cancel: 1.1 * 0.9 is
  // 0.99, and the geometric mean reports the -1% that a mean of ratios hides.
  // This assertion previously expected 0, which was the arithmetic-mean
  // contract this estimator deliberately replaced.
  assert.ok(Math.abs(r.lift - (Math.sqrt(1.1 * 0.9) - 1)) < 1e-12,
    `expected the geometric mean, got ${r.lift}`);
});

test('a layout that does not match the cell count is rejected', () => {
  const { scores, ref } = build([0.1, -0.1], [0, 0]);
  assert.throws(() => pairedLift(scores, ref, { levelCount: 3, seedCount: 2 }), /does not match/);
});

// The whole point of the patch: variation that lives entirely at level level
// must not be counted once per seed.
test('level-clustered SE does not shrink when seeds are added to the same levels', () => {
  const few = build([0.10, 0.02, -0.06, 0.04], Array(10).fill(0));
  const many = build([0.10, 0.02, -0.06, 0.04], Array(1000).fill(0));
  const rFew = pairedLift(few.scores, few.ref, few.layout);
  const rMany = pairedLift(many.scores, many.ref, many.layout);
  assert.ok(Math.abs(rFew.seLevel - rMany.seLevel) < 1e-12,
    `seLevel moved from ${rFew.seLevel} to ${rMany.seLevel} on seeds alone`);
  // and the naive one collapses, which is the bug being guarded against
  assert.ok(rMany.seNaive < rFew.seNaive / 9,
    `naive SE should have shrunk ~10x, went ${rFew.seNaive} -> ${rMany.seNaive}`);
});

test('level-clustered SE does shrink when genuinely new levels are added', () => {
  const four = build([0.10, 0.02, -0.06, 0.04], Array(20).fill(0));
  const sixteen = build([0.10, 0.02, -0.06, 0.04, 0.10, 0.02, -0.06, 0.04,
    0.10, 0.02, -0.06, 0.04, 0.10, 0.02, -0.06, 0.04], Array(20).fill(0));
  const r4 = pairedLift(four.scores, four.ref, four.layout);
  const r16 = pairedLift(sixteen.scores, sixteen.ref, sixteen.layout);
  assert.ok(r16.seLevel < r4.seLevel * 0.6,
    `expected ~2x shrink from 4 to 16 levels, got ${r4.seLevel} -> ${r16.seLevel}`);
});

test('seed-clustered SE catches variation that is common across levels', () => {
  // Every level behaves identically; all the variation is per-seed. Clustering
  // on level alone would report SE 0 and infinite confidence.
  const { scores, ref, layout } = build(Array(8).fill(0), [0.10, -0.10, 0.05, -0.05]);
  const r = pairedLift(scores, ref, layout);
  assert.ok(r.seLevel < 1e-12, `seLevel should vanish, got ${r.seLevel}`);
  assert.ok(r.seSeed > 0.01, `seSeed should be large, got ${r.seSeed}`);
  assert.equal(r.se, r.seSeed, 'headline SE must take the larger axis');
});

test('the correction is an inflation, never a discount', () => {
  const { scores, ref, layout } = build([0.10, 0.02, -0.06, 0.04], Array(50).fill(0));
  const r = pairedLift(scores, ref, layout);
  assert.ok(r.se >= r.seNaive, `clustered ${r.se} should not be below naive ${r.seNaive}`);
});

test('behavior summary means chain size and the share of score earned in the final third', () => {
  const behavior = summarizeBehavior({
    chainCount: 4,
    chainTiles: 20,
    totalScore: 100,
    lateScore: 40,
  });

  assert.deepEqual(behavior, { meanChainLength: 5, lateScoreShare: 0.4 });
});

test('patience counts score only from moves in the final third of the budget', () => {
  const totals = { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 };
  recordBehaviorMove(totals, { chainLength: 3, scoreGain: 20, moveNumber: 4, moveBudget: 6 });
  recordBehaviorMove(totals, { chainLength: 7, scoreGain: 80, moveNumber: 5, moveBudget: 6 });

  assert.deepEqual(totals, { chainCount: 2, chainTiles: 10, totalScore: 100, lateScore: 80 });
  assert.deepEqual(summarizeBehavior(totals), { meanChainLength: 5, lateScoreShare: 0.8 });
});

test('policy evaluation exposes aggregate behavior beside uncensored scores', () => {
  const result = evaluatePolicy(DEFAULT_PARAMS, [LEVELS[0]], [0]);

  assert.equal(result.scores.length, 1);
  assert.ok(result.behaviorTotals.chainCount > 0);
  assert.deepEqual(result.behavior, summarizeBehavior(result.behaviorTotals));
  assert.ok(result.behavior.meanChainLength >= LEVELS[0].minChain);
  assert.ok(result.behavior.lateScoreShare >= 0 && result.behavior.lateScoreShare <= 1);
});

test('single-cell policy evaluation aggregates the same post-move descriptor as its real play trace', () => {
  const level = LEVELS[0];
  const seed = 0;
  const played = playToBudget(level, makeRng(seed), DEFAULT_PARAMS);
  const evaluated = evaluatePolicy(DEFAULT_PARAMS, [level], [seed]);

  assert.deepEqual(played.postMoveDescriptors, summarizePostMoveTrace(played.postMoveTrace));
  assert.deepEqual(evaluated.postMoveDescriptors, played.postMoveDescriptors);
  assert.ok(evaluated.postMoveDescriptors.strandedCellPressure >= 0);
  assert.ok(evaluated.postMoveDescriptors.strandedCellPressure <= 1);
});
