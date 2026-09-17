const { test } = require('node:test');
const assert = require('node:assert/strict');

const { measureHarvest, parseArgs } = require('../board-map-elites');

const POSITIVE_CONTROL = Object.freeze({
  schemaVersion: 1,
  name: 'harvest-positive-control',
  level: 56,
  target: 124000,
  tileScale: 32,
  moves: 23,
  minChain: 3,
  gridW: 6,
  gridH: 5,
  blockers: [],
  sourceShapeIdentity: '1'.repeat(64),
});

const ORTHOGONAL_CONTROL = Object.freeze({
  schemaVersion: 1,
  name: 'immediate-positive-control',
  level: 56,
  target: 178000,
  tileScale: 32,
  moves: 27,
  minChain: 4,
  gridW: 6,
  gridH: 7,
  blockers: [{ type: 'bomb', x: 2, y: 3, timer: 16 }],
  sourceShapeIdentity: '2'.repeat(64),
});

test('production paired search has a harvest-positive and an immediate-positive control', () => {
  const harvestPositive = measureHarvest(POSITIVE_CONTROL, [41500000]);
  const immediatePositive = measureHarvest(ORTHOGONAL_CONTROL, [41500000]);
  assert.ok(harvestPositive.value >= 0.15, `expected >= 0.15, got ${harvestPositive.value}`);
  assert.ok(immediatePositive.value <= -0.05, `expected <= -0.05, got ${immediatePositive.value}`);
  assert.equal(harvestPositive.bin.index, 6);
  assert.equal(immediatePositive.bin.index, 1);
});

test('both harvesting arms receive identical game, seed, objective, and work bounds', () => {
  const calls = [];
  const searchFn = (options) => {
    calls.push(options);
    return {
      best: null,
      terminationReason: 'work-budget',
      stats: { expandedStates: options.maxExpandedStates, generatedActions: 0 },
    };
  };
  const result = measureHarvest(POSITIVE_CONTROL, [10, 11], searchFn);
  assert.equal(result.value, 0);
  assert.equal(calls.length, 4);
  for (let index = 0; index < calls.length; index += 2) {
    const { rankStateFn: immediate, ...left } = calls[index];
    const { rankStateFn: harvest, ...right } = calls[index + 1];
    assert.deepEqual(left, right);
    assert.notEqual(immediate, harvest);
    assert.equal(left.includeBaseline, false);
  }
});

test('CLI defaults freeze the 7x7 confirmation configuration', () => {
  const parsed = parseArgs(['--out', 'somewhere', '--protocol', 'RESULT-0045']);
  assert.equal(parsed.count, 36);
  assert.equal(parsed.full, 16);
  assert.equal(parsed.level, 56);
  assert.equal(parsed.samplerSeed, 20260919);
  assert.deepEqual(parsed.descriptorSeeds, [43000000, 43000001, 43000002]);
});
