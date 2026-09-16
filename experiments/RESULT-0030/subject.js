const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0030';
const CONFIRMATION_SEEDS = Object.freeze([32100000, 32100001]);
const PROFILE_LEVELS = Object.freeze([10, 31, 53, 54]);
const CAPS = Object.freeze([2, 3, 4, 6, 8, 12]);
const SHALLOW_SEARCH = Object.freeze({ width: 12, actionsPerState: 16, pathWidth: 2 });
const DEEP_SEARCH = Object.freeze({ width: 48, actionsPerState: 16, pathWidth: 2 });
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0030/subject.js',
  'experiments/RESULT-0030/run.js',
  'experiments/RESULT-0030/verify.js',
  'experiments/RESULT-0030/run.test.js',
  'experiments/RESULT-0030/verify.test.js',
  'solver/puzzle-descriptor-witness.js',
  'solver/tests/puzzleDescriptorWitness.test.js',
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

function hashBytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function identity(value) {
  return hashBytes(canonicalJson(value));
}

function fileHash(relative) {
  return hashBytes(fs.readFileSync(path.join(ROOT, relative)));
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function profiles() {
  return PROFILE_LEVELS.map((number) => {
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`missing shipped level ${number}`);
    return JSON.parse(JSON.stringify(level));
  });
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CAPS,
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  PROFILE_LEVELS,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  identity,
  profiles,
  sourceHashes,
};
