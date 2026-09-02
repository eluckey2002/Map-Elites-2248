// Evaluating one bot policy on a fixed set of games.
//
// Everything here exists to make policy comparison PAIRED. Two policies are
// only ever compared on the identical (level, seed) cells, so board difficulty
// and spawn luck — the dominant variance in this game — cancel in the
// difference instead of having to be averaged away. That is why searching over
// policies is tractable where searching over boards was not: the board search
// had two independent estimates of one item correlating at r = 0.49, and the
// paired policy measurement resolves a 1.3% difference at t = 7.6 on 3,000
// games (see docs/ or the ledger record for POLICY-SEARCH).
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require(`${ROOT}/solver/engine`);
const { chooseMove } = require(`${ROOT}/solver/bot`);
const {
  addPostMoveTrace,
  capturePostMove,
  createPostMoveTotals,
  summarizePostMoveTotals,
  summarizePostMoveTrace,
} = require(`${ROOT}/solver/behavior-descriptors`);

const LOOKAHEAD_BASE = 987654321; // must match solver/sweep.js

function summarizeBehavior(totals) {
  return {
    meanChainLength: totals.chainCount ? totals.chainTiles / totals.chainCount : 0,
    lateScoreShare: totals.totalScore ? totals.lateScore / totals.totalScore : 0,
  };
}

function recordBehaviorMove(totals, {
  chainLength, scoreGain, moveNumber, moveBudget,
}) {
  totals.chainCount += 1;
  totals.chainTiles += chainLength;
  totals.totalScore += scoreGain;
  if (moveNumber > moveBudget * (2 / 3)) totals.lateScore += scoreGain;
  return totals;
}

