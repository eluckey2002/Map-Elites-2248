const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  makeRng, createLevelState, canExtendChain, isValidChain, chainValue, chainMultiplier,
  executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs, findBestChain, cloneState,
  findTopChains, buildGreedyChain, findGreedyChains,
} = require('../engine');

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

test('makeRng: same seed produces the same sequence', () => {
  const a = makeRng(12345);
  const b = makeRng(12345);
  const seqA = Array.from({ length: 5 }, () => a());
  const seqB = Array.from({ length: 5 }, () => b());
  assert.deepEqual(seqA, seqB);
});

test('createLevelState: grid has levelData dimensions', () => {
  const levelData = { level: 1, target: 500, moves: 25, minChain: 2, gridW: 3, gridH: 4, blockers: [] };
  const state = createLevelState(levelData, makeRng(1));
  assert.equal(state.grid.length, 4); // gridH rows
  assert.equal(state.grid[0].length, 3); // gridW cols
});

test('createLevelState: places a bomb blocker at the configured position', () => {
  const levelData = {
    level: 40, target: 20000, moves: 30, minChain: 4, gridW: 5, gridH: 7,
    blockers: [{ type: 'bomb', x: 2, y: 3, timer: 8 }],
  };
  const state = createLevelState(levelData, makeRng(1));
  const tile = state.grid[3][2]; // [y][x]
  assert.equal(tile.blocker, 'bomb');
  assert.equal(tile.bombTimer, 8);
});

test('canExtendChain: first extension requires equal value to the start tile', () => {
  const start = { value: 4 };
  assert.equal(canExtendChain([start], { value: 4 }), true);
  assert.equal(canExtendChain([start], { value: 8 }), false);
});

test('canExtendChain: later extensions allow equal or double the last tile', () => {
  const chain = [{ value: 4 }, { value: 4 }];
  assert.equal(canExtendChain(chain, { value: 4 }), true); // equal
  assert.equal(canExtendChain(chain, { value: 8 }), true); // double
  assert.equal(canExtendChain(chain, { value: 16 }), false);
});

test('isValidChain: false when shorter than minChain', () => {
  const chain = [{ value: 2 }, { value: 2 }];
  assert.equal(isValidChain(chain, 3), false);
});

test('isValidChain: false when the first two tiles do not match', () => {
  const chain = [{ value: 2 }, { value: 4 }];
  assert.equal(isValidChain(chain, 2), false);
});

test('isValidChain: true for a same-value chain meeting minChain', () => {
  const chain = [{ value: 2 }, { value: 2 }, { value: 4 }];
  assert.equal(isValidChain(chain, 3), true);
});

test('chainValue: sums the tile values', () => {
  const chain = [{ value: 2 }, { value: 2 }, { value: 4 }];
  assert.equal(chainValue(chain), 8);
});

test('chainMultiplier: steps at 3/5/7/9 tiles', () => {
  assert.equal(chainMultiplier(2), 1);
  assert.equal(chainMultiplier(3), 1.5);
  assert.equal(chainMultiplier(5), 2);
  assert.equal(chainMultiplier(7), 3);
  assert.equal(chainMultiplier(9), 5);
});

test('executeChain: removes non-final tiles, sets final tile to the chain sum, scores points, spends a move', () => {
  const t00 = makeTile(0, 0, 2);
  const t10 = makeTile(1, 0, 2);
  const grid = [[t00, t10]];
  const state = makeState(grid);

  const points = executeChain(state, [t00, t10]); // sum 4, len 2 -> multiplier 1

  assert.equal(state.grid[0][0], null);
  assert.equal(state.grid[0][1], t10);
  assert.equal(t10.value, 4);
  assert.equal(points, 4);
  assert.equal(state.score, 4);
  assert.equal(state.moves, 1);
});

test('executeChain: defuses the final tile if it was a bomb', () => {
  const t00 = makeTile(0, 0, 2);
  const t10 = makeTile(1, 0, 2, 'bomb', 5);
  const grid = [[t00, t10]];
  const state = makeState(grid);

  executeChain(state, [t00, t10]);

  assert.equal(t10.blocker, null);
  assert.equal(t10.bombTimer, 0);
});

