#!/usr/bin/env node
// Qualification only: replay the frozen captured corpus and describe the
// challenger search bound. This never chooses a move for a live game or opens
// a fresh seed.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { makeRng, createLevelState } = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { analyzeRouteDiverseMove, SUPPLEMENT_LIMIT } = require('../solver/route-diverse-challenger');
const { loadCorpus, ROOT, fileHash } = require('../solver/oracle/corpus');

const LOOKAHEAD_BASE = 987654321;
const TRAINING_RECORDING = 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json';
const DEFAULT_OUT = path.join(ROOT, 'docs/learning-cycles/LC-0021-route-diverse-boundedness.json');

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function identity(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function timed(fn) {
  const started = process.hrtime.bigint();
  const result = fn();
  return { result, ns: Number(process.hrtime.bigint() - started) };
}

function measurePuzzle(puzzleIdentity, descriptors) {
  if (!descriptors.length) throw new Error(`missing retained recording for ${puzzleIdentity}`);
  // The frozen corpus deduplicates equal initial puzzles. Every descriptor in
  // this group has the same replayed initial state, so the first descriptor is
  // only a reconstruction vehicle—not a chosen outcome or preferred trace.
  const descriptor = descriptors[0];
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, descriptor.file), 'utf8'));
  const rng = makeRng(recording.seed);
  const state = createLevelState(descriptor.candidate, rng);
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + state.moves);
  const champion = timed(() => analyzeMove(state, { lookaheadRngFactory }));
  const challenger = timed(() => analyzeRouteDiverseMove(state, { lookaheadRngFactory }));
  if (challenger.result.supplement.length > SUPPLEMENT_LIMIT) {
    throw new Error(`supplement cap breached for ${descriptor.file} initial state`);
  }

  return {
    puzzleIdentity,
    recordingFiles: descriptors.map(({ file }) => file),
    recordingIdentities: descriptors.map(({ file }) => fileHash(path.join(ROOT, file))),
    level: descriptor.levelNumber,
    seed: recording.seed,
    training: descriptors.some(({ file }) => file === TRAINING_RECORDING),
    // One state per frozen puzzle is the boundedness sampling unit. The
    // training move-two state has its own exact recovery test; replaying every
    // historic decision would make this a trace-length benchmark instead.
    decisions: [{
      move: 1,
      championCandidates: champion.result.candidates.length,
      supplementCandidates: challenger.result.supplement.length,
      supplementWon: challenger.result.supplementWon,
      championNs: champion.ns,
      challengerNs: challenger.ns,
    }],
  };
}

function summarize(rows) {
  const decisions = rows.flatMap(({ decisions: entries }) => entries);
  const championNs = decisions.reduce((total, entry) => total + entry.championNs, 0);
  const challengerNs = decisions.reduce((total, entry) => total + entry.challengerNs, 0);
  return {
    puzzles: rows.length,
    decisions: decisions.length,
    maxSupplementCandidates: Math.max(...decisions.map(({ supplementCandidates }) => supplementCandidates)),
    totalChampionNs: championNs,
    totalChallengerNs: challengerNs,
    wallClockRatio: championNs === 0 ? null : challengerNs / championNs,
    supplementWins: decisions.filter(({ supplementWon }) => supplementWon).length,
  };
}

function qualify() {
  const corpus = loadCorpus();
  const rows = corpus.puzzles.map(({ puzzleIdentity, recordings }) => measurePuzzle(puzzleIdentity, recordings));
  const training = rows.filter(({ training: isTraining }) => isTraining);
  const qualification = rows.filter(({ training: isTraining }) => !isTraining);
  if (training.length !== 1 || qualification.length !== 19) {
    throw new Error(`expected 1 training and 19 qualification puzzles, found ${training.length} and ${qualification.length}`);
  }
  const body = {
    schemaVersion: 1,
    kind: 'route-diverse-boundedness-qualification',
    scope: 'one initial decision state from each frozen captured puzzle; search-bound measurement only, not an outcome experiment',
    corpus: {
      path: 'docs/oracle/corpus.json',
      identity: corpus.manifestIdentity,
      puzzles: corpus.puzzles.length,
    },
    sources: {
      tool: fileHash(__filename),
      challenger: fileHash(path.join(ROOT, 'solver/route-diverse-challenger.js')),
      champion: fileHash(path.join(ROOT, 'solver/bot.js')),
      engine: fileHash(path.join(ROOT, 'solver/engine.js')),
    },
    supplementLimit: SUPPLEMENT_LIMIT,
    training: summarize(training),
    qualification: summarize(qualification),
    rows,
  };
  return { ...body, artifactIdentity: identity(body) };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? DEFAULT_OUT : path.resolve(process.argv[outIndex + 1]);
  if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a path');
  const artifact = qualify();
  if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
  fs.writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({
    artifactIdentity: artifact.artifactIdentity,
    training: artifact.training,
    qualification: artifact.qualification,
  }, null, 2));
}

if (require.main === module) main();

module.exports = { qualify, measurePuzzle, summarize };
