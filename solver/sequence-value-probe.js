const {
  makeRng,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
  checkBombs,
  isBlockedTile,
} = require('./engine');
const { chooseMove } = require('./bot');
const { normalizedBuiltReservoirHarvest } = require('./built-reservoir-probe');

const THREE_STEP_HORIZON = 3;
const LOOKAHEAD_BASE = 987654321;
const INITIAL_MAX_MULTIPLIER = 16;

function sequenceCostFromOutcome({ status, continuationMoves, score, targetScore }) {
  if (!['win', 'active', 'loss'].includes(status)) throw new Error(`unknown status ${status}`);
  if (!Number.isInteger(continuationMoves) || continuationMoves < 0) {
    throw new TypeError('continuationMoves must be a non-negative integer');
  }
  if (!Number.isFinite(score) || !Number.isFinite(targetScore) || targetScore <= 0) {
    throw new TypeError('score and targetScore must be finite, with positive targetScore');
  }
  const gap = Math.max(0, targetScore - score) / targetScore;
  if (status === 'win') return continuationMoves;
  if (status === 'active') return 4 + gap;
  return 6 + gap;
}

function normalizedBuiltMaterial(state) {
  const scale = state.tileScale || 1;
  const cutoff = INITIAL_MAX_MULTIPLIER * scale;
  let count = 0;
  let value = 0;
  for (const row of state.grid) {
    for (const tile of row) {
      if (!tile || isBlockedTile(tile) || tile.value <= cutoff) continue;
      count += 1;
      value += tile.value;
    }
  }
  return { count, value: value / scale };
}

function stateDiagnostics(state) {
  return {
    normalizedBuiltMaterial: normalizedBuiltMaterial(state),
    normalizedBuiltReservoirHarvest: normalizedBuiltReservoirHarvest(state),
  };
}

function snapshotChain(chain) {
  return chain.map(({ x, y, value }) => ({ x, y, value }));
}

function measureThreeStepTargetCost(state, rng, {
  absoluteMoveIndex = state.moves,
  chooser = chooseMove,
  horizon = THREE_STEP_HORIZON,
  lookaheadBase = LOOKAHEAD_BASE,
} = {}) {
  if (!Number.isInteger(horizon) || horizon < 0) throw new TypeError('horizon must be a non-negative integer');
  if (!Number.isInteger(absoluteMoveIndex) || absoluteMoveIndex < 0) {
    throw new TypeError('absoluteMoveIndex must be a non-negative integer');
  }

  const startScore = state.score;
  const trace = [];
  let continuationPoints = 0;
  let continuationMoves = 0;
  let chooserCalls = 0;

  function result(status, reason) {
    return {
      status,
      reason,
      cost: sequenceCostFromOutcome({
        status,
        continuationMoves,
        score: state.score,
        targetScore: state.targetScore,
      }),
      continuationMoves,
      chooserCalls,
      continuationPoints,
      scoreGain: state.score - startScore,
      finalScore: state.score,
      targetGap: Math.max(0, state.targetScore - state.score),
      trace,
      finalDiagnostics: stateDiagnostics(state),
    };
  }

  if (checkBombs(state)) return result('loss', 'bomb');
  if (state.score >= state.targetScore) return result('win', 'target');
  if (state.moves >= state.maxMoves) return result('loss', 'move-budget');

  while (continuationMoves < horizon) {
    const moveIndex = absoluteMoveIndex + continuationMoves;
    const chain = chooser(state, {
      lookaheadRngFactory: () => makeRng(lookaheadBase + moveIndex),
    });
    chooserCalls += 1;
    if (!chain) return result('loss', 'no-legal-move');

    const chainBeforeMutation = snapshotChain(chain);
    const points = executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    continuationMoves += 1;
    continuationPoints += points;
    trace.push({ moveIndex, points, chain: chainBeforeMutation });

    if (checkBombs(state)) return result('loss', 'bomb');
    if (state.score >= state.targetScore) return result('win', 'target');
    if (state.moves >= state.maxMoves) return result('loss', 'move-budget');
  }

  return result('active', 'horizon');
}

module.exports = {
  INITIAL_MAX_MULTIPLIER,
  LOOKAHEAD_BASE,
  THREE_STEP_HORIZON,
  measureThreeStepTargetCost,
  normalizedBuiltMaterial,
  sequenceCostFromOutcome,
  stateDiagnostics,
};
