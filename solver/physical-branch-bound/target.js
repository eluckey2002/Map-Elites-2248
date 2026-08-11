const { createHash } = require('node:crypto');
const { LEVELS } = require('../../src/game');
const { makeRng, createLevelState } = require('../engine');
const { makeFrozenSpawnValues, findBeamWitness, replayFrozenWitness } = require('../exact-score');
const { searchPhysicalTarget } = require('./index');

function frozenIdentity(state, spawnValues) {
  const initial = state.grid.flat().map((tile) => tile.value);
  return createHash('sha256').update(Buffer.from([...initial, ...spawnValues])).digest('hex');
}

function runTarget() {
  const level = LEVELS.find((entry) => entry.level === 26);
  if (!level) throw new Error('Level 26 is missing');
  const state = createLevelState(level, makeRng(0));
  const spawnValues = makeFrozenSpawnValues(level, 0);
  const guide = findBeamWitness({ level, seed: 0, width: 128, actionsPerState: 32 });
  const guideReplay = replayFrozenWitness({ level, seed: 0, witness: guide.witness });
  const started = Date.now();
  const result = searchPhysicalTarget({
    state,
    spawnValues,
    target: 13000,
    compatibilityDepth: 2,
    maxNodes: 1,
    maxExpandedPerNode: 1,
    preferredWitness: guide.witness,
    replayLevel: level,
    seed: 0,
  });
  const pruningInvariant = result.pruneReceipts.every(
    (receipt) => receipt.strict && receipt.tailUpperBound < receipt.remainingTarget,
  );
  return {
    kind: 'exact-physical-prefix-with-certified-value-compatible-tail',
    level: 26,
    seed: 0,
    target: 13000,
    inputIdentity: frozenIdentity(state, spawnValues),
    verdict: result.verdict,
    complete: result.complete,
    scoreClaim: result.scoreClaim,
    guideLowerBound: guide.score,
    guideMoves: guide.witness.length,
    guideReplay,
    bestObservedScore: result.bestObservedScore,
    finitePhysicalBound: { maxNodes: 1, maxExpandedPerNode: 1 },
    tail: {
      compatibilityDepth: 2,
      terminalRelaxation: 'complete mass/cursor dynamic program',
      capBehavior: 'fail closed; no pruning value returned',
    },
    stats: result.stats,
    pruningInvariant,
    pruneReceipts: result.pruneReceipts,
    tailAssessments: result.tailAssessments,
    elapsedMs: Date.now() - started,
    witness: result.witness,
    replay: result.replay,
  };
}

if (require.main === module) {
  const result = runTarget();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.verdict === 'SAT' || (result.verdict === 'UNSAT' && result.complete) ? 0 : 2;
}

module.exports = { runTarget };
