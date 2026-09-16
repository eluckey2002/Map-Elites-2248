const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0036';
const PROFILE_LEVELS = Object.freeze([10, 31, 53, 54]);
const PERCENTILES = Object.freeze([0.25, 0.5, 0.75, 1]);
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 8 }, (_, index) => 33200000 + index));
const EXACT_TIMEOUT_MS = 2000;
const EXPECTED_GAMES = PROFILE_LEVELS.length * PERCENTILES.length * CONFIRMATION_SEEDS.length;
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0036/registered-protocol.md',
  'experiments/RESULT-0036/closeout-contract.json',
  'experiments/RESULT-0036/subject.js',
  'experiments/RESULT-0036/run.js',
  'experiments/RESULT-0036/recompute.js',
  'experiments/RESULT-0036/verify.js',
  'experiments/RESULT-0036/run.test.js',
  'experiments/RESULT-0036/verify.test.js',
  'solver/behavior-descriptors.js',
  'solver/greed-descriptor-screen.js',
  'solver/greed-descriptor-result.js',
  'solver/exact-greed-denominator.js',
  'solver/exact-greed-worker.js',
  'solver/tests/behaviorDescriptors.test.js',
  'solver/tests/greedDescriptorScreen.test.js',
  'solver/tests/greedDescriptorResult.test.js',
  'solver/tests/exactGreedDenominator.test.js',
  'solver/exact-score.js',
  'solver/engine.js',
  'src/game.js',
  'solver/experiment-guard.js',
  'tools/verify-experiments.js',
]);
const SUBJECT_SOURCE_PATHS = Object.freeze(SOURCE_PATHS.filter((relative) => (
  !relative.endsWith('registered-protocol.md') && !relative.endsWith('closeout-contract.json')
)));

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
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`missing shipped level ${number}`);
    return JSON.parse(JSON.stringify(level));
  });
}

function subjectIdentity() {
  return subjectIdentityFromSources(sourceHashes());
}

function subjectIdentityFromSources(sources) {
  return identity({
    sources: Object.fromEntries(SUBJECT_SOURCE_PATHS.map((relative) => [relative, sources[relative]])),
    panel: {
      levels: PROFILE_LEVELS,
      percentiles: PERCENTILES,
      seeds: CONFIRMATION_SEEDS,
      exactTimeoutMs: EXACT_TIMEOUT_MS,
    },
  });
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CONFIRMATION_SEEDS,
  EXACT_TIMEOUT_MS,
  EXPECTED_GAMES,
  PERCENTILES,
  PROFILE_LEVELS,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  identity,
  profiles,
  sourceHashes,
  subjectIdentity,
  subjectIdentityFromSources,
};
