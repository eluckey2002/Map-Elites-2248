#!/usr/bin/env node

// Post-run audit added after RESULT-0023 exposed a false-PASS path in C2.
// This is defect evidence, not part of the frozen measurement closure.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { verifyControls } = require('./verify');

const OUTCOME_FIELDS = Object.freeze(['score', 'movesUsed', 'behaviorTotals', 'behavior']);

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

function readValidArtifact(file) {
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('control artifact identity mismatch');
  return artifact;
}

function outcomeDiffers(left, right) {
  return OUTCOME_FIELDS.some((field) => canonicalJson(left[field]) !== canonicalJson(right[field]));
}

function cloneOneStoneOutcomesIntoTwoStone(cells) {
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
}

function audit(artifact) {
  const oneByPair = new Map(artifact.cells
    .filter(({ layout }) => layout === 'one-center-stone')
    .map((cell) => [`${cell.policyId}/${cell.seed}`, cell]));
  const actualOutcomeChangedPairs = artifact.cells
    .filter(({ layout }) => layout === 'two-center-stones')
    .filter((cell) => outcomeDiffers(oneByPair.get(`${cell.policyId}/${cell.seed}`), cell))
    .length;

  const broken = structuredClone(artifact);
  broken.cells = cloneOneStoneOutcomesIntoTwoStone(broken.cells);
  broken.repeatCells = cloneOneStoneOutcomesIntoTwoStone(broken.repeatCells);
  const frozenVerdict = verifyControls(broken);
  if (frozenVerdict.controls !== 'PASS') throw new Error('expected frozen C2 false-PASS was not reproduced');

  return {
    schemaVersion: 1,
    result: 'RESULT-0023',
    auditKind: 'post-run-control-seam-challenge',
    controlsIdentity: artifact.artifactIdentity,
    actualOutcomeChangedPairs,
    actualPairCount: 48,
    controlledTwin: {
      mutation: 'copy score, movesUsed, behaviorTotals, and behavior from each one-stone cell into its two-stone pair',
      outcomeChangedPairs: 0,
      frozenVerifierVerdict: frozenVerdict.controls,
      frozenVerifierReportedChangedPairs: frozenVerdict.positiveChangedPairs,
    },
    finding: 'C2_FALSE_PASS',
  };
}

function main(argv = process.argv.slice(2)) {
  const controls = flag(argv, '--controls');
  const output = flag(argv, '--out');
  if (!controls || !output) throw new Error('usage: audit-control-seam.js --controls <path> --out <path>');
  const body = audit(readValidArtifact(path.resolve(controls)));
  const receipt = { ...body, artifactIdentity: identity(body) };
  const destination = path.resolve(output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${destination}`);
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

module.exports = { audit };
