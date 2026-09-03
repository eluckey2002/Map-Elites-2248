// Frozen port of the hand-made policy authored in me-oe at commit 7f71705.
// Original source SHA-256:
// 19ed34fac5d1b6af0287c7ca0cbc3fc4a388e8e5b5b6d5bade6b7279af635c9b
//
// The only source-level adaptation is dependency resolution into this repo and
// fixing the tested configuration as constants. The selection algorithm is the
// same: bomb-bearing states defer to the reference policy first; otherwise it
// takes an immediate target finish, then exact sums from 64x scale downward,
// with pre-gravity big-neighbour count ahead of chain length.

const E = require('../../solver/engine');
const REF = require('../../solver/bot');

const TOP_MULT = 64;
const NODE_BUDGET = 150000;
const BIG_MULT = 32;
const DEFAULT_PARAMS = REF.DEFAULT_PARAMS;

function hasBomb(state) {
  return state.grid.some((row) => row.some((tile) => tile && tile.blocker === 'bomb'));
}

function neighbors(state, tile) {
  const out = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (!dx && !dy) continue;
      const row = state.grid[tile.y + dy];
      const neighbor = row && row[tile.x + dx];
      if (neighbor && !E.isBlockedTile(neighbor)) out.push(neighbor);
    }
  }
  return out;
}

function bigNeighbours(state, tile, chainSet, bigValue) {
  let count = 0;
  for (const neighbor of neighbors(state, tile)) {
    if (neighbor.value >= bigValue && !chainSet.has(`${neighbor.x},${neighbor.y}`)) count += 1;
  }
  return count;
}

function longestChainSumming(state, target, minChain) {
  const bigValue = BIG_MULT * (state.tileScale || 1);
  let best = null;
  let bestKey = -1;
  let nodes = 0;
  const used = new Set();
  const chain = [];

  function dfs(sum) {
    if (nodes++ > NODE_BUDGET) return;
    if (sum === target && chain.length >= minChain) {
      const key = bigNeighbours(state, chain[chain.length - 1], used, bigValue) * 1000 + chain.length;
      if (key > bestKey) {
        bestKey = key;
        best = chain.slice();
      }
    }
    if (sum >= target) return;
    const last = chain[chain.length - 1];
    for (const neighbor of neighbors(state, last)) {
      const identity = `${neighbor.x},${neighbor.y}`;
      if (used.has(identity) || sum + neighbor.value > target) continue;
      if (!E.canExtendChain(chain, neighbor)) continue;
      used.add(identity);
      chain.push(neighbor);
      dfs(sum + neighbor.value);
      chain.pop();
      used.delete(identity);
      if (nodes > NODE_BUDGET) return;
    }
  }

  for (const row of state.grid) {
    for (const tile of row) {
      if (!tile || E.isBlockedTile(tile) || tile.value > target) continue;
      used.clear();
      chain.length = 0;
      used.add(`${tile.x},${tile.y}`);
      chain.push(tile);
      dfs(tile.value);
      if (nodes > NODE_BUDGET) break;
    }
  }
  return best;
}

function chooseMove(state, options = {}) {
  const params = { ...DEFAULT_PARAMS, ...(options.params || {}) };
  if (hasBomb(state)) return REF.chooseMove(state, options);

  const remaining = (Number.isFinite(state.targetScore) ? state.targetScore : Infinity) - state.score;
  const untrimmed = E.findGreedyChains(state, {
    limit: params.width,
    tieBreak: params.tieBreak,
    pathWidth: params.pathWidth,
    preferMergeableSum: false,
  });
  const winning = untrimmed
    .filter((candidate) => candidate.points >= remaining)
    .sort((left, right) => right.points - left.points);
  if (winning.length) return winning[0].chain;

  const scale = state.tileScale || 1;
  const minChain = state.minChain || 2;
  for (let mult = TOP_MULT; mult >= 2; mult /= 2) {
    const chain = longestChainSumming(state, scale * mult, minChain);
    if (chain) return chain;
  }
  return REF.chooseMove(state, options);
}

module.exports = {
  BIG_MULT,
  DEFAULT_PARAMS,
  NODE_BUDGET,
  TOP_MULT,
  chooseMove,
};
