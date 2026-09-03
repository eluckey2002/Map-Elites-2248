const {
  findBestChain,
  findGreedyChains,
  cloneState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  checkBombs,
} = require('../engine');

const CALIBRATION_VERSION = 'calib-1';
const CALIBRATION_PARAMS = Object.freeze({
  wRoll: 1,
  wPlace: 1,
  turnover: 40,
  width: 24,
  bombMax: 9,
  tieBreak: 'degree',
  wHarvest: 0,
});

function findBombTiles(state) {
  const bombs = [];
  for (let row = 0; row < state.gridHeight; row++) {
    for (let col = 0; col < state.gridWidth; col++) {
      const tile = state.grid[row][col];
      if (tile && tile.blocker === 'bomb') bombs.push(tile);
    }
  }
  return bombs;
}

function mapChainToClone(chain, cloned) {
  return chain.map((tile) => cloned.grid[tile.y][tile.x]);
}

function simulateCandidate(state, candidate, lookaheadRngFactory) {
  const sim = cloneState(state);
  const mappedChain = mapChainToClone(candidate.chain, sim);
  const survivor = mappedChain[mappedChain.length - 1];
  executeChain(sim, mappedChain);
  applyGravity(sim);
  spawnNewTiles(sim, lookaheadRngFactory());
  return { sim, survivor };
}

function rolloutValue(outcome) {
  if (checkBombs(outcome.sim)) return 0;
  const next = findGreedyChains(outcome.sim, { limit: 1 })[0];
  return next ? next.points : 0;
}

function remnantPlacementValueFromOutcome(outcome) {
  if (checkBombs(outcome.sim)) return 0;
  const next = findBestChain(outcome.sim, {
    mustStartAt: outcome.survivor,
    maxLength: outcome.sim.minChain,
  });
  return next ? next.points : 0;
}

function chooseMove(state, options = {}) {
  const { lookaheadRngFactory } = options;
  const { wRoll, wPlace, turnover, width, bombMax, tieBreak } = { ...CALIBRATION_PARAMS };

  const bombs = findBombTiles(state).sort((a, b) => a.bombTimer - b.bombTimer);
  for (const bomb of bombs) {
    const result = findBestChain(state, { mustEndAt: bomb, maxLength: bombMax });
    if (result) return result.chain;
  }

  const candidates = findGreedyChains(state, { limit: width, tieBreak });
  if (candidates.length === 0) return null;
  if (!lookaheadRngFactory || candidates.length === 1) return candidates[0].chain;

  let bestCandidate = candidates[0];
  let bestTotal = -Infinity;
  for (const candidate of candidates) {
    const emptiedCells = candidate.chain.length - 1;
    const outcome = simulateCandidate(state, candidate, lookaheadRngFactory);
    const total = candidate.points
      + wRoll * rolloutValue(outcome)
      + wPlace * remnantPlacementValueFromOutcome(outcome)
      + turnover * (state.tileScale || 1) * emptiedCells;
    if (total > bestTotal) {
      bestTotal = total;
      bestCandidate = candidate;
    }
  }
  return bestCandidate.chain;
}

module.exports = Object.freeze({
  CALIBRATION_VERSION,
  CALIBRATION_PARAMS,
  chooseMove,
});
