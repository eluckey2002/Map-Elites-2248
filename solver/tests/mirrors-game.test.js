// Proves solver/engine.js still behaves like src/game.js.
//
// engine.js says "Mirrors game.js ..." above eight of its functions. Until this
// file existed those were assertions nothing checked, and they had already
// drifted: engine.js has no end-of-level logic at all, and its comment about
// bomb defusal was false.
//
// HOW THIS FILE IS JUDGED: not by passing, but by whether planted divergences
// fail it. An adversarial review of the first version planted 21 defects and 17
// survived. Every hole it named is closed below. If you extend engine.js, plant
// a break in your new code and watch this file go red before you trust it.

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const engine = require(path.join(ROOT, 'solver', 'engine.js'));
const {
  Game, BLOCKER_TYPES, LEVELS, createInitialGrid, makeSeededRng,
} = require(path.join(ROOT, 'src', 'game.js'));

function gameWith(fields) {
  return Object.assign(Object.create(Game.prototype), fields);
}

// Everything executeChain touches that is UI, persistence, or the deferred
// post-merge cycle. The cycle's own members are compared in their own tests
// below, not here.
const UI_STUBS = {
  saveState() {}, showMultiplierPopup() {}, updateChainIndicator() {},
  updateUI() {}, render() {}, showGameOver() {}, finishAuthoring() {},
  authoringCapture: null, bestChain: 0, tileScale: 1, random: () => 0.5,
  applyGravity() {}, spawnNewTiles() {}, tickBlockers() {}, checkBombs() {},
  checkWinLose() {},
};
const afterDeferredCycle = () => new Promise((r) => setTimeout(r, 260));

function tile(x, y, value, extra = {}) {
  return Object.assign({
    x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0,
    selected: false, merging: false,
    isBomb() { return this.blocker === BLOCKER_TYPES.BOMB; },
    tickBlocker() {
      if (this.blocker === BLOCKER_TYPES.ICE) {
        this.blockerDuration -= 1;
        if (this.blockerDuration <= 0) this.blocker = null;
      }
      if (this.blocker === BLOCKER_TYPES.BOMB) this.bombTimer -= 1;
    },
    isBlocked() {
      return this.blocker === BLOCKER_TYPES.STONE
        || this.blocker === BLOCKER_TYPES.ICE
        || this.blocker === BLOCKER_TYPES.LOCK;
    },
  }, extra);
}

// Full identity of a cell. Comparing only value+blocker let a mutant that
// dropped `tile.y = writeRow` from applyGravity pass, so x and y are included.
const cell = (t) => (t ? {
  v: t.value, b: t.blocker || null, d: t.blockerDuration || 0,
  timer: t.bombTimer || 0, x: t.x, y: t.y,
} : null);
const board = (g) => g.map((row) => row.map(cell));

// --- 1. the random source and the opening board ----------------------------

test('makeRng and makeSeededRng produce identical sequences', () => {
  for (const seed of [0, 1, 7, 4242, 2 ** 31]) {
    const a = engine.makeRng(seed);
    const b = makeSeededRng(seed);
    const left = [];
    const right = [];
    for (let i = 0; i < 50; i++) { left.push(a()); right.push(b()); }
    assert.deepStrictEqual(left, right, `sequences differ for seed ${seed}`);
  }
});

test('createLevelState builds the same opening board as createInitialGrid', () => {
  // Never compared before. It decides every seeded board in the whole pipeline.
  const withBlockers = LEVELS.filter((l) => l.blockers && l.blockers.length);
  const sample = [LEVELS[0], withBlockers[0], withBlockers[withBlockers.length - 1]];
  for (const level of sample) {
    for (const seed of [7, 99, 4242]) {
      const state = engine.createLevelState(level, engine.makeRng(seed));
      const grid = createInitialGrid(level, makeSeededRng(seed));
      assert.deepStrictEqual(
        board(state.grid), board(grid),
        `opening board differs for level ${level.level} seed ${seed}`,
      );
      assert.strictEqual(state.tileScale, level.tileScale || 1);
    }
  }
});

// --- 2. chain rules ---------------------------------------------------------

