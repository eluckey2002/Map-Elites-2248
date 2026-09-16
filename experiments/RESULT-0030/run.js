#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { analyzeWitnessBounds } = require('../../solver/puzzle-descriptor-witness');
const {
  CAPS,
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  artifactWithIdentity,
  profiles,
  sourceHashes,
} = require('./subject');

function descriptorBin(analysis) {
  if (analysis.standing === 'UNKNOWN') return 'UNKNOWN';
  const pace = analysis.descriptors.budgetTightnessUpperBound <= 0.5 ? 'relaxed' : 'tight';
  const chain = analysis.descriptors.chainLengthDependenceUpperBound <= 12 ? 'short' : 'long';
  return `${pace}-${chain}`;
}

function deterministicCost(analysis) {
  return analysis.runs.reduce((sum, run) => sum + run.diagnostics.expandedStates, 0);
}

function makeRow(level, seed, shallowSearch = SHALLOW_SEARCH, deepSearch = DEEP_SEARCH) {
  const input = { level, seed, caps: CAPS };
  const shallow = analyzeWitnessBounds({ ...input, search: shallowSearch });
  const deep = analyzeWitnessBounds({ ...input, search: deepSearch });
  return {
    level: level.level,
    dimensions: `${level.gridW}x${level.gridH}`,
    seed,
    puzzleIdentity: deep.puzzleIdentity,
    shallow,
    deep,
    shallowBin: descriptorBin(shallow),
    deepBin: descriptorBin(deep),
    deterministicCost: {
      shallowExpandedStates: deterministicCost(shallow),
      deepExpandedStates: deterministicCost(deep),
    },
  };
}

function summarizeRows(rows) {
  const deepWitnessRows = rows.filter(({ deep }) => deep.standing === 'replayed_upper_bound');
  const coveredProfiles = new Set(deepWitnessRows.map(({ level }) => level)).size;
  const paired = rows.filter(({ shallow, deep }) => (
    shallow.standing === 'replayed_upper_bound' && deep.standing === 'replayed_upper_bound'
  ));
  const sameBin = paired.filter(({ shallowBin, deepBin }) => shallowBin === deepBin).length;
  const deepNoWorse = paired.filter(({ shallow, deep }) => (
    deep.descriptors.minimumMovesUpperBound <= shallow.descriptors.minimumMovesUpperBound
    && deep.descriptors.chainLengthDependenceUpperBound <= shallow.descriptors.chainLengthDependenceUpperBound
  )).length;
  const shallowCost = rows.reduce((sum, row) => sum + row.deterministicCost.shallowExpandedStates, 0);
  const deepCost = rows.reduce((sum, row) => sum + row.deterministicCost.deepExpandedStates, 0);
  const coverageSupported = deepWitnessRows.length >= 7 && coveredProfiles === 4;
  const stabilitySupported = paired.length >= 6
    && sameBin / paired.length >= 0.75
    && deepNoWorse === paired.length;
  return {
    P1: {
      outcome: coverageSupported ? 'SUPPORTED' : 'INCONCLUSIVE',
      deepWitnessRows: deepWitnessRows.length,
      totalRows: rows.length,
      coveredProfiles,
      required: 'at least 7/8 rows and all four profiles',
    },
    P2: {
      outcome: stabilitySupported ? 'SUPPORTED' : 'INCONCLUSIVE',
      pairedRows: paired.length,
      sameBin,
      deepNoWorse,
      agreementRate: paired.length ? sameBin / paired.length : null,
      required: 'at least six pairs, 75% bin agreement, and no worsened upper bound',
    },
    P3: {
      outcome: 'PASS',
      shallowExpandedStates: shallowCost,
      deepExpandedStates: deepCost,
      ratio: shallowCost ? deepCost / shallowCost : null,
      note: 'diagnostic only; the arms are not compute matched',
    },
    descriptorDisposition: coverageSupported && stabilitySupported
      ? 'ELIGIBLE_AS_WITNESS_BOUNDED_PROXY_FOR_A_SEPARATE_MAP_CORPUS'
      : 'REVISE_BEFORE_MAP_CORPUS',
  };
}

function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    proofStanding: 'replayed_upper_bound for successful witnesses; UNKNOWN for bounded misses; heuristic_observation for panel generalization',
    definitions: {
      minimumMovesUpperBound: 'fewest moves among successful registered bounded-search witnesses',
      budgetTightnessUpperBound: 'minimumMovesUpperBound divided by the allowed moves',
      chainLengthDependenceUpperBound: 'smallest tested chain cap with a successful registered witness',
      exclusions: ['exact minimum', 'unreachability', 'difficulty', 'fun', 'player preference', 'solver-independent chain dependence'],
    },
    panel: {
      levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({
        level, gridW, gridH, moves, minChain, tileScale, target, blockers,
      })),
      seeds,
      caps: CAPS,
      shallowSearch: SHALLOW_SEARCH,
      deepSearch: DEEP_SEARCH,
    },
    sources: sourceHashes(),
    rows,
    decision: summarizeRows(rows),
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const candidate = argv[index + 1];
  return candidate && !candidate.startsWith('--') ? candidate : null;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable corpus refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0030 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const artifact = artifactWithIdentity(buildCorpus(), registrationStamp(registration));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(artifact, null, 2)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildCorpus, descriptorBin, makeRow, summarizeRows };
