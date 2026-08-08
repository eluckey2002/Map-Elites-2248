const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chooseMove, remnantPlacementValue } = require('../bot');

function makeTile(x, y, value, blocker = null, bombTimer = 0) {
  return { x, y, value, blocker, blockerDuration: 0, bombTimer };
}

function makeState(grid, overrides = {}) {
  return {
    grid,
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    score: 0,
    moves: 0,
    maxMoves: 25,
    targetScore: 1000,
    minChain: 2,
    ...overrides,
  };
}

test('chooseMove: with no bombs, takes the highest-scoring valid chain', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4);
  const state = makeState([[t0, t1, t2]]);

  const chain = chooseMove(state);

  assert.deepEqual(chain, [t0, t1, t2]);
});

test('chooseMove: prioritizes defusing a reachable bomb over a higher-scoring non-bomb chain', () => {
  const t0 = makeTile(0, 0, 2);
  const bomb = makeTile(1, 0, 2, 'bomb', 3);
  const t2 = makeTile(0, 1, 4);
  const t3 = makeTile(1, 1, 4);
  const t4 = makeTile(2, 1, 8); // len-3 chain, higher points than the bomb pair
  const state = makeState([[t0, bomb, null], [t2, t3, t4]]);

  const chain = chooseMove(state);

  assert.deepEqual(chain, [t0, bomb]);
});

test('chooseMove: falls back to the best chain when the bomb is unreachable this turn', () => {
  const bomb = makeTile(0, 0, 2, 'bomb', 3);
  const isolated = makeTile(1, 0, 6); // matches nothing on the board; can't chain to it or from it
  const t2 = makeTile(0, 1, 4);
  const t3 = makeTile(1, 1, 4);
  const state = makeState([[bomb, isolated], [t2, t3]]);

  const chain = chooseMove(state);

  assert.deepEqual(chain, [t2, t3]);
});

test('chooseMove: returns null when no valid chain exists anywhere', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 4);
  const state = makeState([[t0, t1]]);

  assert.equal(chooseMove(state), null);
});

test('chooseMove: with lookahead, prefers a small immediate chain that sets up a much bigger follow-up over a bigger immediate chain that does not', () => {
  // col0: Z(16) sits above X/X2; clearing them drops Z down beside Q(16),
  // unlocking a Z-Q-R cascade (16+16+32 = 64 * 1.5 = 96pts) that never happens
  // if col1's P/Q1 pair is taken instead, even though that pair scores 60 now
  // against this chain's 4.
  // The col0 chain stops at X/X2 (sum 4) rather than running on through Y
  // (sum 6): findGreedyChains prefers a prefix whose sum is a power of two, so
  // the merged remnant stays chainable. Y is left in place and Z still lands
  // adjacent to Q, so the cascade this test is about is unaffected.
  const Z = makeTile(0, 0, 16);
  const P = makeTile(1, 0, 30);
  const X = makeTile(0, 1, 2);
  const Q1 = makeTile(1, 1, 30);
  const X2 = makeTile(0, 2, 2);
  const Q = makeTile(1, 2, 16);
  const Y = makeTile(0, 3, 2);
  const R = makeTile(1, 3, 32);
  const state = makeState([[Z, P], [X, Q1], [X2, Q], [Y, R]]);
  const constantRng = () => 0; // -> spawn value 2, irrelevant to the cascade

  const greedyChoice = chooseMove(state); // no lookahead: picks P/Q1 (60pts immediate)
  assert.deepEqual(greedyChoice, [P, Q1]);

  const lookaheadChoice = chooseMove(state, { lookaheadRngFactory: () => constantRng });
  assert.deepEqual(lookaheadChoice, [X, X2]); // 4pts now, but unlocks the 96pt cascade
});

test('chooseMove: with lookahead, prefers the chain that clears more of the board even when it scores less right now', () => {
  // Merges CONSERVE board value: the chain's tiles vanish and the survivor is set
  // to their sum. The ONLY new value entering the board is spawns, and spawns
  // land in the cells the chain emptied — so a chain of N tiles injects N-1 fresh
  // tiles' worth of future scoring material. Ranking candidates on immediate
  // points alone ignores that entirely.
  // Here: row 0 is five 64s, whose best chain is 4 of them (sum 256, len 4 ->
  // 384pts) but which empties only 3 cells. Rows 1-4 are twenty 2s, whose best
  // power-of-two prefix is 16 tiles (sum 32, len 16 -> 160pts) but which empties
  // 15 cells. The 2-chain scores 224 fewer points now and is worth far more.
  const grid = [];
  const bigRow = [0, 1, 2, 3, 4].map((x) => makeTile(x, 0, 64));
  grid.push(bigRow);
  for (let y = 1; y <= 4; y++) grid.push([0, 1, 2, 3, 4].map((x) => makeTile(x, y, 2)));
  const state = makeState(grid);
  const constantRng = () => 0; // -> spawn value 2

  const chain = chooseMove(state, { lookaheadRngFactory: () => constantRng });

  assert.equal(chain.length, 16); // the board-clearing 2-chain, not the 4-tile 64-chain
  assert.ok(chain.every((t) => t.value === 2));
});

