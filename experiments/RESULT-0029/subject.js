const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0029';
const REQUIRED_PER_REGION = 4;
const MAX_NODES = 250000;
const BASE_LEVEL = Object.freeze({
  level: 9029,
  name: 'exact-descriptor-micro-puzzle',
  gridW: 3,
  gridH: 3,
  moves: 2,
  minChain: 3,
  tileScale: 1,
  blockers: [],
  target: 1,
});
const REGIONS = Object.freeze([
  Object.freeze({ id: 'relaxed-short', seedStart: 29000000, seedCount: 48 }),
  Object.freeze({ id: 'relaxed-long', seedStart: 29000100, seedCount: 48 }),
  Object.freeze({ id: 'tight-short', seedStart: 29000200, seedCount: 48 }),
  Object.freeze({ id: 'tight-long', seedStart: 29000300, seedCount: 48 }),
]);
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0029/subject.js',
  'experiments/RESULT-0029/run.js',
  'experiments/RESULT-0029/verify.js',
  'solver/puzzle-descriptors.js',
  'solver/exact-score.js',
  'solver/engine.js',
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
  BASE_LEVEL,
  MAX_NODES,
  REGIONS,
  REQUIRED_PER_REGION,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  fileHash,
  hashBytes,
  identity,
  sourceHashes,
};
