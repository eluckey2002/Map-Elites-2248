#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const {
  CAPS,
  DEEP_SEARCH,
  SHALLOW_SEARCH,
  profiles,
} = require('../RESULT-0030/subject');
const { makeRow, summarizeRows } = require('../RESULT-0030/run');
const {
  CONFIRMATION_SEEDS,
  RESULT,
  ROOT,
  artifactWithIdentity,
  sourceHashes,
} = require('./subject');

function capConformance(rows) {
  const arms = rows.flatMap((row) => [row.shallow, row.deep]);
  const violations = arms.flatMap((analysis) => analysis.runs.filter((run) => (
    run.diagnostics.generatedActions
      > run.diagnostics.expandedStates * run.diagnostics.actionsPerState
  )));
  return {
    outcome: violations.length === 0 ? 'PASS' : 'FAIL',
    arms: arms.length,
    runs: arms.reduce((sum, analysis) => sum + analysis.runs.length, 0),
    violations: violations.length,
  };
}

function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  const decision = summarizeRows(rows);
  const cap = capConformance(rows);
  if (cap.outcome !== 'PASS') throw new Error('combined candidate cap was exceeded');
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    supersedesInvalidatedResult: 'RESULT-0030',
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
      combinedCandidateCap: SHALLOW_SEARCH.actionsPerState,
    },
    sources: sourceHashes(),
    rows,
    controls: { combinedCandidateCap: cap },
    decision,
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
  if (!output) throw new Error('usage: run.js --protocol RESULT-0031 --out <path>');
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

module.exports = { buildCorpus, capConformance };
