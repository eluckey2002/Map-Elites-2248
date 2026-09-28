const path = require('path');
// Levels 55-58 recompute with frozen calib-1.
// Usage: node recompute-levels-55-58.js <checkout of main at fee0858 or later>
const ROOT = require('path').resolve(process.argv[2]);
const { deriveCandidate } = require(path.join(ROOT, 'solver/level-author.js'));

// Shapes and shipped targets come from src/game.js; only the demand values
// are taken from each level's src/game.js comment (they are not stored in the
// level object).
const { LEVELS } = require(path.join(ROOT, 'src/game'));
const DEMAND = { 55: 0.80, 56: 0.90, 57: 0.85, 58: 0.85 };
const shipped = {};
const shapes = Object.keys(DEMAND).map(Number).map((level) => {
  const def = LEVELS.find((l) => l.level === level);
  shipped[level] = def.target;
  return {
    schemaVersion: 1, name: `ck12-level-${level}`, level, demand: DEMAND[level],
    demandStatus: 'provisional-proposal', moves: def.moves, minChain: def.minChain,
    gridW: def.gridW, gridH: def.gridH, blockers: def.blockers.map((b) => ({ ...b })),
  };
});

for (const shape of shapes) {
  const { receipt } = deriveCandidate(shape);
  const target = receipt.targetDerivation.roundedTarget;
  console.log(JSON.stringify({
    level: shape.level,
    measuredMedian: receipt.targetDerivation.measuredMedian,
    demand: shape.demand,
    recomputedTarget: target,
    shippedTarget: shipped[shape.level],
    match: target === shipped[shape.level],
  }));
}
