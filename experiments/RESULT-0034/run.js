#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { analyzeForcedDiversity } = require('../../solver/forced-diversity-descriptors');
const { CONFIRMATION_SEEDS, DEEP_SEARCH, RESULT, ROOT, SHALLOW_SEARCH, artifactWithIdentity, profiles, sourceHashes } = require('./subject');

function makeRow(level, seed) {
  return { level: level.level, dimensions: `${level.gridW}x${level.gridH}`, seed,
    shallow: analyzeForcedDiversity({ level, seed, search: SHALLOW_SEARCH }),
    deep: analyzeForcedDiversity({ level, seed, search: DEEP_SEARCH }) };
}
function summarizeRows(rows) {
  const deep = rows.filter((row) => row.deep.standing !== 'UNKNOWN');
  const coveredProfiles = new Set(deep.map(({ level }) => level)).size;
  const forced = deep.map((row) => row.deep.descriptors.forcedPrefixRatio);
  const forcedRange = forced.length ? Math.max(...forced) - Math.min(...forced) : null;
  const diversityCounts = {};
  for (const row of deep) {
    const value = row.deep.descriptors.distinctOpeningMoves;
    diversityCounts[value] = (diversityCounts[value] || 0) + 1;
  }
  const populatedDiversityValues = Object.values(diversityCounts).filter((count) => count >= 4).length;
  const paired = rows.filter((row) => row.shallow.standing !== 'UNKNOWN' && row.deep.standing !== 'UNKNOWN');
  const stableForced = paired.filter((row) => Math.abs(row.shallow.descriptors.forcedPrefixRatio - row.deep.descriptors.forcedPrefixRatio) <= 0.15).length;
  const stableDiversity = paired.filter((row) => row.shallow.descriptors.distinctOpeningMoves === row.deep.descriptors.distinctOpeningMoves).length;
  const p1 = deep.length >= 30 && coveredProfiles === 4;
  const p2 = forcedRange >= 0.15 && populatedDiversityValues >= 2;
  const p3 = paired.length >= 28 && stableForced / paired.length >= 0.75 && stableDiversity / paired.length >= 0.75;
  return {
    P1: { outcome: p1 ? 'SUPPORTED' : 'INCONCLUSIVE', deepWitnessRows: deep.length, coveredProfiles, required: 'at least 30/32 and all profiles' },
    P2: { outcome: p2 ? 'SUPPORTED' : 'INCONCLUSIVE', forcedRange, diversityCounts, populatedDiversityValues, required: 'forced range >=0.15 and two opening-diversity values with >=4 rows each' },
    P3: { outcome: p3 ? 'SUPPORTED' : 'INCONCLUSIVE', pairedRows: paired.length, stableForced, stableDiversity, forcedStabilityRate: paired.length ? stableForced / paired.length : null, diversityStabilityRate: paired.length ? stableDiversity / paired.length : null, required: 'at least 28 pairs and >=75% stability for both proxies' },
    descriptorDisposition: p1 && p2 && p3 ? 'ELIGIBLE_FOR_A_SEPARATE_MAP_CORPUS' : 'REVISE_BEFORE_MAP_CORPUS',
  };
}
function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  return { schemaVersion: 1, result: RESULT, reportable: true,
    proofStanding: 'bounded successful-witness-set proxies; UNKNOWN for bounded misses; heuristic_observation for panel generalization',
    definitions: {
      forcedMoveConstruct: 'share of solution states with only one useful move',
      forcedPrefixRatio: 'share of canonical-witness prefixes with one next move represented in the registered bounded success set',
      solutionDiversityConstruct: 'number of meaningfully different ways to reach target',
      distinctOpeningMoves: 'distinct ordered opening chains represented among registered bounded successful witnesses',
      exclusions: ['exhaustive solution count', 'true forcedness', 'player strategy', 'difficulty', 'fun'],
    },
    panel: { levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({ level, gridW, gridH, moves, minChain, tileScale, target, blockers })), seeds, shallowSearch: SHALLOW_SEARCH, deepSearch: DEEP_SEARCH },
    sources: sourceHashes(), rows, decision: summarizeRows(rows) };
}
function flag(argv, name) { const i = argv.indexOf(name); return i === -1 ? null : argv[i + 1]; }
function main() {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable corpus refuses --exploratory');
  const output = flag(process.argv.slice(2), '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0034 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const artifact = artifactWithIdentity(buildCorpus(), registrationStamp(registration));
  fs.writeFileSync(destination, `${JSON.stringify(artifact)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}
if (require.main === module) { try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; } }
module.exports = { buildCorpus, makeRow, summarizeRows };