test('executeChain: applies the length multiplier (>=3 tiles = 1.5x)', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4);
  const grid = [[t0, t1, t2]];
  const state = makeState(grid);

  const points = executeChain(state, [t0, t1, t2]); // sum 8 * 1.5 = 12

  assert.equal(points, 12);
});

test('applyGravity: a tile falls through holes to the bottom of its column', () => {
  const a = makeTile(0, 1, 2);
  const grid = [[null], [a], [null]]; // 3 rows, 1 col; hole above and below
  const state = makeState(grid);

  applyGravity(state);

  assert.equal(state.grid[0][0], null);
  assert.equal(state.grid[1][0], null);
  assert.equal(state.grid[2][0], a);
  assert.equal(a.y, 2);
});

test('applyGravity: a stone blocks tiles above it from falling past', () => {
  const a = makeTile(0, 0, 2);
  const stone = makeTile(0, 1, 0, 'stone');
  const grid = [[a], [stone], [null]];
  const state = makeState(grid);

  applyGravity(state);

  assert.equal(state.grid[0][0], a); // unmoved: stone blocks it
  assert.equal(state.grid[1][0], stone);
  assert.equal(state.grid[2][0], null); // below-stone hole stays empty (no tile to fall into it)
});

test('spawnNewTiles: fills every null cell using the weighted spawn rng', () => {
  const grid = [[null, makeTile(1, 0, 4)]];
  const state = makeState(grid);
  const fixedRng = () => 0.1; // < 0.6 -> value 2 per spawn weights

  spawnNewTiles(state, fixedRng);

  assert.equal(state.grid[0][0].value, 2);
  assert.equal(state.grid[0][1].value, 4); // untouched
});

test('spawnNewTiles: spawn weight thresholds match game.js (0.6/0.9 for 2/4/8)', () => {
  const gridFor = (rngValue) => {
    const grid = [[null]];
    const state = makeState(grid);
    spawnNewTiles(state, () => rngValue);
    return state.grid[0][0].value;
  };
  assert.equal(gridFor(0.59), 2);
  assert.equal(gridFor(0.6), 4);
  assert.equal(gridFor(0.89), 4);
  assert.equal(gridFor(0.9), 8);
});

test('tickBlockers: ice counts down and clears at zero', () => {
  const ice3 = makeTile(0, 0, 2, 'ice');
  ice3.blockerDuration = 3;
  const ice1 = makeTile(1, 0, 2, 'ice');
  ice1.blockerDuration = 1;
  const state = makeState([[ice3, ice1]]);

  tickBlockers(state);

  assert.equal(ice3.blocker, 'ice');
  assert.equal(ice3.blockerDuration, 2);
  assert.equal(ice1.blocker, null);
});

test('tickBlockers: bomb timer counts down but blocker stays until checkBombs', () => {
  const bomb = makeTile(0, 0, 2, 'bomb', 3);
  const state = makeState([[bomb]]);

  tickBlockers(state);

  assert.equal(bomb.blocker, 'bomb');
  assert.equal(bomb.bombTimer, 2);
});

test('checkBombs: true when any bomb timer has reached zero', () => {
  const bomb = makeTile(0, 0, 2, 'bomb', 0);
  assert.equal(checkBombs(makeState([[bomb]])), true);
});

test('checkBombs: false when all bomb timers are still positive', () => {
  const bomb = makeTile(0, 0, 2, 'bomb', 1);
  assert.equal(checkBombs(makeState([[bomb]])), false);
});

test('findBestChain: picks the highest-scoring reachable chain', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4); // 2*2 -> valid extension
  const state = makeState([[t0, t1, t2]], { minChain: 2 });

  const result = findBestChain(state);

  assert.deepEqual(result.chain, [t0, t1, t2]);
  assert.equal(result.points, 12); // (2+2+4) * 1.5
});

