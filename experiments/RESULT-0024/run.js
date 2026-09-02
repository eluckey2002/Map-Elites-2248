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
const {
  LAYOUTS,
  POLICIES,
  canonicalJson,
  objectIdentity,
} = require(path.join(ROOT, 'experiments', 'RESULT-0023', 'run'));
const { readControlEntitlement } = require('./verify');

const RESULT = 'RESULT-0024';
const CONTROL_SEEDS = Object.freeze(Array.from({ length: 12 }, (_, index) => 22_000_000 + index));
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 200 }, (_, index) => 23_000_000 + index));
const SOURCE_PATHS = Object.freeze([
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

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function fileHash(relative) {
  return hashBytes(fs.readFileSync(path.join(ROOT, relative)));
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
  const started = process.hrtime.bigint();
  const cells = [];
  for (const policy of POLICIES) {
    for (const levelLayout of LAYOUTS) {
      for (const seed of seeds) cells.push(cell(policy, levelLayout, seed));
    }
  }
  return {
    cells,
    runtimeMs: Number(process.hrtime.bigint() - started) / 1_000_000,
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  return index === -1 ? null : argv[index + 1];
}

function outputPath(argv) {
  const output = flag(argv, '--out');
  if (!output) throw new Error('--out <path> is required');
  return path.resolve(process.cwd(), output);
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function withArtifactIdentity(body, registration) {
  return { ...body, artifactIdentity: objectIdentity(body), registration };
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (!['controls', 'confirmation'].includes(command)) {
    throw new Error('usage: run.js controls|confirmation --protocol RESULT-0024 --out <path> [--controls <path> --control-receipt <path>]');
  }
  const registration = requireProtocolOrExit(process.argv, { name: `RESULT-0024 ${command}` });
  const registrationRecord = registrationStamp(registration);
  const fixedSubjects = subjects();
  const sources = sourceHashes();

  if (command === 'controls') {
    const first = runCells(CONTROL_SEEDS);
    const repeat = runCells(CONTROL_SEEDS);
    const body = {
      schemaVersion: 1,
      result: RESULT,
      kind: 'controls',
      subjects: fixedSubjects,
      seeds: CONTROL_SEEDS,
      sources,
      cells: first.cells,
      repeatCells: repeat.cells,
      execution: {
        firstRuntimeMs: first.runtimeMs,
        repeatRuntimeMs: repeat.runtimeMs,
      },
    };
    const artifact = withArtifactIdentity(body, registrationRecord);
    writeNew(outputPath(argv), artifact);
    console.log(`WROTE controls ${artifact.artifactIdentity}`);
    return;
  }

  const controlsPath = flag(argv, '--controls');
  const receiptPath = flag(argv, '--control-receipt');
  if (!controlsPath || !receiptPath) {
    throw new Error('confirmation requires --controls <path> and --control-receipt <path>');
  }
  const entitlement = readControlEntitlement(path.resolve(receiptPath), path.resolve(controlsPath));
  const confirmation = runCells(CONFIRMATION_SEEDS);
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
    controlEntitlement: entitlement,
    execution: { runtimeMs: confirmation.runtimeMs },
    cells: confirmation.cells,
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