test('chooseMove: considers candidates ranked below the top few on immediate points', () => {
  // The candidate list is cut to a fixed width BEFORE the lookahead runs, and it
  // is cut by immediate points — the exact criterion the lookahead exists to
  // override. Five separate 32-pairs each score 64pts and produce two candidates
  // apiece (either tile can be the survivor), so ten candidates outrank the one
  // chain worth taking: an 8-tile run of 2s worth 48pts that empties 7 cells.
  // A width-4 list cannot see it at all.
  const N = null;
  const p = (x, y) => makeTile(x, y, 32);
  const two = (x, y) => makeTile(x, y, 2);
  const grid = [
    [p(0, 0), p(1, 0), N, p(3, 0), p(4, 0)],
    [N, N, N, N, N],
    [p(0, 2), p(1, 2), N, p(3, 2), p(4, 2)],
    [N, N, N, N, N],
    [p(0, 4), p(1, 4), N, two(3, 4), two(4, 4)],
    [N, N, N, two(3, 5), two(4, 5)],
    [N, N, N, two(3, 6), two(4, 6)],
    [N, N, N, two(3, 7), two(4, 7)],
  ];
  const state = makeState(grid);
  const constantRng = () => 0;

  const chain = chooseMove(state, { lookaheadRngFactory: () => constantRng });

  assert.equal(chain.length, 8);
  assert.ok(chain.every((t) => t.value === 2));
});

test('remnantPlacementValue: evaluates the survivor after gravity moves it', () => {
  const survivor = makeTile(0, 0, 2);
  const consumed = makeTile(1, 0, 2);
  const landingNeighbor = makeTile(1, 2, 4);
  const state = makeState([
    [survivor, consumed],
    [null, null],
    [null, landingNeighbor],
  ]);
  const candidate = { chain: [consumed, survivor], points: 4 };
  const constantRng = () => 0; // -> spawn value 2

  const value = remnantPlacementValue(state, candidate, () => constantRng);

  // The merged 4 falls from (0,0) to (0,2), beside landingNeighbor. Looking
  // at its old coordinate after spawning would inspect a new 2 instead.
  assert.equal(value, 8);
});

test('remnantPlacementValue: rewards a survivor that can begin a future chain', () => {
  const fixedEight = makeTile(0, 0, 8);
  const twos = [1, 2, 3, 4].map((x) => makeTile(x, 0, 2));
  const state = makeState([[fixedEight, ...twos]]);
  const besideMatch = { chain: [...twos].reverse(), points: 12 };
  const stranded = { chain: twos, points: 12 };
  const constantRng = () => 0; // -> spawn value 2

  const chainableValue = remnantPlacementValue(state, besideMatch, () => constantRng);
  const strandedValue = remnantPlacementValue(state, stranded, () => constantRng);

  assert.ok(chainableValue > strandedValue);
  assert.equal(chainableValue, 16);
  assert.equal(strandedValue, 0);
});

test('chooseMove: placement signal breaks an ordinary-candidate tie toward a chainable survivor', () => {
  const fixedSixteen = makeTile(0, 0, 16);
  const twos = Array.from({ length: 8 }, (_, index) => makeTile(index + 1, 0, 2));
  const separator = makeTile(9, 0, 6);
  const unrelatedPair = [makeTile(10, 0, 16), makeTile(11, 0, 16)];
  const state = makeState([[fixedSixteen, ...twos, separator, ...unrelatedPair]]);
  const constantRng = () => 0; // -> spawn value 2

  const chain = chooseMove(state, { lookaheadRngFactory: () => constantRng });

  // Both endpoint variants score 48 now, empty seven cells, and have the same
  // 32-point ordinary rollout via unrelatedPair. Only the reverse endpoint
  // leaves its merged 16 beside fixedSixteen for another legal 32-point chain.
  assert.deepEqual(chain, [...twos].reverse());
});
