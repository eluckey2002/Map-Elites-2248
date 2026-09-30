const assert = require('node:assert/strict');
const test = require('node:test');

const { chainValue, isMergeableSum } = require('../engine');
const { chooseMove } = require('../bot');
const { bestMergeableBombChain, chooseBombLatticeMove } = require('../bomb-lattice-challenger');

function tile(x, y, value, blocker = null, bombTimer = 0) {
  return { x, y, value, blocker, blockerDuration: 0, bombTimer };
}

function forkedBombState() {
  return {
    gridWidth: 3,
    gridHeight: 2,
    minChain: 3,
    tileScale: 32,
    score: 0,
    targetScore: 99_999,
    maxMoves: 20,
    moves: 0,
    grid: [
      [tile(0, 0, 64), tile(1, 0, 64), null],
      [null, tile(1, 1, 64), tile(2, 1, 128, 'bomb', 3)],
    ],
  };
}

test('bomb-lattice challenger selects a mergeable bomb route over the champion off-lattice route', () => {
  const state = forkedBombState();
  const champion = chooseMove(state);
  const challenger = chooseBombLatticeMove(state);
  assert.equal(isMergeableSum(chainValue(champion), state.tileScale), false);
  assert.equal(isMergeableSum(chainValue(challenger), state.tileScale), true);
  assert.equal(challenger.at(-1).blocker, 'bomb');
});

test('bomb-lattice challenger is exactly the champion when no bomb route has a mergeable sum', () => {
  const state = forkedBombState();
  state.minChain = 4;
  assert.equal(bestMergeableBombChain(state), null);
  assert.deepEqual(chooseBombLatticeMove(state), chooseMove(state));
});
