// PROTOTYPE — not shipped level content.

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5912;
const SEED = 5;

function buildLevel() {
  const shape = {
    schemaVersion: 1,
    name: 'forge-contracts',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 5,
    gridH: 5,
    blockers: [],
  };
  return validateCandidate({
    ...shape,
    target: 69000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
