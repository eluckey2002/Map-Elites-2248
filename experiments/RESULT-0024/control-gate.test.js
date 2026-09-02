const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.join(__dirname, '..', '..');
const {
  LAYOUTS,
  POLICIES,
  SOURCE_PATHS,
  objectIdentity,
} = require('./run');
const {
  CONTROL_SEEDS,
  countOutcomeChangedPairs,
  issueControlReceipt,
  makeOutcomeIdenticalTwin,
  validateControlEntitlement,
  verifyControls,
  withReceiptIdentity,
} = require('./verify');

function fileHash(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function cell(policyId, layout, seed) {
  return {
    policyId,
    layout,
    seed,
    score: 100,
    movesUsed: 24,
    behaviorTotals: { chainCount: 1, chainTiles: 3, totalScore: 100, lateScore: 20 },
    behavior: { meanChainLength: 3, lateScoreShare: 0.2 },
  };
}

function fixture() {
  const cells = [];
  for (const { policyId } of POLICIES) {
    for (const { name } of LAYOUTS) {
      for (const seed of CONTROL_SEEDS) cells.push(cell(policyId, name, seed));
    }
  }
  return {
    schemaVersion: 1,
    result: 'RESULT-0024',
    kind: 'controls',
    subjects: {
      policies: POLICIES,
      layouts: LAYOUTS.map((entry) => ({ ...entry, layoutIdentity: objectIdentity(entry) })),
    },
    seeds: CONTROL_SEEDS,
    sources: Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)])),
    cells,
    repeatCells: structuredClone(cells),
    artifactIdentity: 'fixture-controls',
  };
}

function withOneOutcomeChange() {
  const artifact = fixture();
  for (const cells of [artifact.cells, artifact.repeatCells]) {
    const target = cells.find(({ policyId, layout, seed }) => (
      policyId === POLICIES[0].policyId
        && layout === 'two-center-stones'
        && seed === CONTROL_SEEDS[0]
    ));
    target.score += 1;
  }
  return artifact;
}

function resign(receipt, mutate) {
  const { artifactIdentity, ...body } = structuredClone(receipt);
  mutate(body);
  return withReceiptIdentity(body);
}

test('outcome-only positive control passes a real gameplay difference', () => {
  const artifact = withOneOutcomeChange();
  assert.equal(countOutcomeChangedPairs(artifact.cells), 1);
  assert.equal(verifyControls(artifact).positiveOutcomeChangedPairs, 1);
});

test('outcome-identical twin fails even though layout identity fields differ', () => {
  const artifact = fixture();
  assert.equal(countOutcomeChangedPairs(artifact.cells), 0, 'garbage twin must really contain zero gameplay differences');
  assert.throws(
    () => verifyControls(artifact),
    /positive control: zero gameplay outcome pairs differ/,
  );

  const twin = makeOutcomeIdenticalTwin(withOneOutcomeChange());
  assert.equal(countOutcomeChangedPairs(twin.cells), 0, 'mutation must erase every gameplay difference');
  assert.throws(
    () => verifyControls(twin),
    /positive control: zero gameplay outcome pairs differ/,
  );
});

test('control receipt binds valid PASS, broken FAIL, and exact control subject', () => {
  const artifact = withOneOutcomeChange();
  const receipt = issueControlReceipt(artifact);
  const entitlement = validateControlEntitlement(receipt, artifact);
  assert.equal(entitlement.receiptIdentity, receipt.artifactIdentity);
  assert.equal(entitlement.controlsIdentity, artifact.artifactIdentity);

  assert.throws(
    () => validateControlEntitlement(resign(receipt, (body) => { body.controlsIdentity = 'another-control'; }), artifact),
    /control receipt subject mismatch/,
  );
  assert.throws(
    () => validateControlEntitlement(resign(receipt, (body) => { body.valid.verdict = 'FAIL'; }), artifact),
    /does not carry a valid PASS/,
  );
  assert.throws(
    () => validateControlEntitlement(resign(receipt, (body) => { body.brokenTwin.verdict = 'PASS'; }), artifact),
    /does not carry the required broken-twin FAIL/,
  );
});

test('confirmation runner refuses to run without the qualified receipt', () => {
  const output = path.join(os.tmpdir(), `result-0024-refusal-${process.pid}.json`);
  const result = spawnSync(process.execPath, [
    path.join(__dirname, 'run.js'),
    'confirmation',
    '--protocol',
    'RESULT-0024',
    '--out',
    output,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /confirmation requires --controls <path> and --control-receipt <path>/);
  assert.equal(fs.existsSync(output), false);
});
