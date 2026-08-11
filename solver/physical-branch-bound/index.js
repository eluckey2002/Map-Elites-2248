const { chainMultiplier } = require('../engine');
const {
  enumerateLegalChains,
  applyFrozenChain,
  enumerateRelaxedActions,
  replayFrozenWitness,
} = require('../exact-score');

function addCount(counts, value, amount) {
  const next = (counts.get(value) || 0) + amount;
  if (next < 0) throw new Error(`negative count for value ${value}`);
  if (next === 0) counts.delete(value);
  else counts.set(value, next);
}

function countsFromState(state) {
  const counts = new Map();
  for (const tile of state.grid.flat()) {
    if (!tile) continue;
    if (tile.blocker) {
      throw new Error('value-compatible tail is certified only for blocker-free states');
    }
    addCount(counts, tile.value, 1);
  }
  return counts;
}

function countKey(counts) {
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => left - right)
    .map(([value, count]) => `${value}x${count}`)
    .join(',');
}

function applyRelaxedAction(counts, action, spawnValues, cursor) {
  const next = new Map(counts);
  for (const [value, count] of action.removedCounts) addCount(next, value, -count);
  addCount(next, action.sum, 1);
  let nextCursor = cursor;
  for (let index = 0; index < action.length - 1; index += 1) {
    if (nextCursor >= spawnValues.length) {
      throw new Error('Frozen spawn stream exhausted in relaxed transition');
    }
    addCount(next, spawnValues[nextCursor], 1);
    nextCursor += 1;
  }
  return { counts: next, cursor: nextCursor };
}

// Complete mass/cursor outer relaxation from an arbitrary physical or
// value-relaxed node. This is the same resource argument as upper-bound.js:
// it tries every chain length, scores the whole current board mass, and keeps
// exact frozen-prefix consumption. It is intentionally local so every leaf
// of the tighter value-compatible prefix shares one memo table.
function makeMassTail({ spawnValues, minChain, capacity, maxStates, stats }) {
  const prefix = [0];
  for (const value of spawnValues) prefix.push(prefix[prefix.length - 1] + value);
  const memo = new Map();

  function solve(mass, cursor, movesLeft) {
    if (movesLeft <= 0) return 0;
    const key = `${mass}|${cursor}|${movesLeft}`;
    if (memo.has(key)) {
      stats.massMemoHits += 1;
      return memo.get(key);
    }
    stats.massStates += 1;
    if (stats.massStates > maxStates) {
      throw new Error(`tail bound exceeded mass-state cap ${maxStates}; no bound produced`);
    }
    let best = 0;
    for (let length = minChain; length <= capacity; length += 1) {
      const nextCursor = cursor + length - 1;
      if (nextCursor > spawnValues.length) break;
      stats.massTransitions += 1;
      const spawnedMass = prefix[nextCursor] - prefix[cursor];
      const future = solve(mass + spawnedMass, nextCursor, movesLeft - 1);
      best = Math.max(best, Math.floor(mass * chainMultiplier(length)) + future);
    }
    memo.set(key, best);
    return best;
  }
  return solve;
}

