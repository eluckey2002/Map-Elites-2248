const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const { valueIdentity } = require('../../solver/benchmark-inputs');
const { replayRecording } = require('../../solver/benchmark-replay');
const { createPuzzle, boardSnapshot, transition, witness } = require('../../solver/oracle/simulation');
const { chooseMove } = require('../../solver/bot');
const { makeRng } = require('../../solver/engine');

const ROOT = path.resolve(__dirname, '../..');
const RESULT = 'RESULT-0040';
const REGISTERED_CHALLENGE_IDENTITY = '2be50b1fac3dbce4787401b3189783478e78e72fc457c6078f9c21c20f50e7c1';
const BUDGET_MS = 30000;
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0040/challenge.json',
  'experiments/RESULT-0040/captures.json',
  'experiments/RESULT-0040/registered-protocol.md',
  'experiments/RESULT-0040/closeout-contract.json',
  'experiments/RESULT-0040/subject.js',
  'experiments/RESULT-0040/run.js',
  'experiments/RESULT-0040/verify.js',
  'experiments/RESULT-0040/qualify.js',
  'experiments/RESULT-0040/run.test.js',
  'solver/oracle/cli.js',
  'solver/oracle/worker.js',
  'solver/oracle/search.js',
  'solver/oracle/simulation.js',
  'solver/oracle/verify.js',
  'solver/engine.js',
  'solver/bot.js',
  'solver/benchmark-inputs.js',
  'solver/benchmark-replay.js',
  'src/game.js',
  'tools/verify-experiments.js',
  'play-sessions/ddc4bce3d15be5501bd22856c23ede5ab4393bd7bde3b8029cb1aad021a54d4b.json',
  'play-sessions/0ab2da13ea6fe1841a5b7c0c75b2f4899bea41d0eb8da25ebb71a67d56b960fb.json',
]);

const fileHash = relative => crypto.createHash('sha256')
  .update(fs.readFileSync(path.resolve(ROOT, relative))).digest('hex');

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map(relative => [relative, fileHash(relative)]));
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, relative), 'utf8'));
}

function ruleLevel(number) {
  const source = LEVELS.find(level => level.level === number);
  if (!source) throw new Error(`missing shipped level ${number}`);
  return Object.fromEntries(['gridW', 'gridH', 'moves', 'minChain', 'target', 'tileScale', 'blockers']
    .map(key => [key, key === 'tileScale' ? source[key] || 1 : structuredClone(source[key])]));
}

function challengeRows() {
  if (fileHash('experiments/RESULT-0040/challenge.json') !== REGISTERED_CHALLENGE_IDENTITY) {
    throw new Error('registered challenge identity mismatch');
  }
  const challenge = readJson('experiments/RESULT-0040/challenge.json');
  const captures = readJson('experiments/RESULT-0040/captures.json');
  if (captures.challengeIdentity !== REGISTERED_CHALLENGE_IDENTITY) {
    throw new Error('capture manifest challenge identity mismatch');
  }
  if (challenge.boards.length !== 2 || captures.entries.length !== 2) {
    throw new Error('challenge must contain exactly two paired rows');
  }
  const captureByBoard = new Map(captures.entries.map(entry => [entry.boardId, entry]));
  return challenge.boards.map(board => {
    const capture = captureByBoard.get(board.id);
    if (!capture) throw new Error(`missing capture for ${board.id}`);
    if (fileHash(capture.file) !== capture.fileIdentity) throw new Error(`${board.id} capture identity mismatch`);
    const recording = readJson(capture.file);
    if (recording.candidateLevel !== board.level || recording.seed !== board.seed) {
      throw new Error(`${board.id} capture assignment mismatch`);
    }
    const level = ruleLevel(board.level);
    const humanReplay = replayRecording(level, recording, { expectedSeed: board.seed });
    if (humanReplay.validity !== 'valid') throw new Error(`${board.id} human replay invalid: ${humanReplay.reasons.join('; ')}`);
    const initial = createPuzzle(level, board.seed);
    const input = {
      engineIdentity: fileHash('solver/engine.js'), level, seed: board.seed,
      initialBoard: boardSnapshot(initial.state), spawnIdentity: valueIdentity(initial.draws),
    };
    return {
      boardId: board.id,
      levelNumber: board.level,
      seed: board.seed,
      puzzleIdentity: valueIdentity(input),
      input,
      capture,
      recording,
      humanReplay,
      humanBestMoves: humanReplay.outcome === 'win' ? humanReplay.moves : null,
    };
  });
}

function recordingWitness(row) {
  let node = createPuzzle(row.input.level, row.seed);
  const draws = node.draws;
  for (const action of row.recording.chains) {
    node = transition(node, action.tiles.map(({ x, y }) => node.state.grid[y][x]), draws);
  }
  return { ...witness(node), outcome: row.recording.outcome };
}

function baselineWitness(row) {
  let node = createPuzzle(row.input.level, row.seed);
  const draws = node.draws;
  while (!node.terminal) {
    const index = node.state.moves;
    const chain = chooseMove(node.state, { lookaheadRngFactory: () => makeRng(987654321 + index) });
    if (!chain) break;
    node = transition(node, chain, draws);
  }
  return { ...witness(node), outcome: node.terminal || 'lose' };
}

function seal(body) {
  return { ...body, artifactIdentity: valueIdentity(body) };
}

module.exports = {
  BUDGET_MS,
  REGISTERED_CHALLENGE_IDENTITY,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  baselineWitness,
  challengeRows,
  fileHash,
  recordingWitness,
  seal,
  sourceHashes,
};
