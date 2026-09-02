#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const { policyIdentity } = require(path.join(ROOT, 'solver', 'map-elites-core'));

const RESULT = 'RESULT-0023';
const CONTROL_SEEDS = Object.freeze(Array.from({ length: 12 }, (_, i) => 20_000_000 + i));
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 200 }, (_, i) => 21_000_000 + i));
const EXPECTED_POLICIES = Object.freeze([
  ['0de51bc557de', { wRoll: 1, wPlace: 1, turnover: 40, width: 24, bombMax: 9, tieBreak: 'degree', wHarvest: 2, offerFull: 0, pathWidth: 8 }],
  ['a61e8b8e23b7', { wRoll: 1, wPlace: 1, turnover: 72, width: 24, bombMax: 11, tieBreak: 'degree', wHarvest: 2, offerFull: 0, pathWidth: 6 }],
  ['4cbec6509c34', { wRoll: 0, wPlace: 0.75, turnover: 0, width: 12, bombMax: 9, tieBreak: 'degree', wHarvest: 0, offerFull: 0, pathWidth: 1 }],
  ['ebeb9e326a01', { wRoll: 1, wPlace: 1.75, turnover: 0, width: 12, bombMax: 9, tieBreak: 'degree', wHarvest: 3.5, offerFull: 0, pathWidth: 8 }],
]);
const EXPECTED_LAYOUTS = Object.freeze([
  { name: 'open', level: 54, gridW: 4, gridH: 8, moves: 24, minChain: 3, tileScale: 32, target: 'Infinity', blockers: [] },
  { name: 'one-center-stone', level: 54, gridW: 4, gridH: 8, moves: 24, minChain: 3, tileScale: 32, target: 'Infinity', blockers: [{ type: 'stone', x: 2, y: 3 }] },
  { name: 'two-center-stones', level: 54, gridW: 4, gridH: 8, moves: 24, minChain: 3, tileScale: 32, target: 'Infinity', blockers: [{ type: 'stone', x: 1, y: 3 }, { type: 'stone', x: 2, y: 3 }] },
]);
const EXPECTED_SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0023/run.js',
  'experiments/RESULT-0023/verify.js',
  'experiments/RESULT-0023/recompute.js',
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

function objectIdentity(value) {
  return hashBytes(canonicalJson(value));
}

