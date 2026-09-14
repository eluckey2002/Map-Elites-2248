// THROWAWAY PROTOTYPE — not shipped level content.

const { identity, validateCandidate } = require('../../solver/level-author');

const SEED = 83;

function buildShape() {
  return {
    schemaVersion: 1,
    name: 'three-forge-docks',
    level: 5911,
    demand: 1,
    demandStatus: 'provisional-proposal',
    target: 55000,
    tileScale: 32,
    moves: 12,
    minChain: 3,
    gridW: 5,
    gridH: 6,
    blockers: [
      { type: 'stone', x: 1, y: 5 },
      { type: 'stone', x: 3, y: 5 },
    ],
  };
}

function buildLevel() {
  const shape = buildShape();
  return validateCandidate({
    ...shape,
    sourceShapeIdentity: identity({
      schemaVersion: shape.schemaVersion,
      name: shape.name,
      level: shape.level,
      demand: shape.demand,
      demandStatus: shape.demandStatus,
      moves: shape.moves,
      minChain: shape.minChain,
      gridW: shape.gridW,
      gridH: shape.gridH,
      blockers: shape.blockers,
    }),
  });
}

module.exports = { SEED, buildLevel };
