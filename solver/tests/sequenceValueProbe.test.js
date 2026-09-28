const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  THREE_STEP_HORIZON,
  sequenceCostFromOutcome,
} = require('../sequence-value-probe');
const { resolveRecordedBoard } = require('../human-benchmark');
const {
  createManifest,
  artifactWithIdentity,
  qualify,
  realInputIntegrityControl,
  runControls,
  runPersistenceControl,
  validateManifest,
  verifyArtifactIdentity,
} = require('../../tools/qualify-three-step-target-progress');

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
  'LC-0003-three-step-target-progress-contract.md',
);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

test('the primary reducer has frozen non-overlapping outcome bands', () => {
  assert.equal(THREE_STEP_HORIZON, 3);
  assert.equal(sequenceCostFromOutcome({ status: 'win', continuationMoves: 0, score: 100, targetScore: 100 }), 0);
  assert.equal(sequenceCostFromOutcome({ status: 'win', continuationMoves: 3, score: 100, targetScore: 100 }), 3);
  assert.equal(sequenceCostFromOutcome({ status: 'active', continuationMoves: 3, score: 75, targetScore: 100 }), 4.25);
  assert.equal(sequenceCostFromOutcome({ status: 'loss', continuationMoves: 2, score: 75, targetScore: 100 }), 6.25);
});

test('the frozen controls pass through the real proxy and recording seam', () => {
  const recording = JSON.parse(fs.readFileSync(RECORDING, 'utf8'));
  const candidate = resolveRecordedBoard(recording).candidate;
  const controls = runControls(candidate, recording);
  assert.deepEqual(controls.map(({ id }) => id), [
    'band-order',
    'third-step-horizon-kill',
    'scale-negative',
    'orthogonal-diagnostic',
    'real-reference-aa',
    'real-input-integrity',
    'persistence-before-verdict',
  ]);
  assert.ok(controls.every(({ pass }) => pass));
});

test('a false recording claim is rejected before measurement', () => {
  const recording = JSON.parse(fs.readFileSync(RECORDING, 'utf8'));
  const candidate = resolveRecordedBoard(recording).candidate;
  const control = realInputIntegrityControl(candidate, recording);
  assert.equal(control.pass, true);
  assert.deepEqual(control.observed.cleanProblems, []);
  assert.ok(control.observed.plantedProblems.some((problem) => /recording claims/.test(problem)));
});

test('a thrown verdict retains the complete raw artifact', () => {
  const control = runPersistenceControl();
  assert.equal(control.pass, true);
  assert.equal(control.observed.threw, true);
  assert.deepEqual(control.observed.retained, { complete: true, cells: [1, 2, 3] });
});

test('a planted failed control makes the verdict go red before any panel claim', () => {
  const artifact = artifactWithIdentity({
    controls: [{ id: 'planted-red', pass: false }],
    panel: null,
  });
  assert.deepEqual(qualify(artifact), {
    qualification: 'UNVERIFIED',
    problems: ['control planted-red failed', 'decision panel was not collected', 'decision matrix mismatch'],
    failures: [],
  });
});

test('an incomplete decision cell is unverified rather than throwing', () => {
  const cells = Array.from({ length: 15 }, (_, index) => ({
    move: index + 1,
    expectedLabel: index === 0 ? 'harmful' : 'neutral',
    observedLabel: index === 0 ? 'harmful' : 'neutral',
    arms: index === 0 ? { owner: null, champion: null } : {
      owner: { before: {}, sequence: { cost: 4, chooserCalls: 3 } },
      champion: { before: {}, sequence: { cost: 4, chooserCalls: 3 } },
    },
  }));
  const result = qualify(artifactWithIdentity({ controls: [], panel: { cells } }));
  assert.equal(result.qualification, 'UNVERIFIED');
  assert.ok(result.problems.includes('move 1 is missing a measured arm'));
});

test('the mechanical manifest binds every declared source', () => {
  const manifest = createManifest({ recordingPath: RECORDING, contractPath: CONTRACT });
  assert.equal(verifyArtifactIdentity(manifest), true);
  assert.equal(manifest.identities.contract, sha256(CONTRACT));
  assert.equal(manifest.identities.sequenceProbe, sha256(path.join(ROOT, 'solver', 'sequence-value-probe.js')));
  assert.equal(manifest.identities.harness, sha256(path.join(ROOT, 'tools', 'qualify-three-step-target-progress.js')));

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'three-step-manifest-'));
  const file = path.join(directory, 'manifest.json');
  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.doesNotThrow(() => validateManifest(JSON.parse(fs.readFileSync(file, 'utf8'))));
});

test('coherent recording substitution fails against the external manifest', () => {
  const manifest = createManifest({ recordingPath: RECORDING, contractPath: CONTRACT });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'three-step-substitution-'));
  const substituted = path.join(directory, 'recording.json');
  const recording = JSON.parse(fs.readFileSync(RECORDING, 'utf8'));
  recording.source = 'coherently substituted fixture';
  fs.writeFileSync(substituted, `${JSON.stringify(recording, null, 2)}\n`);
  manifest.paths.recording = path.relative(ROOT, substituted);
  const { artifactIdentity: _old, ...body } = manifest;
  const coherent = {
    ...body,
    artifactIdentity: crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex'),
  };
  assert.throws(() => validateManifest(coherent), /recording identity mismatch/);
});

test('the generic proxy source contains no Level 54 training identifiers', () => {
  const source = fs.readFileSync(path.join(ROOT, 'solver', 'sequence-value-probe.js'), 'utf8');
  assert.equal(source.includes('1313839221'), false);
  assert.equal(source.includes('ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78'), false);
  assert.equal(source.includes('candidateLevel'), false);
});
