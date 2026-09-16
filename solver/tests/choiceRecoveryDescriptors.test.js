const { test } = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const {
  analyzeChoiceRecovery,
  canStartLegalChain,
  replayChoiceRecoveryAnalysis,
  viableStartFraction,
} = require('../choice-recovery-descriptors');

function tile(x, y, value) {
  return { x, y, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
}

function stateFrom(values, minChain = 3) {
  return {
    grid: values.map((row, y) => row.map((value, x) => tile(x, y, value))),
    gridWidth: values[0].length,
    gridHeight: values.length,
    minChain,
  };
}

test('viable-start fraction distinguishes an open board from isolated pairs', () => {
  const open = stateFrom([[2, 2, 2, 2, 2, 2]]);
  const isolated = stateFrom([[2, 2, 16, 4, 4, 32]]);
  assert.deepEqual(viableStartFraction(open), { viable: 6, available: 6, fraction: 1 });
  assert.equal(viableStartFraction(isolated).fraction, 0);
  assert.equal(canStartLegalChain(isolated, isolated.grid[0][0]), false);
});

test('uniform scale preserves the choice and recovery proxies', () => {
  const base = {
    level: 'scale-control', target: 90, moves: 5, minChain: 2,
    tileScale: 1, gridW: 5, gridH: 4, blockers: [],
  };
  const scaled = { ...base, level: 'scale-control-x32', target: base.target * 32, tileScale: 32 };
  const search = { width: 8, actionsPerState: 8, pathWidth: 1 };
  const first = analyzeChoiceRecovery({ level: base, seed: 9, search, recoveryAlternatives: 4 });
  const second = analyzeChoiceRecovery({ level: scaled, seed: 9, search, recoveryAlternatives: 4 });
  assert.equal(first.standing, 'bounded_proxy_observation');
  assert.deepEqual(first.descriptors, second.descriptors);
  assert.deepEqual(first.choiceTrace, second.choiceTrace);
  assert.equal(first.recovery.tested, second.recovery.tested);
});

test('bounded misses remain UNKNOWN', () => {
  const level = {
    level: 'unknown-control', target: Number.MAX_SAFE_INTEGER, moves: 1, minChain: 3,
    tileScale: 1, gridW: 3, gridH: 3, blockers: [],
  };
  const result = analyzeChoiceRecovery({
    level,
    seed: 4,
    search: { width: 2, actionsPerState: 2, pathWidth: 1 },
    recoveryAlternatives: 2,
  });
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.choiceStanding, 'exact_initial_state');
  assert.equal(result.descriptors.oneDetourRecoveryWitnessRate, null);
});

test('a calibrated move-slack control increases bounded recovery witnesses', () => {
  const source = LEVELS.find(({ level }) => level === 53);
  const search = { width: 12, actionsPerState: 16, pathWidth: 2 };
  const tight = analyzeChoiceRecovery({
    level: { ...source, moves: 14 }, seed: 32300000, search,
    recoveryAlternatives: 8, recoveryCandidatePool: 64,
  });
  const slack = analyzeChoiceRecovery({
    level: { ...source, moves: 16 }, seed: 32300000, search,
    recoveryAlternatives: 8, recoveryCandidatePool: 64,
  });
  assert.equal(tight.descriptors.initialViableStartFraction,
    slack.descriptors.initialViableStartFraction);
  assert.equal(tight.descriptors.oneDetourRecoveryWitnessRate, 0.75);
  assert.equal(slack.descriptors.oneDetourRecoveryWitnessRate, 1);
  assert.equal(replayChoiceRecoveryAnalysis({ ...source, moves: 14 }, tight), true);

  const planted = structuredClone(tight);
  planted.recovery.trials[0].continuationWitness[0][0] = [[99, 99]];
  assert.throws(
    () => replayChoiceRecoveryAnalysis({ ...source, moves: 14 }, planted),
    /unavailable tile/,
  );
});
