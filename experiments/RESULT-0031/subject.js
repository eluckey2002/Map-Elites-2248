const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0031';
const CONFIRMATION_SEEDS = Object.freeze([32200000, 32200001]);
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0031/subject.js',
  'experiments/RESULT-0031/run.js',
  'experiments/RESULT-0031/verify.js',
  'experiments/RESULT-0030/subject.js',
  'experiments/RESULT-0030/run.js',
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

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CONFIRMATION_SEEDS,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  identity,
  sourceHashes,
};
