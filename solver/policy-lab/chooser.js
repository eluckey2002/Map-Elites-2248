'use strict';

const { findGreedyChains, findBestChain, cloneState, executeChain, applyGravity, spawnNewTiles,
  checkBombs, isBlockedTile, isMergeableSum, makeRng } = require('../engine');
const { DEFAULT_PARAMS, chooseMove, chooseBaseMove, analyzeMove, harvestValue } = require('../bot');

function offLatticeCount(state) {
  return state.grid.flat().filter(t => t && t.blocker !== 'stone' && !isMergeableSum(t.value, state.tileScale || 1)).length;
}

function buildPotential(state) {
  const built = state.grid.flat().filter(t => t && !isBlockedTile(t) && t.value > 8 * (state.tileScale || 1));
  let value = 0;
  for (const a of built) for (const b of built) {
    if (a === b) continue;
    const ratio = b.value / a.value;
    const weight = ratio === 1 ? 1 : ratio === 0.5 ? 0.7 : ratio === 2 ? 0.4 : 0;
    const distance = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
    value += a.value * weight / (1 + distance);
  }
  return value;
}

function candidates(state, p, price) {
  const trimmed = findGreedyChains(state, { limit: p.width, tieBreak: p.tieBreak, pathWidth: p.pathWidth });
  if (price <= 0) return trimmed;
  const key = c => { const t = c.chain.at(-1); return `${t.x},${t.y},${c.chain.length},${c.points}`; };
  const seen = new Set(trimmed.map(key));
  const all = [...trimmed];
  for (const c of findGreedyChains(state, { limit: p.width, tieBreak: p.tieBreak, pathWidth: p.pathWidth, preferMergeableSum: false })) {
    if (!seen.has(key(c))) { seen.add(key(c)); all.push(c); }
  }
  return all;
}

function chooseLab(state, options, configuration = {}) {
  const p = { ...DEFAULT_PARAMS, ...configuration.params };
  const weights = { urgency: 0, build: 0, occupancy: 0, samples: 1, ...configuration.weights };
  if (![1, 3, 4].includes(weights.samples)) throw new Error('lookahead samples must be 1, 3 or 4');
  const bombs = state.grid.flat().filter(t => t?.blocker === 'bomb').sort((a, b) => a.bombTimer - b.bombTimer);
  let best = null;
  for (const bomb of bombs) {
    const found = findBestChain(state, { mustEndAt: bomb, maxLength: p.bombMax });
    if (found) { best = found.chain; break; }
  }
  if (!best) {
    const pool = candidates(state, p, weights.occupancy);
    if (!pool.length) return null;
    best = pool[0].chain;
    if (options.lookaheadRngFactory && pool.length > 1) {
      let bestScore = -Infinity;
      const occupancyBefore = weights.occupancy ? offLatticeCount(state) : 0;
      const needed = Math.max(1, state.targetScore - state.score);
      const healthRatio = Math.max(0, Math.min(2, (state.maxMoves - state.moves) * (state.targetScore / state.maxMoves) / needed));
      for (const c of pool) {
        let roll = 0, place = 0, harvest = 0, potential = 0, delta = 0;
        for (let sample = 0; sample < weights.samples; sample++) {
          const sim = cloneState(state);
          const mapped = c.chain.map(t => sim.grid[t.y][t.x]);
          const survivor = mapped.at(-1);
          executeChain(sim, mapped); applyGravity(sim);
          const rng = sample === 0 ? options.lookaheadRngFactory() : makeRng(options.lookaheadBase + options.moveIndex + sample * 1000003);
          spawnNewTiles(sim, rng);
          if (!checkBombs(sim)) {
            const next = findGreedyChains(sim, { limit: 1, tieBreak: p.tieBreak, pathWidth: p.pathWidth })[0];
            const attached = findBestChain(sim, { mustStartAt: survivor, maxLength: sim.minChain });
            roll += next ? next.points : 0;
            place += attached ? attached.points : 0;
          }
          harvest += harvestValue(sim, survivor);
          if (weights.build) potential += buildPotential(sim);
          if (weights.occupancy) delta += offLatticeCount(sim) - occupancyBefore;
        }
        const forecasts = p.wRoll * roll / weights.samples + p.wPlace * place / weights.samples
          + p.turnover * (state.tileScale || 1) * (c.chain.length - 1) + p.wHarvest * harvest / weights.samples;
        // The base expression retains the champion's addition order at zero weight.
        const base = c.points + p.wRoll * roll / weights.samples + p.wPlace * place / weights.samples
          + p.turnover * (state.tileScale || 1) * (c.chain.length - 1) + p.wHarvest * harvest / weights.samples;
        const total = base + weights.urgency * (healthRatio - 1) * forecasts
          + weights.build * potential / weights.samples
          - weights.occupancy * (state.tileScale || 1) * delta / weights.samples;
        if (total > bestScore) { bestScore = total; best = c.chain; }
      }
    }
  }
  // Preserve the champion's exact immediate-finish override, including bomb exclusion.
  if (Number.isFinite(state.targetScore) && state.score < state.targetScore && !bombs.length) {
    const winner = findGreedyChains(state, { limit: p.width, tieBreak: p.tieBreak, pathWidth: p.pathWidth, preferMergeableSum: false })
      .find(c => state.score + c.points >= state.targetScore);
    if (winner) return winner.chain;
  }
  return best;
}

function chooserFor(policy) {
  if (policy.kind === 'champion' || policy.kind === 'zero') return chooseMove;
  if (policy.kind === 'base') return chooseBaseMove;
  if (policy.kind === 'variant') return (s, o) => chooseMove(s, { ...o, params: policy.params });
  if (policy.kind === 'handicap') return (s, o) => {
    const a = analyzeMove(s, o);
    if ((o.moveIndex + 1) % policy.every || a.reason === 'bomb-priority' || a.candidates.length < 2) return chooseMove(s, o);
    const ranked = [...a.candidates].sort((x, y) => y.policyScore - x.policyScore);
    return ranked[1].chain.map(t => s.grid[t.y][t.x]);
  };
  if (policy.kind === 'lab') return (s, o) => chooseLab(s, o, policy);
  throw new Error(`unknown policy kind ${policy.kind}`);
}
module.exports = { chooseLab, chooserFor, offLatticeCount, buildPotential };
