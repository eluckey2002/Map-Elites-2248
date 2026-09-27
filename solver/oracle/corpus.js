const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { valueIdentity, validateSeed } = require('../benchmark-inputs');
const { resolveRecordedBoard } = require('../human-benchmark');
const { replayRecording } = require('../benchmark-replay');
const { createPuzzle, boardSnapshot } = require('./simulation');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_MANIFEST = path.join(ROOT, 'docs/oracle/corpus.json');
// Anchored in source, outside any submitted report. Set by the initial freeze.
const FROZEN_MANIFEST_ID = '59daa4e54dceef9b5da7eacb730d3cecb08f43fc389f9721adec6b4c3dc31308';
const fileHash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function recordingFiles() {
  const dirs = ['recordings', 'play-sessions'];
  for (const pilot of fs.readdirSync(path.join(ROOT, 'pilots')).sort()) {
    const dir = `pilots/${pilot}/recordings`;
    if (fs.existsSync(path.join(ROOT, dir))) dirs.push(dir);
  }
  return dirs.flatMap(dir => fs.readdirSync(path.join(ROOT, dir)).sort()
    .filter(name => name.endsWith('.json')).map(name => `${dir}/${name}`)).sort();
}

function ruleLevel(candidate) {
  return Object.fromEntries(['gridW', 'gridH', 'moves', 'minChain', 'target', 'tileScale', 'blockers']
    .map(key => [key, key === 'tileScale' ? candidate[key] || 1 : candidate[key]]));
}

function collectCorpus(files = recordingFiles()) {
  const engineIdentity = fileHash(path.join(ROOT, 'solver/engine.js'));
  const puzzles = new Map();
  for (const file of files) {
    const recording = JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
    const resolved = resolveRecordedBoard(recording);
    if (!resolved) throw new Error(`unresolved recording: ${file}`);
    const checked = replayRecording(resolved.candidate, recording, {
      expectedSeed: validateSeed(recording.seed),
      ...(recording.candidateIdentity ? { expectedCandidateIdentity: recording.candidateIdentity } : {}),
    });
    if (checked.validity !== 'valid') throw new Error(`${file}: ${checked.reasons.join('; ')}`);
    const level = ruleLevel(resolved.candidate);
    const seed = recording.seed;
    const initial = createPuzzle(level, seed);
    const input = {
      engineIdentity, level, seed, initialBoard: boardSnapshot(initial.state),
      spawnIdentity: valueIdentity(initial.draws),
    };
    const puzzleIdentity = valueIdentity(input);
    const puzzle = puzzles.get(puzzleIdentity) || { puzzleIdentity, input, humanBestMoves: null, recordings: [] };
    if (checked.outcome === 'win') puzzle.humanBestMoves = Math.min(puzzle.humanBestMoves ?? Infinity, checked.moves);
    puzzle.recordings.push({
      file, fileIdentity: fileHash(path.join(ROOT, file)), candidateIdentity: recording.candidateIdentity,
      candidate: resolved.candidate, levelNumber: recording.candidateLevel, source: resolved.source,
      outcome: checked.outcome, moves: checked.moves, score: checked.score,
    });
    puzzles.set(puzzleIdentity, puzzle);
  }
  const body = {
    schemaVersion: 1, scope: 'exact captured corpus; development cases, not a holdout',
    engineIdentity, gameIdentity: fileHash(path.join(ROOT, 'src/game.js')),
    recordingCount: files.length,
    puzzles: [...puzzles.values()].sort((a, b) => a.puzzleIdentity.localeCompare(b.puzzleIdentity)),
  };
  return { ...body, manifestIdentity: valueIdentity(body) };
}

function loadCorpus(file = DEFAULT_MANIFEST, expectedIdentity = FROZEN_MANIFEST_ID) {
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { manifestIdentity, ...body } = manifest;
  if (manifestIdentity !== expectedIdentity || valueIdentity(body) !== expectedIdentity) {
    throw new Error('frozen corpus identity mismatch');
  }
  const frozenFiles = manifest.puzzles.flatMap(puzzle => puzzle.recordings.map(recording => recording.file));
  const actual = collectCorpus(frozenFiles);
  if (actual.manifestIdentity !== expectedIdentity) throw new Error('live corpus or rules differ from the frozen manifest');
  return manifest;
}

if (require.main === module) {
  if (process.argv[2] !== 'freeze') throw new Error('usage: node solver/oracle/corpus.js freeze');
  if (fs.existsSync(DEFAULT_MANIFEST)) throw new Error('refusing to overwrite frozen corpus');
  const corpus = collectCorpus();
  fs.mkdirSync(path.dirname(DEFAULT_MANIFEST), { recursive: true });
  fs.writeFileSync(DEFAULT_MANIFEST, `${JSON.stringify(corpus, null, 2)}\n`);
  console.log(JSON.stringify({ identity: corpus.manifestIdentity, recordings: corpus.recordingCount, puzzles: corpus.puzzles.length }));
}

module.exports = { ROOT, DEFAULT_MANIFEST, FROZEN_MANIFEST_ID, fileHash, collectCorpus, loadCorpus };
