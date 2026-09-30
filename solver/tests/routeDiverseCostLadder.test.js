const test = require('node:test');
const assert = require('node:assert/strict');

const { SUPPLEMENT_LIMIT } = require('../route-diverse-challenger');
const { WIDTHS, fallbackIdentity, routeRecovery, runLadder } = require('../../tools/qualify-route-diverse-cost-ladder');

test('each predeclared width records route recovery while preserving exact champion fallback', () => {
  for (const searchWidth of WIDTHS) {
    const diversity = { searchWidth, supplementLimit: SUPPLEMENT_LIMIT };
    const recovery = routeRecovery(diversity);
    assert.equal(typeof recovery.recovered, 'boolean', `width ${searchWidth} should report recovery`);
    assert.equal(recovery.capRespected, true);
    assert.equal(fallbackIdentity(diversity).preserved, true, `width ${searchWidth} should preserve fallback`);
  }
});

test('the fixed ladder selects only its largest qualifying width, or honestly reports no fit', () => {
  const artifact = runLadder();
  assert.deepEqual(artifact.results.map(({ diversity }) => diversity.searchWidth), WIDTHS);
  assert.equal(artifact.results.every(({ recovery, fallback, qualification }) => (
    recovery.capRespected
      && fallback.preserved
      && qualification.maxSupplementCandidates <= SUPPLEMENT_LIMIT
  )), true);
  const expected = artifact.results.find(({ eligible }) => eligible);
  assert.deepEqual(artifact.selected, expected ? expected.diversity : null);
});
