const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizeRows } = require('./run');
function a(forced, diversity, standing = 'bounded_success_set_proxy') { return { standing, descriptors: standing === 'UNKNOWN' ? null : { forcedPrefixRatio: forced, distinctOpeningMoves: diversity } }; }
test('summary rejects a collapsed diversity coordinate', () => {
  const rows = Array.from({ length: 32 }, (_, i) => ({ level: [10, 31, 53, 54][i % 4], shallow: a(i / 100, 1), deep: a(i / 100, 1) }));
  const result = summarizeRows(rows);
  assert.equal(result.P1.outcome, 'SUPPORTED');
  assert.equal(result.P2.outcome, 'INCONCLUSIVE');
  assert.equal(result.descriptorDisposition, 'REVISE_BEFORE_MAP_CORPUS');
});
