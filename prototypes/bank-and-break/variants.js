// PROTOTYPE — not shipped level content.
//
// Question: does a fixed bottom gate between two cramped rooms create a
// perceptible build-separately, then connect-and-harvest arc?

const { identity, validateCandidate } = require('../../solver/level-author');

const SHARED = Object.freeze({
  schemaVersion: 1,
  target: 40000,
  tileScale: 32,
  moves: 16,
  minChain: 3,
  gridW: 5,
  gridH: 5,
});

function fixedBottomGate() {
  return [
    { type: 'stone', x: 2, y: 0 },
    { type: 'stone', x: 2, y: 1 },
    { type: 'stone', x: 2, y: 2 },
    { type: 'stone', x: 2, y: 3 },
    // Bottom-row ice cannot fall out of the wall before it thaws.
    { type: 'ice', x: 2, y: 4, duration: 4 },
  ];
}

function candidate({ level, name, blockers }) {
  const shape = {
    schemaVersion: 1,
    name,
    level,
    demand: 1,
    demandStatus: 'provisional-proposal',
    moves: SHARED.moves,
    minChain: SHARED.minChain,
    gridW: SHARED.gridW,
    gridH: SHARED.gridH,
    blockers,
  };
  return validateCandidate({
    ...SHARED,
    level,
    name,
    blockers,
    sourceShapeIdentity: identity(shape),
  });
}

function buildVariants() {
  return [
    candidate({
      level: 5904,
      name: 'bank-break-fixed-bottom-gate',
      blockers: fixedBottomGate(),
    }),
  ];
}

module.exports = { SHARED, buildVariants };
