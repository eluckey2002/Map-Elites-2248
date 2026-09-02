#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const { policyIdentity } = require(path.join(ROOT, 'solver', 'map-elites-core'));
const {
  LAYOUTS,
  POLICIES,
  objectIdentity,
} = require(path.join(ROOT, 'experiments', 'RESULT-0023', 'run'));

const RESULT = 'RESULT-0024';
const CONTROL_SEEDS = Object.freeze(Array.from({ length: 12 }, (_, index) => 22_000_000 + index));
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 200 }, (_, index) => 23_000_000 + index));
const OUTCOME_FIELDS = Object.freeze(['score', 'movesUsed', 'behaviorTotals', 'behavior']);
const EXPECTED_SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0024/run.js',
  'experiments/RESULT-0024/verify.js',
  'experiments/RESULT-0024/recompute.js',
  'experiments/RESULT-0024/control-gate.test.js',
  'experiments/RESULT-0023/run.js',
  'solver/bot.js',
  'solver/engine.js',
  'solver/policy-eval.js',
  'solver/map-elites-core.js',
  'solver/map-elites-output/archive.json',
  'src/game.js',
]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fileHash(relative) {
  return hashBytes(fs.readFileSync(path.join(ROOT, relative)));
}

function receiptIdentity(value) {
  return hashBytes(canonicalJson(value));
}

function withReceiptIdentity(body) {
  return { ...body, artifactIdentity: receiptIdentity(body) };
}

function readArtifact(file) {
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { artifactIdentity, registration, ...body } = artifact;
  if (typeof artifactIdentity !== 'string') throw new Error(`${file}: artifactIdentity missing`);
  const actual = objectIdentity(body);
  if (actual !== artifactIdentity) throw new Error(`${file}: artifact identity mismatch (${actual} != ${artifactIdentity})`);
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT
    || !/^[0-9a-f]{40}$/.test(registration.protocolCommit || '')) {
    throw new Error(`${file}: invalid registration stamp`);
  }
  return artifact;
}

function readReceipt(file) {
  const receipt = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { artifactIdentity, ...body } = receipt;
  if (receiptIdentity(body) !== artifactIdentity) throw new Error(`${file}: receipt identity mismatch`);
  return receipt;
}

function expectedSubjects() {
  return {
    policies: POLICIES,
    layouts: LAYOUTS.map((entry) => ({ ...entry, layoutIdentity: objectIdentity(entry) })),
  };
}

function verifySubjects(artifact) {
  if (artifact.result !== RESULT) throw new Error(`wrong result ${artifact.result}`);
  if (canonicalJson(artifact.subjects) !== canonicalJson(expectedSubjects())) throw new Error('subject closure mismatch');
  for (const policy of artifact.subjects.policies) {
    if (policyIdentity(policy.params) !== policy.policyId) throw new Error(`policy identity mismatch for ${policy.policyId}`);
  }
  const sourceKeys = Object.keys(artifact.sources || {}).sort();
  if (canonicalJson(sourceKeys) !== canonicalJson([...EXPECTED_SOURCE_PATHS].sort())) throw new Error('source closure mismatch');
  for (const relative of EXPECTED_SOURCE_PATHS) {
    const actual = fileHash(relative);
    if (artifact.sources[relative] !== actual) throw new Error(`source hash mismatch for ${relative}`);
  }
  return { verdict: 'PASS', policyCount: 4, layoutCount: 3, sourceCount: EXPECTED_SOURCE_PATHS.length };
}

function keyOf(cell) {
  return `${cell.policyId}/${cell.layout}/${cell.seed}`;
}

function validateCell(cell) {
  if (!POLICIES.some(({ policyId }) => policyId === cell.policyId)) throw new Error(`unknown policy ${cell.policyId}`);
  if (!LAYOUTS.some(({ name }) => name === cell.layout)) throw new Error(`unknown layout ${cell.layout}`);
  if (!Number.isFinite(cell.score) || !Number.isFinite(cell.movesUsed)) throw new Error(`${keyOf(cell)}: non-finite outcome`);
  const totals = cell.behaviorTotals;
  if (!totals || !cell.behavior) throw new Error(`${keyOf(cell)}: behavior missing`);
  for (const field of ['chainCount', 'chainTiles', 'totalScore', 'lateScore']) {
    if (!Number.isFinite(totals[field])) throw new Error(`${keyOf(cell)}: behavior total ${field} is not finite`);
  }
  const meanChainLength = totals.chainCount ? totals.chainTiles / totals.chainCount : 0;
  const lateScoreShare = totals.totalScore ? totals.lateScore / totals.totalScore : 0;
  if (meanChainLength !== cell.behavior.meanChainLength || lateScoreShare !== cell.behavior.lateScoreShare) {
    throw new Error(`${keyOf(cell)}: behavior summary mismatch`);
  }
}

