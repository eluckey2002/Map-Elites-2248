const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { search } = require('../../solver/oracle/search');
const {
  POLICIES, RESULT, ROOT, SUBJECT_IDENTITY, loadPanel, seal, sourceHashes, subject,
} = require('./subject');
const { analyze, verifyArtifact } = require('./verify');

function calibrationArtifact() {
  const { corpus } = loadPanel();
  const prior = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/oracle/runs/attempt-05-full-corpus.json'), 'utf8'));
  const priorById = new Map(prior.rows.map(row => [row.puzzleIdentity, row.result.best]));
  const rows = corpus.puzzles.flatMap(puzzle => POLICIES.map(policy => {
    const witness = structuredClone(priorById.get(puzzle.puzzleIdentity));
    assert.ok(witness, `missing calibration witness for ${puzzle.puzzleIdentity}`);
    return {
      puzzleIdentity: puzzle.puzzleIdentity,
      policy: policy.id,
      outcome: 'win',
      moves: witness.movesUsed,
      score: witness.score,
      expandedStates: subject.maxExpandedStates,
      terminationReason: 'work-budget',
      witness,
    };
  }));
  return seal({
    schemaVersion: 1,
    result: RESULT,
    subjectIdentity: SUBJECT_IDENTITY,
    corpusIdentity: corpus.manifestIdentity,
    sources: sourceHashes(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    rows,
  });
}

function reseal(artifact) {
  const { artifactIdentity, ...body } = artifact;
  return seal(body);
}

function runPublic(artifact) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0041-'));
  const file = path.join(directory, 'artifact.json');
  fs.writeFileSync(file, JSON.stringify(artifact));
  const result = spawnSync(process.execPath, ['experiments/RESULT-0041/verify.js', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  fs.rmSync(directory, { recursive: true });
  return result;
}

test('subject freezes 18 transfer puzzles and two disclosed optimization overlaps', () => {
  const { corpus, primary, excluded } = loadPanel();
  assert.equal(corpus.puzzles.length, 20);
  assert.equal(primary.length, 18);
  assert.equal(excluded.size, 2);
});

test('public verifier accepts a complete known-legal calibration matrix', () => {
  const artifact = calibrationArtifact();
  const result = runPublic(artifact);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).primaryOutcome, 'INCONCLUSIVE');
});

test('public verifier reads and rejects a planted replay defect', () => {
  const artifact = calibrationArtifact();
  artifact.rows[0].witness.trace[0].score++;
  artifact.rows[0].score = artifact.rows[0].witness.score;
  const broken = reseal(artifact);
  assert.equal(broken.rows[0].witness.trace[0].score, artifact.rows[0].witness.trace[0].score);
  const result = runPublic(broken);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /trace at move 1/);
});

test('externally anchored subject identity rejects coherent artifact substitution', () => {
  const artifact = calibrationArtifact();
  artifact.subjectIdentity = `${SUBJECT_IDENTITY.slice(0, -1)}0`;
  assert.throws(() => verifyArtifact(reseal(artifact)), /subject identity mismatch/);
});

test('missing, duplicate, and source-substituted matrix evidence is rejected', () => {
  const mutations = [
    artifact => artifact.rows.pop(),
    artifact => { artifact.rows[1] = structuredClone(artifact.rows[0]); },
    artifact => { artifact.sources['solver/oracle/search.js'] = '0'.repeat(64); },
  ];
  for (const mutate of mutations) {
    const artifact = calibrationArtifact();
    mutate(artifact);
    assert.throws(() => verifyArtifact(reseal(artifact)));
  }
});

test('analysis is derived from verified raw rows rather than reported comparisons', () => {
  const result = analyze(calibrationArtifact());
  assert.deepEqual(result.checks, { P1: 'INCONCLUSIVE', P2: 'SUPPORTED', P3: 'SUPPORTED' });
  assert.equal(result.primaryOutcome, 'INCONCLUSIVE');
  assert.equal(result.pairedRegressions, 0);
});

test('production search calls the injected ranker and preserves bounded UNKNOWN semantics', () => {
  let calls = 0;
  const level = { gridW: 3, gridH: 3, moves: 2, minChain: 2, target: 1_000_000, tileScale: 1, blockers: [] };
  const result = search({
    level,
    seed: 7,
    budgetMs: 30000,
    maxExpandedStates: 2,
    includeBaseline: false,
    rankStateFn: state => { calls++; return state.score; },
  });
  assert.ok(calls > 0);
  assert.equal(result.best, null);
  assert.equal(result.standing, 'UNKNOWN');
  assert.equal(result.terminationReason, 'work-budget');
});
