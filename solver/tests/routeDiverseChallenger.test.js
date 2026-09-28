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
  isMergeableSum,
} = require('../engine');
const { analyzeMove, chooseMove, DEFAULT_PARAMS } = require('../bot');
const {
  SUPPLEMENT_LIMIT,
  analyzeRouteDiverseMove,
  chooseRouteDiverseMove,
  generateRouteDiverseSupplement,
  routeSignature,
  scoreSupplementCandidate,
} = require('../route-diverse-challenger');

const recording = require('../../play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json');
const LOOKAHEAD_BASE = 987654321;

function chainKey(chain) {
  return chain && chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function mapRecordedChain(state, recorded) {
  return recorded.tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    assert.ok(tile, `missing recorded tile at ${x},${y}`);
    assert.equal(tile.value, value, `wrong recorded value at ${x},${y}`);
    return tile;
  });
}

function trainingState() {
  const level = LEVELS.find(({ level }) => level === recording.candidateLevel);
  const rng = makeRng(recording.seed);
  const state = createLevelState(level, rng);
  executeChain(state, mapRecordedChain(state, recording.chains[0]));
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return { level, rng, state };
}

function finishWithChampion(state, rng, startMoveIndex) {
  for (let moveIndex = startMoveIndex; moveIndex < state.maxMoves; moveIndex += 1) {
    const chain = chooseMove(state, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex),
    });
    if (!chain) break;
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state) || state.score >= state.targetScore) break;
  }
  return state;
}

test('route-diverse supplement recovers the owner move-two afterstate', () => {
  const { state } = trainingState();
  const owner = mapRecordedChain(state, recording.chains[1]);
  const expected = routeSignature(owner);
  const supplement = generateRouteDiverseSupplement(state);

  assert.ok(supplement.length > 0);
  assert.ok(supplement.length <= SUPPLEMENT_LIMIT);
  assert.ok(supplement.some(({ chain }) => routeSignature(chain) === expected));
  assert.equal(new Set(supplement.map(({ chain }) => routeSignature(chain))).size, supplement.length);
  for (const { chain } of supplement) {
    const sum = chain.reduce((total, tile) => total + tile.value, 0);
    assert.equal(isMergeableSum(sum, state.tileScale), true);
  }
});

test('the recovered training route leaves the unchanged champion a move-17 finish', () => {
  const { rng, state } = trainingState();
  const owner = mapRecordedChain(state, recording.chains[1]);
  executeChain(state, owner);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);

  const finished = finishWithChampion(state, rng, 2);
  assert.equal(finished.score >= finished.targetScore, true);
  assert.equal(finished.moves, 17);
});

test('supplement scoring exactly matches the champion scorer on shared candidates', () => {
  const { state } = trainingState();
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + 1);
  const champion = analyzeMove(state, { lookaheadRngFactory });

  for (const described of champion.candidates) {
    const candidate = {
      chain: described.chain.map(({ x, y }) => state.grid[y][x]),
      points: described.immediatePoints,
    };
    assert.ok(Math.abs(
      scoreSupplementCandidate(state, candidate, lookaheadRngFactory, DEFAULT_PARAMS)
        - described.policyScore,
    ) < 1e-9);
  }
});

test('the unchanged scorer rejects the recovered training route', () => {
  const { state } = trainingState();
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + 1);
  const champion = analyzeMove(state, { lookaheadRngFactory });
  const selected = champion.candidates.find(({ id }) => id === champion.selectedId);
  const owner = {
    chain: mapRecordedChain(state, recording.chains[1]),
    points: recording.chains[1].points,
  };
  const ownerScore = scoreSupplementCandidate(
    state,
    owner,
    lookaheadRngFactory,
    DEFAULT_PARAMS,
  );
  const challenger = analyzeRouteDiverseMove(state, { lookaheadRngFactory });

  assert.ok(ownerScore < selected.policyScore);
  assert.equal(challenger.supplementWon, false);
  assert.equal(chainKey(challenger.selectedChain), chainKey(challenger.championChain));
});

test('duplicate and non-mergeable routes never enter the supplement', () => {
  const state = {
    gridWidth: 3,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
    score: 0,
    targetScore: 100,
    moves: 0,
    maxMoves: 5,
    grid: [
      [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 2 }, { x: 2, y: 0, value: 4 }],
      [{ x: 0, y: 1, value: 2 }, { x: 1, y: 1, value: 2 }, { x: 2, y: 1, value: 2 }],
    ],
  };
  const supplement = generateRouteDiverseSupplement(state);
  const signatures = supplement.map(({ chain }) => routeSignature(chain));

  assert.equal(new Set(signatures).size, signatures.length);
  assert.equal(supplement.some(({ chain }) => (
    !isMergeableSum(chain.reduce((sum, tile) => sum + tile.value, 0), state.tileScale)
  )), false);
});

test('the challenger returns the exact champion chain when no supplement wins', () => {
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
  const analysis = analyzeRouteDiverseMove(state, options);

  assert.equal(analysis.supplementWon, false);
  assert.equal(chainKey(analysis.selectedChain), chainKey(chooseMove(state, options)));
  assert.equal(chainKey(chooseRouteDiverseMove(state, options)), chainKey(chooseMove(state, options)));

  const mutatedChampion = analysis.championChain.slice().reverse();
  assert.notEqual(chainKey(mutatedChampion), chainKey(analysis.selectedChain));
});
