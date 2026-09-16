const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { LEVELS } = require('../../src/game');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0034';
const CONFIRMATION_SEEDS = Object.freeze(Array.from({ length: 8 }, (_, i) => 32800000 + i));
const PROFILE_LEVELS = Object.freeze([10, 31, 53, 54]);
const SHALLOW_SEARCH = Object.freeze({ width: 12, actionsPerState: 16, pathWidth: 2, successCap: 64, successesPerOpening: 8 });
const DEEP_SEARCH = Object.freeze({ width: 48, actionsPerState: 16, pathWidth: 2, successCap: 64, successesPerOpening: 8 });
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0034/subject.js', 'experiments/RESULT-0034/run.js',
  'experiments/RESULT-0034/verify.js', 'experiments/RESULT-0034/run.test.js',
  'solver/forced-diversity-descriptors.js', 'solver/tests/forcedDiversityDescriptors.test.js',
  'solver/choice-recovery-descriptors.js', 'solver/exact-score.js', 'solver/engine.js',
  'src/game.js', 'solver/experiment-guard.js', 'tools/verify-experiments.js',
]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function identity(value) { return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex'); }
function fileHash(relative) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex'); }
function sourceHashes() { return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)])); }
function profiles() {
  return PROFILE_LEVELS.map((number) => {
    const level = LEVELS.find(({ level: candidate }) => candidate === number);
    if (!level) throw new Error(`missing shipped level ${number}`);
    if (level.blockers.some(({ type }) => type !== 'stone')) throw new Error(`dynamic blocker outside scope on ${number}`);
    return JSON.parse(JSON.stringify(level));
  });
}
function artifactWithIdentity(body, registration) { return { ...body, registration, artifactIdentity: identity(body) }; }

module.exports = { CONFIRMATION_SEEDS, DEEP_SEARCH, RESULT, ROOT, SHALLOW_SEARCH, SOURCE_PATHS, artifactWithIdentity, canonicalJson, identity, profiles, sourceHashes };
