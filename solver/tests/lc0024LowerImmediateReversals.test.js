const test = require('node:test');
const assert = require('node:assert/strict');

const { diagnose, findReversals, validateRow } = require('../../tools/diagnose-lc0024-lower-immediate-reversals');

test('reversal detector finds only lower-immediate candidates that beat the champion afterstate score', () => {
  const champion = { immediatePoints: 100, policyScore: 50 };
  const candidates = [
    { points: 90, policyScore: 51, chain: [{ x: 0, y: 0, value: 2 }] },
    { points: 90, policyScore: 50, chain: [{ x: 1, y: 0, value: 2 }] },
    { points: 100, policyScore: 60, chain: [{ x: 2, y: 0, value: 2 }] },
  ];
  const reversals = findReversals(champion, candidates);
  assert.equal(reversals.length, 1);
  assert.equal(reversals[0].immediatePoints, 90);
  assert.equal(reversals[0].policyScore, 51);
});

test('reversal validator rejects a planted non-reversal mislabeled as evidence', () => {
  const row = {
    id: 'fixture',
    supplementCandidates: 1,
    comparedCandidates: 1,
    champion: { immediatePoints: 100, policyScore: 50 },
    reversals: [{ immediatePoints: 100, policyScore: 51 }],
  };
  assert.throws(() => validateRow(row), /does not have lower immediate points/);
});

test('frozen-pool diagnostic compares every returned supplemental candidate', () => {
  const artifact = diagnose();
  assert.equal(artifact.states, 21);
  assert.equal(artifact.rows.every(({ supplementCandidates, comparedCandidates }) => (
    supplementCandidates === comparedCandidates
  )), true);
  assert.equal(artifact.reversalCount, artifact.reversals.length);
});
