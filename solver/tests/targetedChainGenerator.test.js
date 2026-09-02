const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const { replay } = require('../recording-replay');
const {
  actionIdentity,
  generateTargetedChains,
} = require('../targeted-chain-generator');
const {
  createLevelState,
  makeRng,
} = require('../engine');
const {
  assessCoverage,
  evaluateCoverage,
} = require('../targeted-chain-coverage');

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

function smallState() {
  return {
    grid: [
      [
        { x: 0, y: 0, value: 2, blocker: null },
        { x: 1, y: 0, value: 2, blocker: null },
      ],
      [
        { x: 0, y: 1, value: 2, blocker: null },
        { x: 1, y: 1, value: 2, blocker: null },
      ],
    ],
    gridWidth: 2,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
  };
}

test('targeted generation dedupes real legal actions and can finish a small search', () => {
  const result = generateTargetedChains(smallState(), {
    maxNodes: 1_000,
    candidateLimit: 1_000,
    pathWidth: 8,
  });

  assert.equal(result.complete, true);
  assert.deepEqual(result.telemetry.capReasons, []);
  assert.ok(result.candidates.length > 0);
  assert.equal(
    new Set(result.candidates.map(({ chain }) => actionIdentity(chain))).size,
    result.candidates.length,
  );
  for (const { chain } of result.candidates) {
    assert.ok(chain.length >= 3);
    assert.equal(chain[0].value, chain[1].value);
  }
});

test('the real opening search recovers the missed 24-tile, sum-3456 action', () => {
  const opening = createLevelState(FIXTURE.level, makeRng(FIXTURE.sessions[0].seed));
  const anchor = FIXTURE.sessions.find(({ sourceFile }) => sourceFile.startsWith('64eef933')).chains[0];
  const result = generateTargetedChains(opening, {
    maxNodes: 100_000,
    candidateLimit: 512,
    pathWidth: 64,
  });

  assert.ok(result.candidates.some(({ chain }) => actionIdentity(chain) === actionIdentity(anchor.tiles)));
  assert.equal(anchor.tiles.reduce((sum, tile) => sum + tile.value, 0), 3456);
  assert.equal(anchor.tiles.length, 24);
  assert.ok(result.telemetry.nodesVisited <= 100_000);
});

test('caller node caps fail closed and are deterministic', () => {
  const first = generateTargetedChains(smallState(), {
    maxNodes: 1,
    candidateLimit: 100,
    pathWidth: 1,
  });
  const second = generateTargetedChains(smallState(), {
    maxNodes: 1,
    candidateLimit: 100,
    pathWidth: 1,
  });
  const stable = ({ complete, candidates, telemetry }) => ({
    complete,
    candidateIds: candidates.map(({ chain }) => actionIdentity(chain)),
    nodesVisited: telemetry.nodesVisited,
    capReasons: telemetry.capReasons,
  });

  assert.deepEqual(stable(first), stable(second));
  assert.equal(first.complete, false);
  assert.deepEqual(first.telemetry.capReasons, ['maxNodes']);
});

test('the real-state coverage seam beats production and recovers both named anchors', () => {
  const report = evaluateCoverage(FIXTURE, {
    maxNodes: 100_000,
    candidateLimit: 512,
    pathWidth: 64,
  });
  const verdict = assessCoverage(report);

  assert.equal(report.states, 39);
  assert.deepEqual(report.production, { exact: 2, equivalent: 4 });
  assert.ok(report.challenger.equivalent > report.production.equivalent);
  assert.equal(report.anchors.opening24TileSum3456, true);
  assert.equal(report.anchors.productionBotSecondDecisionSum2048, true);
  assert.equal(verdict.pass, true, verdict.failures.join('; '));
  assert.equal(report.search.states, 39);
  assert.equal(report.search.completeStates + report.search.cappedStates, 39);
  assert.ok(report.search.nodesVisited > 0);
  assert.ok(report.search.elapsedMs >= 0);
});

test('a controlled broken cap fails the coverage CLI acceptance seam', () => {
  const cli = path.join(__dirname, '..', 'targeted-chain-coverage.js');
  const fixture = path.join(__dirname, '..', 'test-fixtures', 'level52-seed2000000-human-games.json');
  const run = spawnSync(process.execPath, [
    cli,
    '--fixture', fixture,
    '--max-nodes', '1',
    '--candidate-limit', '1',
    '--path-width', '1',
  ], { encoding: 'utf8' });

  assert.equal(run.status, 1);
  const result = JSON.parse(run.stdout);
  assert.equal(result.verdict, 'FAIL');
  assert.ok(result.failures.some((failure) => failure.includes('opening anchor')));
});
