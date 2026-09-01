// Proves solver/engine.js still behaves like src/game.js.
//
// engine.js says "Mirrors game.js ..." above eight of its functions. Until this
// file existed those were assertions nothing checked, and they had already
// drifted: engine.js has no end-of-level logic at all, and its comment about
// bomb defusal was simply false. A comment claiming a correspondence is a claim
// nothing enforces; this file enforces it.
//
// Both implementations are driven with identical inputs and their outputs
// compared. game.js's rule methods run headless on a bare prototype object;
// executeChain needs its UI calls stubbed, which is done explicitly below so it
// is obvious what was replaced.

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const engine = require(path.join(ROOT, 'solver', 'engine.js'));
const { Game, BLOCKER_TYPES } = require(path.join(ROOT, 'src', 'game.js'));

// --- driving the real game without a browser --------------------------------

function gameWith(fields) {
  return Object.assign(Object.create(Game.prototype), fields);
}

// Every UI/persistence call executeChain makes, replaced with no-ops so the
// merge mutation can be exercised without a browser.
//
// executeChain also defers the post-merge cycle into a 200 ms setTimeout. That
// deferred callback is NOT what this file is comparing - the engine has no
// equivalent deferral - so its members are stubbed too, and the tests below
// await the timer so nothing escapes into the next test. If game.js starts
// calling something else in there, it throws here rather than silently
// skipping.
const UI_STUBS = {
  saveState() {},
  showMultiplierPopup() {},
  updateChainIndicator() {},
  updateUI() {},
  render() {},
  authoringCapture: null,
  bestChain: 0,
  // members of the deferred post-merge cycle
  tileScale: 1,
  random: () => 0.5,
  applyGravity() {},
  spawnNewTiles() {},
  tickBlockers() {},
  checkBombs() {},
  checkWinLose() {},
};

// executeChain's deferred cycle runs 200 ms later; wait past it.
const afterDeferredCycle = () => new Promise((resolve) => setTimeout(resolve, 260));

function tile(x, y, value, extra = {}) {
  return Object.assign({
    x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0,
    selected: false, merging: false,
    isBomb() { return this.blocker === 'bomb'; },
    isBlocked() {
      return this.blocker === 'stone' || this.blocker === 'ice' || this.blocker === 'lock';
    },
  }, extra);
}

// --- 1. chain extension rules ----------------------------------------------

test('canExtendChain agrees for every value relationship', () => {
  const values = [2, 4, 8, 12, 16, 24, 32, 48, 64];
  let compared = 0;
  for (const a of values) {
    for (const b of values) {
      // as the second tile (must be equal)
      const chain1 = [tile(0, 0, a)];
      const g1 = gameWith({ chain: chain1 });
      assert.strictEqual(
        g1.canExtendChain(tile(1, 0, b)),
        engine.canExtendChain(chain1, tile(1, 0, b)),
        `second-tile disagreement: chain [${a}] + ${b}`,
      );
      // as a later tile (equal or double)
      const chain2 = [tile(0, 0, a), tile(1, 0, a)];
      const g2 = gameWith({ chain: chain2 });
      assert.strictEqual(
        g2.canExtendChain(tile(2, 0, b)),
        engine.canExtendChain(chain2, tile(2, 0, b)),
        `later-tile disagreement: chain [${a},${a}] + ${b}`,
      );
      compared += 2;
    }
  }
  assert.ok(compared >= 100, `only compared ${compared} pairs`);
});

test('an empty chain accepts anything, in both', () => {
  assert.strictEqual(gameWith({ chain: [] }).canExtendChain(tile(0, 0, 4)), true);
  assert.strictEqual(engine.canExtendChain([], tile(0, 0, 4)), true);
});

// --- 2. validity ------------------------------------------------------------

test('isValidChain agrees across lengths and first-pair values', () => {
  for (const minChain of [2, 3, 4]) {
    for (let len = 0; len <= 6; len++) {
      for (const secondValue of [4, 8]) {
        const chain = [];
        for (let i = 0; i < len; i++) {
          chain.push(tile(i, 0, i === 1 ? secondValue : 4));
        }
        const g = gameWith({ chain, minChain });
        assert.strictEqual(
          g.isValidChain(),
          engine.isValidChain(chain, minChain),
          `minChain ${minChain}, length ${len}, second value ${secondValue}`,
        );
      }
    }
  }
});

// --- 3. multiplier and scoring ---------------------------------------------

