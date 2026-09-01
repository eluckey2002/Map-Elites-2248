#!/usr/bin/env node
// Paired terminal-game evaluation for the target-aware challenger.
// Diagnostic, screen, and holdout inputs are fixed; no arbitrary seed flags.
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const { LEVELS } = require('../src/game');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('./engine');
// chooseBaseMove, not chooseMove. DECISION-0004 promoted the target-aware
// policy into the bot, so on main chooseMove IS the challenger and this
// comparison reads zero on every board. chooseBaseMove is the pre-promotion
// chooser kept for exactly this. See BL-0005-FINISH-LINE fact 2.
const { chooseBaseMove } = require('./bot');
const { chooseTargetAwareMove } = require('./target-aware-challenger');
const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');

// Refuse before spending the run. This script produced RESULT-0018's holdout.
const REGISTRATION = process.argv.includes('--out')
  ? requireProtocolOrExit(process.argv, { name: 'target-aware-evaluation --out' })
  : { exploratory: true, protocolCommit: null, resultId: null };
const REGISTRATION_STAMP = registrationStamp(REGISTRATION);

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;
const SCREEN_LEVELS = Object.freeze([1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51, 52]);
const SCREEN_SEEDS = Object.freeze(Array.from({ length: 40 }, (_, index) => 12000000 + index));
const HOLDOUT_LEVELS = Object.freeze(Array.from({ length: 52 }, (_, index) => index + 1));
const HOLDOUT_SEEDS = Object.freeze(Array.from({ length: 300 }, (_, index) => 13000000 + index));

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

function fileIdentity(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function moveKey(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function playToTerminal(levelData, seed, chooser) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const sequence = [];
  let reason = 'out_of_moves';
  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex++) {
    const chain = chooser(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) { reason = 'no_valid_moves'; break; }
    sequence.push(moveKey(chain));
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) { reason = 'bomb'; break; }
    if (state.score >= state.targetScore) { reason = 'target'; break; }
    if (state.moves >= state.maxMoves) { reason = 'out_of_moves'; break; }
  }
  return {
    win: reason === 'target',
    movesToTarget: reason === 'target' ? state.moves : null,
    moves: state.moves,
    score: state.score,
    reason,
    sequence,
  };
}

function changedMoveCount(left, right) {
  const length = Math.min(left.length, right.length);
  let changed = 0;
  for (let index = 0; index < length; index++) if (left[index] !== right[index]) changed += 1;
  return changed;
}

function evaluatePairWithTimings(levels, seeds) {
  const cells = [];
  let championMs = 0;
  let challengerMs = 0;
  for (const level of levels) {
    for (const seed of seeds) {
      let start = performance.now();
      const champion = playToTerminal(level, seed, chooseBaseMove);
      championMs += performance.now() - start;
      start = performance.now();
      const challenger = playToTerminal(level, seed, chooseTargetAwareMove);
      challengerMs += performance.now() - start;
      const championPublic = { ...champion };
      const challengerPublic = { ...challenger };
      delete championPublic.sequence;
      delete challengerPublic.sequence;
      cells.push({
        level: level.level,
        seed,
        champion: championPublic,
        challenger: challengerPublic,
        changedMoveCount: changedMoveCount(champion.sequence, challenger.sequence),
        terminalMoveDelta: challenger.moves - champion.moves,
      });
    }
  }
  return { cells, timings: { championMs, challengerMs } };
}

function evaluatePair(levels, seeds) {
  return evaluatePairWithTimings(levels, seeds).cells;
}

function sourceIdentities() {
  return {
    champion: fileIdentity(path.join(__dirname, 'bot.js')),
    challenger: fileIdentity(path.join(__dirname, 'target-aware-challenger.js')),
    engine: fileIdentity(path.join(__dirname, 'engine.js')),
    levels: fileIdentity(path.join(ROOT, 'src/game.js')),
    evaluator: fileIdentity(__filename),
  };
}

function makeArtifact(mode, levelNumbers, seeds, cells, timings) {
  const body = {
    schemaVersion: 1,
    experiment: 'target-aware-immediate-win-challenger',
    mode,
    levelNumbers,
    seeds,
    order: 'level-major',
    sources: sourceIdentities(),
    timings,
    cells,
  };
  return { ...body, artifactIdentity: identity(body), registration: REGISTRATION_STAMP };
}

