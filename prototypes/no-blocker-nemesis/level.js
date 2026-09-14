// PROTOTYPE — not shipped level content.
//
// Question: can an exact seed create a legible setup puzzle and a meaningful
// beat-the-bot challenge on a fully open board?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5907;
const SEED = 3190;

function buildLevel() {
  const shape = {
    schemaVersion: 1,
    name: 'no-blocker-nemesis-sparse-opening',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 6,
    gridH: 5,
    blockers: [],
  };

  return validateCandidate({
    ...shape,
    target: 90000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