test('canExtendChain agrees for every value relationship, including 0', () => {
  // 0 matters: every stone tile has value 0.
  const values = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64];
  for (const a of values) {
    for (const b of values) {
      const first = [tile(0, 0, a)];
      assert.strictEqual(
        gameWith({ chain: first }).canExtendChain(tile(1, 0, b)),
        engine.canExtendChain(first, tile(1, 0, b)),
        `second tile: [${a}] + ${b}`,
      );
      const later = [tile(0, 0, a), tile(1, 0, a)];
      assert.strictEqual(
        gameWith({ chain: later }).canExtendChain(tile(2, 0, b)),
        engine.canExtendChain(later, tile(2, 0, b)),
        `later tile: [${a},${a}] + ${b}`,
      );
    }
  }
  assert.strictEqual(gameWith({ chain: [] }).canExtendChain(tile(0, 0, 4)), true);
  assert.strictEqual(engine.canExtendChain([], tile(0, 0, 4)), true);
});

test('isBlockedTile agrees with Tile.isBlocked for every blocker type', () => {
  for (const b of [null, BLOCKER_TYPES.STONE, BLOCKER_TYPES.ICE,
    BLOCKER_TYPES.BOMB, BLOCKER_TYPES.LOCK]) {
    const t = tile(0, 0, 4, { blocker: b });
    assert.strictEqual(
      engine.isBlockedTile(t), t.isBlocked(),
      `blocker ${b}: engine says ${engine.isBlockedTile(t)}, game says ${t.isBlocked()}`,
    );
  }
});

test('isValidChain agrees across lengths and first-pair values', () => {
  for (const minChain of [2, 3, 4]) {
    for (let len = 0; len <= 6; len++) {
      for (const second of [4, 8]) {
        const chain = Array.from({ length: len },
          (_, i) => tile(i, 0, i === 1 ? second : 4));
        assert.strictEqual(
          gameWith({ chain, minChain }).isValidChain(),
          engine.isValidChain(chain, minChain),
          `minChain ${minChain}, length ${len}, second ${second}`,
        );
      }
    }
  }
});

test('chain multiplier agrees for lengths 0-30', () => {
  for (let len = 0; len <= 30; len++) {
    const chain = Array.from({ length: len }, (_, i) => tile(i, 0, 4));
    assert.strictEqual(
      gameWith({ chain }).getChainMultiplier(), engine.chainMultiplier(len), `length ${len}`,
    );
  }
});

// --- 3. the merge ----------------------------------------------------------

function runBoth(rowValues, chainIndexes, blockers = {}) {
  const build = () => [rowValues.map((v, x) => tile(x, 0, v, blockers[x] || {}))];
  const gGrid = build();
  const g = gameWith(Object.assign({}, UI_STUBS, {
    grid: gGrid, gridWidth: rowValues.length, gridHeight: 1,
    chain: chainIndexes.map((i) => gGrid[0][i]), score: 0, moves: 0, animating: false,
  }));
  g.executeChain();
  const eGrid = build();
  const state = {
    grid: eGrid, gridWidth: rowValues.length, gridHeight: 1,
    score: 0, moves: 0, minChain: 2, tileScale: 1,
  };
  const points = engine.executeChain(state, chainIndexes.map((i) => eGrid[0][i]));
  return { g, gGrid, state, eGrid, points };
}

