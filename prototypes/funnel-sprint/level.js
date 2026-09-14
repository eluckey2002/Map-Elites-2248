// PROTOTYPE — not shipped level content.
//
// Question: do three narrow feeder lanes and an eight-move budget create a
// distinct routing-and-timing problem rather than ordinary chain hunting?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5905;
const SEED = 403;

function buildLevel() {
  const blockers = [];
  for (const x of [1, 3]) {
    for (let y = 0; y < 3; y++) blockers.push({ type: 'stone', x, y });
  }

  const shape = {
    schemaVersion: 1,
    name: 'funnel-sprint-three-lane',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 8,
    minChain: 3,
    gridW: 5,
    gridH: 5,
    blockers,
  };

  return validateCandidate({
    ...shape,
    target: 22000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