test('findBestChain: returns null when no chain of minChain length exists', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 4); // not equal, can't even start a chain
  const state = makeState([[t0, t1]], { minChain: 2 });

  assert.equal(findBestChain(state), null);
});

test('findBestChain: mustEndAt restricts the result to chains ending at that tile', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4);
  const state = makeState([[t0, t1, t2]], { minChain: 2 });

  const result = findBestChain(state, { mustEndAt: t1 });

  assert.deepEqual(result.chain, [t0, t1]);
});

test('findBestChain: mustEndAt returns null when the target tile is unreachable', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const unreachable = makeTile(2, 0, 8); // not equal or double of t1
  const state = makeState([[t0, t1, unreachable]], { minChain: 2 });

  assert.equal(findBestChain(state, { mustEndAt: unreachable }), null);
});

test('findBestChain: maxLength stops the search from extending past that many tiles', () => {
  // A run of 5 same-value tiles: without a cap, the best chain is all 5
  // (points 10*2=20 at length 5); capped at 3, it should stop growing there.
  const tiles = [0, 1, 2, 3, 4].map((i) => makeTile(i, 0, 2));
  const state = makeState([tiles], { minChain: 2 });

  const uncapped = findBestChain(state);
  const capped = findBestChain(state, { maxLength: 3 });

  assert.equal(uncapped.chain.length, 5);
  assert.equal(capped.chain.length, 3);
});

test('findBestChain: mustStartAt restricts the search to chains starting at that tile', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const other0 = makeTile(0, 2, 4);
  const other1 = makeTile(1, 2, 4);
  const other2 = makeTile(2, 2, 8); // higher-scoring chain, but unreachable from t0 (gap row between them)
  const state = makeState(
    [[t0, t1, null], [null, null, null], [other0, other1, other2]],
    { minChain: 2 },
  );

  const result = findBestChain(state, { mustStartAt: t0 });

  assert.deepEqual(result.chain, [t0, t1]);
});

test('cloneState: deep-copies the grid so mutating the clone leaves the original untouched', () => {
  const t0 = makeTile(0, 0, 2);
  const state = makeState([[t0]]);

  const clone = cloneState(state);
  clone.grid[0][0].value = 999;
  clone.score = 500;

  assert.equal(state.grid[0][0].value, 2);
  assert.equal(state.score, 0);
  assert.equal(clone.grid[0][0].value, 999);
});

test('findTopChains: sorted best-first and covers moves from every reachable cluster', () => {
  const a0 = makeTile(0, 0, 2);
  const a1 = makeTile(1, 0, 2);
  const b0 = makeTile(0, 2, 2);
  const b1 = makeTile(1, 2, 2);
  const b2 = makeTile(2, 2, 4); // makes cluster B's longest chain score higher than cluster A's
  const state = makeState(
    [[a0, a1, null], [null, null, null], [b0, b1, b2]],
    { minChain: 2 },
  );

  const top = findTopChains(state, { limit: 10 });

  assert.deepEqual(top[0].chain, [b0, b1, b2]); // best overall comes first
  for (let i = 1; i < top.length; i++) {
    assert.ok(top[i - 1].points >= top[i].points); // non-increasing
  }
  assert.ok(top.some((r) => r.chain.includes(a0))); // cluster A is still represented
});

test('findTopChains: respects the limit', () => {
  const a0 = makeTile(0, 0, 2);
  const a1 = makeTile(1, 0, 2);
  const b0 = makeTile(0, 2, 2);
  const b1 = makeTile(1, 2, 2);
  const state = makeState([[a0, a1, null], [null, null, null], [b0, b1, null]], { minChain: 2 });

  const top = findTopChains(state, { limit: 1 });

  assert.equal(top.length, 1);
});

test('findBestChain: a stone tile cannot be part of a chain', () => {
  const t0 = makeTile(0, 0, 2);
  const stone = makeTile(1, 0, 0, 'stone');
  const t2 = makeTile(2, 0, 2);
  const state = makeState([[t0, stone, t2]], { minChain: 2 });

  assert.equal(findBestChain(state), null); // t0 and t2 aren't adjacent (stone sits between)
});

