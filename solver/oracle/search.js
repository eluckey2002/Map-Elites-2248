const { performance } = require('node:perf_hooks');
const assert = require('node:assert/strict');
const { chooseMove } = require('../bot');
const { valueIdentity } = require('../benchmark-inputs');
const { makeRng, cloneState, buildGreedyChain, findGreedyChains, chainMultiplier, isMergeableSum, isBlockedTile } = require('../engine');
const { boardSnapshot, createPuzzle, sourcePuzzleIdentity, transition, stateKey, witness } = require('./simulation');
const { RANKERS } = require('./rankers');

const LOOKAHEAD_BASE = 987654321;

// Bounded physical actions: retain prefixes and survivor locations, including
// off-lattice sums. Equal immediate scores are not equivalent board actions.
function candidates(state, limit = 48, variant = 0) {
  const actions = new Map();
  const paths = variant >= 2
    ? findGreedyChains(state, { pathWidth: 8, tieBreak: 'degree', preferMergeableSum: false })
    : state.grid.flat().filter(tile => tile && !isBlockedTile(tile))
      .map(tile => buildGreedyChain(state, tile, { tieBreak: variant % 2 ? 'none' : 'degree' })).filter(Boolean);
  for (const found of paths) {
    let sum = 0;
    const selected = [];
    for (const next of found.chain) {
      sum += next.value;
      selected.push(next.y * state.gridWidth + next.x);
      if (selected.length < state.minChain) continue;
      const chain = found.chain.slice(0, selected.length);
      const key = `${selected[selected.length - 1]}:${selected.slice().sort((a, b) => a - b)}`;
      if (!actions.has(key)) actions.set(key, {
        chain, points: Math.floor(sum * chainMultiplier(chain.length)), sum,
        mergeable: isMergeableSum(sum, state.tileScale), key,
      });
    }
  }
  const all = [...actions.values()];
  const scoreOrder = (a, b) => b.points - a.points || a.key.localeCompare(b.key);
  const pools = [
    all.slice().sort(scoreOrder),
    all.filter(a => a.mergeable).sort(scoreOrder),
    all.slice().sort((a, b) => a.chain.length - b.chain.length || scoreOrder(a, b)),
  ];
  const kept = new Map();
  for (let i = 0; kept.size < limit; i++) {
    let any = false;
    for (const pool of pools) {
      if (!pool[i]) continue;
      any = true;
      if (kept.size < limit) kept.set(pool[i].key, pool[i]);
    }
    if (!any) break;
  }
  return [...kept.values()];
}

function retainBeam(nodes, width, weight, rankStateFn = RANKERS.harvesting) {
  const all = [...nodes.values()];
  const scoreOrder = (a, b) => b.state.score - a.state.score;
  const result = all.slice().sort(scoreOrder).slice(0, Math.ceil(width / 3));
  const kept = new Set(result);
  for (const node of all) node.rank = rankStateFn(node.state, { potentialWeight: weight });
  all.sort((a, b) => b.rank - a.rank || scoreOrder(a, b));
  for (const node of all) {
    if (result.length >= width) break;
    if (!kept.has(node)) { result.push(node); kept.add(node); }
  }
  return result;
}

function searchFromRoot({
  level, root, draws, budgetMs = 30000, maxExpandedStates = Infinity,
  includeBaseline = true, rankStateFn = RANKERS.harvesting,
}, onProgress = () => {}) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > 30000) throw new Error('budgetMs must be in (0, 30000]');
  if (maxExpandedStates !== Infinity && (!Number.isInteger(maxExpandedStates) || maxExpandedStates < 1)) {
    throw new Error('maxExpandedStates must be a positive integer or Infinity');
  }
  const started = performance.now();
  // Reserve time to serialize the final result. The CLI also enforces a process deadline.
  const deadline = started + Math.max(0, budgetMs - 50);
  const stats = { expandedStates: 0, generatedActions: 0, completedPasses: 0 };
  let baseline = null;
  let best = null;
  const elapsed = () => performance.now() - started;
  function publish(reason) {
    onProgress({ baseline, best, searchMs: elapsed(), terminationReason: reason, stats: { ...stats } });
  }
  if (includeBaseline) {
    let node = root;
    while (!node.terminal && performance.now() < deadline) {
      const chain = chooseMove(node.state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + node.state.moves) });
      if (!chain || performance.now() >= deadline) break;
      node = transition(node, chain, draws);
    }
    if (node.terminal) {
      baseline = { ...witness(node), outcome: node.terminal };
      if (node.terminal === 'win') best = baseline;
      publish('baseline');
    }
  }

  // Progressive widths reuse the same seeded game. Each pass remains bounded;
  // no result of these passes establishes absence of a better solution.
  for (const width of [16, 48, 128, 256]) {
    for (const variant of [0, 1, 2]) {
      if (performance.now() >= deadline) break;
      let frontier = [root];
      for (let depth = 0; depth < (best ? best.movesUsed - 1 : level.moves); depth++) {
        const next = new Map();
        for (const current of frontier) {
          if (performance.now() >= deadline) break;
          if (stats.expandedStates >= maxExpandedStates) break;
          stats.expandedStates++;
          for (const action of candidates(current.state, 48, variant)) {
            if (performance.now() >= deadline) break;
            stats.generatedActions++;
            const successor = transition(current, action.chain, draws);
            if (successor.terminal === 'win') {
              if (!best || successor.state.moves < best.movesUsed) {
                best = { ...witness(successor), outcome: 'win' };
                publish('improved');
              }
              continue;
            }
            if (successor.terminal) continue;
            const key = stateKey(successor);
            const previous = next.get(key);
            if (!previous || previous.state.score < successor.state.score) next.set(key, successor);
          }
        }
        if (performance.now() >= deadline || stats.expandedStates >= maxExpandedStates || next.size === 0) break;
        frontier = retainBeam(next, width, variant ? 4 : 1, rankStateFn);
      }
      if (performance.now() < deadline) stats.completedPasses++;
    }
  }
  const result = {
    baseline, best, searchMs: elapsed(), stats,
    terminationReason: performance.now() >= deadline ? 'time-budget'
      : stats.expandedStates >= maxExpandedStates ? 'work-budget' : 'portfolio-complete',
    standing: best ? 'best-known' : 'UNKNOWN',
  };
  onProgress(result);
  return result;
}

