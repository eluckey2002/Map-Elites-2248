#!/usr/bin/env node

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { choosePercentileCandidate } = require('../../solver/greed-descriptor-screen');
const { addedIn } = require('../../tools/verify-experiments');
const { qualificationCommand, ROOT, sourcePaths } = require('./manifest');
const { reduceCorpus } = require('./recompute');
const { greedBinStability, summarizeDeterministicGreed } = require('./result');
const {
  CONFIRMATION_SEEDS,
  EMERGENCY_TIMEOUT_MS,
  EXACT_MAX_PATH_STATES,
  EXPECTED_GAMES,
  PERCENTILES,
  PROFILE_LEVELS,
  RESULT,
  artifactWithIdentity,
  identity,
  sourceHashes,
  subjectIdentity,
  subjectIdentityFromSources,
} = require('./subject');
const { verifyArtifact } = require('./verify');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function greedFor(percentile) {
  return new Map([[0.25, 0.30], [0.5, 0.55], [0.75, 0.80], [1, 0.95]]).get(percentile);
}

function fixtureRows({
  percentiles = PERCENTILES,
  levels = PROFILE_LEVELS,
  seeds = CONFIRMATION_SEEDS,
} = {}) {
  return percentiles.flatMap((percentile, policyIndex) => levels.flatMap((level) => (
    seeds.map((seed, seedIndex) => {
      const exactComplete = seedIndex !== 0;
      const greedRatio = exactComplete ? greedFor(percentile) : null;
      const greed = greedRatio === null ? null : greedRatio < 0.45 ? 0 : greedRatio < 0.75 ? 1 : 2;
      return {
        percentile,
        level,
        seed,
        score: 1000 + ((seedIndex + level) % 7) * 17,
        win: seedIndex < policyIndex * 2 + 1,
        moves: 1,
        terminal: 'moves',
        denominator: 'exact',
        denominatorObservations: exactComplete ? [{
          standing: 'exact_result',
          maxPathStates: EXACT_MAX_PATH_STATES,
          timeoutMs: EMERGENCY_TIMEOUT_MS,
          points: 100,
          legalChains: 3,
          visitedPathStates: 40,
        }] : [{
          standing: 'UNKNOWN',
          reason: 'work-limit',
          maxPathStates: EXACT_MAX_PATH_STATES,
          timeoutMs: EMERGENCY_TIMEOUT_MS,
          visitedPathStates: EXACT_MAX_PATH_STATES,
        }],
        exactComplete,
        descriptors: { greedRatio, halfScoreMove: policyIndex % 2 ? 0.55 : 0.35 },
        cell: exactComplete ? { greed, timing: policyIndex % 2, key: `${policyIndex % 2},${greed}` } : null,
      };
    })
  )));
}

function registration() {
  const protocolPath = `experiments/${RESULT}/protocol.md`;
  const protocolCommit = addedIn(protocolPath, ROOT);
  if (!protocolCommit) throw new Error('protocol is not committed');
  return { exploratory: false, protocol: RESULT, protocolCommit };
}

