const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  axesFromPilot, buildAxis, cellForBehavior, placeElite, policyIdentity, renderMapHtml,
  validateArtifact,
} = require('../map-elites-core');
const { evaluationSeeds, parseArgs, validateConfig } = require('../map-elites');

test('measurement-control CLI keeps legacy defaults and parses explicit starts and axes source', () => {
  const defaults = parseArgs([]);
  assert.equal(defaults.screenSeedStart, 2_000_000);
  assert.equal(defaults.holdoutSeedStart, 3_000_000);
  assert.equal(defaults.axesFrom, null);

  const configured = parseArgs([
    '--screen-seed-start', '4000000',
    '--holdout-seed-start', '5000000',
    '--axes-from', 'solver/map-elites-output/archive.json',
  ]);
  assert.equal(configured.screenSeedStart, 4_000_000);
  assert.equal(configured.holdoutSeedStart, 5_000_000);
  assert.equal(configured.axesFrom, 'solver/map-elites-output/archive.json');
});

test('evaluation seed ranges must be safe, non-negative, and disjoint', () => {
  const config = {
    iterations: 0, screenSeedCount: 4, holdoutSeedCount: 3, bins: 5,
    screenSeedStart: 10, holdoutSeedStart: 20,
  };
  assert.doesNotThrow(() => validateConfig(config));
  assert.deepEqual(evaluationSeeds(config), {
    screenSeeds: [10, 11, 12, 13],
    holdoutSeeds: [20, 21, 22],
  });
  assert.throws(() => validateConfig({ ...config, holdoutSeedStart: 12 }), /overlap/);
  assert.throws(() => validateConfig({ ...config, screenSeedStart: -1 }), /non-negative safe integer/);
  assert.throws(() => validateConfig({
    ...config, screenSeedStart: Number.MAX_SAFE_INTEGER - 2,
  }), /exceeds Number.MAX_SAFE_INTEGER/);
});

test('MAP-Elites keeps the best policy independently inside each behavior cell', () => {
  const archive = new Map();

  placeElite(archive, { cell: '0,0', fitness: 0.10, policyId: 'small-early-a' });
  placeElite(archive, { cell: '0,0', fitness: 0.05, policyId: 'small-early-worse' });
  placeElite(archive, { cell: '4,4', fitness: -0.20, policyId: 'large-late' });
  placeElite(archive, { cell: '0,0', fitness: 0.12, policyId: 'small-early-better' });

  assert.equal(archive.size, 2, 'a lower global score in another style still belongs in the map');
  assert.equal(archive.get('0,0').policyId, 'small-early-better');
  assert.equal(archive.get('4,4').policyId, 'large-late');
});

test('behavior descriptors land in understandable numeric chain-style and patience bins', () => {
  const axes = {
    chainStyle: buildAxis('Mean chain length', 4, 8, 4),
    patience: buildAxis('Late-score share', 0.1, 0.5, 4),
  };

  const located = cellForBehavior({ meanChainLength: 4.9, lateScoreShare: 0.39 }, axes);

  assert.equal(located.cell, '0,2');
  assert.equal(located.chainBin.label, '4.00–5.00');
  assert.equal(located.patienceBin.label, '0.30–0.40');
});

test('a pilot must demonstrate real range on both descriptors before axes exist', () => {
  const axes = axesFromPilot([
    { meanChainLength: 10, lateScoreShare: 0.20 },
    { meanChainLength: 10.3, lateScoreShare: 0.23 },
    { meanChainLength: 10.6, lateScoreShare: 0.27 },
  ], { count: 3, minimumChainRange: 0.15, minimumPatienceRange: 0.02 });

  assert.equal(axes.pilot.chainRange, 0.6);
  assert.ok(Math.abs(axes.pilot.patienceRange - 0.07) < 1e-12);
  assert.throws(() => axesFromPilot([
    { meanChainLength: 10, lateScoreShare: 0.20 },
    { meanChainLength: 10.01, lateScoreShare: 0.201 },
  ], { count: 3, minimumChainRange: 0.15, minimumPatienceRange: 0.02 }), /DESCRIPTORS INVALID/);
});

test('policy identity is stable across object key order', () => {
  const a = policyIdentity({ turnover: 40, wRoll: 1, pathWidth: 8 });
  const b = policyIdentity({ pathWidth: 8, wRoll: 1, turnover: 40 });

  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{12}$/);
});

test('the static map explains axes, empty cells, elite identity, selection, and holdout', () => {
  const artifact = {
    axes: {
      chainStyle: buildAxis('Mean chain length', 4, 8, 2),
      patience: buildAxis('Late-score share', 0.1, 0.5, 2),
    },
    archive: [{
      cell: '0,0', policyId: 'abc123', fitness: 0.1,
      behavior: { meanChainLength: 4.5, lateScoreShare: 0.15 },
      params: { turnover: 40 },
    }],
    representatives: [{ policyId: 'abc123', holdout: { fitness: 0.05, winRate: 0.8 } }],
  };

  const html = renderMapHtml(artifact);

  assert.match(html, /Chain style: mean chain length/);
  assert.match(html, /Patience: late-score share/);
  assert.match(html, /abc123/);
  assert.match(html, /Selection fitness/);
  assert.match(html, /Holdout fitness/);
  assert.match(html, /Empty cell/);
});

test('artifact verification refuses seed overlap and missing representative holdout evidence', () => {
  const artifact = {
    config: { screen: { seeds: [1, 2] }, holdout: { seeds: [3, 4] } },
    archive: [
      { cell: '0,0', policyId: 'a' },
      { cell: '1,0', policyId: 'b' },
      { cell: '1,1', policyId: 'c' },
    ],
    representatives: [
      { cell: '0,0', policyId: 'a', holdout: { fitness: 0 } },
      { cell: '1,0', policyId: 'b', holdout: { fitness: -0.1 } },
      { cell: '1,1', policyId: 'c', holdout: { fitness: 0.1 } },
    ],
  };

  assert.doesNotThrow(() => validateArtifact(artifact));
  assert.throws(() => validateArtifact({
    ...artifact,
    config: { screen: { seeds: [1, 2] }, holdout: { seeds: [2, 3] } },
  }), /overlap/);
  assert.throws(() => validateArtifact({
    ...artifact,
    representatives: artifact.representatives.map((entry, index) => (
      index === 1 ? { cell: entry.cell, policyId: entry.policyId } : entry
    )),
  }), /missing holdout/);
});
