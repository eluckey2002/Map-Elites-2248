const test = require('node:test');
const assert = require('node:assert/strict');

const { summarizeDeterministicGreed } = require('./result');
const { reduceCorpus } = require('./recompute');

function supportedRows() {
  const percentiles = [0.25, 0.5, 0.75, 1];
  const levels = [10, 31, 53, 54];
  const seeds = Array.from({ length: 8 }, (_, index) => 33400000 + index);
  const greed = [0.2, 0.5, 0.8, 0.95];
  const greedBin = [0, 1, 2, 2];
  const wins = [1, 3, 6, 8];
  return percentiles.flatMap((percentile, policyIndex) => levels.flatMap((level) => (
    seeds.map((seed, seedIndex) => ({
      percentile,
      level,
      seed,
      score: 1000 + (seedIndex % 2) * 100,
      win: seedIndex < wins[policyIndex],
      exactComplete: true,
      descriptors: {
        greedRatio: greed[policyIndex] + (seedIndex % 2) * 0.005,
        halfScoreMove: seedIndex % 2 ? 0.5 : 0.4,
      },
      cell: { greed: greedBin[policyIndex], timing: seedIndex % 2 ? 1 : 0 },
    }))
  )));
}

test('registered analysis supports a planted complete and predictive greed panel', () => {
  const decision = summarizeDeterministicGreed(supportedRows());

  assert.equal(decision.primaryOutcome, 'SUPPORTED');
  assert.equal(decision.exact.completeGames, 128);
  assert.ok(decision.diagnostics.greedMeanRange >= 0.30);
  assert.ok(decision.diagnostics.policyWinGreedCorrelation >= 0.50);
  assert.ok(Math.abs(decision.diagnostics.scoreGreedCorrelation) < 0.70);
});

test('independent corpus reducer matches the registered analysis byte-for-byte', () => {
  const rows = supportedRows();
  const corpus = {
    panel: { percentiles: [0.25, 0.5, 0.75, 1], expectedGames: 128 },
    rows,
  };

  assert.deepEqual(reduceCorpus(corpus), summarizeDeterministicGreed(rows));
});
