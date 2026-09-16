#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { analyzeMergeSpread } = require('../../solver/merge-spread-descriptors');
const {
  CONFIRMATION_SEEDS, DEEP_SEARCH, RESULT, ROOT, SHALLOW_SEARCH,
  artifactWithIdentity, profiles, sourceHashes,
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

function summarizeRows(rows) {
  const deep = rows.filter(({ deep: analysis }) => analysis.standing !== 'UNKNOWN');
  const coveredProfiles = new Set(deep.map(({ level }) => level)).size;
  const depths = deep.map(({ deep: analysis }) => analysis.descriptors.peakMergeDepth);
  const depthCounts = Object.fromEntries([...new Set(depths)].sort((a, b) => a - b)
    .map((depth) => [depth, depths.filter((value) => value === depth).length]));
  const spreads = deep.map(({ deep: analysis }) => analysis.descriptors.meanNormalizedChainSpan);
  const spreadRange = spreads.length ? Math.max(...spreads) - Math.min(...spreads) : null;
  const populatedDepths = Object.values(depthCounts).filter((count) => count >= 4).length;

  const paired = rows.filter(({ shallow, deep: analysis }) => (
    shallow.standing !== 'UNKNOWN' && analysis.standing !== 'UNKNOWN'
  ));
  const sameDepth = paired.filter(({ shallow, deep: analysis }) => (
    shallow.descriptors.peakMergeDepth === analysis.descriptors.peakMergeDepth
  )).length;
  const stableSpread = paired.filter(({ shallow, deep: analysis }) => (
    Math.abs(shallow.descriptors.meanNormalizedChainSpan
      - analysis.descriptors.meanNormalizedChainSpan) <= 0.10
  )).length;

  const p1Supported = deep.length >= 30 && coveredProfiles === 4;
  const p2Supported = populatedDepths >= 2 && spreadRange >= 0.15;
  const p3Supported = paired.length >= 28
    && sameDepth / paired.length >= 0.75
    && stableSpread / paired.length >= 0.75;
  return {
    P1: {
      outcome: p1Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      deepWitnessRows: deep.length,
      coveredProfiles,
      required: 'at least 30/32 rows and all four profiles',
    },
    P2: {
      outcome: p2Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      depthCounts,
      populatedDepthValues: populatedDepths,
      spreadRange,
      required: 'at least two depth values with >=4 rows each and spread range >=0.15',
    },
    P3: {
      outcome: p3Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      pairedRows: paired.length,
      sameDepth,
      stableSpread,
      depthAgreementRate: paired.length ? sameDepth / paired.length : null,
      spreadStabilityRate: paired.length ? stableSpread / paired.length : null,
      required: 'at least 28 pairs, >=75% exact depth agreement, >=75% spread within 0.10',
    },
    descriptorDisposition: p1Supported && p2Supported && p3Supported
      ? 'ELIGIBLE_FOR_A_SEPARATE_MAP_CORPUS'
      : 'REVISE_BEFORE_MAP_CORPUS',
  };
}

function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    proofStanding: 'replayed witness proxies; UNKNOWN for bounded misses; heuristic_observation for panel generalization',
    definitions: {
      mergeDepthConstruct: 'number of dependent merge generations used along a successful construction',
      peakMergeDepth: 'largest recursively tracked merge-tree depth created by the registered successful witness',
      spatialSpreadConstruct: 'how far apart tiles used by successful chains are',
      meanNormalizedChainSpan: 'mean witness-chain Chebyshev span divided by the board Chebyshev diameter',
      exclusions: ['minimum required merge depth', 'all-solution spatial spread', 'difficulty', 'fun', 'player preference'],
    },
    panel: {
      levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({
        level, gridW, gridH, moves, minChain, tileScale, target, blockers,
      })),
      seeds,
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
  const value = argv[index + 1];
  return value && !value.startsWith('--') ? value : null;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable corpus refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0033 --out <path>');
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

module.exports = { buildCorpus, makeRow, summarizeRows };
