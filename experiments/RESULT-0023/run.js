#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const { makeRng } = require(path.join(ROOT, 'solver', 'engine'));
const { playToBudget } = require(path.join(ROOT, 'solver', 'policy-eval'));
const { policyIdentity } = require(path.join(ROOT, 'solver', 'map-elites-core'));
const {
  registrationStamp,
  requireProtocolOrExit,
} = require(path.join(ROOT, 'solver', 'experiment-guard'));

const RESULT = 'RESULT-0023';
const CONTROL_SEEDS = Object.freeze(Array.from({ length: 12 }, (_, i) => 20_000_000 + i));
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 200 }, (_, i) => 21_000_000 + i));

const POLICIES = Object.freeze([
  {
    name: 'current-base',
    policyId: '0de51bc557de',
    params: { wRoll: 1, wPlace: 1, turnover: 40, width: 24, bombMax: 9, tieBreak: 'degree', wHarvest: 2, offerFull: 0, pathWidth: 8 },
  },
  {
    name: 'historical-long-chain',
    policyId: 'a61e8b8e23b7',
    params: { wRoll: 1, wPlace: 1, turnover: 72, width: 24, bombMax: 11, tieBreak: 'degree', wHarvest: 2, offerFull: 0, pathWidth: 6 },
  },
  {
    name: 'historical-short-chain',
    policyId: '4cbec6509c34',
    params: { wRoll: 0, wPlace: 0.75, turnover: 0, width: 12, bombMax: 9, tieBreak: 'degree', wHarvest: 0, offerFull: 0, pathWidth: 1 },
  },
  {
    name: 'historical-late-score',
    policyId: 'ebeb9e326a01',
    params: { wRoll: 1, wPlace: 1.75, turnover: 0, width: 12, bombMax: 9, tieBreak: 'degree', wHarvest: 3.5, offerFull: 0, pathWidth: 8 },
  },
]);

const layout = (name, blockers) => Object.freeze({
  name,
  level: 54,
  gridW: 4,
  gridH: 8,
  moves: 24,
  minChain: 3,
  tileScale: 32,
  target: 'Infinity',
  blockers,
});

const LAYOUTS = Object.freeze([
  layout('open', []),
  layout('one-center-stone', [{ type: 'stone', x: 2, y: 3 }]),
  layout('two-center-stones', [{ type: 'stone', x: 1, y: 3 }, { type: 'stone', x: 2, y: 3 }]),
]);

const SOURCE_PATHS = Object.freeze([
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

function withArtifactIdentity(body, registration) {
  return { ...body, artifactIdentity: objectIdentity(body), registration };
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function subjects() {
  for (const policy of POLICIES) {
    const actual = policyIdentity(policy.params);
    if (actual !== policy.policyId) throw new Error(`policy identity mismatch for ${policy.name}: ${actual}`);
  }
  return {
    policies: POLICIES,
    layouts: LAYOUTS.map((entry) => ({ ...entry, layoutIdentity: objectIdentity(entry) })),
  };
}

function runtimeLevel(entry) {
  return { ...entry, target: Infinity };
}

function cell(policy, levelLayout, seed) {
  const outcome = playToBudget(runtimeLevel(levelLayout), makeRng(seed), policy.params);
  return {
    policyId: policy.policyId,
    layout: levelLayout.name,
    seed,
    score: outcome.score,
    movesUsed: outcome.moves,
    behaviorTotals: outcome.behaviorTotals,
    behavior: outcome.behavior,
  };
}

function runCells(seeds) {
  const cells = [];
  for (const policy of POLICIES) {
    for (const levelLayout of LAYOUTS) {
      for (const seed of seeds) cells.push(cell(policy, levelLayout, seed));
    }
  }
  return cells;
}

function outputPath(argv) {
  const index = argv.indexOf('--out');
  if (index === -1 || !argv[index + 1]) throw new Error('--out <path> is required');
  return path.resolve(process.cwd(), argv[index + 1]);
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!['controls', 'confirmation'].includes(command)) {
    throw new Error('usage: run.js controls|confirmation --protocol RESULT-0023 --out <path>');
  }
  const registration = requireProtocolOrExit(process.argv, { name: `RESULT-0023 ${command}` });
  const registrationRecord = registrationStamp(registration);
  const fixedSubjects = subjects();
  const sources = sourceHashes();

  if (command === 'controls') {
    const body = {
      schemaVersion: 1,
      result: RESULT,
      kind: 'controls',
      subjects: fixedSubjects,
      seeds: CONTROL_SEEDS,
      sources,
      cells: runCells(CONTROL_SEEDS),
      repeatCells: runCells(CONTROL_SEEDS),
    };
    const artifact = withArtifactIdentity(body, registrationRecord);
    writeNew(outputPath(argv), artifact);
    console.log(`WROTE controls ${artifact.artifactIdentity}`);
    return;
  }

  const body = {
    schemaVersion: 1,
    result: RESULT,
    kind: 'confirmation',
    subjects: fixedSubjects,
    seeds: CONFIRMATION_SEEDS,
    halves: [
      [CONFIRMATION_SEEDS[0], CONFIRMATION_SEEDS[99]],
      [CONFIRMATION_SEEDS[100], CONFIRMATION_SEEDS[199]],
    ],
    sources,
    cells: runCells(CONFIRMATION_SEEDS),
  };
  const artifact = withArtifactIdentity(body, registrationRecord);
  writeNew(outputPath(argv), artifact);
  console.log(`WROTE confirmation ${artifact.artifactIdentity}`);
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
  CONFIRMATION_SEEDS,
  CONTROL_SEEDS,
  LAYOUTS,
  POLICIES,
  SOURCE_PATHS,
  canonicalJson,
  objectIdentity,
};