function withArtifactIdentity(body) {
  return { ...body, artifactIdentity: objectIdentity(body) };
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

function expectedSubjects() {
  return {
    policies: EXPECTED_POLICIES.map(([policyId, params], index) => ({
      name: ['current-base', 'historical-long-chain', 'historical-short-chain', 'historical-late-score'][index],
      policyId,
      params,
    })),
    layouts: EXPECTED_LAYOUTS.map((entry) => ({ ...entry, layoutIdentity: objectIdentity(entry) })),
  };
}

function verifySubjects(artifact) {
  if (artifact.result !== RESULT) throw new Error(`wrong result ${artifact.result}`);
  const expected = expectedSubjects();
  if (canonicalJson(artifact.subjects) !== canonicalJson(expected)) throw new Error('subject closure mismatch');
  for (const policy of artifact.subjects.policies) {
    if (policyIdentity(policy.params) !== policy.policyId) throw new Error(`policy identity mismatch for ${policy.policyId}`);
  }
  const sourceKeys = Object.keys(artifact.sources || {}).sort();
  if (canonicalJson(sourceKeys) !== canonicalJson([...EXPECTED_SOURCE_PATHS].sort())) throw new Error('source closure mismatch');
  for (const relative of EXPECTED_SOURCE_PATHS) {
    const actual = fileHash(relative);
    if (artifact.sources[relative] !== actual) throw new Error(`source hash mismatch for ${relative}`);
  }
  return { subjects: 'PASS', policyCount: 4, layoutCount: 3, sourceCount: EXPECTED_SOURCE_PATHS.length };
}

function keyOf(cell) {
  return `${cell.policyId}/${cell.layout}/${cell.seed}`;
}

function validateCell(cell) {
  if (!EXPECTED_POLICIES.some(([id]) => id === cell.policyId)) throw new Error(`unknown policy ${cell.policyId}`);
  if (!EXPECTED_LAYOUTS.some(({ name }) => name === cell.layout)) throw new Error(`unknown layout ${cell.layout}`);
  for (const field of ['score', 'movesUsed']) {
    if (!Number.isFinite(cell[field])) throw new Error(`${keyOf(cell)}: ${field} is not finite`);
  }
  if (!cell.behaviorTotals || !cell.behavior || !Number.isFinite(cell.behavior.meanChainLength)
    || !Number.isFinite(cell.behavior.lateScoreShare)) throw new Error(`${keyOf(cell)}: behavior is incomplete`);
  const totals = cell.behaviorTotals;
  const meanChainLength = totals.chainCount ? totals.chainTiles / totals.chainCount : 0;
  const lateScoreShare = totals.totalScore ? totals.lateScore / totals.totalScore : 0;
  if (meanChainLength !== cell.behavior.meanChainLength || lateScoreShare !== cell.behavior.lateScoreShare) {
    throw new Error(`${keyOf(cell)}: behavior summary mismatch`);
  }
}

function expectedKeys(seeds) {
  const keys = [];
  for (const [policyId] of EXPECTED_POLICIES) {
    for (const { name } of EXPECTED_LAYOUTS) {
      for (const seed of seeds) keys.push(`${policyId}/${name}/${seed}`);
    }
  }
  return keys.sort();
}

function verifyCellSet(cells, seeds, label) {
  cells.forEach(validateCell);
  const actual = cells.map(keyOf).sort();
  const expected = expectedKeys(seeds);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label}: expected key set mismatch`);
}

function verifyControls(artifact) {
  if (artifact.kind !== 'controls') throw new Error('controls artifact has wrong kind');
  if (canonicalJson(artifact.seeds) !== canonicalJson(CONTROL_SEEDS)) throw new Error('control seeds mismatch');
  verifyCellSet(artifact.cells, CONTROL_SEEDS, 'controls');
  verifyCellSet(artifact.repeatCells, CONTROL_SEEDS, 'control repeat');
  if (canonicalJson(artifact.cells) !== canonicalJson(artifact.repeatCells)) throw new Error('negative control changed on exact repeat');
  const byKey = new Map(artifact.cells.map((cell) => [keyOf(cell), cell]));
  let changed = 0;
  for (const [policyId] of EXPECTED_POLICIES) {
    for (const seed of CONTROL_SEEDS) {
      const one = byKey.get(`${policyId}/one-center-stone/${seed}`);
      const two = byKey.get(`${policyId}/two-center-stones/${seed}`);
      if (canonicalJson(one) !== canonicalJson(two)) changed += 1;
    }
  }
  if (changed === 0) throw new Error('positive control: one- and two-stone layouts read identically');
  return { controls: 'PASS', negativeRepeatCells: 144, positiveChangedPairs: changed };
}

function verifyMatrix(artifact) {
  if (artifact.kind !== 'confirmation') throw new Error('confirmation artifact has wrong kind');
  if (canonicalJson(artifact.seeds) !== canonicalJson(CONFIRMATION_SEEDS)) throw new Error('confirmation seeds mismatch');
  if (canonicalJson(artifact.halves) !== canonicalJson([[21_000_000, 21_000_099], [21_000_100, 21_000_199]])) {
    throw new Error('confirmation halves mismatch');
  }
  verifyCellSet(artifact.cells, CONFIRMATION_SEEDS, 'confirmation');
  if (artifact.cells.some(({ seed }) => CONTROL_SEEDS.includes(seed))) throw new Error('control seed leaked into confirmation');
  return { matrix: 'PASS', cells: artifact.cells.length };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function geometricResponse(numerators, denominators) {
  return Math.expm1(mean(numerators.map((value, index) => Math.log(Math.max(value, 1) / Math.max(denominators[index], 1)))));
}

function aggregateBehavior(cells) {
  const totals = { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 };
  for (const cell of cells) {
    for (const key of Object.keys(totals)) totals[key] += cell.behaviorTotals[key];
  }
  return {
    meanChainLength: totals.chainCount ? totals.chainTiles / totals.chainCount : 0,
    lateScoreShare: totals.totalScore ? totals.lateScore / totals.totalScore : 0,
  };
}

function uniqueExtreme(entries, direction) {
  const sorted = [...entries].sort((a, b) => direction * (a.response - b.response) || a.policyId.localeCompare(b.policyId));
  if (sorted.length > 1 && sorted[0].response === sorted[1].response) return null;
  return sorted[0].policyId;
}

function responseRows(cells, seeds) {
  const allowed = new Set(seeds);
  const rows = [];
  for (const [policyId] of EXPECTED_POLICIES) {
    const selected = cells.filter((cell) => cell.policyId === policyId && allowed.has(cell.seed));
    const byLayout = Object.fromEntries(EXPECTED_LAYOUTS.map(({ name }) => [name,
      selected.filter((cell) => cell.layout === name).sort((a, b) => a.seed - b.seed)]));
    rows.push({
      policyId,
      response: geometricResponse(byLayout['two-center-stones'].map((cell) => cell.score), byLayout['one-center-stone'].map((cell) => cell.score)),
      oneVsOpen: geometricResponse(byLayout['one-center-stone'].map((cell) => cell.score), byLayout.open.map((cell) => cell.score)),
      earlyTerminationRate: Object.fromEntries(EXPECTED_LAYOUTS.map(({ name }) => [name,
        byLayout[name].filter((cell) => cell.movesUsed < 24).length / byLayout[name].length])),
      behavior: Object.fromEntries(EXPECTED_LAYOUTS.map(({ name }) => [name, aggregateBehavior(byLayout[name])])),
    });
  }
  return rows;
}

function verifyVerdict(artifact) {
  const responses = responseRows(artifact.cells, CONFIRMATION_SEEDS);
  const openBehavior = responses.map(({ policyId, behavior }) => ({ policyId, ...behavior.open }));
  const chainValues = openBehavior.map(({ meanChainLength }) => meanChainLength);
  const patienceValues = openBehavior.map(({ lateScoreShare }) => lateScoreShare);
  const styleGuard = {
    chainRange: Math.max(...chainValues) - Math.min(...chainValues),
    patienceRange: Math.max(...patienceValues) - Math.min(...patienceValues),
  };
  styleGuard.pass = styleGuard.chainRange >= 0.15 || styleGuard.patienceRange >= 0.02;

  const interactionSpread = Math.max(...responses.map(({ response }) => response))
    - Math.min(...responses.map(({ response }) => response));
  const halves = [CONFIRMATION_SEEDS.slice(0, 100), CONFIRMATION_SEEDS.slice(100)];
  const halfOrderings = halves.map((seeds) => {
    const rows = responseRows(artifact.cells, seeds);
    return { mostAffected: uniqueExtreme(rows, 1), leastAffected: uniqueExtreme(rows, -1) };
  });
  const stableOrdering = halfOrderings[0].mostAffected !== null
    && halfOrderings[0].leastAffected !== null
    && canonicalJson(halfOrderings[0]) === canonicalJson(halfOrderings[1]);

  let verdict = 'INCONCLUSIVE';
  if (styleGuard.pass && interactionSpread >= 0.05 && stableOrdering) verdict = 'SUPPORTED';
  else if (styleGuard.pass && interactionSpread < 0.02) verdict = 'FALSIFIED';

  return {
    verdict: 'PASS',
    primaryVerdict: verdict,
    styleGuard,
    interactionSpread,
    stableOrdering,
    halfOrderings,
    responses,
  };
}

function verifyAll(controlsPath, confirmationPath) {
  const controls = readArtifact(controlsPath);
  const confirmation = readArtifact(confirmationPath);
  const subjectControls = verifySubjects(controls);
  const subjectConfirmation = verifySubjects(confirmation);
  if (canonicalJson(controls.subjects) !== canonicalJson(confirmation.subjects)) throw new Error('control and confirmation subjects differ');
  if (canonicalJson(controls.sources) !== canonicalJson(confirmation.sources)) throw new Error('control and confirmation sources differ');
  return {
    status: 'PASS',
    result: RESULT,
    controlsIdentity: controls.artifactIdentity,
    confirmationIdentity: confirmation.artifactIdentity,
    subjectControls,
    subjectConfirmation,
    controlCheck: verifyControls(controls),
    matrixCheck: verifyMatrix(confirmation),
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

function challenge(controlsPath, confirmationPath, output) {
  const valid = verifyAll(controlsPath, confirmationPath);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'result-0023-broken-'));
  const brokenPath = path.join(temp, 'confirmation-broken.json');
  const broken = JSON.parse(fs.readFileSync(confirmationPath, 'utf8'));
  broken.cells[0].score += 1;
  fs.writeFileSync(brokenPath, `${JSON.stringify(broken, null, 2)}\n`);
  let brokenVerdict = 'PASS';
  let error = null;
  try {
    verifyAll(controlsPath, brokenPath);
  } catch (caught) {
    brokenVerdict = 'FAIL';
    error = caught.message;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
  if (brokenVerdict !== 'FAIL') throw new Error('broken twin unexpectedly passed');
  const body = {
    schemaVersion: 1,
    result: RESULT,
    verifier: fileHash('experiments/RESULT-0023/verify.js'),
    valid: { verdict: valid.status, confirmationIdentity: valid.confirmationIdentity },
    brokenTwin: { verdict: brokenVerdict, mutation: 'cells[0].score += 1', error },
  };
  const receipt = withArtifactIdentity(body);
  writeNew(output, receipt);
  return receipt;
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const controls = flag(argv, '--controls');
  const confirmation = flag(argv, '--confirmation');
  const jsonOut = flag(argv, '--json-out');
  if (!controls) throw new Error('--controls is required');
  if (command === 'controls') {
    const artifact = readArtifact(path.resolve(controls));
    const result = {
      status: 'PASS',
      result: RESULT,
      controlsIdentity: artifact.artifactIdentity,
      subjectCheck: verifySubjects(artifact),
      controlCheck: verifyControls(artifact),
    };
    const receipt = withArtifactIdentity(result);
    if (jsonOut) writeNew(path.resolve(jsonOut), receipt);
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  if (!confirmation) throw new Error('--confirmation is required for all and challenge');
  if (command === 'all') {
    const result = verifyAll(path.resolve(controls), path.resolve(confirmation));
    const receipt = withArtifactIdentity(result);
    if (jsonOut) writeNew(path.resolve(jsonOut), receipt);
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  if (command === 'challenge') {
    if (!jsonOut) throw new Error('challenge requires --json-out');
    const receipt = challenge(path.resolve(controls), path.resolve(confirmation), path.resolve(jsonOut));
    console.log(JSON.stringify(receipt, null, 2));
    return;
  }
  throw new Error('usage: verify.js controls|all|challenge --controls <path> [--confirmation <path>] [--json-out <path>]');
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyAll, verifyControls, verifyMatrix, verifySubjects, verifyVerdict };