function expectedKeys(seeds) {
  const keys = [];
  for (const { policyId } of POLICIES) {
    for (const { name } of LAYOUTS) {
      for (const seed of seeds) keys.push(`${policyId}/${name}/${seed}`);
    }
  }
  return keys.sort();
}

function verifyCellSet(cells, seeds, label) {
  cells.forEach(validateCell);
  const actual = cells.map(keyOf).sort();
  if (canonicalJson(actual) !== canonicalJson(expectedKeys(seeds))) throw new Error(`${label}: expected key set mismatch`);
}

function outcomeOf(cell) {
  return Object.fromEntries(OUTCOME_FIELDS.map((field) => [field, cell[field]]));
}

function countOutcomeChangedPairs(cells, seeds = CONTROL_SEEDS) {
  const byKey = new Map(cells.map((cell) => [keyOf(cell), cell]));
  let changed = 0;
  for (const { policyId } of POLICIES) {
    for (const seed of seeds) {
      const one = byKey.get(`${policyId}/one-center-stone/${seed}`);
      const two = byKey.get(`${policyId}/two-center-stones/${seed}`);
      if (canonicalJson(outcomeOf(one)) !== canonicalJson(outcomeOf(two))) changed += 1;
    }
  }
  return changed;
}

function makeOutcomeIdenticalTwin(artifact) {
  const twin = structuredClone(artifact);
  const copyOutcomes = (cells) => {
    const oneByPair = new Map(cells
      .filter(({ layout }) => layout === 'one-center-stone')
      .map((cell) => [`${cell.policyId}/${cell.seed}`, cell]));
    return cells.map((cell) => {
      if (cell.layout !== 'two-center-stones') return cell;
      const source = oneByPair.get(`${cell.policyId}/${cell.seed}`);
      const copy = structuredClone(cell);
      for (const field of OUTCOME_FIELDS) copy[field] = structuredClone(source[field]);
      return copy;
    });
  };
  twin.cells = copyOutcomes(twin.cells);
  twin.repeatCells = copyOutcomes(twin.repeatCells);
  return twin;
}

function verifyControls(artifact) {
  if (artifact.kind !== 'controls') throw new Error('controls artifact has wrong kind');
  if (canonicalJson(artifact.seeds) !== canonicalJson(CONTROL_SEEDS)) throw new Error('control seeds mismatch');
  verifyCellSet(artifact.cells, CONTROL_SEEDS, 'controls');
  verifyCellSet(artifact.repeatCells, CONTROL_SEEDS, 'control repeat');
  if (canonicalJson(artifact.cells) !== canonicalJson(artifact.repeatCells)) {
    throw new Error('negative control changed on exact repeat');
  }
  const changed = countOutcomeChangedPairs(artifact.cells);
  if (changed === 0) throw new Error('positive control: zero gameplay outcome pairs differ');
  return { verdict: 'PASS', negativeRepeatCells: 144, positiveOutcomeChangedPairs: changed };
}