test('buildGreedyChain: walks the connected same-or-double run from a start tile, no backtracking', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4);
  const t3 = makeTile(3, 0, 8);
  const state = makeState([[t0, t1, t2, t3]], { minChain: 2 });

  const result = buildGreedyChain(state, t0);

  assert.deepEqual(result.chain, [t0, t1, t2, t3]);
  assert.equal(result.points, Math.floor((2 + 2 + 4 + 8) * 1.5)); // len4 -> mult 1.5
});

test('buildGreedyChain: at each step prefers the lower-value valid neighbor (keeps the walk alive longer)', () => {
  // t1 has two valid extensions: t2(4, double) is a dead end (its only other
  // neighbor is already visited); t1b(2, equal) leads on to t1b2. Preferring
  // the lower value reaches a longer chain (4 tiles vs 3).
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 4);
  const t1b = makeTile(0, 1, 2);
  const t1b2 = makeTile(0, 2, 2);
  const state = makeState(
    [[t0, t1, t2], [t1b, null, null], [t1b2, null, null]],
    { minChain: 2 },
  );

  const result = buildGreedyChain(state, t0);

  assert.deepEqual(result.chain, [t0, t1, t1b, t1b2]);
});

test('buildGreedyChain: returns null when the start alone cannot reach minChain', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 4); // not equal to t0, no first extension
  const state = makeState([[t0, t1]], { minChain: 2 });

  assert.equal(buildGreedyChain(state, t0), null);
});

test('buildGreedyChain: respects maxLength', () => {
  const tiles = [0, 1, 2, 3, 4].map((i) => makeTile(i, 0, 2));
  const state = makeState([tiles], { minChain: 2 });

  const result = buildGreedyChain(state, tiles[0], { maxLength: 3 });

  assert.equal(result.chain.length, 3);
});

test('buildGreedyChain: a stone tile cannot be part of the chain', () => {
  const t0 = makeTile(0, 0, 2);
  const stone = makeTile(1, 0, 0, 'stone');
  const t2 = makeTile(2, 0, 2);
  const state = makeState([[t0, stone, t2]], { minChain: 2 });

  assert.equal(buildGreedyChain(state, t0), null);
});

test('buildGreedyChain: preferMergeableSum stops at the prefix whose sum is a power of two', () => {
  // A merge leaves behind exactly one tile, valued at the chain's SUM. The full
  // walk here (2,2,2,4) sums to 10 — a value nothing on the board can ever
  // equal or double into, so that tile is dead weight forever. The 2-tile
  // prefix sums to 4, which stays inside the merge lattice and can be chained
  // again. Worth 4 points now instead of 15; that trade is the point.
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 2);
  const t3 = makeTile(3, 0, 4);
  const state = makeState([[t0, t1, t2, t3]], { minChain: 2 });

  const plain = buildGreedyChain(state, t0);
  assert.deepEqual(plain.chain, [t0, t1, t2, t3]); // default: unchanged full walk
  assert.equal(plain.points, 15); // sum 10 * 1.5

  const merged = buildGreedyChain(state, t0, { preferMergeableSum: true });
  assert.deepEqual(merged.chain, [t0, t1]);
  assert.equal(merged.points, 4); // sum 4 * 1
});

test('buildGreedyChain: preferMergeableSum falls back to the full walk when no prefix sums to a power of two', () => {
  // Only one prefix reaches minChain (3 tiles, sum 6) and it is not a power of
  // two — the preference must not turn that into "no move".
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 2);
  const state = makeState([[t0, t1, t2]], { minChain: 3 });

  const result = buildGreedyChain(state, t0, { preferMergeableSum: true });

  assert.deepEqual(result.chain, [t0, t1, t2]);
  assert.equal(result.points, 9); // sum 6 * 1.5
});