test('merges agree at every multiplier tier, on board and on score', async () => {
  const cases = [
    { name: 'length 2 (multiplier 1)', values: [4, 4], chain: [0, 1] },
    { name: 'length 3 (multiplier 1.5)', values: [4, 4, 8], chain: [0, 1, 2] },
    { name: 'length 5 (multiplier 2)', values: [2, 2, 4, 8, 16], chain: [0, 1, 2, 3, 4] },
    { name: 'length 7 (multiplier 3)', values: [2, 2, 4, 4, 8, 8, 16], chain: [0, 1, 2, 3, 4, 5, 6] },
    { name: 'length 9 (multiplier 5)', values: [2, 2, 2, 4, 4, 8, 8, 16, 32], chain: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  ];
  for (const c of cases) {
    const { g, gGrid, state, eGrid, points } = runBoth(c.values, c.chain);
    assert.deepStrictEqual(board(gGrid), board(eGrid), `board differs: ${c.name}`);
    // state.score, not the returned points - comparing to `points` let a mutant
    // that deleted `state.score += points` survive.
    assert.strictEqual(g.score, state.score, `score differs: ${c.name}`);
    assert.strictEqual(g.score, points, `returned points differ: ${c.name}`);
    assert.strictEqual(g.moves, state.moves, `move count differs: ${c.name}`);
  }
  await afterDeferredCycle();
});

test('a bomb in the FINAL position is defused and survives, in both', async () => {
  const bomb = { blocker: BLOCKER_TYPES.BOMB, bombTimer: 3 };
  const { gGrid, eGrid } = runBoth([4, 4, 8], [0, 1, 2], { 2: bomb });
  assert.deepStrictEqual(board(gGrid), board(eGrid));
  for (const [label, grid] of [['game', gGrid], ['engine', eGrid]]) {
    assert.strictEqual(grid[0][2].blocker, null, `${label}: defused`);
    assert.strictEqual(grid[0][2].bombTimer, 0, `${label}: timer cleared`);
    assert.strictEqual(grid[0][2].value, 16, `${label}: holds the sum`);
  }
  await afterDeferredCycle();
});

test('a bomb in a NON-final position is deleted outright, in both', async () => {
  // engine.js once claimed ending on the bomb was the only way to remove one.
  const bomb = { blocker: BLOCKER_TYPES.BOMB, bombTimer: 3 };
  const { gGrid, eGrid, state } = runBoth([4, 4, 8], [0, 1, 2], { 1: bomb });
  assert.deepStrictEqual(board(gGrid), board(eGrid));
  assert.strictEqual(gGrid[0][1], null, 'game: bomb gone from the grid');
  assert.strictEqual(eGrid[0][1], null, 'engine: bomb gone from the grid');
  assert.strictEqual(engine.checkBombs(state), false, 'engine: nothing left to explode');
  await afterDeferredCycle();
});

// --- 4. the post-merge cycle -----------------------------------------------

test('applyGravity agrees across columns, stones, ice and bombs', () => {
  // Every case has something ABOVE a blocker and space BELOW it, which is the
  // only arrangement where "stone blocks gravity" and "it does not" differ.
  // Multi-column cases are here because a single-column board cannot catch a
  // writeRow hoisted out of the column loop.
  const S = { blocker: BLOCKER_TYPES.STONE, value: 0 };
  const I = { blocker: BLOCKER_TYPES.ICE, blockerDuration: 2 };
  const B = { blocker: BLOCKER_TYPES.BOMB, bombTimer: 3 };
  const cases = [
    { name: 'tile above a stone, gap below', w: 1, rows: [[4], [S], [null]] },
    { name: 'stack above a stone, two gaps', w: 1, rows: [[4], [8], [S], [null], [null]] },
    { name: 'two stones, tile between', w: 1, rows: [[S], [4], [S], [null]] },
    { name: 'two columns, different fill', w: 2, rows: [[4, null], [null, 8], [null, null]] },
    { name: 'two columns, stone in one only', w: 2, rows: [[4, 4], [S, null], [null, null]] },
    { name: 'three columns, stones staggered', w: 3, rows: [[2, 4, 8], [S, null, null], [null, S, null]] },
    { name: 'ice above a gap (ice must FALL)', w: 1, rows: [[I], [null], [null]] },
    { name: 'bomb above a gap (bomb must FALL)', w: 1, rows: [[B], [null]] },
    { name: 'no blockers, plain fall', w: 2, rows: [[4, 8], [null, null], [16, null]] },
  ];
  for (const { name, w, rows } of cases) {
    const build = () => rows.map((row, y) => row.map((c, x) => {
      if (c === null) return null;
      if (typeof c === 'number') return tile(x, y, c);
      return tile(x, y, c.value !== undefined ? c.value : 4, c);
    }));
    const h = rows.length;
    const gGrid = build();
    gameWith({ grid: gGrid, gridWidth: w, gridHeight: h }).applyGravity();
    const eGrid = build();
    engine.applyGravity({ grid: eGrid, gridWidth: w, gridHeight: h });
    assert.deepStrictEqual(board(gGrid), board(eGrid), `gravity differs: ${name}`);
  }

  // Anti-vacuity: at least one arrangement must actually move a tile.
  const g = [[tile(0, 0, 4)], [null]];
  gameWith({ grid: g, gridWidth: 1, gridHeight: 2 }).applyGravity();
  assert.ok(g[1][0] !== null && g[0][0] === null, 'applyGravity moved nothing - vacuous');
});

test('spawnNewTiles agrees on values, positions, and how many draws it takes', () => {
  // Draws sit on and around every threshold in both implementations
  // (0.5/0.6/0.8/0.9/0.95), so no branch goes unexercised.
  const draws = [0.0, 0.5, 0.55, 0.6, 0.61, 0.79, 0.8, 0.89, 0.9, 0.91, 0.94, 0.95, 0.99];
  for (const tileScale of [1, 2, 8]) {
    // One shared counter, so over- or under-consumption of the stream shows up.
    const counter = { game: 0, engine: 0 };
    const feed = (who) => () => draws[counter[who]++ % draws.length];
    const build = () => [
      [null, tile(1, 0, 4)], [tile(0, 1, 8), null], [null, null], [null, null],
    ];
    const gGrid = build();
    gameWith({
      grid: gGrid, gridWidth: 2, gridHeight: 4, tileScale, random: feed('game'),
    }).spawnNewTiles();
    const eGrid = build();
    engine.spawnNewTiles(
      { grid: eGrid, gridWidth: 2, gridHeight: 4, tileScale }, feed('engine'),
    );
    assert.deepStrictEqual(board(gGrid), board(eGrid), `spawn differs at scale ${tileScale}`);
    assert.strictEqual(
      counter.game, counter.engine,
      `draw counts differ at scale ${tileScale}: game ${counter.game}, engine ${counter.engine}`
      + ' - seeded replay would desync',
    );
    assert.ok(counter.game >= 6, 'fewer draws than empty cells - spawn did nothing');
  }
});

test('tickBlockers agrees on ice thawing and bomb countdown', () => {
  for (const duration of [1, 2, 3]) {
    for (const timer of [1, 2, 5]) {
      const build = () => [[
        tile(0, 0, 4, { blocker: BLOCKER_TYPES.ICE, blockerDuration: duration }),
        tile(1, 0, 8, { blocker: BLOCKER_TYPES.BOMB, bombTimer: timer }),
        tile(2, 0, 0, { blocker: BLOCKER_TYPES.STONE }),
        tile(3, 0, 16),
      ]];
      const gGrid = build();
      // gameWith, not UI_STUBS - UI_STUBS no-ops tickBlockers.
      gameWith({ grid: gGrid, gridWidth: 4, gridHeight: 1 }).tickBlockers();
      const eGrid = build();
      engine.tickBlockers({ grid: eGrid, gridWidth: 4, gridHeight: 1 });
      assert.deepStrictEqual(
        board(gGrid), board(eGrid),
        `tick differs: ice duration ${duration}, bomb timer ${timer}`,
      );
    }
  }
});

test('checkBombs agrees in BOTH directions', () => {
  // The engine returns a boolean; the game sets gameOver. Compare those.
  const cases = [
    { name: 'bomb at timer 0 explodes', timer: 0, expected: true },
    { name: 'bomb below zero explodes', timer: -2, expected: true },
    { name: 'bomb at timer 1 does not', timer: 1, expected: false },
    { name: 'no bomb at all', timer: null, expected: false },
  ];
  for (const { name, timer, expected } of cases) {
    const build = () => [[
      tile(0, 0, 4),
      timer === null ? tile(1, 0, 8)
        : tile(1, 0, 8, { blocker: BLOCKER_TYPES.BOMB, bombTimer: timer }),
    ]];
    const eResult = engine.checkBombs({ grid: build(), gridWidth: 2, gridHeight: 1 });
    // NOT UI_STUBS: it contains a no-op checkBombs, which would replace the
    // very method under test. Only the two calls checkBombs itself makes are
    // stubbed here.
    const g = gameWith({
      grid: build(), gridWidth: 2, gridHeight: 1, gameOver: false,
      showGameOver() {}, finishAuthoring() {},
    });
    g.checkBombs();
    assert.strictEqual(eResult, expected, `engine wrong: ${name}`);
    assert.strictEqual(g.gameOver, expected, `game wrong: ${name}`);
    assert.strictEqual(eResult, g.gameOver, `the two disagree: ${name}`);
  }
});

// --- 5. what this file still does NOT compare ------------------------------

test('the list of uncompared behaviour is accurate', () => {
  // Not a behavioural check - a guard on this file's own honesty. The previous
  // version named three gaps when there were nine, which is exactly the kind of
  // unenforced claim this file exists to replace.
  const gameOnly = ['checkWinLose', 'hasValidMoves', 'undo', 'saveState'];
  for (const name of gameOnly) {
    assert.strictEqual(typeof Game.prototype[name], 'function', `${name} missing from Game`);
    assert.strictEqual(
      engine[name], undefined,
      `engine.js now has ${name} - compare it here instead of listing it as a gap`,
    );
  }

  // Present in engine.js and NOT compared against game.js by this file. Listed
  // so the hole is visible. Shrinking this list is the way to improve coverage.
  const uncompared = ['findTopChains', 'findBestChain', 'findGreedyChains', 'buildGreedyChain'];
  for (const name of uncompared) {
    assert.strictEqual(
      typeof engine[name], 'function',
      `${name} left engine.js - update this list`,
    );
  }
  // game.js's own chain traversal, which the above reimplement without comparison.
  assert.strictEqual(typeof Game.prototype.canFormValidChain, 'function');
});
