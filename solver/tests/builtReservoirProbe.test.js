const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  INITIAL_MAX_MULTIPLIER,
  MAX_BUILT_TILES,
  normalizedBuiltReservoirHarvest,
} = require('../built-reservoir-probe');
const { resolveRecordedBoard } = require('../human-benchmark');
const {
  collectQualification,
  qualify,
  realInputIntegrityControl,
  runSyntheticControls,
  verifyArtifactIdentity,
} = require('../../tools/qualify-built-reservoir-proxy');

const ROOT = path.join(__dirname, '..', '..');
const RECORDING = path.join(
  ROOT,
  'play-sessions',
  'ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json',
);
const CONTRACT = path.join(
  ROOT,
  'docs',
  'learning-cycles',
  'LC-0002-built-reservoir-proxy-contract.md',
);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function identities(recordingPath = RECORDING) {
  return {
    recordingPath,
    contractPath: CONTRACT,
    expectedRecordingSha256: sha256(RECORDING),
    expectedBotSha256: sha256(path.join(ROOT, 'solver', 'bot.js')),
    expectedEngineSha256: sha256(path.join(ROOT, 'solver', 'engine.js')),
    expectedContractSha256: sha256(CONTRACT),
  };
}

test('the proxy has the frozen cutoff and exact-search bound', () => {
  assert.equal(INITIAL_MAX_MULTIPLIER, 16);
  assert.equal(MAX_BUILT_TILES, 12);
});

test('positive, scale, isolated-mass, and initial-boundary controls pass', () => {
  const controls = runSyntheticControls();
  assert.deepEqual(controls.map(({ id }) => id), [
    'positive-topology',
    'scale-negative',
    'isolated-mass',
    'initial-value-boundary',
  ]);
  assert.ok(controls.every(({ pass }) => pass));
});

test('more than twelve built tiles is unmeasured rather than silently zero', () => {
  const grid = Array.from({ length: 4 }, (_, y) => (
    Array.from({ length: 4 }, (_, x) => ({ x, y, value: 32, blocker: null }))
  ));
  const result = normalizedBuiltReservoirHarvest({
    grid,
    gridWidth: 4,
    gridHeight: 4,
    minChain: 3,
    tileScale: 1,
  });
  assert.equal(result.status, 'UNMEASURED');
  assert.equal(result.builtTileCount, 16);
});

test('the real recording passes and a planted false value is rejected', () => {
  const recording = JSON.parse(fs.readFileSync(RECORDING, 'utf8'));
  const candidate = resolveRecordedBoard(recording).candidate;
  const control = realInputIntegrityControl(candidate, recording);
  assert.equal(control.pass, true);
  assert.deepEqual(control.observed.cleanProblems, []);
  assert.ok(control.observed.plantedProblems.some((problem) => /recording claims/.test(problem)));
});

test('trusted recording identity rejects a coherent path substitution', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'reservoir-proxy-'));
  const substituted = path.join(directory, 'recording.json');
  const recording = JSON.parse(fs.readFileSync(RECORDING, 'utf8'));
  recording.source = 'coherently substituted fixture';
  fs.writeFileSync(substituted, `${JSON.stringify(recording, null, 2)}\n`);

  assert.throws(
    () => collectQualification(identities(substituted)),
    /recording identity mismatch/,
  );
});

test('the complete known-case panel honestly fails the frozen discriminator', () => {
  const artifact = collectQualification(identities());
  assert.equal(verifyArtifactIdentity(artifact), true);
  assert.ok(artifact.controls.every(({ pass }) => pass));
  assert.equal(artifact.panel.cells.length, 15);

  const result = qualify(artifact);
  assert.equal(result.qualification, 'FAIL');
  assert.equal(result.decisionCells, 10);
  assert.equal(result.passingCells, 5);
  assert.deepEqual(result.failures.map(({ move }) => move), [2, 6, 9, 11, 13]);
  assert.deepEqual(result.failures.map(({ label }) => label), [
    'helpful', 'helpful', 'harmful', 'helpful', 'helpful',
  ]);
});

test('the generic proxy source contains no Level 54 training identifiers', () => {
  const source = fs.readFileSync(path.join(ROOT, 'solver', 'built-reservoir-probe.js'), 'utf8');
  assert.equal(source.includes('1313839221'), false);
  assert.equal(source.includes('ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78'), false);
  assert.equal(source.includes('candidateLevel'), false);
});
