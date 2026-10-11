const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { Game, LEVELS, formatTileValue } = require('../../src/game.js');

/**
 * Player-facing bugs from the 2026-10-11 repo review: Enter pressed on any
 * button made a move; Restart during the 200 ms merge animation let the old
 * move's callback run on the freshly loaded board; a dealt board with no legal
 * chain left the player stuck; and big values were rounded to labels that
 * looked equal but would not chain.
 */

function withDom(run) {
  const previousDocument = global.document;
  const previousLocalStorage = global.localStorage;
  const handlers = {};
  global.document = {
    getElementById: () => ({ addEventListener() {}, textContent: '' }),
    addEventListener: (type, fn) => { handlers[type] = fn; },
  };
  global.localStorage = { getItem: () => null, setItem() {} };
  try {
    return run(handlers);
  } finally {
    global.document = previousDocument;
    global.localStorage = previousLocalStorage;
  }
}

function headlessGame() {
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    canvas: { addEventListener() {} },
    history: [],
    maxHistory: 10,
    animations: [],
    unlockedLevel: 1,
    setupCanvas() {},
    render() {},
    updateUI() {},
    updateChainIndicator() {},
    showMultiplierPopup() {},
    showModal() {},
    showGameOver(message) { this.gameOverMessage = message; },
    hideModal() {},
    submitPlaySession() {},
  });
  return game;
}

function snapshot(game) {
  return JSON.stringify({
    grid: game.grid.map(row => row.map(tile => tile && [tile.value, tile.blocker || null, tile.blockerDuration ?? null, tile.bombTimer ?? null])),
    score: game.score,
    moves: game.moves,
    rng: [game.random(), game.random(), game.random()],
  });
}

function firstPair(game) {
  for (let y = 0; y < game.gridHeight; y++) {
    for (let x = 0; x < game.gridWidth; x++) {
      const a = game.grid[y][x];
      if (!a || a.isBlocked()) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
        const b = game.grid[y + dy]?.[x + dx];
        if (b && !b.isBlocked() && b.value === a.value) return [a, b];
      }
    }
  }
  throw new Error('fixture board has no legal pair');
}

// Level 25 carries an ice blocker, so a stray blocker tick shows on the board.
const LEVEL = 25;
const SEED = 12345;

test('Restart during the merge animation leaves the new board untouched', () => {
  withDom(() => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const fresh = headlessGame();
      fresh.loadLevel(LEVEL, { seed: SEED });
      const expected = snapshot(fresh);

      const game = headlessGame();
      game.loadLevel(LEVEL, { seed: SEED });
      game.chain = firstPair(game);
      game.executeChain();
      assert.equal(game.animating, true);

      game.reloadCurrentLevel();
      mock.timers.tick(250);

      assert.equal(game.moves, 0);
      assert.equal(game.animating, false);
      assert.equal(snapshot(game), expected);
    } finally {
      mock.timers.reset();
    }
  });
});

test('a normal move still finishes after the animation', () => {
  withDom(() => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      const game = headlessGame();
      game.loadLevel(LEVEL, { seed: SEED });
      game.chain = firstPair(game);
      game.executeChain();
      mock.timers.tick(250);
      assert.equal(game.animating, false);
      assert.equal(game.moves, 1);
      assert.ok(game.grid.every(row => row.every(Boolean)), 'board refilled');
    } finally {
      mock.timers.reset();
    }
  });
});

function pressEnter(handlers, target) {
  let prevented = false;
  handlers.keydown({ key: 'Enter', target, preventDefault: () => { prevented = true; } });
  return prevented;
}

function element(tag) {
  const el = { tagName: tag.toUpperCase() };
  el.closest = (selector) => (selector.split(',').some(s => s.trim() === tag) ? el : null);
  return el;
}

test('Enter on a focused button does not submit the chain', () => {
  withDom((handlers) => {
    const game = headlessGame();
    let submitted = 0;
    game.submitChain = () => { submitted++; };
    game.setupEventListeners();

    const prevented = pressEnter(handlers, element('button'));
    assert.equal(submitted, 0);
    assert.equal(prevented, false, 'the button keeps its own Enter behaviour');
  });
});

test('Enter with nothing focused still submits the chain', () => {
  withDom((handlers) => {
    const game = headlessGame();
    let submitted = 0;
    game.submitChain = () => { submitted++; };
    game.setupEventListeners();

    const body = { tagName: 'BODY', closest: () => null };
    assert.equal(pressEnter(handlers, body), true);
    assert.equal(submitted, 1);
  });
});

test('a dealt board with no legal chain ends at once with a message', () => {
  withDom(() => {
    const game = headlessGame();
    // 2/4 over 8/16 in 2x2 blocks: no tile touches an equal value, diagonals included.
    const draws = [[0.1, 0.6], [0.9, 0.99]];
    let i = 0;
    const width = LEVELS[0].gridW;
    const rng = () => {
      const row = Math.floor(i / width);
      const col = i % width;
      i++;
      return draws[row % 2][col % 2];
    };
    game.initializeLevel(LEVELS[0], rng);
    assert.equal(game.gameOver, true);
    assert.equal(game.gameOverMessage, 'No valid moves!');
  });
});

test('a playable dealt board is left alone', () => {
  withDom(() => {
    const game = headlessGame();
    game.loadLevel(LEVEL, { seed: SEED });
    assert.equal(game.gameOver, false);
    assert.equal(game.gameOverMessage, undefined);
  });
});

test('tile labels are exact, so values that do not chain never look equal', () => {
  assert.equal(formatTileValue(12288), '12288');
  assert.notEqual(formatTileValue(12288), formatTileValue(12400));
  assert.equal(formatTileValue(1500000), '1500000');
});
