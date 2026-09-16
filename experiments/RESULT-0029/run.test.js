const { test } = require('node:test');
const assert = require('node:assert/strict');

const { expectedRegion, targetForRegion } = require('./run');
const { artifactWithIdentity, identity } = require('./subject');

function envelope() {
  const scoresUpTo = Array.from({ length: 3 }, () => Array(10).fill(null));
  for (let cap = 3; cap <= 9; cap++) scoresUpTo[0][cap] = 0;
  scoresUpTo[1][3] = 30;
  scoresUpTo[1][4] = 40;
  for (let cap = 5; cap <= 9; cap++) scoresUpTo[1][cap] = 80;
  scoresUpTo[2][3] = 70;
  scoresUpTo[2][4] = 90;
  for (let cap = 5; cap <= 9; cap++) scoresUpTo[2][cap] = 140;
  return { maximumCap: 9, scoresUpTo };
}

test('frozen target recipes construct the intended counterfactual boundaries', () => {
  const subject = envelope();
  assert.equal(targetForRegion('relaxed-short', subject), 30);
  assert.equal(targetForRegion('relaxed-long', subject), 41);
  assert.equal(targetForRegion('tight-short', subject), 31);
  assert.equal(targetForRegion('tight-long', subject), 91);
});

test('region labels use only the two declared descriptors', () => {
  assert.equal(expectedRegion({ budgetTightness: 0.5, chainLengthDependence: 3 }), 'relaxed-short');
  assert.equal(expectedRegion({ budgetTightness: 0.5, chainLengthDependence: 5 }), 'relaxed-long');
  assert.equal(expectedRegion({ budgetTightness: 1, chainLengthDependence: 3 }), 'tight-short');
  assert.equal(expectedRegion({ budgetTightness: 1, chainLengthDependence: 7 }), 'tight-long');
});

test('artifact identity covers the evidence body and not the registration stamp', () => {
  const body = { schemaVersion: 1, result: 'RESULT-0029', cells: [1, 2, 3] };
  const first = artifactWithIdentity(body, { protocolCommit: 'a'.repeat(40) });
  const second = artifactWithIdentity(body, { protocolCommit: 'b'.repeat(40) });

  assert.equal(first.artifactIdentity, identity(body));
  assert.equal(second.artifactIdentity, first.artifactIdentity);
});
