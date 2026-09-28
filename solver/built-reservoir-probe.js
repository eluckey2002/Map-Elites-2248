const {
  cloneState,
  findBestChain,
  isBlockedTile,
} = require('./engine');

const INITIAL_MAX_MULTIPLIER = 16;
const MAX_BUILT_TILES = 12;

// Diagnostic only. A "built" tile is one whose value is above the largest
// value the initial-board generator can deal. The proxy asks how much score is
// available right now from an exact legal chain made entirely from such tiles.
// It deliberately does not estimate future construction, bridge tiles, target
// distance, or when the reservoir should be harvested.
function normalizedBuiltReservoirHarvest(state) {
  const scale = state.tileScale || 1;
  if (!Number.isSafeInteger(scale) || scale <= 0) {
    throw new TypeError('tileScale must be a positive safe integer');
  }

  const filtered = cloneState(state);
  const cutoff = INITIAL_MAX_MULTIPLIER * scale;
  let builtTileCount = 0;

  for (let y = 0; y < filtered.gridHeight; y++) {
    for (let x = 0; x < filtered.gridWidth; x++) {
      const tile = filtered.grid[y][x];
      if (!tile || isBlockedTile(tile) || tile.value <= cutoff) {
        filtered.grid[y][x] = null;
        continue;
      }
      builtTileCount += 1;
    }
  }

  if (builtTileCount > MAX_BUILT_TILES) {
    return {
      status: 'UNMEASURED',
      reason: `built tile count ${builtTileCount} exceeds exact-search cap ${MAX_BUILT_TILES}`,
      builtTileCount,
      maxBuiltTiles: MAX_BUILT_TILES,
    };
  }

  const best = findBestChain(filtered);
  return {
    status: 'MEASURED',
    normalizedPoints: best ? best.points / scale : 0,
    rawPoints: best ? best.points : 0,
    chainLength: best ? best.chain.length : 0,
    builtTileCount,
    maxBuiltTiles: MAX_BUILT_TILES,
  };
}

module.exports = {
  INITIAL_MAX_MULTIPLIER,
  MAX_BUILT_TILES,
  normalizedBuiltReservoirHarvest,
};
