const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0032';
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 8 }, (_, index) => 32400000 + index));
const PROFILE_MOVES = Object.freeze({ 10: 13, 31: 15, 53: 14, 54: 27 });
const SLACK_MOVES = 4;
const SHALLOW_SEARCH = Object.freeze({ width: 12, actionsPerState: 16, pathWidth: 2 });
const DEEP_SEARCH = Object.freeze({ width: 48, actionsPerState: 16, pathWidth: 2 });
const RECOVERY_ALTERNATIVES = 8;
const RECOVERY_CANDIDATE_POOL = 64;
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0032/subject.js',
  'experiments/RESULT-0032/run.js',
  'experiments/RESULT-0032/verify.js',
  'experiments/RESULT-0032/run.test.js',
  'experiments/RESULT-0032/verify.test.js',
  'solver/choice-recovery-descriptors.js',
  'solver/tests/choiceRecoveryDescriptors.test.js',
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
  return Object.entries(PROFILE_MOVES).map(([number, moves]) => {
    const source = LEVELS.find(({ level }) => level === Number(number));
    if (!source) throw new Error(`missing shipped level ${number}`);
    if (source.blockers.some(({ type }) => type !== 'stone')) {
      throw new Error(`profile ${number} has a dynamic blocker outside this instrument's scope`);
    }
    return { ...JSON.parse(JSON.stringify(source)), moves };
  });
}

function artifactWithIdentity(body, registration) {
  return { ...body, registration, artifactIdentity: identity(body) };
}

module.exports = {
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  PROFILE_MOVES,
  RECOVERY_ALTERNATIVES,
  RECOVERY_CANDIDATE_POOL,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  SLACK_MOVES,
  SOURCE_PATHS,
  artifactWithIdentity,
  canonicalJson,
  identity,
  profiles,
  sourceHashes,
};
