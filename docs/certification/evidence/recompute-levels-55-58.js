const path = require('path');
// Levels 55, 57, 58 recompute with frozen calib-1.
// Usage: node recompute-levels-55-58.js <checkout of main at fee0858 or later>
const ROOT = require('path').resolve(process.argv[2]);
const { deriveCandidate } = require(path.join(ROOT, 'solver/level-author.js'));

const shapes = [
  { schemaVersion: 1, name: 'ck12-level-55', level: 55, demand: 0.80, demandStatus: 'provisional-proposal', moves: 26, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'stone', x: 1, y: 2 }, { type: 'bomb', x: 3, y: 4, timer: 8 }] },
  { schemaVersion: 1, name: 'ck12-level-57', level: 57, demand: 0.85, demandStatus: 'provisional-proposal', moves: 26, minChain: 4, gridW: 5, gridH: 8, blockers: [{ type: 'stone', x: 1, y: 4 }, { type: 'stone', x: 3, y: 4 }, { type: 'ice', x: 2, y: 2, duration: 4 }] },
  { schemaVersion: 1, name: 'ck12-level-58', level: 58, demand: 0.85, demandStatus: 'provisional-proposal', moves: 28, minChain: 4, gridW: 5, gridH: 7, blockers: [{ type: 'bomb', x: 1, y: 2, timer: 7 }, { type: 'bomb', x: 3, y: 5, timer: 9 }] },
];

const shipped = { 55: 122000, 57: 129000, 58: 162000 };

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