// The walk is self-avoiding and never backtracks, so taking a well-connected
// tile early can wall it off from tiles it could still have reached. These
// three fix the behavior of the Warnsdorff tie-break that fixes that.
//
//   S P R        S(0,0) starts. P and R sit on the top row; Q hangs below S.
//   Q . .        Every tile is a 2, so any self-avoiding path is legal.
//
// Going S->P first strands Q: from P the walk takes R (first minimum in scan
// order), and R is a dead end. Going S->Q first uses the tile that was about
// to be cut off, and the walk then picks up P and R anyway.
function strandingFixture() {
  const s = makeTile(0, 0, 2);
  const p = makeTile(1, 0, 2);
  const r = makeTile(2, 0, 2);
  const q = makeTile(0, 1, 2);
  return { s, p, r, q, state: makeState([[s, p, r], [q, null, null]], { minChain: 2 }) };
}

test('buildGreedyChain: the plain walk strands a tile it could have used', () => {
  const { s, p, r, state } = strandingFixture();

  const result = buildGreedyChain(state, s);

  assert.deepEqual(result.chain, [s, p, r]); // Q never reached
});

test('buildGreedyChain: the degree tie-break takes the nearly-cut-off tile first', () => {
  const { s, p, r, q, state } = strandingFixture();

  const result = buildGreedyChain(state, s, { tieBreak: 'degree' });

  // Q has one onward move and P has two, so Q goes first and nothing is lost.
  assert.deepEqual(result.chain, [s, q, p, r]);
  assert.equal(result.points, 12); // sum 8 * 1.5
});

test('buildGreedyChain: the degree tie-break never overrides the lower-value preference', () => {
  // Low-value-first is what makes the walk long; connectivity only settles ties
  // between tiles of EQUAL value. Ranking on connectivity first measured far
  // worse, so this guards against the two being swapped.
  //
  //   A2 B2      After A->B both C (a double) and D (an equal) are legal.
  //   C4 D2      C is the dead end -- zero onward moves against D's one -- so a
  //              degree-first rule would take it. Value-first must take D.
  const a = makeTile(0, 0, 2);
  const b = makeTile(1, 0, 2);
  const c = makeTile(0, 1, 4);
  const d = makeTile(1, 1, 2);
  const state = makeState([[a, b], [c, d]], { minChain: 2 });

  const result = buildGreedyChain(state, a, { tieBreak: 'degree' });

  assert.equal(result.chain[2], d);
  assert.deepEqual(result.chain, [a, b, d, c]);
});

test('findGreedyChains: applies the mergeable-sum preference by default', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 2);
  const t3 = makeTile(3, 0, 4);
  const state = makeState([[t0, t1, t2, t3]], { minChain: 2 });

  const top = findGreedyChains(state, { limit: 10 });

  assert.ok(top.length > 0);
  for (const r of top) {
    assert.equal(r.chain.length, 2); // every walk truncated to its power-of-two prefix
    assert.equal(chainValue(r.chain), 4);
  }
});

test('findGreedyChains: preferMergeableSum:false restores the plain longest-walk behavior', () => {
  const t0 = makeTile(0, 0, 2);
  const t1 = makeTile(1, 0, 2);
  const t2 = makeTile(2, 0, 2);
  const t3 = makeTile(3, 0, 4);
  const state = makeState([[t0, t1, t2, t3]], { minChain: 2 });

  const top = findGreedyChains(state, { limit: 10, preferMergeableSum: false });

  assert.equal(top[0].chain.length, 4);
});

test('findGreedyChains: tries every non-blocked tile as a start, sorted best-first', () => {
  const a0 = makeTile(0, 0, 2);
  const a1 = makeTile(1, 0, 2);
  const b0 = makeTile(0, 2, 2);
  const b1 = makeTile(1, 2, 2);
  const b2 = makeTile(2, 2, 4);
  const state = makeState(
    [[a0, a1, null], [null, null, null], [b0, b1, b2]],
    { minChain: 2 },
  );

  const top = findGreedyChains(state, { limit: 10 });

  assert.ok(top.length >= 2);
  assert.equal(top[0].chain.length, 3); // b0,b1,b2 is the best available
  for (let i = 1; i < top.length; i++) {
    assert.ok(top[i - 1].points >= top[i].points);
  }
});
