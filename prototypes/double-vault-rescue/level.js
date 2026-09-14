// PROTOTYPE — not shipped level content.
//
// Question: if each bomb is a true dead end, does a necessary short defusal
// become a banked survivor the player deliberately returns to later?

const { identity, validateCandidate } = require('../../solver/level-author');

const LEVEL = 5909;
const SEED = 34;

function buildLevel() {
  const shape = {
    schemaVersion: 1,
    name: 'double-vault-rescue',
    level: LEVEL,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: 12,
    minChain: 3,
    gridW: 5,
    gridH: 6,
    blockers: [
      { type: 'stone', x: 0, y: 4 },
      { type: 'stone', x: 1, y: 4 },
      { type: 'stone', x: 3, y: 4 },
      { type: 'stone', x: 4, y: 4 },
      { type: 'bomb', x: 0, y: 5, timer: 3 },
      { type: 'ice', x: 3, y: 5, duration: 4 },
      { type: 'bomb', x: 4, y: 5, timer: 7 },
    ],
  };

  return validateCandidate({
    ...shape,
    target: 45000,
    tileScale: 32,
    sourceShapeIdentity: identity(shape),
  });
}

module.exports = { LEVEL, SEED, buildLevel };
