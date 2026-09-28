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
const {
  generateRouteDiverseSupplement,
  routeSignature,
} = require('../route-diverse-challenger');
const {
  continuationDensity,
  rankByContinuationDensity,
} = require('../continuation-density-probe');

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

test('continuation density measures legal three-tile branching per usable opener', () => {
  const state = {
    gridWidth: 3,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
    grid: [
      [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 2 }, { x: 2, y: 0, value: 4 }],
      [null, { x: 1, y: 1, value: 2 }, null],
    ],
  };

  const result = continuationDensity(state);

  assert.equal(result.usableOpeners, 3);
  // Six directed equal opening pairs; four of them can reach both a third 2
  // and the 4, while the other two can reach only the remaining 2.
  assert.equal(result.continuations, 10);
  assert.equal(result.density, 10 / 3);
});

test('the generic signal sees the owner setup but honestly selects a different route', () => {
  const { rng, state } = trainingState();
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + 1);
  const owner = mapRecordedChain(state, recording.chains[1]);
  const ownerSignature = routeSignature(owner);
  const champion = analyzeMove(state, { lookaheadRngFactory });
  const selectedChampion = champion.candidates.find(({ id }) => id === champion.selectedId);
  const championCandidate = {
    chain: selectedChampion.chain.map(({ x, y }) => state.grid[y][x]),
    points: selectedChampion.immediatePoints,
  };
  const supplement = generateRouteDiverseSupplement(state, {
    searchWidth: 384,
    supplementLimit: 128,
  });
  const ranked = rankByContinuationDensity(state, supplement, lookaheadRngFactory);
  const ownerResult = ranked.find(({ signature }) => signature === ownerSignature);
  const championResult = rankByContinuationDensity(
    state,
    [championCandidate],
    lookaheadRngFactory,
  )[0];

  assert.ok(ownerResult.density > championResult.density);
  assert.notEqual(ranked[0].signature, ownerSignature);
  assert.notEqual(ranked[0].signature, routeSignature(championCandidate.chain));

  executeChain(state, ranked[0].chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const finished = finishWithChampion(state, rng);

  assert.equal(finished.score >= finished.targetScore, true);
  assert.equal(finished.moves, 16);
});

test('the probe implementation contains no training-case identifiers', () => {
  const { state } = trainingState();
  const ownerSignature = routeSignature(mapRecordedChain(state, recording.chains[1]));
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'continuation-density-probe.js'),
    'utf8',
  );

  assert.equal(source.includes(String(recording.candidateLevel)), false);
  assert.equal(source.includes(String(recording.seed)), false);
  assert.equal(source.includes('ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78'), false);
  assert.equal(source.includes(ownerSignature), false);
});