// Admissibility argument:
// 1. Every physical chain removes one multiset accepted by
//    enumerateRelaxedActions, which retains the shipped equal-or-double rule.
// 2. The relaxed transition creates the same sum survivor and consumes the
//    same L-1 frozen values, but forgets geometry. Therefore it contains every
//    physical successor.
// 3. After compatibilityDepth complete layers, the mass/cursor relaxation
//    contains every continuation. Taking maxima composes these supersets.
// A cap throws before a result exists; callers may never prune on that error.
function solveValueCompatibleTailBound({
  state,
  spawnValues,
  cursor = 0,
  compatibilityDepth = 1,
  maxValueStates = 100000,
  maxMassStates = 100000,
}) {
  if (!Number.isInteger(compatibilityDepth) || compatibilityDepth < 0) {
    throw new Error('compatibilityDepth must be a non-negative integer');
  }
  const remainingMoves = Math.max(0, state.maxMoves - state.moves);
  const capacity = state.gridWidth * state.gridHeight;
  const initialCounts = countsFromState(state);
  const stats = {
    valueStates: 0,
    valueMemoHits: 0,
    valueActions: 0,
    massStates: 0,
    massMemoHits: 0,
    massTransitions: 0,
  };
  const massTail = makeMassTail({
    spawnValues,
    minChain: state.minChain,
    capacity,
    maxStates: maxMassStates,
    stats,
  });
  const memo = new Map();

  function solve(counts, currentCursor, movesLeft, depthLeft) {
    if (movesLeft <= 0) return 0;
    const mass = [...counts.entries()].reduce((sum, [value, count]) => sum + value * count, 0);
    if (depthLeft === 0) return massTail(mass, currentCursor, movesLeft);
    const key = `${movesLeft}|${depthLeft}|${currentCursor}|${countKey(counts)}`;
    if (memo.has(key)) {
      stats.valueMemoHits += 1;
      return memo.get(key);
    }
    stats.valueStates += 1;
    if (stats.valueStates > maxValueStates) {
      throw new Error(`tail bound exceeded value-state cap ${maxValueStates}; no bound produced`);
    }
    const actions = enumerateRelaxedActions(counts, state.minChain);
    stats.valueActions += actions.length;
    let best = 0;
    for (const action of actions) {
      const next = applyRelaxedAction(counts, action, spawnValues, currentCursor);
      best = Math.max(
        best,
        action.points + solve(next.counts, next.cursor, movesLeft - 1, depthLeft - 1),
      );
    }
    memo.set(key, best);
    return best;
  }

  const score = solve(initialCounts, cursor, remainingMoves, Math.min(compatibilityDepth, remainingMoves));
  return {
    kind: 'certified-value-compatible-prefix-plus-mass-tail',
    complete: true,
    score,
    remainingMoves,
    compatibilityDepth: Math.min(compatibilityDepth, remainingMoves),
    assumptions: [
      'blocker-free physical state with the shipped equal-or-double chain rule',
      'complete enumeration of compatible value multisets for the declared prefix depth',
      'exact sum survivor and L-1 frozen spawn consumption in every compatible layer',
      'complete mass/cursor outer relaxation after the compatible prefix',
      'resource caps fail closed and never return a pruning value',
    ],
    finiteBound: { maxValueStates, maxMassStates },
    stats,
  };
}

function chainKey(chain) {
  const final = chain[chain.length - 1];
  const removed = chain.slice(0, -1)
    .map((tile) => `${tile.x},${tile.y}`)
    .sort()
    .join('|');
  return `${final.x},${final.y};${removed}`;
}

function coordinateChainKey(coordinates) {
  const final = coordinates[coordinates.length - 1];
  const removed = coordinates.slice(0, -1)
    .map(([x, y]) => `${x},${y}`)
    .sort()
    .join('|');
  return `${final[0]},${final[1]};${removed}`;
}

