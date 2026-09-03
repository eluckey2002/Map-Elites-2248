const assert = require('node:assert/strict');
const test = require('node:test');

const { addedIn } = require('../../tools/verify-experiments');
const {
  CONFIRMATION_SEEDS,
  LEVEL_NUMBERS,
  artifactWithIdentity,
  resignArtifact,
} = require('./subject');
const { qualificationArtifactBody, authorizeConfirmation } = require('./run');
const {
  issueChallengeReceipt,
  receiptWithIdentity,
  validateChallengeReceipt,
  verifyArtifact,
} = require('./gate');
const {
  identity: independentIdentity,
  receiptForArtifact,
  summarize: independentlySummarize,
} = require('./recompute');
const { validateIndependent } = require('./admit');
const reference = require('../../solver/bot');
const handmade = require('./frozen-handmade-policy');

function qualification() {
  const protocolCommit = addedIn('experiments/RESULT-0026/protocol.md');
  if (!protocolCommit) throw new Error('RESULT-0026 protocol must be committed before the qualified tests can pass');
  return artifactWithIdentity(qualificationArtifactBody(), {
    exploratory: false,
    protocol: 'RESULT-0026',
    protocolCommit,
  });
}

function resignReceipt(receipt, mutate) {
  const { receiptIdentity, ...body } = structuredClone(receipt);
  mutate(body);
  return receiptWithIdentity(body);
}

test('real qualification subject passes and a resigned wrong-outcome twin fails the same gate', () => {
  const artifact = qualification();
  assert.equal(verifyArtifact(artifact).verdict, 'PASS');
  assert.ok(artifact.cells.every((cell) => cell.movesUsed <= cell.moveBudget));
  assert.deepEqual(
    artifact.cells.map(({ policy, level, targetReached, movesToTarget, movesUsed, score }) => (
      { policy, level, targetReached, movesToTarget, movesUsed, score }
    )),
    [
      { policy: 'reference', level: 5, targetReached: true, movesToTarget: 7, movesUsed: 7, score: 2400 },
      { policy: 'reference', level: 50, targetReached: true, movesToTarget: 20, movesUsed: 20, score: 76704 },
      { policy: 'handmade', level: 5, targetReached: true, movesToTarget: 7, movesUsed: 7, score: 2688 },
      { policy: 'handmade', level: 50, targetReached: true, movesToTarget: 19, movesUsed: 19, score: 76320 },
    ],
  );

  const twin = structuredClone(artifact);
  twin.cells[0].score += 1;
  const resigned = resignArtifact(twin);
  assert.equal(resigned.cells[0].score, artifact.cells[0].score + 1, 'garbage mutation must really land');
  assert.throws(() => verifyArtifact(resigned), /policy outcome mismatch/);
});

test('challenge receipt records valid PASS, broken FAIL, and source-change invalidation', () => {
  const artifact = qualification();
  const receipt = issueChallengeReceipt(artifact);
  assert.equal(receipt.valid.verdict, 'PASS');
  assert.equal(receipt.brokenTwin.verdict, 'FAIL');
  assert.equal(receipt.invalidationTwin.verdict, 'FAIL');
  assert.equal(validateChallengeReceipt(receipt, artifact).receiptIdentity, receipt.receiptIdentity);
});

test('confirmation authorization refuses a re-signed receipt that claims the broken twin passed', () => {
  const artifact = qualification();
  const receipt = issueChallengeReceipt(artifact);
  const broken = resignReceipt(receipt, (body) => { body.brokenTwin.verdict = 'PASS'; });
  assert.equal(broken.brokenTwin.verdict, 'PASS', 'garbage receipt mutation must really land');
  assert.throws(
    () => authorizeConfirmation(artifact, broken),
    /lacks required PASS\/FAIL\/FAIL qualification/,
  );
});

test('a re-signed forged receipt still fails because consumers rerun the challenge', () => {
  const artifact = qualification();
  const receipt = issueChallengeReceipt(artifact);
  const forged = resignReceipt(receipt, (body) => { body.brokenTwin.error = 'invented failure'; });
  assert.throws(
    () => authorizeConfirmation(artifact, forged),
    /does not match a fresh execution of the qualified challenge/,
  );
});

