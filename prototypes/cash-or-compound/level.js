// PROTOTYPE — not shipped level content.
//
// Question: can an open board make a voluntary smaller move pay off through a
// later chain of several tiles the player deliberately built?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5910;
const SEED = 5;

function buildLevel() {
  const shape = {
    schemaVersion: 1,
    name: 'cash-or-compound',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 16,
    minChain: 3,
    gridW: 5,
    gridH: 5,
    blockers: [],
  };
  return validateCandidate({
    ...shape,
    target: 59000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