function fixtureArtifact() {
  const rows = fixtureRows();
  const body = {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    finalSubjectIdentity: subjectIdentity(),
    proofStanding: 'qualification fixture only',
    definitions: { greedRatio: 'qualification fixture', halfScoreMove: 'diagnostic only' },
    panel: {
      levels: PROFILE_LEVELS,
      seeds: CONFIRMATION_SEEDS,
      percentiles: PERCENTILES,
      exactMaxPathStates: EXACT_MAX_PATH_STATES,
      emergencyTimeoutMs: EMERGENCY_TIMEOUT_MS,
      expectedGames: EXPECTED_GAMES,
    },
    sources: sourceHashes(),
    rows,
    decision: summarizeDeterministicGreed(rows, {
      expectedGames: EXPECTED_GAMES,
      percentiles: PERCENTILES,
    }),
  };
  return artifactWithIdentity(body, registration());
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resign(artifact) {
  const { artifactIdentity: _old, registration: stamp, ...body } = artifact;
  return { ...body, registration: stamp, artifactIdentity: identity(body) };
}

function expectedFailure(id, artifact, pattern) {
  let observed = null;
  try { verifyArtifact(artifact); } catch (error) { observed = error.message; }
  assert.match(observed || '', pattern, `${id} survived production verification`);
  return { id, classification: 'KILL', expectedReason: pattern.source, observed };
}

function compareReducers(corpus) {
  const registered = summarizeDeterministicGreed(corpus.rows, {
    expectedGames: corpus.panel.expectedGames,
    percentiles: corpus.panel.percentiles,
  });
  assert.deepEqual(reduceCorpus(corpus), registered);
}

function qualify() {
  const cleanSourcesBefore = sourceHashes();
  const command = qualificationCommand();
  const tests = spawnSync(command[0], command.slice(1), { cwd: ROOT, encoding: 'utf8' });
  if (tests.status !== 0) throw new Error(`qualification tests failed:\n${tests.stdout}\n${tests.stderr}`);

  const clean = fixtureArtifact();
  const cleanVerdict = verifyArtifact(clean);

  const candidates = [{ points: 100 }, { points: 75 }, { points: 50 }, { points: 25 }];
  const scaled = candidates.map(({ points }) => ({ points: points * 2 }));
  for (const percentile of PERCENTILES) {
    const selected = choosePercentileCandidate(candidates, percentile).points / candidates[0].points;
    const scaledSelected = choosePercentileCandidate(scaled, percentile).points / scaled[0].points;
    assert.equal(selected, scaledSelected);
  }

  const unstable = [1, 0, 2, 1, 0, 2, 1, 1].map((greed) => ({
    percentile: 0.5,
    exactComplete: true,
    cell: { greed },
  }));
  const instability = greedBinStability(unstable, 0.5);
  assert.deepEqual(instability, { modalGreedBin: 1, exactModalGreedRate: 0.5 });

  const mutations = [];
  const bodyMutation = clone(clean);
  bodyMutation.rows[0].score += 1;
  mutations.push(expectedFailure('M1-stale-body-hash', bodyMutation, /artifact identity mismatch/));

  const seedMutation = clone(clean);
  const replacementSeeds = CONFIRMATION_SEEDS.map((seed) => seed + 1000);
  seedMutation.panel.seeds = replacementSeeds;
  seedMutation.rows.forEach((row) => { row.seed += 1000; });
  mutations.push(expectedFailure('M2-coherent-seed-substitution', resign(seedMutation), /registered seed panel mismatch/));

  const workMutation = clone(clean);
  const capped = workMutation.rows.find((row) => !row.exactComplete);
  capped.denominatorObservations[0].visitedPathStates -= 1;
  mutations.push(expectedFailure('M3-work-limit-count', resign(workMutation), /work-limit state count mismatch/));

  const sourceMutation = clone(clean);
  const sourcePath = sourcePaths().find((relative) => relative.endsWith('exact-score.test.js'));
  sourceMutation.sources[sourcePath] = '0'.repeat(64);
  sourceMutation.finalSubjectIdentity = subjectIdentityFromSources(sourceMutation.sources);
  mutations.push(expectedFailure('M4-coherent-source-substitution', resign(sourceMutation), /source identity closure mismatch/));

  const baseCorpus = { panel: { percentiles: PERCENTILES, expectedGames: EXPECTED_GAMES }, rows: fixtureRows() };
  compareReducers(baseCorpus);

  const zeroExact = clone(baseCorpus);
  zeroExact.rows.filter(({ percentile }) => percentile === 0.5).forEach((row) => {
    row.exactComplete = false;
    row.descriptors.greedRatio = null;
    row.cell = null;
  });
  compareReducers(zeroExact);

  const nullCell = clone(baseCorpus);
  nullCell.rows.find(({ exactComplete }) => exactComplete).cell = null;
  compareReducers(nullCell);

  const nonDefaultRows = fixtureRows({ percentiles: [0.25, 1] });
  compareReducers({ panel: { percentiles: [0.25, 1], expectedGames: nonDefaultRows.length }, rows: nonDefaultRows });

  const timingChanged = clone(baseCorpus.rows);
  timingChanged.forEach((row) => {
    row.descriptors.halfScoreMove = row.descriptors.halfScoreMove < 0.5 ? 0.9 : 0.1;
    if (row.cell) row.cell.timing = row.cell.timing === 0 ? 2 : 0;
  });
  const before = summarizeDeterministicGreed(baseCorpus.rows, { expectedGames: EXPECTED_GAMES, percentiles: PERCENTILES });
  const after = summarizeDeterministicGreed(timingChanged, { expectedGames: EXPECTED_GAMES, percentiles: PERCENTILES });
  assert.deepEqual(
    { P1: before.P1, P2: before.P2, P3: before.P3, P4: before.P4, P5: before.P5, policies: before.policies },
    { P1: after.P1, P2: after.P2, P3: after.P3, P4: after.P4, P5: after.P5, policies: after.policies },
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0040-qualification-'));
  try {
    const corpusPath = path.join(tempDir, 'corpus.json');
    fs.writeFileSync(corpusPath, `${JSON.stringify(baseCorpus)}\n`);
    const recomputation = spawnSync(process.execPath, [
      path.join(ROOT, 'experiments/RESULT-0040/recompute.js'), '--corpus', corpusPath,
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(recomputation.status, 0, recomputation.stderr);
    assert.equal(recomputation.stdout, `${JSON.stringify(reduceCorpus(baseCorpus))}\n`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  const cleanSourcesAfter = sourceHashes();
  assert.deepEqual(cleanSourcesAfter, cleanSourcesBefore);
  return {
    schemaVersion: 1,
    result: RESULT,
    qualification: 'PASS',
    finalSubjectIdentity: subjectIdentity(),
    oracle: {
      path: `experiments/${RESULT}/registered-protocol.md`,
      sha256: sourceHashes()[`experiments/${RESULT}/registered-protocol.md`],
    },
    productionSeam: `experiments/${RESULT}/verify.js#verifyArtifact`,
    manifest: { paths: sourcePaths(), identity: sha256(JSON.stringify(sourcePaths())) },
    controls: {
      cleanBaseline: cleanVerdict.verdict,
      positiveAndScaleInvariantSelection: 'PASS',
      unstableMiddleBin: instability,
      reducerEdgeFixtures: ['work-limited', 'zero-exact-policy', 'null-cell', 'non-default-policy-panel'],
      timingOrthogonality: 'PASS',
      restoration: 'PASS',
    },
    mutations,
    testCommand: command,
    testExitCode: tests.status,
    testOutputSha256: sha256(`${tests.stdout}${tests.stderr}`),
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1 || argv[0] !== 'write') throw new Error('usage: qualify.js write');
  const output = path.join(__dirname, 'qualification.json');
  if (fs.existsSync(output)) throw new Error('refusing to overwrite qualification.json');
  const receipt = qualify();
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`PASS ${output} ${receipt.finalSubjectIdentity}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { fixtureArtifact, fixtureRows, qualify };
