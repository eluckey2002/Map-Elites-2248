const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const { sourcePaths } = require('./manifest');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0043';
const PROFILE_LEVELS = Object.freeze([10, 31, 53, 54]);
const PERCENTILES = Object.freeze([0.25, 0.5, 0.75, 1]);
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 8 }, (_, index) => 34000000 + index));
const EXACT_MAX_PATH_STATES = 500000;
const EMERGENCY_TIMEOUT_MS = 120000;
const EXPECTED_GAMES = PROFILE_LEVELS.length * PERCENTILES.length * CONFIRMATION_SEEDS.length;
const SOURCE_PATHS = Object.freeze(sourcePaths());
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

function subjectSourceHashes() {
  return Object.fromEntries(SUBJECT_SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function profiles() {
  return PROFILE_LEVELS.map((number) => {
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`missing shipped level ${number}`);
    return JSON.parse(JSON.stringify(level));
  });
}

function subjectIdentityFromSources(sources) {
  return identity({
    sources: Object.fromEntries(SUBJECT_SOURCE_PATHS.map((relative) => [relative, sources[relative]])),
    panel: {
      levels: PROFILE_LEVELS,
      percentiles: PERCENTILES,
      seeds: CONFIRMATION_SEEDS,
      exactMaxPathStates: EXACT_MAX_PATH_STATES,
      emergencyTimeoutMs: EMERGENCY_TIMEOUT_MS,
    },
  });
}

function subjectIdentity() {
  return subjectIdentityFromSources(subjectSourceHashes());
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CONFIRMATION_SEEDS,
  EMERGENCY_TIMEOUT_MS,
  EXACT_MAX_PATH_STATES,
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
  subjectSourceHashes,
  subjectIdentity,
  subjectIdentityFromSources,
};
