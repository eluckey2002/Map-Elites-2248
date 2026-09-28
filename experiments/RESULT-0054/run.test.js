const { test } = require('node:test');
const assert = require('node:assert/strict');

const { CONFIG, FINAL_SUBJECT_IDENTITY, assertSubject } = require('./subject');
const { decide } = require('./result');

test('the successor subject identity binds fresh fixed inputs and repaired sources', () => {
  assert.equal(assertSubject(), FINAL_SUBJECT_IDENTITY);
  assert.equal(CONFIG.samplerSeed, 20260919);
  assert.deepEqual(CONFIG.descriptorSeeds, [43000000, 43000001, 43000002]);
});

test('the frozen decision rule supports the required map and falsifies either collapsed axis', () => {
  const base = {
    finalSubjectIdentity: FINAL_SUBJECT_IDENTITY,
    artifactIdentity: 'a'.repeat(64),
    summary: { occupiedBreadthBins: 2, occupiedHarvestBins: 2, occupiedCells: 4 },
  };
  assert.equal(decide(base).primaryOutcome, 'SUPPORTED');
  assert.equal(decide({ ...base, summary: { ...base.summary, occupiedBreadthBins: 1 } }).primaryOutcome, 'FALSIFIED');
  assert.equal(decide({ ...base, summary: { ...base.summary, occupiedHarvestBins: 1 } }).primaryOutcome, 'FALSIFIED');
  assert.equal(decide({ ...base, summary: { ...base.summary, occupiedCells: 3 } }).primaryOutcome, 'FALSIFIED');
});
