const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  AuthoringCapture,
  Game,
  createInitialGrid,
  customCandidateFromQuery,
  levelFromQuery,
  makeSeededRng,
  validatePlayableLevel,
} = require('../../src/game.js');

const LEVEL = {
  schemaVersion: 1,
  name: 'level-51-split-channel',
  level: 51,
  target: 750,
  tileScale: 32,
  moves: 24,
  minChain: 4,
  gridW: 5,
  gridH: 7,
  blockers: [],
  sourceShapeIdentity: 'a'.repeat(64),
};

test('candidate and seed parsing is strict and does not change shipped level query behavior', () => {
  assert.deepEqual(customCandidateFromQuery('?candidate=51&seed=1'), { level: 51, seed: 1 });
  assert.equal(customCandidateFromQuery('?candidate=51'), null);
  assert.equal(customCandidateFromQuery('?candidate=51&seed=-1'), null);
  assert.equal(customCandidateFromQuery('?candidate=51&seed=1.5'), null);
  assert.equal(customCandidateFromQuery('?level=26&seed=1'), null);
  assert.equal(levelFromQuery('?candidate=51&seed=1', 50), null);
  assert.equal(levelFromQuery('?candidate=51&seed=1&level=26', 50), 26);
});

test('seeded candidate initialization is repeatable and arbitrary-level validation fails closed', () => {
  const first = createInitialGrid(validatePlayableLevel(LEVEL), makeSeededRng(17));
  const second = createInitialGrid(validatePlayableLevel(LEVEL), makeSeededRng(17));
  const third = createInitialGrid(validatePlayableLevel(LEVEL), makeSeededRng(18));
  const values = (grid) => grid.map((row) => row.map((tile) => tile.value));

  assert.deepEqual(values(first), values(second));
  assert.notDeepEqual(values(first), values(third));
  assert.equal(first.length, 7);
  assert.equal(first[0].length, 5);
  assert.throws(() => validatePlayableLevel({ ...LEVEL, gridW: 0 }), /gridW/);
  assert.throws(() => validatePlayableLevel({ ...LEVEL, blockers: [{ type: 'stone', x: 9, y: 0 }] }), /blocker/);
  assert.throws(() => validatePlayableLevel({ ...LEVEL, tileScale: 0 }), /tileScale/);
  assert.throws(() => validatePlayableLevel({ ...LEVEL, tileScale: NaN }), /tileScale/);
  assert.throws(() => validatePlayableLevel({ ...LEVEL, tileScale: null }), /tileScale/);
});

test('authoring capture records each legal chain as ordered coordinates and values', () => {
  const capture = new AuthoringCapture({ candidateIdentity: 'b'.repeat(64), candidateLevel: 51, seed: 1 });
  const tiles = [
    { x: 3, y: 2, value: 64 },
    { x: 2, y: 1, value: 64 },
    { x: 1, y: 0, value: 128 },
    { x: 0, y: 0, value: 128 },
  ];

  capture.recordChain(tiles, 576);

  assert.deepEqual(capture.chains, [{
    tiles: [
      { x: 3, y: 2, value: 64 },
      { x: 2, y: 1, value: 64 },
      { x: 1, y: 0, value: 128 },
      { x: 0, y: 0, value: 128 },
    ],
    points: 576,
  }]);
});

test('authoring capture emits one terminal payload and ignores later terminal paths', () => {
  const submitted = [];
  const capture = new AuthoringCapture({
    candidateIdentity: 'b'.repeat(64), candidateLevel: 51, seed: 1,
    submit: (payload) => submitted.push(payload),
  });
  capture.recordChain([
    { x: 0, y: 0, value: 64 }, { x: 1, y: 0, value: 64 },
    { x: 2, y: 0, value: 128 }, { x: 3, y: 0, value: 128 },
  ], 576);

  const first = capture.finish({ outcome: 'win', reason: 'target reached', score: 800, movesUsed: 1 });
  const second = capture.finish({ outcome: 'lose', reason: 'out of moves', score: 800, movesUsed: 1 });

  assert.equal(first, true);
  assert.equal(second, false);
  assert.equal(submitted.length, 1);
  assert.deepEqual(submitted[0], {
    schemaVersion: 1,
    candidateIdentity: 'b'.repeat(64),
    candidateLevel: 51,
    seed: 1,
    outcome: 'win',
    reason: 'target reached',
    score: 800,
    movesUsed: 1,
    chains: capture.chains,
  });
});

test('candidate undo restores capture length and seeded RNG state', () => {
  const previousDocument = global.document;
  const undoButton = { disabled: true };
  global.document = { getElementById: () => undoButton };

  try {
    const capture = new AuthoringCapture({
      candidateIdentity: 'b'.repeat(64), candidateLevel: 51, seed: 17,
    });
    const game = Object.assign(Object.create(Game.prototype), {
      animating: false,
      authoringCapture: capture,
      bestChain: 0,
      chain: [],
      gameOver: false,
      grid: [[{ x: 0, y: 0, value: 64, blocker: null, blockerDuration: 0, bombTimer: 0 }]],
      history: [],
      levelComplete: false,
      maxHistory: 10,
      moves: 0,
      random: makeSeededRng(17),
      score: 0,
      hideModal() {},
      render() {},
      updateChainIndicator() {},
      updateUI() {},
    });
    const expected = makeSeededRng(17);
    assert.equal(game.random(), expected());
    assert.equal(game.random(), expected());

    game.saveState();
    capture.recordChain([{ x: 0, y: 0, value: 64 }], 64);
    game.random();
    game.random();
    game.undo();

    assert.equal(capture.chains.length, 0);
    assert.equal(game.random(), expected());
  } finally {
    global.document = previousDocument;
  }
});
