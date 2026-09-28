const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
} = require('../engine');
const { analyzeMove, chooseMove } = require('../bot');
const { routeSignature } = require('../route-diverse-challenger');
const {
  analyzeContinuationDensityMove,
  chooseContinuationDensityMove,
} = require('../continuation-density-challenger');

const recording = require('../../play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json');
const LOOKAHEAD_BASE = 987654321;

function mapRecordedChain(state, recorded) {
  return recorded.tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    assert.ok(tile, `missing recorded tile at ${x},${y}`);
    assert.equal(tile.value, value, `wrong recorded value at ${x},${y}`);
    return tile;
  });
}

function trainingState() {
  const level = LEVELS.find(({ level: number }) => number === recording.candidateLevel);
  const rng = makeRng(recording.seed);
  const state = createLevelState(level, rng);
  executeChain(state, mapRecordedChain(state, recording.chains[0]));
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return { rng, state };
}

function finishWithChampion(state, rng) {
  while (state.moves < state.maxMoves && state.score < state.targetScore) {
    const moveIndex = state.moves;
    const chain = chooseMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) break;
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) break;
  }
  return state;
}

test('the broadened rule selects the densest equal-score route on the training decision', () => {
  const { rng, state } = trainingState();
  const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + 1) };
  const ownerSignature = routeSignature(mapRecordedChain(state, recording.chains[1]));
  const champion = analyzeMove(state, options);
  const analysis = analyzeContinuationDensityMove(state, options);

  assert.equal(analysis.densityApplied, true);
  assert.equal(analysis.selectedImmediatePoints, 5120);
  assert.ok(analysis.selectedDensity > analysis.championDensity);
  assert.notEqual(routeSignature(analysis.selectedChain), ownerSignature);
  assert.notEqual(routeSignature(analysis.selectedChain), routeSignature(analysis.championChain));
  assert.equal(routeSignature(champion.selectedChain), routeSignature(analysis.championChain));

  executeChain(state, analysis.selectedChain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const finished = finishWithChampion(state, rng);

  assert.equal(finished.score >= finished.targetScore, true);
  assert.ok(finished.moves <= 16);
});

test('the broadened rule returns the exact champion move when no denser equal-score route exists', () => {
  const state = {
    gridWidth: 2,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
    score: 0,
    targetScore: 100,
    moves: 0,
    maxMoves: 5,
    grid: [
      [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 2 }],
      [{ x: 0, y: 1, value: 2 }, { x: 1, y: 1, value: 4 }],
    ],
  };
  const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE) };
  const champion = chooseMove(state, options);
  const analysis = analyzeContinuationDensityMove(state, options);

  assert.equal(analysis.densityApplied, false);
  assert.equal(routeSignature(analysis.selectedChain), routeSignature(champion));
  assert.equal(routeSignature(chooseContinuationDensityMove(state, options)), routeSignature(champion));
});

test('bomb and immediate-target decisions remain under full champion control', () => {
  const bombState = {
    gridWidth: 2,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
    score: 0,
    targetScore: 100,
    moves: 0,
    maxMoves: 5,
    grid: [
      [{ x: 0, y: 0, value: 2, blocker: 'bomb', bombTimer: 2 }, { x: 1, y: 0, value: 2 }],
      [{ x: 0, y: 1, value: 2 }, { x: 1, y: 1, value: 8 }],
    ],
  };
  const targetState = structuredClone(bombState);
  targetState.grid[0][0].blocker = null;
  targetState.score = 96;
  const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE) };

  for (const state of [bombState, targetState]) {
    const champion = analyzeMove(state, options);
    const analysis = analyzeContinuationDensityMove(state, options);
    assert.equal(analysis.densityApplied, false);
    assert.equal(routeSignature(analysis.selectedChain), routeSignature(champion.selectedChain));
  }
});

test('the broadened policy contains no training-case identifiers', () => {
  const { state } = trainingState();
  const ownerSignature = routeSignature(mapRecordedChain(state, recording.chains[1]));
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'continuation-density-challenger.js'),
    'utf8',
  );

  assert.equal(source.includes(String(recording.candidateLevel)), false);
  assert.equal(source.includes(String(recording.seed)), false);
  assert.equal(source.includes('ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78'), false);
  assert.equal(source.includes(ownerSignature), false);
});
