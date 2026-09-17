const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { valueIdentity } = require('../../solver/benchmark-inputs');
const { isBlockedTile } = require('../../solver/engine');
const { loadCorpus } = require('../../solver/oracle/corpus');
const { rankState: evolvedRankState } = require('../../solver/oracle/harvest-policy');

const ROOT = path.resolve(__dirname, '../..');
const RESULT = 'RESULT-0041';
const SUBJECT_FILE = path.join(__dirname, 'subject.json');
const subject = JSON.parse(fs.readFileSync(SUBJECT_FILE, 'utf8'));
const SUBJECT_IDENTITY = valueIdentity(subject);
const fileHash = file => createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');

const SOURCE_FILES = [
  'experiments/RESULT-0041/subject.json',
  'experiments/RESULT-0041/subject.js',
  'experiments/RESULT-0041/run.js',
  'experiments/RESULT-0041/verify.js',
  'experiments/RESULT-0041/recompute.js',
  'solver/oracle/harvest-policy.js',
  'solver/oracle/search.js',
  'solver/oracle/simulation.js',
  'solver/oracle/verify.js',
  'solver/oracle/corpus.js',
  'solver/benchmark-inputs.js',
  'solver/benchmark-replay.js',
  'solver/human-benchmark.js',
  'solver/engine.js',
  'src/game.js',
];

function baselineHarvestableMass(state) {
  const counts = new Map();
  for (const tile of state.grid.flat()) {
    if (tile && !isBlockedTile(tile)) counts.set(tile.value, (counts.get(tile.value) || 0) + 1);
  }
  let result = 0;
  for (const [value, count] of counts) {
    if (count > 1 || counts.has(value / 2) || counts.has(value * 2)) result += value * count;
  }
  return result;
}

function baselineRankState(state, { potentialWeight = 1 } = {}) {
  return state.score + potentialWeight * baselineHarvestableMass(state);
}

const POLICIES = Object.freeze([
  { id: 'baseline', rankState: baselineRankState },
  { id: 'evolved', rankState: evolvedRankState },
]);

function loadPanel() {
  assert.equal(subject.result, RESULT);
  const corpus = loadCorpus();
  assert.equal(corpus.manifestIdentity, subject.corpusIdentity);
  const excluded = new Set(subject.optimizationPanelCorpusPuzzles);
  assert.equal(excluded.size, 2);
  const primary = corpus.puzzles.filter(puzzle => !excluded.has(puzzle.puzzleIdentity));
  assert.equal(primary.length, 18);
  return { corpus, excluded, primary };
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_FILES.map(file => [file, fileHash(file)]));
}

function seal(body) {
  return { ...body, artifactIdentity: valueIdentity(body) };
}

module.exports = {
  POLICIES, RESULT, ROOT, SOURCE_FILES, SUBJECT_IDENTITY, baselineRankState,
  fileHash, loadPanel, seal, sourceHashes, subject,
};
