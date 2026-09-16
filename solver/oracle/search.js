const { performance } = require('node:perf_hooks');
const { chooseMove } = require('../bot');
const { makeRng, buildGreedyChain, findGreedyChains, chainMultiplier, isMergeableSum, isBlockedTile } = require('../engine');
const { createPuzzle, transition, stateKey, witness } = require('./simulation');

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

function potential(state) {
  const counts = new Map();
  for (const tile of state.grid.flat()) {
    if (tile && !isBlockedTile(tile)) counts.set(tile.value, (counts.get(tile.value) || 0) + 1);
  }
  let result = 0;
  for (const [value, count] of counts) {
    // An estimate used only to order a bounded beam, never a proof bound.
    if (count > 1 || counts.has(value / 2) || counts.has(value * 2)) result += value * count;
  }
  return result;
}

function retainBeam(nodes, width, weight) {
  const all = [...nodes.values()];
  const scoreOrder = (a, b) => b.state.score - a.state.score;
  const result = all.slice().sort(scoreOrder).slice(0, Math.ceil(width / 3));
  const kept = new Set(result);
  for (const node of all) node.rank = node.state.score + weight * potential(node.state);
  all.sort((a, b) => b.rank - a.rank || scoreOrder(a, b));
  for (const node of all) {
    if (result.length >= width) break;
    if (!kept.has(node)) { result.push(node); kept.add(node); }
  }
  return result;
}

function search({ level, seed, budgetMs = 30000 }, onProgress = () => {}) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > 30000) throw new Error('budgetMs must be in (0, 30000]');
  const started = performance.now();
  // Reserve time to serialize the final result. The CLI also enforces a process deadline.
  const deadline = started + Math.max(0, budgetMs - 50);
  const root = createPuzzle(level, seed);
  const stats = { expandedStates: 0, generatedActions: 0, completedPasses: 0 };
  let baseline = null;
  let best = null;
  const elapsed = () => performance.now() - started;
  function publish(reason) {
    onProgress({ baseline, best, searchMs: elapsed(), terminationReason: reason, stats: { ...stats } });
  }
  let node = root;
  while (!node.terminal && performance.now() < deadline) {
    const chain = chooseMove(node.state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + node.state.moves) });
    if (!chain || performance.now() >= deadline) break;
    node = transition(node, chain, root.draws);
  }
  if (node.terminal) {
    baseline = { ...witness(node), outcome: node.terminal };
    if (node.terminal === 'win') best = baseline;
    publish('baseline');
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
          stats.expandedStates++;
          for (const action of candidates(current.state, 48, variant)) {
            if (performance.now() >= deadline) break;
            stats.generatedActions++;
            const successor = transition(current, action.chain, root.draws);
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
        if (performance.now() >= deadline || next.size === 0) break;
        frontier = retainBeam(next, width, variant ? 4 : 1);
      }
      if (performance.now() < deadline) stats.completedPasses++;
    }
  }
  const result = {
    baseline, best, searchMs: elapsed(), stats,
    terminationReason: performance.now() >= deadline ? 'time-budget' : 'portfolio-complete',
    standing: best ? 'best-known' : 'UNKNOWN',
  };
  onProgress(result);
  return result;
}

module.exports = { candidates, search };
