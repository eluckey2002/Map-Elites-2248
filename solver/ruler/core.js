'use strict';

// The decision order is fixed: wins gained/lost, then speed on mutual wins.
// Every caller supplies a complete level-major paired grid.
function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleSd(values) {
  if (values.length < 2) return null;
  const center = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1));
}

function twoAxis(values, levelCount, seedCount) {
  if (values.length !== levelCount * seedCount) throw new Error('incomplete two-axis grid');
  const observed = values.filter((value) => value !== null);
  if (!observed.length) return { mean: null, se: null, seLevel: null, seSeed: null, ci95: [null, null], n: 0 };
  const byLevel = Array.from({ length: levelCount }, (_, levelIndex) => (
    values.slice(levelIndex * seedCount, (levelIndex + 1) * seedCount).filter((value) => value !== null)
  )).filter((group) => group.length).map(mean);
  const bySeed = Array.from({ length: seedCount }, (_, seedIndex) => (
    Array.from({ length: levelCount }, (_, levelIndex) => values[levelIndex * seedCount + seedIndex])
      .filter((value) => value !== null)
  )).filter((group) => group.length).map(mean);
  const levelSd = sampleSd(byLevel);
  const seedSd = sampleSd(bySeed);
  const seLevel = levelSd === null ? null : levelSd / Math.sqrt(byLevel.length);
  const seSeed = seedSd === null ? null : seedSd / Math.sqrt(bySeed.length);
  const se = seLevel === null || seSeed === null ? null : Math.max(seLevel, seSeed);
  const estimate = mean(observed);
  return {
    mean: estimate, se, seLevel, seSeed,
    ci95: se === null ? [null, null] : [estimate - 1.96 * se, estimate + 1.96 * se],
    n: observed.length,
  };
}

function checkOutcome(outcome) {
  if (!outcome || typeof outcome.win !== 'boolean'
    || !Number.isInteger(outcome.moveBudget) || outcome.moveBudget < 1
    || (outcome.win && (!Number.isInteger(outcome.movesToTarget)
      || outcome.movesToTarget < 1 || outcome.movesToTarget > outcome.moveBudget))
    || (!outcome.win && outcome.movesToTarget !== null)) {
    throw new Error('malformed target-stop outcome');
  }
}

function summarizePairs(cells, levels, seeds) {
  if (!Array.isArray(levels) || !Array.isArray(seeds) || !levels.length || !seeds.length
    || cells.length !== levels.length * seeds.length) {
    throw new Error('paired grid has the wrong size');
  }
  const winDiffs = [];
  const moveDiffs = [];
  let winsGained = 0;
  let winsLost = 0;
  let bothWin = 0;
  let bothLose = 0;
  let candidateFaster = 0;
  let championFaster = 0;
  let sameSpeed = 0;
  let referenceMoves = 0;
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const expectedLevel = levels[Math.floor(i / seeds.length)];
    const expectedSeed = seeds[i % seeds.length];
    if (cell.level !== expectedLevel || cell.seed !== expectedSeed) {
      throw new Error('paired grid is not complete and level-major');
    }
    checkOutcome(cell.candidate);
    checkOutcome(cell.champion);
    if (cell.candidate.moveBudget !== cell.champion.moveBudget) {
      throw new Error('paired arms have different move budgets');
    }
    const winDiff = Number(cell.candidate.win) - Number(cell.champion.win);
    winDiffs.push(winDiff);
    if (winDiff > 0) winsGained += 1;
    if (winDiff < 0) winsLost += 1;
    if (cell.candidate.win && cell.champion.win) {
      bothWin += 1;
      const saved = cell.champion.movesToTarget - cell.candidate.movesToTarget;
      moveDiffs.push(saved);
      referenceMoves += cell.champion.movesToTarget;
      if (saved > 0) candidateFaster += 1;
      else if (saved < 0) championFaster += 1;
      else sameSpeed += 1;
    } else {
      moveDiffs.push(null);
      if (!cell.candidate.win && !cell.champion.win) bothLose += 1;
    }
  }
  const wins = twoAxis(winDiffs, levels.length, seeds.length);
  const moves = twoAxis(moveDiffs, levels.length, seeds.length);
  return {
    cells: cells.length, winsGained, winsLost, netWins: winsGained - winsLost,
    bothWin, bothLose, candidateFaster, championFaster, sameSpeed,
    winRateDifference: wins.mean, winSe: wins.se, winSeLevel: wins.seLevel,
    winSeSeed: wins.seSeed, winCi95: wins.ci95,
    meanMovesSaved: moves.mean, moveSe: moves.se, moveSeLevel: moves.seLevel,
    moveSeSeed: moves.seSeed, moveCi95: moves.ci95,
    mutualWins: moves.n,
    relativeMovesPct: bothWin ? 100 * moves.mean / (referenceMoves / bothWin) : null,
  };
}

function compareFitness(a, b) {
  if (a.netWins !== b.netWins) return Math.sign(a.netWins - b.netWins);
  return Math.sign((a.meanMovesSaved ?? 0) - (b.meanMovesSaved ?? 0));
}

const CHAMPION_FITNESS = Object.freeze({ netWins: 0, meanMovesSaved: 0 });

function stageDecision(summary, stage) {
  if (![1, 2, 3].includes(stage)) throw new Error('unknown screen stage');
  if (summary.netWins < 0) return 'CUT';
  if (summary.netWins > 0) return stage === 3 ? 'NOMINATE' : 'ADVANCE';
  if (stage === 3) {
    return summary.meanMovesSaved !== null && summary.meanMovesSaved > 0 ? 'NOMINATE' : 'CUT';
  }
  return summary.moveCi95[1] !== null && summary.moveCi95[1] < 0 ? 'CUT' : 'ADVANCE';
}

function admit(screen, fresh, incumbentFresh = null) {
  if (stageDecision(screen, 3) !== 'NOMINATE') return { admitted: false, reason: 'screen-cut' };
  if (compareFitness(fresh, CHAMPION_FITNESS) <= 0) {
    return { admitted: false, reason: 'fresh-not-better-than-champion' };
  }
  if (incumbentFresh && compareFitness(fresh, incumbentFresh) <= 0) {
    return { admitted: false, reason: 'fresh-not-better-than-cell-incumbent' };
  }
  return { admitted: true, reason: 'fresh-rank' };
}

module.exports = { CHAMPION_FITNESS, admit, compareFitness, stageDecision, summarizePairs, twoAxis };
