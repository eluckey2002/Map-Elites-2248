// PROTOTYPE — not shipped level content.
//
// Question: can a reachable bomb followed by an ice-gated bomb make the
// player's priority change twice before the board settles into score play?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5908;
const SEED = 27;

function buildLevel() {
  const shape = {
    schemaVersion: 1,
    name: 'sequential-defusal-relay',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 5,
    gridH: 7,
    blockers: [
      { type: 'bomb', x: 0, y: 6, timer: 3 },
      { type: 'stone', x: 3, y: 5 },
      { type: 'stone', x: 3, y: 6 },
      { type: 'ice', x: 4, y: 5, duration: 3 },
      { type: 'bomb', x: 4, y: 6, timer: 6 },
    ],
  };

  return validateCandidate({
    ...shape,
    target: 50000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
