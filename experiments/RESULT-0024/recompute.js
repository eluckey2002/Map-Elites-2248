#!/usr/bin/env node

// Independent arithmetic recomputation for RESULT-0024. This intentionally
// does not import RESULT-0024's runner or primary verifier.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const RESULT = 'RESULT-0024';
const POLICY_IDS = Object.freeze([
  '0de51bc557de',
  'a61e8b8e23b7',
  '4cbec6509c34',
  'ebeb9e326a01',
]);
const LAYOUT_NAMES = Object.freeze(['open', 'one-center-stone', 'two-center-stones']);
const SEEDS = Object.freeze(Array.from({ length: 200 }, (_, index) => 23_000_000 + index));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function readConfirmation(file) {
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('confirmation artifact identity mismatch');
  if (artifact.result !== RESULT || artifact.kind !== 'confirmation') throw new Error('wrong confirmation artifact');
  if (!registration || registration.protocol !== RESULT || registration.exploratory !== false) {
    throw new Error('confirmation is not protocol registered');
  }
  if (canonicalJson(artifact.seeds) !== canonicalJson(SEEDS)) throw new Error('confirmation seeds mismatch');
  if (!artifact.controlEntitlement?.receiptIdentity || !artifact.controlEntitlement?.controlsIdentity) {
    throw new Error('confirmation has no consumed control entitlement');
  }
  const expected = [];
  for (const policyId of POLICY_IDS) {
    for (const layout of LAYOUT_NAMES) {
      for (const seed of SEEDS) expected.push(`${policyId}/${layout}/${seed}`);
    }
  }
  const observed = artifact.cells.map(({ policyId, layout, seed }) => `${policyId}/${layout}/${seed}`);
  if (new Set(observed).size !== observed.length || canonicalJson(observed.sort()) !== canonicalJson(expected.sort())) {
    throw new Error('confirmation cell closure mismatch');
  }
  return artifact;
}

function geometricResponse(numerators, denominators) {
  const logMean = numerators.reduce((sum, numerator, index) => (
    sum + Math.log(Math.max(numerator, 1) / Math.max(denominators[index], 1))
  ), 0) / numerators.length;
  return Math.exp(logMean) - 1;
}

function totals(cells) {
  return cells.reduce((sum, cell) => ({
    chainCount: sum.chainCount + cell.behaviorTotals.chainCount,
    chainTiles: sum.chainTiles + cell.behaviorTotals.chainTiles,
    totalScore: sum.totalScore + cell.behaviorTotals.totalScore,
    lateScore: sum.lateScore + cell.behaviorTotals.lateScore,
  }), { chainCount: 0, chainTiles: 0, totalScore: 0, lateScore: 0 });
}

function rows(cells, seeds) {
  const accepted = new Set(seeds);
  return POLICY_IDS.map((policyId) => {
    const policyCells = cells.filter((cell) => cell.policyId === policyId && accepted.has(cell.seed));
    const byLayout = Object.fromEntries(LAYOUT_NAMES.map((layout) => [
      layout,
      policyCells.filter((cell) => cell.layout === layout).sort((a, b) => a.seed - b.seed),
    ]));
    const open = totals(byLayout.open);
    return {
      policyId,
      response: geometricResponse(
        byLayout['two-center-stones'].map(({ score }) => score),
        byLayout['one-center-stone'].map(({ score }) => score),
      ),
      openMeanChainLength: open.chainCount ? open.chainTiles / open.chainCount : 0,
      openLateScoreShare: open.totalScore ? open.lateScore / open.totalScore : 0,
    };
  });
}

function extreme(responseRows, minimum) {
  const sorted = [...responseRows].sort((a, b) => (
    (minimum ? a.response - b.response : b.response - a.response)
      || a.policyId.localeCompare(b.policyId)
  ));
  return sorted[0].response === sorted[1].response ? null : sorted[0].policyId;
}

function recompute(artifact) {
  const responseRows = rows(artifact.cells, SEEDS);
  const chain = responseRows.map(({ openMeanChainLength }) => openMeanChainLength);
  const late = responseRows.map(({ openLateScoreShare }) => openLateScoreShare);
  const styleGuard = {
    chainRange: Math.max(...chain) - Math.min(...chain),
    patienceRange: Math.max(...late) - Math.min(...late),
  };
  styleGuard.pass = styleGuard.chainRange >= 0.15 || styleGuard.patienceRange >= 0.02;
  const interactionSpread = Math.max(...responseRows.map(({ response }) => response))
    - Math.min(...responseRows.map(({ response }) => response));
  const halfRows = [rows(artifact.cells, SEEDS.slice(0, 100)), rows(artifact.cells, SEEDS.slice(100))];
  const halfOrderings = halfRows.map((entries) => ({
    mostAffected: extreme(entries, true),
    leastAffected: extreme(entries, false),
  }));
  const stableOrdering = halfOrderings[0].mostAffected !== null
    && halfOrderings[0].leastAffected !== null
    && canonicalJson(halfOrderings[0]) === canonicalJson(halfOrderings[1]);
  let primaryVerdict = 'INCONCLUSIVE';
  if (styleGuard.pass && interactionSpread >= 0.05 && stableOrdering) primaryVerdict = 'SUPPORTED';
  else if (styleGuard.pass && interactionSpread < 0.02) primaryVerdict = 'FALSIFIED';
  return { primaryVerdict, styleGuard, interactionSpread, stableOrdering, halfOrderings, responses: responseRows };
}

function main(argv = process.argv.slice(2)) {
  const confirmation = flag(argv, '--confirmation');
  const output = flag(argv, '--out');
  if (!confirmation || !output) throw new Error('usage: recompute.js --confirmation <path> --out <path>');
  const artifact = readConfirmation(path.resolve(confirmation));
  const body = {
    schemaVersion: 1,
    result: RESULT,
    confirmationIdentity: artifact.artifactIdentity,
    controlReceiptIdentity: artifact.controlEntitlement.receiptIdentity,
    recomputation: recompute(artifact),
  };
  const receipt = { ...body, artifactIdentity: identity(body) };
  const destination = path.resolve(output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${destination}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { recompute };
