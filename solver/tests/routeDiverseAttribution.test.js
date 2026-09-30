const test = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../engine');
const { analyzeRouteDiverseMove } = require('../route-diverse-challenger');
const { attributedAnalysis, trainingScoreGate, validateAttribution } = require('../../tools/attribute-route-diverse-cost');

const recording = require('../../play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json');

function stateBeforeOwnerMoveTwo() {
  const level = LEVELS.find(({ level: number }) => number === recording.candidateLevel);
  const rng = makeRng(recording.seed);
  const state = createLevelState(level, rng);
  const chain = recording.chains[0].tiles.map(({ x, y }) => state.grid[y][x]);
  executeChain(state, chain);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return state;
}

test('external attribution preserves the real challenger decision while accounting for its scored supplement', () => {
  const state = stateBeforeOwnerMoveTwo();
  const options = {
    diversity: { searchWidth: 384, supplementLimit: 128 },
    lookaheadRngFactory: () => makeRng(987654322),
  };
  const plain = analyzeRouteDiverseMove(state, options);
  const observed = attributedAnalysis(state, options);

  const key = (chain) => chain.map(({ x, y }) => `${x},${y}`).join('|');
  const selected = observed.winner
    && observed.winner.policyScore > observed.champion.candidates.find(({ id }) => id === observed.champion.selectedId).policyScore
    ? observed.winner.chain
    : observed.championChain;
  assert.equal(key(selected), key(plain.selectedChain));
  assert.equal(observed.supplement.length, plain.supplement.length);
  assert.ok(observed.generated.length >= observed.supplement.length);
  assert.ok(observed.timings.supplementScoringNs > 0);
});

test('attribution validator rejects a planted scored-supplement accounting defect', () => {
  const row = {
    puzzleIdentity: 'fixture',
    timings: {
      championAnalysisNs: 1,
      supplementGenerationNs: 1,
      supplementScoringNs: 1,
      winnerSelectionNs: 1,
    },
    generatedSupplementCandidates: 2,
    scoredSupplementCandidates: 1,
    supplementCandidates: 2,
  };
  assert.throws(() => validateAttribution(row), /scored\/supplement count mismatch/);
});

test('the immediate-point scoring-gate candidate retains the frozen human route', () => {
  const gate = trainingScoreGate();
  assert.equal(gate.ownerImmediatePoints, gate.championImmediatePoints);
  assert.equal(gate.ownerSurvivesImmediatePointGate, true);
});
