const test = require('node:test');
const assert = require('node:assert/strict');

const {
  adjacentRate,
  choosePercentileCandidate,
  descriptorCell,
  summarize,
} = require('../greed-descriptor-screen');

test('percentile player chooses the chain nearest its fixed share of the best points', () => {
  const candidates = [{ points: 100 }, { points: 76 }, { points: 52 }, { points: 24 }];
  assert.equal(choosePercentileCandidate(candidates, 1).points, 100);
  assert.equal(choosePercentileCandidate(candidates, 0.75).points, 76);
  assert.equal(choosePercentileCandidate(candidates, 0.5).points, 52);
  assert.equal(choosePercentileCandidate(candidates, 0.25).points, 24);
});

test('the frozen 3x3 descriptor bins name early, steady, late and low, mid, high', () => {
  assert.deepEqual(descriptorCell({ halfScoreMove: 0.4, greedRatio: 0.4 }), { timing: 0, greed: 0, key: '0,0', name: 'Dawdler' });
  assert.deepEqual(descriptorCell({ halfScoreMove: 0.5, greedRatio: 0.5 }), { timing: 1, greed: 1, key: '1,1', name: 'Balanced' });
  assert.deepEqual(descriptorCell({ halfScoreMove: 0.8, greedRatio: 0.8 }), { timing: 2, greed: 2, key: '2,2', name: 'Late Sprinter' });
});

test('same-or-edge-adjacent stability does not let a center cell cover the corners', () => {
  const rows = [
    { cell: { key: '1,1', timing: 1, greed: 1 } },
    { cell: { key: '1,2', timing: 1, greed: 2 } },
    { cell: { key: '2,2', timing: 2, greed: 2 } },
  ];
  assert.equal(adjacentRate(rows, '1,1'), 2 / 3);
});

test('screen stops when a descriptor merely tracks score and occupies one row', () => {
  const rows = [];
  for (const percentile of [0.25, 0.5, 0.75, 1]) {
    for (let seed = 0; seed < 20; seed += 1) {
      const greed = percentile;
      const timing = 0.5;
      rows.push({
        percentile,
        score: greed * 1000 + seed,
        win: percentile >= 0.75,
        descriptors: { halfScoreMove: timing, greedRatio: greed },
        cell: descriptorCell({ halfScoreMove: timing, greedRatio: greed }),
      });
    }
  }
  const result = summarize(rows);
  assert.equal(result.screenChecks.lowFitnessCorrelation, false);
  assert.equal(result.screenChecks.expressiveRange, false);
  assert.equal(result.nextStep, 'STOP_AFTER_SCREEN');
});

test('screen fails closed when score correlation is undefined', () => {
  const timingByPercentile = new Map([
    [0.25, 0.3],
    [0.5, 0.5],
    [0.75, 0.8],
    [1, 0.8],
  ]);
  const rows = [];
  for (const percentile of [0.25, 0.5, 0.75, 1]) {
    for (let seed = 0; seed < 20; seed += 1) {
      const descriptors = {
        halfScoreMove: timingByPercentile.get(percentile),
        greedRatio: percentile,
      };
      rows.push({
        percentile,
        score: 1000,
        win: percentile >= 0.75,
        descriptors,
        cell: descriptorCell(descriptors),
      });
    }
  }
  const result = summarize(rows);
  assert.equal(result.diagnostics.scoreGreedCorrelation, null);
  assert.equal(result.screenChecks.lowFitnessCorrelation, false);
  assert.equal(result.nextStep, 'STOP_AFTER_SCREEN');
});