function issueControlReceipt(artifact) {
  const subjectCheck = verifySubjects(artifact);
  const valid = verifyControls(artifact);
  const twin = makeOutcomeIdenticalTwin(artifact);
  const twinOutcomeChangedPairs = countOutcomeChangedPairs(twin.cells);
  if (twinOutcomeChangedPairs !== 0) throw new Error('controlled twin mutation did not create zero outcome differences');
  let brokenVerdict = 'PASS';
  let brokenError = null;
  try {
    verifyControls(twin);
  } catch (error) {
    brokenVerdict = 'FAIL';
    brokenError = error.message;
  }
  if (brokenVerdict !== 'FAIL' || brokenError !== 'positive control: zero gameplay outcome pairs differ') {
    throw new Error('outcome-identical controlled twin did not fail at C2');
  }
  const body = {
    schemaVersion: 1,
    result: RESULT,
    kind: 'control-entitlement',
    authority: 'confirmation-execution',
    controlsIdentity: artifact.artifactIdentity,
    sourcesIdentity: receiptIdentity(artifact.sources),
    verifierIdentity: fileHash('experiments/RESULT-0024/verify.js'),
    subjectCheck,
    valid: { verdict: valid.verdict, positiveOutcomeChangedPairs: valid.positiveOutcomeChangedPairs },
    brokenTwin: {
      verdict: brokenVerdict,
      mutation: 'copy score, movesUsed, behaviorTotals, and behavior from each one-stone cell into its two-stone pair',
      outcomeChangedPairs: twinOutcomeChangedPairs,
      error: brokenError,
    },
  };
  return withReceiptIdentity(body);
}

function validateControlEntitlement(receipt, artifact) {
  const { artifactIdentity, ...body } = receipt || {};
  if (!artifactIdentity || receiptIdentity(body) !== artifactIdentity) throw new Error('control receipt identity mismatch');
  if (receipt.result !== RESULT || receipt.kind !== 'control-entitlement'
    || receipt.authority !== 'confirmation-execution') throw new Error('wrong control receipt authority');
  if (receipt.controlsIdentity !== artifact.artifactIdentity) throw new Error('control receipt subject mismatch');
  if (receipt.sourcesIdentity !== receiptIdentity(artifact.sources)) throw new Error('control receipt source mismatch');
  if (receipt.verifierIdentity !== fileHash('experiments/RESULT-0024/verify.js')) throw new Error('control receipt verifier mismatch');
  if (receipt.valid?.verdict !== 'PASS') throw new Error('control receipt does not carry a valid PASS');
  if (!(receipt.valid.positiveOutcomeChangedPairs > 0)) throw new Error('control receipt carries no positive outcome changes');
  if (receipt.brokenTwin?.verdict !== 'FAIL' || receipt.brokenTwin?.outcomeChangedPairs !== 0) {
    throw new Error('control receipt does not carry the required broken-twin FAIL');
  }
  return {
    receiptIdentity: receipt.artifactIdentity,
    controlsIdentity: artifact.artifactIdentity,
    verifierIdentity: receipt.verifierIdentity,
  };
}

function readControlEntitlement(receiptPath, controlsPath) {
  const controls = readArtifact(controlsPath);
  verifySubjects(controls);
  verifyControls(controls);
  return validateControlEntitlement(readReceipt(receiptPath), controls);
}