test('chain multiplier agrees for lengths 0-30', () => {
  for (let len = 0; len <= 30; len++) {
    const chain = Array.from({ length: len }, (_, i) => tile(i, 0, 4));
    assert.strictEqual(
      gameWith({ chain }).getChainMultiplier(),
      engine.chainMultiplier(len),
      `length ${len}`,
    );
  }
});

test('chain value and final score agree', () => {
  const cases = [
    [2, 2], [4, 4, 8], [2, 2, 4, 8, 16],
    [8, 8, 16, 32, 32, 64], [2, 2, 2, 4, 4, 8, 8, 16, 32],
    [6, 6, 12, 24], // off the power-of-two lattice
  ];
  for (const values of cases) {
    const chain = values.map((v, i) => tile(i, 0, v));
    const g = gameWith({ chain });
    const gameValue = g.calculateChainValue();
    assert.strictEqual(gameValue, engine.chainValue(chain), `sum for [${values}]`);
    assert.strictEqual(
      Math.floor(gameValue * g.getChainMultiplier()),
      Math.floor(engine.chainValue(chain) * engine.chainMultiplier(chain.length)),
      `score for [${values}]`,
    );
  }
});

// --- 4. the merge itself, including bombs ----------------------------------

function runGameExecuteChain(grid, chain, extra = {}) {
  const g = gameWith(Object.assign({}, UI_STUBS, {
    grid,
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    chain,
    score: 0,
    moves: 0,
    animating: false,
  }, extra));
  g.executeChain();
  return g;
}

function runEngineExecuteChain(grid, chain) {
  const state = {
    grid,
    gridWidth: grid[0].length,
    gridHeight: grid.length,
    score: 0,
    moves: 0,
    minChain: 2,
    tileScale: 1,
  };
  const points = engine.executeChain(state, chain);
  return { state, points };
}

test('a merge deletes n-1 tiles and gives the survivor the exact sum, in both', async () => {
  const build = () => [[tile(0, 0, 4), tile(1, 0, 4), tile(2, 0, 8)]];

  const gGrid = build();
  const g = runGameExecuteChain(gGrid, [gGrid[0][0], gGrid[0][1], gGrid[0][2]]);

  const eGrid = build();
  const { state, points } = runEngineExecuteChain(eGrid, [eGrid[0][0], eGrid[0][1], eGrid[0][2]]);

  assert.strictEqual(gGrid[0][0], null, 'game: first tile removed');
  assert.strictEqual(eGrid[0][0], null, 'engine: first tile removed');
  assert.strictEqual(gGrid[0][2].value, 16, 'game: survivor is the exact sum');
  assert.strictEqual(eGrid[0][2].value, 16, 'engine: survivor is the exact sum');
  assert.strictEqual(g.score, points, 'scores agree');
  assert.strictEqual(g.moves, state.moves, 'move counters agree');
  await afterDeferredCycle();
});

test('a bomb in the FINAL position is defused and survives, in both', async () => {
  const build = () => {
    const row = [tile(0, 0, 4), tile(1, 0, 4), tile(2, 0, 8, { blocker: 'bomb', bombTimer: 3 })];
    return [row];
  };

  const gGrid = build();
  runGameExecuteChain(gGrid, [gGrid[0][0], gGrid[0][1], gGrid[0][2]]);
  const eGrid = build();
  runEngineExecuteChain(eGrid, [eGrid[0][0], eGrid[0][1], eGrid[0][2]]);

  for (const [label, grid] of [['game', gGrid], ['engine', eGrid]]) {
    assert.strictEqual(grid[0][2].blocker, null, `${label}: bomb defused`);
    assert.strictEqual(grid[0][2].bombTimer, 0, `${label}: timer cleared`);
    assert.strictEqual(grid[0][2].value, 16, `${label}: survivor holds the sum`);
  }
  await afterDeferredCycle();
});

test('a bomb in a NON-final position is deleted outright, in both', async () => {
  // engine.js's comment used to claim ending on the bomb was the only way to
  // remove one. It is not, and this is the case that proves it.
  const build = () => [[
    tile(0, 0, 4),
    tile(1, 0, 4, { blocker: 'bomb', bombTimer: 3 }),
    tile(2, 0, 8),
  ]];

  const gGrid = build();
  runGameExecuteChain(gGrid, [gGrid[0][0], gGrid[0][1], gGrid[0][2]]);
  const eGrid = build();
  const { state } = runEngineExecuteChain(eGrid, [eGrid[0][0], eGrid[0][1], eGrid[0][2]]);

  assert.strictEqual(gGrid[0][1], null, 'game: the bomb tile is gone from the grid');
  assert.strictEqual(eGrid[0][1], null, 'engine: the bomb tile is gone from the grid');
  assert.strictEqual(engine.checkBombs(state), false, 'engine: no bomb remains to explode');
  assert.strictEqual(gGrid[0][2].blocker, null, 'game: survivor did not inherit the bomb');
  await afterDeferredCycle();
});