function search({ level, seed, ...options }, onProgress = () => {}) {
  const root = createPuzzle(level, seed);
  return searchFromRoot({ level, root, draws: root.draws, ...options }, onProgress);
}

function searchFromVerifiedRoot({ level, seed, verifiedRoot, ...options }, onProgress = () => {}) {
  assert.ok(verifiedRoot && verifiedRoot.successor && verifiedRoot.record, 'verified root is required');
  const { recordIdentity, ...recordBody } = verifiedRoot.record;
  assert.equal(valueIdentity(recordBody), recordIdentity, 'verified root record identity mismatch');
  assert.equal(
    verifiedRoot.record.sourcePuzzleIdentity,
    sourcePuzzleIdentity(level, seed),
    'source-puzzle identity mismatch',
  );
  assert.deepEqual(
    boardSnapshot(verifiedRoot.successor.state),
    verifiedRoot.record.board,
    'board mismatch',
  );
  assert.equal(verifiedRoot.successor.cursor, verifiedRoot.record.drawCursor, 'draw cursor mismatch');
  assert.equal(verifiedRoot.successor.state.score, verifiedRoot.record.score, 'score mismatch');
  assert.equal(verifiedRoot.successor.state.moves, verifiedRoot.record.moves, 'move count mismatch');

  const initial = createPuzzle(level, seed);
  let canonical = initial;
  for (const action of verifiedRoot.record.prefixChains) {
    const chain = action.tiles.map(({ x, y }) => canonical.state.grid[y][x]);
    canonical = transition(canonical, chain, initial.draws);
  }
  assert.deepEqual(boardSnapshot(canonical.state), verifiedRoot.record.board, 'verified root record board mismatch');
  assert.equal(canonical.cursor, verifiedRoot.record.drawCursor, 'verified root record draw cursor mismatch');
  assert.equal(canonical.state.score, verifiedRoot.record.score, 'verified root record score mismatch');
  assert.deepEqual(verifiedRoot.successor.state, canonical.state, 'successor state mismatch');

  const root = {
    ...canonical,
    state: cloneState(canonical.state),
    cursor: canonical.cursor,
  };
  return searchFromRoot({ level, root, draws: initial.draws, ...options }, onProgress);
}

function searchPortfolio(options, onProgress = () => {}, {
  searchFn = search,
  verifyWitnessFn = require('./verify').verifyWitness,
} = {}) {
  const arms = {};
  let selectedArm = null;
  let best = null;
  for (const [name, rankStateFn] of Object.entries(RANKERS)) {
    const result = searchFn(
      { ...options, rankStateFn },
      progress => onProgress({ arm: name, progress }),
    );
    if (!result.best) {
      arms[name] = result;
      continue;
    }
    try {
      const replay = verifyWitnessFn({ level: options.level, seed: options.seed }, result.best);
      if (replay.outcome !== 'win') throw new Error('portfolio witness must replay to a win');
      arms[name] = { ...result, verification: 'valid' };
      if (!best || result.best.movesUsed < best.movesUsed) {
        best = result.best;
        selectedArm = name;
      }
    } catch (error) {
      arms[name] = {
        ...result,
        best: null,
        standing: 'INVALID',
        verificationError: error.message,
      };
    }
  }
  return {
    arms,
    best,
    selectedArm,
    standing: best ? 'best-known' : 'UNKNOWN',
  };
}

module.exports = { candidates, search, searchFromVerifiedRoot, searchPortfolio };
