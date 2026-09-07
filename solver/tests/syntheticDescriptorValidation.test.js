const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  createLevelState,
  isValidChain,
} = require('../engine');
const {
  SUBJECTS,
  chooseSyntheticMove,
  scheduledGreedTarget,
  sourceHashes,
  summarizeEpisode,
  withArtifactIdentity,
  writeNew,
} = require('../../experiments/RESULT-0029/run');
const {
  factorDiagnostics,
  leaveOneLevelOutBrier,
  validateArtifact,
} = require('../../experiments/RESULT-0029/verify');

const ROOT = path.join(__dirname, '..', '..');
const RUNNER = path.join(ROOT, 'experiments', 'RESULT-0029', 'run.js');
const VERIFIER = path.join(ROOT, 'experiments', 'RESULT-0029', 'verify.js');

test('half-score timing divides by the full move budget when an episode ends early', () => {
  const summary = summarizeEpisode([
    { points: 10, beamGreedRatio: 0.5 },
    { points: 20, beamGreedRatio: 1 },
  ], 10);

  assert.deepEqual(summary, {
    finalScore: 30,
    halfScoreMove: 0.2,
    meanBeamGreedRatio: 0.75,
  });
});

test('greed center shifts the whole schedule while timing slope redistributes it', () => {
  const steadyLow = { greedCenter: 0.35, timingSlope: 0 };
  const steadyHigh = { greedCenter: 0.85, timingSlope: 0 };
  const late = { greedCenter: 0.6, timingSlope: 0.25 };
  const early = { greedCenter: 0.6, timingSlope: -0.25 };

  assert.equal(scheduledGreedTarget(steadyLow, 1, 5), 0.35);
  assert.equal(scheduledGreedTarget(steadyHigh, 1, 5), 0.85);
  assert.deepEqual(
    [1, 3, 5].map((move) => scheduledGreedTarget(late, move, 5)),
    [0.35, 0.6, 0.85],
  );
  assert.deepEqual(
    [1, 3, 5].map((move) => scheduledGreedTarget(early, move, 5)),
    [0.85, 0.6, 0.35],
  );
});

test('the exported nine-policy factorial is exactly three greed centers by three timing slopes', () => {
  assert.equal(SUBJECTS.length, 9);
  assert.deepEqual([...new Set(SUBJECTS.map((subject) => subject.greedCenter))], [0.35, 0.6, 0.85]);
  assert.deepEqual([...new Set(SUBJECTS.map((subject) => subject.timingSlope))], [-0.25, 0, 0.25]);
  assert.equal(new Set(SUBJECTS.map((subject) => subject.id)).size, 9);
  assert.ok(SUBJECTS.every((subject) => /^[a-f0-9]{12}$/.test(subject.id)));
});

function analysisCells({ duplicateSeeds = false, collapseGreed = false } = {}) {
  const levels = [901, 902, 903];
  const seeds = duplicateSeeds ? [11, 12] : [11];
  return SUBJECTS.flatMap((subject) => levels.flatMap((level) => seeds.map((seed) => {
    const meanBeamGreedRatio = collapseGreed ? 0.6 : subject.greedCenter;
    const halfScoreMove = 0.5 + (0.2 * subject.timingSlope);
    const wins = subject.greedCenter >= 0.6 && subject.timingSlope >= 0;
    return {
      subjectId: subject.id,
      level,
      seed,
      outcome: wins ? 'win' : 'lose',
      halfScoreMove,
      meanBeamGreedRatio,
    };
  })));
}

test('factor diagnostics expose realized conditional spans without calling them an archive grid', () => {
  const diagnostics = factorDiagnostics(analysisCells());

  assert.equal(diagnostics.policies, 9);
  assert.equal(diagnostics.outcomes.win, 4 * 3);
  assert.equal(diagnostics.outcomes.lose, 5 * 3);
  assert.equal(diagnostics.greed.monotonicSlices, 3);
  assert.equal(diagnostics.greed.totalSlices, 3);
  assert.equal(diagnostics.greed.minimumSpan, 0.5);
  assert.equal(diagnostics.timing.monotonicSlices, 3);
  assert.equal(diagnostics.timing.totalSlices, 3);
  assert.ok(Math.abs(diagnostics.timing.minimumSpan - 0.1) <= 1e-12);

  const collapsed = factorDiagnostics(analysisCells({ collapseGreed: true }));
  assert.equal(collapsed.greed.monotonicSlices, 0);
  assert.equal(collapsed.greed.minimumSpan, 0);
});

test('leave-one-level-out prediction aggregates repeated seeds before scoring', () => {
  const single = leaveOneLevelOutBrier(analysisCells());
  const duplicated = leaveOneLevelOutBrier(analysisCells({ duplicateSeeds: true }));

  assert.deepEqual(single, duplicated);
  assert.equal(single.levels, 3);
  assert.equal(single.observations, 27);
  assert.equal(single.k, 5);
  for (const name of ['baseRate', 'halfScoreMove', 'meanBeamGreedRatio', 'joint']) {
    assert.ok(Number.isFinite(single.brier[name]));
    assert.ok(single.brier[name] >= 0 && single.brier[name] <= 1);
  }
  assert.equal(single.perLevel.length, 3);
});