// With maxExpandedPerNode=Infinity and maxNodes=Infinity this is a complete
// exact physical target search. Finite values create an explicit auditable
// frontier: every enumerated but unexpanded direct branch is counted.
function searchPhysicalTarget({
  state,
  spawnValues,
  cursor = 0,
  target = state.targetScore,
  compatibilityDepth = 1,
  maxNodes = Infinity,
  maxExpandedPerNode = Infinity,
  preferredWitness = [],
  maxValueStates = 100000,
  maxMassStates = 100000,
  replayLevel = null,
  seed = 0,
}) {
  const stats = {
    searchedNodes: 0,
    generatedActions: 0,
    expandedBranches: 0,
    prunedBranches: 0,
    unexpandedBranches: 0,
    terminalBranches: 0,
    boundUnavailable: 0,
    actionEnumerationFailures: 0,
    unknownFrontierNodes: 0,
    guideMatches: 0,
  };
  const pruneReceipts = [];
  const tailAssessments = [];
  let halted = false;
  let witness = null;
  let replay = null;
  let winningScore = null;
  let bestObservedScore = state.score;
  let omittedBranches = false;

  function visit(current, currentCursor, actionsTaken) {
    if (witness || halted) return;
    if (current.score > bestObservedScore) bestObservedScore = current.score;
    if (current.score >= target) {
      witness = actionsTaken;
      winningScore = current.score;
      return;
    }
    if (current.moves >= current.maxMoves) {
      stats.terminalBranches += 1;
      return;
    }
    if (stats.searchedNodes >= maxNodes) {
      halted = true;
      return;
    }
    stats.searchedNodes += 1;

    let tail = null;
    try {
      tail = solveValueCompatibleTailBound({
        state: current,
        spawnValues,
        cursor: currentCursor,
        compatibilityDepth,
        maxValueStates,
        maxMassStates,
      });
    } catch (error) {
      stats.boundUnavailable += 1;
    }
    const remainingTarget = target - current.score;
    if (tail && tail.complete) {
      tailAssessments.push({
        depth: current.moves,
        score: current.score,
        remainingTarget,
        tailUpperBound: tail.score,
        strictPruneEligible: tail.score < remainingTarget,
        compatibilityDepth: tail.compatibilityDepth,
        stats: tail.stats,
      });
    }
    if (tail && tail.complete && tail.score < remainingTarget) {
      stats.prunedBranches += 1;
      pruneReceipts.push({
        depth: current.moves,
        score: current.score,
        remainingTarget,
        tailUpperBound: tail.score,
        strict: tail.score < remainingTarget,
        boundKind: tail.kind,
        compatibilityDepth: tail.compatibilityDepth,
      });
      return;
    }

    let actions;
    try {
      actions = enumerateLegalChains(current);
    } catch (error) {
      stats.actionEnumerationFailures += 1;
      stats.unknownFrontierNodes += 1;
      halted = true;
      return;
    }
    stats.generatedActions += actions.length;
    if (actions.length === 0) {
      stats.terminalBranches += 1;
      return;
    }

    if (preferredWitness[current.moves]) {
      const wanted = coordinateChainKey(preferredWitness[current.moves]);
      const preferredIndex = actions.findIndex((chain) => chainKey(chain) === wanted);
      if (preferredIndex >= 0) {
        const first = actions[0];
        actions[0] = actions[preferredIndex];
        actions[preferredIndex] = first;
        stats.guideMatches += 1;
      }
    }

    const expansionCount = Math.min(actions.length, maxExpandedPerNode);
    if (expansionCount < actions.length) {
      stats.unexpandedBranches += actions.length - expansionCount;
      omittedBranches = true;
    }
    for (let index = 0; index < expansionCount; index += 1) {
      if (stats.searchedNodes >= maxNodes && index > 0) {
        stats.unexpandedBranches += expansionCount - index;
        omittedBranches = true;
        halted = true;
        break;
      }
      const chain = actions[index];
      const transition = applyFrozenChain(current, chain, spawnValues, currentCursor);
      stats.expandedBranches += 1;
      visit(
        transition.state,
        transition.cursor,
        [...actionsTaken, chain.map((tile) => [tile.x, tile.y])],
      );
      if (witness || halted) {
        if (index + 1 < expansionCount) {
          stats.unexpandedBranches += expansionCount - index - 1;
          omittedBranches = true;
        }
        break;
      }
    }
  }

  visit(state, cursor, []);
  if (witness && replayLevel) {
    // Independent concrete replay is the only path to SAT.
    replay = replayFrozenWitness({
      level: replayLevel,
      seed,
      witness,
    });
    if (!replay.reachesTarget || replay.score !== winningScore) {
      throw new Error('SAT witness failed independent frozen replay');
    }
  }

  const complete = !witness && !halted && !omittedBranches;
  return {
    verdict: witness ? 'SAT' : complete ? 'UNSAT' : 'NON_DECISIVE',
    complete,
    scoreClaim: witness ? winningScore : null,
    bestObservedScore,
    witness,
    replay,
    stats,
    pruneReceipts,
    tailAssessments,
  };
}

function assertAdmissibleTail(exactScore, candidateBound) {
  if (!(candidateBound >= exactScore)) {
    throw new Error(`inadmissible tail bound ${candidateBound} below exact ${exactScore}`);
  }
}

module.exports = {
  countsFromState,
  solveValueCompatibleTailBound,
  searchPhysicalTarget,
  assertAdmissibleTail,
};
