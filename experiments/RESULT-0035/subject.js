const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0035';
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 32 }, (_, index) => 33000000 + index));
const PROFILE_LEVELS = Object.freeze([10, 31, 53, 54]);
const SHALLOW_SEARCH = Object.freeze({ width: 12, actionsPerState: 16, pathWidth: 2 });
const DEEP_SEARCH = Object.freeze({ width: 48, actionsPerState: 16, pathWidth: 2 });
const SPREAD_CUT = 0.82;
const CELL_CAPACITY = 4;
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0035/registered-protocol.md',
  'experiments/RESULT-0035/closeout-contract.json',
  'experiments/RESULT-0035/subject.js',
  'experiments/RESULT-0035/run.js',
  'experiments/RESULT-0035/recompute.js',
  'experiments/RESULT-0035/verify.js',
  'experiments/RESULT-0035/run.test.js',
  'experiments/RESULT-0035/verify.test.js',
  'solver/merge-spread-map.js',
  'solver/tests/mergeSpreadMap.test.js',
  'solver/merge-spread-descriptors.js',
  'solver/tests/mergeSpreadDescriptors.test.js',
  'solver/choice-recovery-descriptors.js',
  'solver/exact-score.js',
  'solver/engine.js',
  'src/game.js',
  'solver/experiment-guard.js',
  'tools/verify-experiments.js',
]);

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

function fileHash(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function profiles() {
  return PROFILE_LEVELS.map((number) => {
    const source = LEVELS.find(({ level }) => level === number);
    if (!source) throw new Error(`missing shipped level ${number}`);
    if (source.blockers.some(({ type }) => type !== 'stone')) {
      throw new Error(`profile ${number} has a dynamic blocker outside this instrument's scope`);
    }
    return JSON.parse(JSON.stringify(source));
  });
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CELL_CAPACITY,
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  PROFILE_LEVELS,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  SOURCE_PATHS,
  SPREAD_CUT,
  artifactWithIdentity,
  canonicalJson,
  identity,
  profiles,
  sourceHashes,
};
