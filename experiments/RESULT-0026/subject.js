const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0026';
const LEVEL_NUMBERS = Object.freeze([5, 11, 17, 23, 29, 35, 41, 47, 50]);
const QUALIFICATION_LEVELS = Object.freeze([5, 50]);
const QUALIFICATION_SEEDS = Object.freeze([7000000]);
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 25 }, (_, index) => 24000000 + index));
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0026/frozen-handmade-policy.js',
  'experiments/RESULT-0026/subject.js',
  'experiments/RESULT-0026/run.js',
  'experiments/RESULT-0026/gate.js',
  'experiments/RESULT-0026/recompute.js',
  'experiments/RESULT-0026/admit.js',
  'solver/bot.js',
  'solver/engine.js',
  'solver/experiment-guard.js',
  'src/game.js',
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

function params() {
  const reference = require(path.join(ROOT, 'solver', 'bot'));
  return { ...reference.DEFAULT_PARAMS, offerFull: 0, tieBreak: 'degree' };
}

function subjects() {
  const resolvedParams = params();
  return [
    {
      name: 'reference',
      policyId: identity({
        name: 'reference',
        source: fileHash('solver/bot.js'),
        params: resolvedParams,
      }).slice(0, 12),
      params: resolvedParams,
    },
    {
      name: 'handmade',
      policyId: identity({
        name: 'handmade',
        source: fileHash('experiments/RESULT-0026/frozen-handmade-policy.js'),
        params: resolvedParams,
        topMult: 64,
        bigMult: 32,
        nodeBudget: 150000,
        bombHandling: 'defer-to-reference-before-target-finish',
        placement: 'pre-gravity-big-neighbours-then-length',
      }).slice(0, 12),
      params: resolvedParams,
    },
  ];
}

function levels(numbers) {
  const { LEVELS } = require(path.join(ROOT, 'src', 'game'));
  return numbers.map((number) => {
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`level ${number} is missing`);
    return level;
  });
}

function artifactWithIdentity(body, registration) {
  const envelope = { ...body, registration };
  return { ...envelope, artifactIdentity: identity(envelope) };
}

function resignArtifact(artifact) {
  const { artifactIdentity, ...envelope } = structuredClone(artifact);
  return { ...envelope, artifactIdentity: identity(envelope) };
}

module.exports = {
  CONFIRMATION_SEEDS,
  LEVEL_NUMBERS,
  QUALIFICATION_LEVELS,
  QUALIFICATION_SEEDS,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  fileHash,
  hashBytes,
  identity,
  levels,
  params,
  resignArtifact,
  sourceHashes,
  subjects,
};