// --- 5. gravity -------------------------------------------------------------

test('applyGravity agrees, including stone acting as a floor', () => {
  // Each case is written as explicit rows so the stone genuinely has a tile
  // ABOVE it and empty space BELOW it - the only arrangement where "stone
  // blocks gravity" and "stone does not" give different answers.
  //
  // The first version of this test placed stones where nothing sat above them.
  // It passed, and it also passed when the stone rule was deleted from
  // engine.js. Planting that defect is the only reason the hole was found.
  const cases = [
    { name: 'tile above a stone, gap below',
      rows: [['4'], ['S'], [null]] },
    { name: 'stack above a stone, two gaps below',
      rows: [['4'], ['8'], ['S'], [null], [null]] },
    { name: 'stone at the bottom, tiles falling onto it',
      rows: [['4'], [null], ['S']] },
    { name: 'two stones with a tile between them',
      rows: [['S'], ['4'], ['S'], [null]] },
    { name: 'no stone at all, plain fall',
      rows: [['4'], [null], ['8'], [null]] },
  ];

  for (const { name, rows } of cases) {
    const build = () => rows.map((row, y) => row.map((cell, x) => {
      if (cell === null) return null;
      if (cell === 'S') return tile(x, y, 0, { blocker: BLOCKER_TYPES.STONE });
      return tile(x, y, Number(cell));
    }));

    const h = rows.length;
    const gGrid = build();
    gameWith({ grid: gGrid, gridWidth: 1, gridHeight: h }).applyGravity();
    const eGrid = build();
    engine.applyGravity({ grid: eGrid, gridWidth: 1, gridHeight: h });

    const shape = (g) => g.map((r) => r.map((t) => (t ? `${t.value}${t.blocker || ''}` : '.')));
    assert.deepStrictEqual(shape(gGrid), shape(eGrid), `gravity differs: ${name}`);
  }

  // Guard the guard: at least one case must actually move a tile, or the
  // comparison above is comparing two untouched boards.
  const moved = (() => {
    const g = [[tile(0, 0, 4)], [null]];
    gameWith({ grid: g, gridWidth: 1, gridHeight: 2 }).applyGravity();
    return g[1][0] !== null && g[0][0] === null;
  })();
  assert.ok(moved, 'applyGravity moved nothing at all - the comparison is vacuous');
});

// --- 6. spawning ------------------------------------------------------------

test('spawnNewTiles fills the same cells with the same values, in the same order', () => {
  for (const tileScale of [1, 2, 8]) {
    // One shared draw sequence, replayed into each implementation.
    const draws = [0.05, 0.55, 0.61, 0.75, 0.89, 0.91, 0.99, 0.3, 0.45, 0.7];
    const feed = () => { let i = 0; return () => draws[i++ % draws.length]; };

    const build = () => [[null, tile(1, 0, 4)], [tile(0, 1, 8), null], [null, null]];

    const gGrid = build();
    gameWith({
      grid: gGrid, gridWidth: 2, gridHeight: 3, tileScale, random: feed(),
    }).spawnNewTiles();

    const eGrid = build();
    engine.spawnNewTiles({ grid: eGrid, gridWidth: 2, gridHeight: 3, tileScale }, feed());

    const values = (g) => g.map((r) => r.map((t) => (t ? t.value : null)));
    assert.deepStrictEqual(
      values(gGrid), values(eGrid),
      `spawn differs at tileScale ${tileScale}`,
    );
  }
});

// --- 7. what this file does NOT cover --------------------------------------

test('documented coverage gaps are still gaps, not silent omissions', () => {
  // engine.js has no analog of these. They are the reason the two files drifted
  // on how a level ends. Listing them here means a future reader sees the hole.
  const gameOnly = ['checkWinLose', 'hasValidMoves', 'undo'];
  for (const name of gameOnly) {
    assert.strictEqual(
      typeof Game.prototype[name], 'function',
      `${name} should exist on Game`,
    );
    assert.strictEqual(
      engine[name], undefined,
      `engine.js now has ${name} - extend this test to compare it`,
    );
  }
});