test('the real bounded candidate seam selects deterministic legal prefixes at different greed centers', () => {
  const level = {
    level: 999,
    target: Infinity,
    tileScale: 1,
    moves: 5,
    minChain: 3,
    gridW: 3,
    gridH: 2,
    blockers: [],
  };
  const state = createLevelState(level, () => 0);
  const low = chooseSyntheticMove(state, { greedCenter: 0.35, timingSlope: 0 }, 1, 5);
  const high = chooseSyntheticMove(state, { greedCenter: 0.85, timingSlope: 0 }, 1, 5);
  const lowAgain = chooseSyntheticMove(state, { greedCenter: 0.35, timingSlope: 0 }, 1, 5);

  assert.ok(isValidChain(low.chain, state.minChain));
  assert.ok(isValidChain(high.chain, state.minChain));
  assert.deepEqual(low.chain.map(({ x, y }) => [x, y]), lowAgain.chain.map(({ x, y }) => [x, y]));
  assert.equal(low.beamMaxPoints, high.beamMaxPoints);
  assert.ok(low.beamGreedRatio < high.beamGreedRatio,
    `expected greed control to shift realized ratio, got ${low.beamGreedRatio} and ${high.beamGreedRatio}`);
  assert.ok(low.beamGreedRatio >= 0 && high.beamGreedRatio <= 1);
});

function fixtureArtifact() {
  const level = 999;
  const seed = 7;
  const cells = SUBJECTS.map((subject, index) => {
    const moveTrace = [
      { points: 10 + index, beamMaxPoints: 20 + (2 * index), beamGreedRatio: 0.5, targetGreed: 0.5 },
      { points: 20, beamMaxPoints: 40, beamGreedRatio: 0.5, targetGreed: 0.5 },
    ];
    return {
      subjectId: subject.id,
      level,
      seed,
      outcome: index % 2 ? 'lose' : 'win',
      reason: index % 2 ? 'out of moves' : 'target reached',
      score: 30 + index,
      moves: 2,
      moveBudget: 10,
      moveTrace,
      halfScoreMove: 0.2,
      meanBeamGreedRatio: 0.5,
    };
  });
  const body = {
    schemaVersion: 1,
    result: 'RESULT-0029',
    kind: 'fixture',
    sources: sourceHashes(),
    subjects: SUBJECTS,
    levels: [level],
    seeds: [seed],
    cells,
  };
  return withArtifactIdentity(body, { exploratory: true });
}

function rehash(artifact, changes) {
  const { artifactIdentity, registration, ...body } = artifact;
  return withArtifactIdentity({ ...body, ...changes }, registration);
}

test('the production verifier reads a serialized artifact and rejects its one-field tampered twin', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-descriptor-verifier-'));
  const goodPath = path.join(dir, 'good.json');
  const badPath = path.join(dir, 'bad.json');
  const artifact = fixtureArtifact();
  fs.writeFileSync(goodPath, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(badPath, `${JSON.stringify({ ...artifact, cells: artifact.cells.map((cell, index) => (
    index === 0 ? { ...cell, outcome: 'lose' } : cell
  )) }, null, 2)}\n`);

  const good = spawnSync(process.execPath, [VERIFIER, '--artifact', goodPath], { encoding: 'utf8' });
  const bad = spawnSync(process.execPath, [VERIFIER, '--artifact', badPath], { encoding: 'utf8' });

  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /PASS/);
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /artifact identity mismatch/);
});

test('the production verifier exposes the frozen factor and held-out analysis path', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-descriptor-analysis-'));
  const artifactPath = path.join(dir, 'analysis.json');
  const base = fixtureArtifact();
  const levels = [997, 998, 999];
  const artifact = rehash(base, {
    levels,
    cells: base.cells.flatMap((cell) => levels.map((level) => ({ ...cell, level }))),
  });
  fs.writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);

  const result = spawnSync(process.execPath, [VERIFIER, '--artifact', artifactPath, '--analysis'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.verification.cells, 27);
  assert.equal(output.analysis.factor.policies, 9);
  assert.equal(output.analysis.prediction.observations, 27);
  assert.equal(output.analysis.prediction.levels, 3);
});

test('artifact validation fails closed on malformed coverage, values, sources, and identity', () => {
  const valid = fixtureArtifact();
  assert.doesNotThrow(() => validateArtifact(valid));

  const { artifactIdentity, registration, ...body } = valid;
  const unknownShippedLevel = withArtifactIdentity(
    { ...body, kind: 'controls' },
    { exploratory: false, protocol: 'RESULT-0029', protocolCommit: 'a'.repeat(40) },
  );
  assert.throws(() => validateArtifact(unknownShippedLevel), /unknown shipped level/);

  const cases = [
    rehash(valid, { cells: valid.cells.slice(1) }),
    rehash(valid, { cells: [...valid.cells, valid.cells[0]] }),
    rehash(valid, { cells: valid.cells.map((cell, index) => (index === 0 ? { ...cell, halfScoreMove: Infinity } : cell)) }),
    rehash(valid, { cells: valid.cells.map((cell, index) => (index === 0 ? { ...cell, outcome: 'maybe' } : cell)) }),
    rehash(valid, { sources: { ...valid.sources, 'solver/engine.js': '0000000000000000' } }),
    { ...valid, artifactIdentity: '0'.repeat(64) },
  ];
  for (const candidate of cases) assert.throws(() => validateArtifact(candidate));
});

test('the real CLI refuses an unregistered run before creating output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-descriptor-unregistered-'));
  const out = path.join(dir, 'artifact.json');
  const result = spawnSync(process.execPath, [RUNNER, 'confirmation', '--out', out], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /EXPERIMENT NOT REGISTERED/);
  assert.equal(fs.existsSync(out), false);
});

test('the production writer refuses to overwrite an existing artifact', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-descriptor-overwrite-'));
  const out = path.join(dir, 'artifact.json');
  writeNew(out, { first: true });
  assert.throws(() => writeNew(out, { second: true }), /refusing to overwrite/);
  assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), { first: true });
});
