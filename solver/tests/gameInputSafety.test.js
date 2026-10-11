const { test, mock } = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../../src/game.js');

/**
 * Two player-facing input bugs from the 2026-10-11 repo review:
 * Enter pressed on any button made a move, and Restart during the 200 ms
 * merge animation let the old move's callback run on the freshly loaded board.
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