function verifyMatrix(artifact, expectedEntitlement) {
  if (artifact.kind !== 'confirmation') throw new Error('confirmation artifact has wrong kind');
  if (canonicalJson(artifact.seeds) !== canonicalJson(CONFIRMATION_SEEDS)) throw new Error('confirmation seeds mismatch');
  if (canonicalJson(artifact.halves) !== canonicalJson([[23_000_000, 23_000_099], [23_000_100, 23_000_199]])) {
    throw new Error('confirmation halves mismatch');
  }
  verifyCellSet(artifact.cells, CONFIRMATION_SEEDS, 'confirmation');
  const forbidden = new Set([...CONTROL_SEEDS, ...Array.from({ length: 200 }, (_, index) => 21_000_000 + index)]);
  if (artifact.cells.some(({ seed }) => forbidden.has(seed))) throw new Error('prior seed leaked into confirmation');
  if (canonicalJson(artifact.controlEntitlement) !== canonicalJson(expectedEntitlement)) {
    throw new Error('confirmation did not record the consumed control entitlement');
  }
  if (!artifact.execution || !Number.isFinite(artifact.execution.runtimeMs) || artifact.execution.runtimeMs <= 0) {
    throw new Error('confirmation runtime missing');
  }
  return { verdict: 'PASS', cells: artifact.cells.length, controlReceiptConsumed: expectedEntitlement.receiptIdentity };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function geometricResponse(numerators, denominators) {
  return Math.expm1(mean(numerators.map((value, index) => Math.log(Math.max(value, 1) / Math.max(denominators[index], 1)))));
}

function aggregateBehavior(cells) {
  const totals = { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 };
  for (const cell of cells) for (const key of Object.keys(totals)) totals[key] += cell.behaviorTotals[key];
  return {
    meanChainLength: totals.chainCount ? totals.chainTiles / totals.chainCount : 0,
    lateScoreShare: totals.totalScore ? totals.lateScore / totals.totalScore : 0,
  };
}

function uniqueExtreme(entries, minimum) {
  const sorted = [...entries].sort((a, b) => (
    (minimum ? a.response - b.response : b.response - a.response) || a.policyId.localeCompare(b.policyId)
  ));
  return sorted[0].response === sorted[1].response ? null : sorted[0].policyId;
}

function responseRows(cells, seeds) {
  const allowed = new Set(seeds);
  return POLICIES.map(({ policyId }) => {
    const selected = cells.filter((cell) => cell.policyId === policyId && allowed.has(cell.seed));
    const byLayout = Object.fromEntries(LAYOUTS.map(({ name }) => [name,
      selected.filter((cell) => cell.layout === name).sort((a, b) => a.seed - b.seed)]));
    return {
      policyId,
      response: geometricResponse(byLayout['two-center-stones'].map(({ score }) => score), byLayout['one-center-stone'].map(({ score }) => score)),
      oneVsOpen: geometricResponse(byLayout['one-center-stone'].map(({ score }) => score), byLayout.open.map(({ score }) => score)),
      earlyTerminationRate: Object.fromEntries(LAYOUTS.map(({ name }) => [name,
        byLayout[name].filter(({ movesUsed }) => movesUsed < 24).length / byLayout[name].length])),
      behavior: Object.fromEntries(LAYOUTS.map(({ name }) => [name, aggregateBehavior(byLayout[name])])),
    };
  });
}

function verifyVerdict(artifact) {
  const responses = responseRows(artifact.cells, CONFIRMATION_SEEDS);
  const chainValues = responses.map(({ behavior }) => behavior.open.meanChainLength);
  const patienceValues = responses.map(({ behavior }) => behavior.open.lateScoreShare);
  const styleGuard = {
    chainRange: Math.max(...chainValues) - Math.min(...chainValues),
    patienceRange: Math.max(...patienceValues) - Math.min(...patienceValues),
  };
  styleGuard.pass = styleGuard.chainRange >= 0.15 || styleGuard.patienceRange >= 0.02;
  const interactionSpread = Math.max(...responses.map(({ response }) => response))
    - Math.min(...responses.map(({ response }) => response));
  const halfOrderings = [CONFIRMATION_SEEDS.slice(0, 100), CONFIRMATION_SEEDS.slice(100)].map((seeds) => {
    const rows = responseRows(artifact.cells, seeds);
    return { mostAffected: uniqueExtreme(rows, true), leastAffected: uniqueExtreme(rows, false) };
  });
  const stableOrdering = halfOrderings[0].mostAffected !== null
    && halfOrderings[0].leastAffected !== null
    && canonicalJson(halfOrderings[0]) === canonicalJson(halfOrderings[1]);
  let primaryVerdict = 'INCONCLUSIVE';
  if (styleGuard.pass && interactionSpread >= 0.05 && stableOrdering) primaryVerdict = 'SUPPORTED';
  else if (styleGuard.pass && interactionSpread < 0.02) primaryVerdict = 'FALSIFIED';
  return { verdict: 'PASS', primaryVerdict, styleGuard, interactionSpread, stableOrdering, halfOrderings, responses };
}

function verifyAll(controlsPath, receiptPath, confirmationPath) {
  const controls = readArtifact(controlsPath);
  const receipt = readReceipt(receiptPath);
  const confirmation = readArtifact(confirmationPath);
  const subjectControls = verifySubjects(controls);
  const subjectConfirmation = verifySubjects(confirmation);
  if (canonicalJson(controls.subjects) !== canonicalJson(confirmation.subjects)) throw new Error('control and confirmation subjects differ');
  if (canonicalJson(controls.sources) !== canonicalJson(confirmation.sources)) throw new Error('control and confirmation sources differ');
  const entitlement = validateControlEntitlement(receipt, controls);
  return {
    status: 'PASS',
    result: RESULT,
    entitlementVerdict: 'ENTITLED',
    controlsIdentity: controls.artifactIdentity,
    controlReceiptIdentity: receipt.artifactIdentity,
    confirmationIdentity: confirmation.artifactIdentity,
    subjectControls,
    subjectConfirmation,
    controlCheck: verifyControls(controls),
    matrixCheck: verifyMatrix(confirmation, entitlement),
    verdictCheck: verifyVerdict(confirmation),
  };
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function challenge(controlsPath, receiptPath, confirmationPath, output) {
  const valid = verifyAll(controlsPath, receiptPath, confirmationPath);
  const controls = readArtifact(controlsPath);
  const controlTwin = makeOutcomeIdenticalTwin(controls);
  let controlTwinVerdict = 'PASS';
  let controlTwinError = null;
  try {
    verifyControls(controlTwin);
  } catch (error) {
    controlTwinVerdict = 'FAIL';
    controlTwinError = error.message;
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0024-broken-'));
  const brokenPath = path.join(temp, 'confirmation-broken.json');
  const broken = JSON.parse(fs.readFileSync(confirmationPath, 'utf8'));
  broken.cells[0].score += 1;
  fs.writeFileSync(brokenPath, `${JSON.stringify(broken, null, 2)}\n`);
  let confirmationTwinVerdict = 'PASS';
  let confirmationTwinError = null;
  try {
    verifyAll(controlsPath, receiptPath, brokenPath);
  } catch (error) {
    confirmationTwinVerdict = 'FAIL';
    confirmationTwinError = error.message;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  if (controlTwinVerdict !== 'FAIL' || confirmationTwinVerdict !== 'FAIL') {
    throw new Error('one or more broken twins unexpectedly passed');
  }
  const body = {
    schemaVersion: 1,
    result: RESULT,
    verifierIdentity: fileHash('experiments/RESULT-0024/verify.js'),
    valid: { verdict: valid.status, entitlementVerdict: valid.entitlementVerdict, confirmationIdentity: valid.confirmationIdentity },
    controlTwin: { verdict: controlTwinVerdict, outcomeChangedPairs: countOutcomeChangedPairs(controlTwin.cells), error: controlTwinError },
    confirmationTwin: { verdict: confirmationTwinVerdict, mutation: 'cells[0].score += 1', error: confirmationTwinError },
  };
  const receipt = withReceiptIdentity(body);
  writeNew(output, receipt);
  return receipt;
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const controlsPath = flag(argv, '--controls');
  const receiptPath = flag(argv, '--control-receipt');
  const confirmationPath = flag(argv, '--confirmation');
  const jsonOut = flag(argv, '--json-out');
  if (!controlsPath) throw new Error('--controls is required');
  if (command === 'controls') {
    if (!jsonOut) throw new Error('controls requires --json-out');
    const artifact = readArtifact(path.resolve(controlsPath));
    const receipt = issueControlReceipt(artifact);
    writeNew(path.resolve(jsonOut), receipt);
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  if (!receiptPath || !confirmationPath) throw new Error('all and challenge require --control-receipt and --confirmation');
  if (command === 'all') {
    const result = withReceiptIdentity(verifyAll(path.resolve(controlsPath), path.resolve(receiptPath), path.resolve(confirmationPath)));
    if (jsonOut) writeNew(path.resolve(jsonOut), result);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === 'challenge') {
    if (!jsonOut) throw new Error('challenge requires --json-out');
    console.log(JSON.stringify(challenge(
      path.resolve(controlsPath),
      path.resolve(receiptPath),
      path.resolve(confirmationPath),
      path.resolve(jsonOut),
    ), null, 2));
    return;
  }
  throw new Error('usage: verify.js controls|all|challenge --controls <path> [--control-receipt <path> --confirmation <path>] --json-out <path>');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  CONTROL_SEEDS,
  CONFIRMATION_SEEDS,
  OUTCOME_FIELDS,
  countOutcomeChangedPairs,
  issueControlReceipt,
  makeOutcomeIdenticalTwin,
  readControlEntitlement,
  validateControlEntitlement,
  verifyAll,
  verifyControls,
  verifyMatrix,
  verifySubjects,
  verifyVerdict,
  withReceiptIdentity,
};
