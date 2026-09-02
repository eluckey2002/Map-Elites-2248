const { test } = require('node:test');
const assert = require('node:assert/strict');

const { replay } = require('../recording-replay');

const FIXTURE = require('../test-fixtures/level52-seed2000000-human-games.json');

const EXPECTED_SOURCES = new Map([
  ['60de027212d339ac199f8a258079137c18a5e6b48d1e2b483e5a617c22edaf13.json',
    '53103b56d417538c99d41a4bf9dd1b035ace85beeb050b32228fb61a9c7feb19'],
  ['64eef93375ec2077d3b33be02ca8920da96ab0c837afd66c805d8069451bc3cc.json',
    'b8fced33750b6209144f38fd52e6c8cb512ad7ebd7e160af675a7ba085c2e44f'],
  ['d39d6c0e7bf5630702d3559a86c2376676ad1e791129a50ea805828287a79ecd.json',
    'e84a6dee44855db6a486894743b264117ed7b301b09de72702ee6dea7200aa6e'],
  ['f636dfe5d81c821a3e64d09015bd818191b06610021e63ec92e05a17007fb4ae.json',
    '983f1ad4542f425fec02c91592d95ba6a4a6cac7053855a218d348e7da12d325'],
]);

test('four compacted owner sessions replay through the real engine to exact outcomes', () => {
  assert.equal(FIXTURE.sessions.length, 4, 'the corpus must not pass vacuously');
  assert.deepEqual(
    new Map(FIXTURE.sessions.map(({ sourceFile, sourceSha256 }) => [sourceFile, sourceSha256])),
    EXPECTED_SOURCES,
  );

  const outcomes = [];
  for (const session of FIXTURE.sessions) {
    const result = replay(FIXTURE.level, session);
    assert.deepEqual(result.problems, [], session.sourceFile);
    assert.equal(result.score, session.score, session.sourceFile);
    assert.equal(result.moves, session.movesUsed, session.sourceFile);
    outcomes.push(`${result.score}/${result.moves}`);
  }

  assert.deepEqual(outcomes.sort(), ['110464/9', '113536/9', '119808/11', '120256/10']);
});
