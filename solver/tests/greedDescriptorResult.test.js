const test = require('node:test');
const assert = require('node:assert/strict');

const { descriptorCell } = require('../greed-descriptor-screen');
const { summarizeRegistered } = require('../greed-descriptor-result');

function supportedRows() {
  const percentiles = [0.25, 0.5, 0.75, 1];
  const rows = [];
  for (let index = 0; index < 128; index += 1) {
    const percentile = percentiles[index % 4];
    const timing = percentile === 0.25
      ? (index % 8 === 0 ? 0.8 : 0.5)
      : percentile === 0.5
        ? (index % 8 === 1 ? 0.5 : 0.3)
        : 0.3;
    const greed = 0.25 + 0.7 * percentile;
    const descriptors = { halfScoreMove: timing, greedRatio: greed };
    rows.push({
      level: [10, 31, 53, 54][Math.floor(index / 4) % 4],
      percentile,
      score: 1000 + (index % 7) * 10,
      win: percentile >= 0.75,
      exactComplete: true,
      descriptors,
      cell: descriptorCell(descriptors),
    });
  }
  return rows;
}

test('registered summary can support a complete predictive independent pair', () => {
  const result = summarizeRegistered(supportedRows());
  assert.equal(result.P1.outcome, 'SUPPORTED');
  assert.equal(result.P2.outcome, 'SUPPORTED');
  assert.equal(result.P3.outcome, 'SUPPORTED');
  assert.equal(result.P4.outcome, 'SUPPORTED');
  assert.equal(result.P5.outcome, 'SUPPORTED');
  assert.equal(result.P6.outcome, 'SUPPORTED');
  assert.equal(result.primaryOutcome, 'SUPPORTED');
});

test('registered summary falsifies a collapsed timing axis', () => {
  const rows = supportedRows().map((row) => {
    const descriptors = { ...row.descriptors, halfScoreMove: 0.5 };
    return { ...row, descriptors, cell: descriptorCell(descriptors) };
  });
  const result = summarizeRegistered(rows);
  assert.equal(result.P6.outcome, 'FALSIFIED');
  assert.equal(result.primaryOutcome, 'FALSIFIED');
});
