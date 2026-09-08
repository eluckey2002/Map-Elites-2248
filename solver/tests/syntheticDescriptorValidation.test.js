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
  resolveEmptyCandidatePool,
  scheduledGreedTarget,
  sourceHashes,
  summarizeEpisode,
  withArtifactIdentity,
  writeNew,
} = require('../../experiments/RESULT-0029/run');
const {
  validateArtifact,
} = require('../../experiments/RESULT-0029/verify');
const {
  analyzeArtifact,
  factorMetrics,
  predictionMetrics,
} = require('../../experiments/RESULT-0029/analyze');

const ROOT = path.join(__dirname, '..', '..');
const RUNNER = path.join(ROOT, 'experiments', 'RESULT-0029', 'run.js');
const VERIFIER = path.join(ROOT, 'experiments', 'RESULT-0029', 'verify.js');
const ANALYZER = path.join(ROOT, 'experiments', 'RESULT-0029', 'analyze.js');

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
      reason: wins ? 'target reached' : 'no valid moves',
      halfScoreMove,
      meanBeamGreedRatio,
    };
  })));
}

test('registered factor metrics expose all conditional spans and detect collapse', () => {
  const metrics = factorMetrics(analysisCells());
  assert.equal(metrics.policies, 9);
  assert.equal(metrics.greed.monotonicSlices, 3);
  assert.equal(metrics.greed.minimumSpan, 0.5);
  assert.equal(metrics.timing.monotonicSlices, 3);
  assert.ok(Math.abs(metrics.timing.minimumSpan - 0.1) <= 1e-12);

  const collapsed = factorMetrics(analysisCells({ collapseGreed: true }));
  assert.equal(collapsed.greed.monotonicSlices, 0);
  assert.equal(collapsed.greed.minimumSpan, 0);
});

test('registered prediction aggregates seeds before deterministic level-held-out scoring', () => {
  const single = predictionMetrics(analysisCells());
  const duplicated = predictionMetrics(analysisCells({ duplicateSeeds: true }));
  assert.deepEqual(single.brier, duplicated.brier);
  assert.deepEqual(single.gains, duplicated.gains);
  assert.deepEqual(single.perLevel, duplicated.perLevel);
  assert.deepEqual(single.perPolicy, duplicated.perPolicy);
  assert.deepEqual(single.levelMeans, duplicated.levelMeans);
  assert.equal(single.levels, 3);
  assert.equal(single.observations, 27);
  assert.equal(duplicated.observations, 27);
  assert.equal(duplicated.cells, single.cells * 2);
  assert.equal(single.k, 5);
  assert.equal(single.perLevel.length, 3);
  assert.deepEqual(Object.keys(single.brier), [
    'baseRate',
    'halfScoreMove',
    'meanBeamGreedRatio',
    'joint',
  ]);
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

test('empty bounded-policy output is distinguished from actual game move exhaustion', () => {
  const level = {
    level: 999,
    target: Infinity,
    tileScale: 1,
    moves: 5,
    minChain: 3,
    gridW: 2,
    gridH: 2,
    blockers: [],
  };
  const playable = createLevelState(level, () => 0);
  assert.throws(() => resolveEmptyCandidatePool(playable), /bounded candidate pool exhausted/);

  const dead = createLevelState(level, () => 0);
  [2, 4, 8, 16].forEach((value, index) => {
    dead.grid[Math.floor(index / 2)][index % 2].value = value;
  });
  assert.equal(resolveEmptyCandidatePool(dead), 'no valid moves');
});

test('source closure includes the hashing implementation used to build it', () => {
  assert.match(sourceHashes()['tools/verify-experiments.js'], /^[a-f0-9]{16}$/);
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
      reason: index % 2 ? 'no valid moves' : 'target reached',
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

function controlArtifact() {
  const level = 1;
  const seed = 7;
  const moveBudget = 25;
  const patterns = new Map([
    [-0.25, [120, 100, 90, 90]],
    [0, [80, 80, 140, 100]],
    [0.25, [50, 50, 90, 210]],
  ]);
  const cells = SUBJECTS.map((subject) => {
    const points = patterns.get(subject.timingSlope);
    const moveTrace = points.map((value, index) => ({
      points: value,
      beamMaxPoints: value / subject.greedCenter,
      beamGreedRatio: subject.greedCenter,
      targetGreed: scheduledGreedTarget(subject, index + 1, moveBudget),
    }));
    return {
      subjectId: subject.id,
      level,
      seed,
      outcome: 'lose',
      reason: 'no valid moves',
      score: 400,
      moves: moveTrace.length,
      moveBudget,
      moveTrace,
      ...summarizeEpisode(moveTrace, moveBudget),
    };
  });
  return withArtifactIdentity({
    schemaVersion: 1,
    result: 'RESULT-0029',
    kind: 'controls',
    sources: sourceHashes(),
    subjects: SUBJECTS,
    levels: [level],
    seeds: [seed],
    cells,
  }, {
    exploratory: false,
    protocol: 'RESULT-0029',
    protocolCommit: 'a'.repeat(40),
  });
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

test('the registered calculator validates real input and reproduces byte-identical output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'synthetic-descriptor-analysis-'));
  const input = path.join(dir, 'controls.json');
  const firstPath = path.join(dir, 'first.json');
  const secondPath = path.join(dir, 'second.json');
  const artifact = controlArtifact();
  fs.writeFileSync(input, `${JSON.stringify(artifact, null, 2)}\n`);

  const direct = analyzeArtifact(artifact, 'controls');
  assert.equal(direct.inputArtifactIdentity, artifact.artifactIdentity);
  assert.equal(direct.metrics.greed.monotonicSlices, 3);
  assert.equal(direct.metrics.timing.monotonicSlices, 3);

  const first = spawnSync(process.execPath, [ANALYZER, 'controls', '--artifact', input, '--out', firstPath], { encoding: 'utf8' });
  const second = spawnSync(process.execPath, [ANALYZER, 'controls', '--artifact', input, '--out', secondPath], { encoding: 'utf8' });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(fs.readFileSync(firstPath, 'utf8'), fs.readFileSync(secondPath, 'utf8'));

  const tampered = { ...artifact, cells: artifact.cells.slice(1) };
  assert.throws(() => analyzeArtifact(tampered, 'controls'), /artifact identity mismatch/);
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

  const loseWithWinReason = rehash(valid, {
    cells: valid.cells.map((cell, index) => (
      index === 0 ? { ...cell, outcome: 'lose', reason: 'target reached' } : cell
    )),
  });
  assert.throws(() => validateArtifact(loseWithWinReason), /outcome\/reason mismatch/);

  const earlyOutOfMoves = rehash(valid, {
    cells: valid.cells.map((cell, index) => (
      index === 1 ? { ...cell, reason: 'out of moves' } : cell
    )),
  });
  assert.throws(() => validateArtifact(earlyOutOfMoves), /out-of-moves count mismatch/);

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
