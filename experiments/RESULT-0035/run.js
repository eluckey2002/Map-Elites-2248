#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { analyzeMergeSpread } = require('../../solver/merge-spread-descriptors');
const { summarizeMap } = require('../../solver/merge-spread-map');
const {
  CELL_CAPACITY,
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  SPREAD_CUT,
  artifactWithIdentity,
  profiles,
  sourceHashes,
} = require('./subject');

function makeRow(level, seed) {
  const input = { level, seed };
  return {
    level: level.level,
    dimensions: `${level.gridW}x${level.gridH}`,
    seed,
    shallow: analyzeMergeSpread({ ...input, search: SHALLOW_SEARCH }),
    deep: analyzeMergeSpread({ ...input, search: DEEP_SEARCH }),
  };
}

function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    proofStanding: 'replayed witness proxies; UNKNOWN for bounded misses; heuristic_observation for archive generalization',
    definitions: {
      depthAxis: 'registered successful-witness peak merge depth: depth 1 versus depth 2 or greater',
      spreadAxis: `registered successful-witness mean normalized chain span: compact below ${SPREAD_CUT}, broad at or above ${SPREAD_CUT}`,
      archiveQuality: 'cross-width exact cell agreement, then lower spread delta; this is measurement reproducibility, not gameplay quality',
      exclusions: ['minimum required merge depth', 'all-solution spatial spread', 'difficulty', 'fun', 'player preference', 'full MAP-Elites evolutionary search'],
    },
    panel: {
      levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({
        level, gridW, gridH, moves, minChain, tileScale, target, blockers,
      })),
      seeds,
      shallowSearch: SHALLOW_SEARCH,
      deepSearch: DEEP_SEARCH,
      spreadCut: SPREAD_CUT,
      cellCapacity: CELL_CAPACITY,
    },
    sources: sourceHashes(),
    rows,
    decision: summarizeMap(rows, { spreadCut: SPREAD_CUT, capacity: CELL_CAPACITY }),
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable corpus refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0035 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const artifact = artifactWithIdentity(buildCorpus(), registrationStamp(registration));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(artifact)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { buildCorpus, makeRow };
