// PROTOTYPE — not shipped level content.
//
// Question: does a stone-bounded side bay let the player deliberately park a
// valuable survivor, work elsewhere, and later reconnect it for a payoff?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5906;
const SEED = 447;

function buildLevel() {
  const blockers = [
    { type: 'stone', x: 3, y: 0 },
    { type: 'stone', x: 3, y: 1 },
    { type: 'stone', x: 3, y: 3 },
    { type: 'stone', x: 4, y: 3 },
  ];
  const shape = {
    schemaVersion: 1,
    name: 'builder-pocket-side-bay',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 5,
    gridH: 5,
    blockers,
  };

  return validateCandidate({
    ...shape,
    target: 60000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
