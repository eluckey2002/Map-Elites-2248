'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { offLatticeCount, buildPotential } = require('../policy-lab/chooser');
const { accepted, promising, disposition } = require('../policy-lab/decision');
const { createPool } = require('../policy-lab/pool');
const { strandedCellPressure } = require('../behavior-descriptors');

test('policy lab occupancy agrees with the project classifier, including recoverable values and stones', () => {
  const state = { tileScale: 3, gridWidth: 3, gridHeight: 2, grid: [
    [{ value: 18 }, { value: 18 }, { value: 36 }],
    [{ value: 6 }, { value: 12 }, { value: 7, blocker: 'stone' }],
  ] };
  assert.equal(offLatticeCount(state), 3);
  assert.equal(offLatticeCount(state) / 5, strandedCellPressure(state));
});

test('policy lab acceptance rejects a win regression, a zero lower bound and a gate-only gain', () => {
  const good = { netWins: 0, meanMovesSaved: 1, moveCi95: [0.1, 1.9] };
  assert.equal(promising(good), true);
  assert.equal(accepted(good), true);
  assert.equal(accepted({ ...good, netWins: -1 }), false);
  assert.equal(accepted({ ...good, moveCi95: [0, 2] }), false);
  assert.equal(disposition(good, null), 'PROMISING_UNRECHECKED');
  assert.equal(disposition(good, { ...good, meanMovesSaved: 0, moveCi95: [-1, 1] }), 'NOT_ACCEPTED');
});

test('board build potential excludes tiles in the dealt range and blocked company', () => {
  const tile = (x, value, blocker) => ({ x, y: 0, value, blocker });
  assert.equal(buildPotential({ tileScale: 1, grid: [[tile(0, 8), tile(1, 8)]] }), 0);
  assert.equal(buildPotential({ tileScale: 1, grid: [[tile(0, 16), tile(1, 16, 'stone')]] }), 0);
  assert.equal(buildPotential({ tileScale: 1, grid: [[tile(0, 16), tile(1, 16)]] }), 16);
});

test('policy lab rejects a fifth worker before launching any workers', () => {
  assert.throws(() => createPool(5), /at most four workers/);
});