// Plays out the whole move budget and returns the final score. Deliberately
// does NOT stop at targetScore: the win condition censors score from above, so
// a policy strong enough to clear the target early would be indistinguishable
// from one that barely scrapes it. Strength needs an uncensored measure.
function playToBudget(levelData, rng, params) {
  const state = createLevelState(levelData, rng);
  let moveIndex = 0;
  let reachedTarget = null;
  const behaviorTotals = { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 };
  const postMoveTrace = [];
  for (let i = 0; i < levelData.moves + 5; i++) {
    const chain = chooseMove(state, {
      params,
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    moveIndex += 1;
    if (!chain) break;
    const scoreBefore = state.score;
    executeChain(state, chain);
    recordBehaviorMove(behaviorTotals, {
      chainLength: chain.length,
      scoreGain: state.score - scoreBefore,
      moveNumber: state.moves,
      moveBudget: state.maxMoves,
    });
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    postMoveTrace.push(capturePostMove(state));
    if (checkBombs(state)) break;
    if (reachedTarget === null && state.score >= state.targetScore) reachedTarget = state.moves;
    if (state.moves >= state.maxMoves) break;
  }
  return {
    score: state.score,
    movesToTarget: reachedTarget,
    moves: state.moves,
    behaviorTotals,
    behavior: summarizeBehavior(behaviorTotals),
    postMoveTrace,
    postMoveDescriptors: summarizePostMoveTrace(postMoveTrace),
  };
}

// One policy against a fixed (level, seed) grid, flattened in a stable order so
// cell i of one run is the same game as cell i of any other run.
function evaluatePolicy(params, levels, seeds) {
  const scores = [];
  let wins = 0;
  let movesToTargetSum = 0;
  const behaviorTotals = { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 };
  const postMoveTotals = createPostMoveTotals();
  for (const levelData of levels) {
    for (const seed of seeds) {
      const r = playToBudget(levelData, makeRng(seed), params);
      scores.push(r.score);
      if (r.movesToTarget !== null) { wins += 1; movesToTargetSum += r.movesToTarget; }
      for (const key of Object.keys(behaviorTotals)) behaviorTotals[key] += r.behaviorTotals[key];
      addPostMoveTrace(postMoveTotals, r.postMoveTrace);
    }
  }
  return {
    scores,
    winRate: wins / scores.length,
    avgMovesToTarget: wins ? movesToTargetSum / wins : null,
    behaviorTotals,
    behavior: summarizeBehavior(behaviorTotals),
    postMoveTotals,
    postMoveDescriptors: summarizePostMoveTotals(postMoveTotals),
  };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
function sd(a) {
  const m = mean(a);
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1));
}

// Paired lift of `scores` over `refScores` on the same cells.
//
// TWO CHOICES HERE ARE LOAD-BEARING.
//
// (1) LOG-RATIO, NOT RATIO. The per-cell statistic is
// log(max(score,1)/max(ref,1)). Clamping at 1 keeps a zero-score cell in the
// sample; the earlier ratio form guarded division by scoring any cell with a
// zero reference as an exact tie, which silently deleted the very games where
// a policy difference is largest. Logs also make the measure symmetric — a
// halving and a doubling are equal and opposite — so one blown-up game cannot
// outweigh many small losses. Reported back as a percentage via expm1.
//
// (2) CLUSTER BY LEVEL. sd(cells)/sqrt(nCells) assumes every cell is an
// independent draw. They are not: all 250 seeds of level 26 are the SAME
// BOARD, so a policy that happens to suit that board tilts 250 cells together.
// The inflation factor is sqrt(1 + (S-1) * ICC) — at 250 seeds per level this
// is large, and it certifies level-specific quirks as general improvements.
// So the mean is taken WITHIN each level first, and the standard error is
// taken ACROSS the 51 level-means. The effective n is 51, not 12,750.
//
// This is the same mistake as the board search wearing different clothes:
// there, one lucky sample; here, one lucky level counted hundreds of times.
//
// `seNaive` is retained only so the size of the correction stays visible; it
// is never the headline.
//
// (3) THE HEADLINE TAKES THE LARGER AXIS. Clustering on level alone has a hole:
// if every level behaves identically and all the variation is per-seed, the
// level-means are all equal, the between-level SE is zero, and the estimator
// reports infinite confidence in whatever the mean happens to be. So `seSeed`
// clusters the other way — every level is scored on the SAME seed set, so
// seed k's spawn luck is common across cells too — and `se` is the larger of
// the two, a conservative stand-in for a two-way cluster estimate. On the real
// holdout data the level axis binds, so this changes no reported result; it
// only stops the degenerate case from certifying itself.
function pairedLift(scores, refScores, layout = null) {
  const d = scores.map((v, i) => Math.log(Math.max(v, 1) / Math.max(refScores[i], 1)));
  const m = mean(d);
  const seNaive = sd(d) / Math.sqrt(d.length);
  const asPct = (x) => Math.expm1(x);
  if (!layout) {
    return { lift: asPct(m), logLift: m, se: seNaive, seNaive, t: seNaive > 0 ? m / seNaive : 0, n: d.length };
  }

  const { levelCount, seedCount } = layout;
  if (levelCount * seedCount !== d.length) {
    throw new Error(`layout ${levelCount}x${seedCount} does not match ${d.length} cells`);
  }
  // Cells are stored level-major: level 0's seeds, then level 1's, and so on.
  const byLevel = [];
  for (let j = 0; j < levelCount; j++) {
    byLevel.push(mean(d.slice(j * seedCount, (j + 1) * seedCount)));
  }
  const bySeed = [];
  for (let k = 0; k < seedCount; k++) {
    const cells = [];
    for (let j = 0; j < levelCount; j++) cells.push(d[j * seedCount + k]);
    bySeed.push(mean(cells));
  }
  const clusterMean = mean(byLevel);
  const seLevel = levelCount > 1 ? sd(byLevel) / Math.sqrt(levelCount) : Infinity;
  const seSeed = seedCount > 1 ? sd(bySeed) / Math.sqrt(seedCount) : Infinity;
  const se = Math.max(seLevel, seSeed);
  return {
    lift: asPct(clusterMean),
    logLift: clusterMean,
    se,                       // the larger axis; level-clustered in practice
    seLevel,                  // clustered by level, n = levelCount
    seNaive,
    seSeed,
    inflation: seNaive > 0 ? se / seNaive : Infinity,
    t: se > 0 ? clusterMean / se : 0,
    n: levelCount,
    cells: d.length,
    levelCount,
    seedCount,
    byLevel: byLevel.map(asPct),
  };
}

module.exports = {
  playToBudget, evaluatePolicy, pairedLift, mean, sd,
  recordBehaviorMove, summarizeBehavior, LOOKAHEAD_BASE,
};