function validateArtifact(artifact) {
  // registration rides outside the hashed body; stripping it here keeps
  // artifacts written before the guard existed verifying unchanged.
  const { artifactIdentity, registration, ...body } = artifact;
  const expected = artifact.levelNumbers.length * artifact.seeds.length;
  if (artifact.cells.length !== expected) throw new Error(`cell count ${artifact.cells.length} does not match ${expected}`);
  let index = 0;
  for (const level of artifact.levelNumbers) {
    for (const seed of artifact.seeds) {
      const cell = artifact.cells[index++];
      if (!cell || cell.level !== level || cell.seed !== seed) throw new Error('cells are not complete level-major order');
      if (!cell.champion || !cell.challenger) throw new Error('paired cell is incomplete');
    }
  }
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
  return { cells: artifact.cells.length, identity: artifactIdentity };
}

function writeArtifact(file, artifact) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  validateArtifact(artifact);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`);
}

function parseArgs(argv) {
  let mode = null;
  let out = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (['--diagnostic', '--screen', '--holdout'].includes(arg)) {
      if (mode) throw new Error('choose exactly one mode');
      mode = arg.slice(2);
    } else if (arg === '--out') {
      out = argv[++index];
      if (!out) throw new Error('--out needs a path');
    } else if (arg === '--protocol') {
      // Consumed by the registration guard against raw argv before this runs.
      // Accepted and ignored here so the documented command actually parses.
      if (!argv[++index]) throw new Error('--protocol needs a RESULT id');
    } else if (arg === '--exploratory') {
      // Same: the guard already read it and stamped the artifact exploratory.
    } else {
      throw new Error(`unknown argument ${arg}`);
    }
  }
  if (!mode) throw new Error('choose --diagnostic, --screen, or --holdout');
  if (mode === 'diagnostic' && out) throw new Error('--diagnostic does not write output');
  if (mode !== 'diagnostic' && !out) throw new Error('--out is required for screen and holdout');
  return { mode, out };
}

async function runWorkers(levelNumbers, seeds) {
  const size = Math.max(1, Math.min(os.cpus().length - 1, 9));
  const chunkSize = Math.ceil(levelNumbers.length / size);
  const chunks = [];
  for (let index = 0; index < levelNumbers.length; index += chunkSize) {
    chunks.push(levelNumbers.slice(index, index + chunkSize));
  }
  const workers = chunks.map(() => new Worker(path.join(__dirname, 'target-aware-worker.js')));
  try {
    const parts = await Promise.all(chunks.map((chunk, index) => new Promise((resolve, reject) => {
      const worker = workers[index];
      const onMessage = (message) => resolve(message);
      const onError = (error) => reject(error);
      worker.once('message', onMessage);
      worker.once('error', onError);
      worker.postMessage({ levelNumbers: chunk, seeds });
    })));
    return {
      cells: parts.flatMap((part) => part.cells),
      timings: {
        championMs: parts.reduce((sum, part) => sum + part.timings.championMs, 0),
        challengerMs: parts.reduce((sum, part) => sum + part.timings.challengerMs, 0),
      },
    };
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}

async function main() {
  const { mode, out } = parseArgs(process.argv.slice(2));
  if (mode === 'diagnostic') {
    const level = LEVELS.find(({ level: number }) => number === 51);
    const cells = evaluatePair([level], [1]);
    const cell = cells[0];
    console.log('TRAINING_ONLY Level 51 seed 1');
    console.log(`champion: ${cell.champion.movesToTarget} moves / ${cell.champion.score}`);
    console.log(`challenger: ${cell.challenger.movesToTarget} moves / ${cell.challenger.score}`);
    console.log(`changed moves: ${cell.changedMoveCount}`);
    return;
  }
  const levelNumbers = mode === 'screen' ? SCREEN_LEVELS : HOLDOUT_LEVELS;
  const seeds = mode === 'screen' ? SCREEN_SEEDS : HOLDOUT_SEEDS;
  const result = await runWorkers(levelNumbers, seeds);
  const artifact = makeArtifact(mode, levelNumbers, seeds, result.cells, result.timings);
  const output = path.isAbsolute(out) ? out : path.join(ROOT, out);
  writeArtifact(output, artifact);
  console.log(`wrote ${output}`);
  console.log(`${artifact.cells.length} paired cells; ${artifact.artifactIdentity}`);
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });

module.exports = {
  SCREEN_LEVELS, SCREEN_SEEDS, HOLDOUT_LEVELS, HOLDOUT_SEEDS,
  parseArgs, playToTerminal, evaluatePair, evaluatePairWithTimings,
  makeArtifact, validateArtifact, writeArtifact, runWorkers,
};
