const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  analyzePuzzle,
  descriptorFromEnvelope,
  exactScoreEnvelope,
  replayDescriptorWitnesses,
} = require('../puzzle-descriptors');

const QUALIFICATION_LEVEL = Object.freeze({
  level: 9000,
  name: 'descriptor-qualification',
  gridW: 3,
  gridH: 3,
  moves: 2,
  minChain: 3,
  tileScale: 1,
  blockers: [],
  target: 1,
});

test('exact envelope turns reachability into budget tightness and a solver-independent chain cap', () => {
  const envelope = exactScoreEnvelope({ level: QUALIFICATION_LEVEL, seed: 7, maxNodes: 250000 });
  const target = envelope.scoresUpTo[1][3];
  assert.ok(target > 0, 'qualification board needs a legal three-tile opening');

  const descriptor = descriptorFromEnvelope(envelope, target);
  assert.equal(descriptor.standing, 'exact_result');
  assert.equal(descriptor.minimumMoves, 1);
  assert.equal(descriptor.budgetTightness, 0.5);
  assert.equal(descriptor.chainLengthDependence, 3);
  assert.ok(descriptor.counterfactuals.bestScoreWithFewerMoves < target);
  assert.ok(descriptor.counterfactuals.bestScoreBelowRequiredCap < target);
});

test('descriptor witnesses replay through the real frozen transition seam', () => {
  const envelope = exactScoreEnvelope({ level: QUALIFICATION_LEVEL, seed: 7, maxNodes: 250000 });
  const target = envelope.scoresUpTo[1][3];
  const result = analyzePuzzle({ level: { ...QUALIFICATION_LEVEL, target }, seed: 7, maxNodes: 250000 });

  assert.equal(result.descriptor.reachable, true);
  assert.doesNotThrow(() => replayDescriptorWitnesses(result));
  assert.equal(result.replays.minimumMovesReplay.score >= target, true);
});

test('the real verifier seam rejects a planted bad descriptor', () => {
  const envelope = exactScoreEnvelope({ level: QUALIFICATION_LEVEL, seed: 7, maxNodes: 250000 });
  const target = envelope.scoresUpTo[1][3];
  const result = analyzePuzzle({ level: { ...QUALIFICATION_LEVEL, target }, seed: 7, maxNodes: 250000 });
  const broken = structuredClone(result);
  broken.descriptor.chainLengthDependence += 1;

  assert.throws(
    () => replayDescriptorWitnesses(broken),
    /minimum-cap witness does not use the declared maximum chain length/,
  );
});

test('a node cap stays UNKNOWN instead of becoming evidence of unreachability', () => {
  const result = analyzePuzzle({ level: QUALIFICATION_LEVEL, seed: 7, target: 1000, maxNodes: 1 });

  assert.equal(result.search.complete, false);
  assert.equal(result.descriptor.standing, 'UNKNOWN');
  assert.equal(result.descriptor.reachable, null);
});
