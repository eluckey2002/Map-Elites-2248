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

test('exact-modal stability fails an unstable middle-bin policy', () => {
  const rows = supportedRows();
  const unstableBins = [1, 0, 2, 1, 0, 2, 1, 1];
  let index = 0;
  for (const row of rows.filter(({ percentile }) => percentile === 0.5)) {
    row.cell.greed = unstableBins[index % unstableBins.length];
    index += 1;
  }
  const decision = summarizeDeterministicGreed(rows);
  const policy = decision.policies.find(({ percentile }) => percentile === 0.5);
  assert.equal(policy.modalGreedBin, 1);
  assert.equal(policy.exactModalGreedRate, 0.5);
  assert.equal(decision.P5.outcome, 'FALSIFIED');
});

test('registered and independent reducers agree for a non-default policy panel', () => {
  const rows = supportedRows().filter(({ percentile }) => [0.25, 1].includes(percentile));
  const corpus = {
    panel: { percentiles: [0.25, 1], expectedGames: 64 },
    rows,
  };
  assert.deepEqual(
    reduceCorpus(corpus),
    summarizeDeterministicGreed(rows, { expectedGames: 64, percentiles: [0.25, 1] }),
  );
});