test('a caller-fabricated independent receipt cannot substitute for executing recompute.js', () => {
  const cells = additiveCells();
  const body = {
    schemaVersion: 1,
    result: 'RESULT-0026',
    kind: 'confirmation',
    reportable: true,
    levelNumbers: LEVEL_NUMBERS,
    seeds: CONFIRMATION_SEEDS,
    cells,
  };
  const artifact = artifactWithIdentity(body, {
    exploratory: false,
    protocol: 'RESULT-0026',
    protocolCommit: 'synthetic-confirmation-test',
  });
  const valid = receiptForArtifact(artifact);
  assert.equal(validateIndependent(valid, artifact, valid.summary), valid.artifactIdentity);

  const forgedBody = { ...valid, recomputeSourceIdentity: '0'.repeat(64) };
  delete forgedBody.artifactIdentity;
  const forged = { ...forgedBody, artifactIdentity: independentIdentity(forgedBody) };
  assert.throws(
    () => validateIndependent(forged, artifact, valid.summary),
    /does not match execution of the frozen recomputation/,
  );
});

function additiveCells() {
  const cells = [];
  const levelOffsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
  const seedOffsets = Array.from({ length: 25 }, (_, index) => index - 12);
  for (let levelIndex = 0; levelIndex < LEVEL_NUMBERS.length; levelIndex += 1) {
    const level = LEVEL_NUMBERS[levelIndex];
    for (let seedIndex = 0; seedIndex < CONFIRMATION_SEEDS.length; seedIndex += 1) {
      const seed = CONFIRMATION_SEEDS[seedIndex];
      const difference = 3 + levelOffsets[levelIndex] + seedOffsets[seedIndex];
      cells.push({ policy: 'reference', level, seed, targetReached: true, movesToTarget: 50, moveBudget: 100 });
      cells.push({ policy: 'handmade', level, seed, targetReached: true, movesToTarget: 50 - difference, moveBudget: 100 });
    }
  }
  return cells;
}

test('two-way clustered intersection correction blocks the additive false-SUPPORTED panel', () => {
  const cells = additiveCells();
  const primary = require('./gate').summarize(cells, LEVEL_NUMBERS, CONFIRMATION_SEEDS);
  const independent = independentlySummarize(cells);
  assert.equal(primary.primaryVerdict, 'INCONCLUSIVE');
  assert.ok(primary.t < 2, `two-way t ${primary.t} must remain below 2`);
  assert.deepEqual(primary, independent);
});

test('the frozen handmade subject is explicitly bomb-first and matches the reference decision on a bomb state', () => {
  const tile = (x, y, value, blocker = null) => ({ x, y, value, blocker, bombTimer: blocker === 'bomb' ? 2 : 0 });
  const state = {
    gridWidth: 3,
    gridHeight: 2,
    grid: [
      [tile(0, 0, 2), tile(1, 0, 2, 'bomb'), tile(2, 0, 4)],
      [tile(0, 1, 32), tile(1, 1, 32), tile(2, 1, 64)],
    ],
    minChain: 2,
    tileScale: 1,
    score: 0,
    targetScore: 100,
  };
  const key = (chain) => chain.map(({ x, y }) => `${x},${y}`).join('>');
  const options = { params: reference.DEFAULT_PARAMS };
  assert.equal(key(handmade.chooseMove(state, options)), key(reference.chooseMove(state, options)));
});

test('covered policy identity mutation invalidates the subject even after re-signing', () => {
  const artifact = qualification();
  const twin = structuredClone(artifact);
  twin.sources['experiments/RESULT-0026/frozen-handmade-policy.js'] = '0'.repeat(64);
  const resigned = resignArtifact(twin);
  assert.notEqual(resigned.artifactIdentity, artifact.artifactIdentity);
  assert.throws(() => verifyArtifact(resigned), /source identity closure mismatch/);
});
