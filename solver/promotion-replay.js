#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');

const { LEVELS } = require('../src/game');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');

const ROOT = path.join(__dirname, '..');
const LOOKAHEAD_BASE = 987654321;
const GOLDEN52_SHA256 = 'b6fe43d6a7818868c10b40cc95399259c689bf958679f5c8fb4aa4e37e3217c8';
const GOLDEN52_IDENTITY = '83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0';
const GOLDEN52_SOURCES = Object.freeze({
  champion: '9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840',
  challenger: 'ba75b5a66883a63562eb7a819e339dd6b398279a7fe0178512e231c11a77dd90',
  engine: '4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6',
  levels: '9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115',
  evaluator: '53aa4b2ef23d3245010cacd6e5f121eb99c697f9802549d360a501c4ac3dddb1',
});
const BASE_SOURCES = Object.freeze({
  bot: GOLDEN52_SOURCES.champion,
  engine: GOLDEN52_SOURCES.engine,
  levels: '541baa1c05cb0dc4b74391f5bb621900e75620ddd97ebb93d148e854c252d3ee',
});
const GOLDEN52_LEVELS = Object.freeze(Array.from({ length: 52 }, (_, index) => index + 1));
const GOLDEN52_SEEDS = Object.freeze(Array.from({ length: 300 }, (_, index) => 13000000 + index));
const LEVEL53_SEEDS = Object.freeze(Array.from({ length: 300 }, (_, index) => 14000000 + index));

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fileIdentity(file) {
  return sha256(fs.readFileSync(file));
}

function artifactIdentity(artifact) {
  const { artifactIdentity: ignored, ...body } = artifact;
  return sha256(canonicalJson(body));
}

function currentSources() {
  return {
    bot: fileIdentity(path.join(__dirname, 'bot.js')),
    engine: fileIdentity(path.join(__dirname, 'engine.js')),
    levels: fileIdentity(path.join(ROOT, 'src/game.js')),
  };
}

function playToTerminal(levelData, seed, chooser = chooseMove) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  let reason = 'out_of_moves';
  for (let moveIndex = 0; moveIndex < levelData.moves; moveIndex++) {
    const chain = chooser(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + moveIndex) });
    if (!chain) {
      reason = 'no_valid_moves';
      break;
    }
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) {
      reason = 'bomb';
      break;
    }
    if (state.score >= state.targetScore) {
      reason = 'target';
      break;
    }
    if (state.moves >= state.maxMoves) {
      reason = 'out_of_moves';
      break;
    }
  }
  return {
    win: reason === 'target',
    movesToTarget: reason === 'target' ? state.moves : null,
    moves: state.moves,
    score: state.score,
    reason,
  };
}

function makeLevel53Baseline(cells, sources = currentSources()) {
  const artifact = {
    schemaVersion: 1,
    experiment: 'target-aware-promotion-rehearsal',
    mode: 'level53-baseline',
    levelNumbers: [53],
    seeds: [...LEVEL53_SEEDS],
    order: 'level-major',
    sources: { ...sources },
    cells,
  };
  return { ...artifact, artifactIdentity: artifactIdentity(artifact) };
}

function assertExactObject(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} differs`);
}

function validateOrderedCells(cells, levelNumbers, seeds) {
  const expectedCount = levelNumbers.length * seeds.length;
  if (!Array.isArray(cells) || cells.length !== expectedCount) {
    throw new Error(`cell count ${cells && cells.length} does not match ${expectedCount}`);
  }
  const keys = new Set();
  let index = 0;
  for (const level of levelNumbers) {
    for (const seed of seeds) {
      const cell = cells[index++];
      if (!cell || cell.level !== level || cell.seed !== seed) {
        throw new Error(`cells are not complete level-major order at index ${index - 1}`);
      }
      const key = `${cell.level}:${cell.seed}`;
      if (keys.has(key)) throw new Error(`duplicate cell ${key}`);
      keys.add(key);
    }
  }
}

function validateLevel53Baseline(artifact, expectedSources = BASE_SOURCES) {
  if (artifact.schemaVersion !== 1 || artifact.experiment !== 'target-aware-promotion-rehearsal') {
    throw new Error('baseline schema or experiment differs');
  }
  if (artifact.mode !== 'level53-baseline' || artifact.order !== 'level-major') {
    throw new Error('baseline mode or order differs');
  }
  assertExactObject(artifact.levelNumbers, [53], 'level list');
  assertExactObject(artifact.seeds, LEVEL53_SEEDS, 'seed list');
  assertExactObject(artifact.sources, expectedSources, 'source manifest');
  validateOrderedCells(artifact.cells, [53], LEVEL53_SEEDS);
  if (artifactIdentity(artifact) !== artifact.artifactIdentity) throw new Error('artifact identity mismatch');
  return { cells: artifact.cells.length, identity: artifact.artifactIdentity };
}

function validateGolden52(artifact) {
  if (artifact.schemaVersion !== 1 || artifact.mode !== 'holdout' || artifact.order !== 'level-major') {
    throw new Error('golden 1-52 schema, mode, or order differs');
  }
  if (artifact.experiment !== 'target-aware-immediate-win-challenger') throw new Error('golden experiment differs');
  assertExactObject(artifact.levelNumbers, GOLDEN52_LEVELS, 'golden level list');
  assertExactObject(artifact.seeds, GOLDEN52_SEEDS, 'golden seed list');
  assertExactObject(artifact.sources, GOLDEN52_SOURCES, 'golden source manifest');
  validateOrderedCells(artifact.cells, GOLDEN52_LEVELS, GOLDEN52_SEEDS);
  if (artifactIdentity(artifact) !== artifact.artifactIdentity) throw new Error('golden artifact identity mismatch');
  if (artifact.artifactIdentity !== GOLDEN52_IDENTITY) throw new Error('golden sealed identity differs');
  return { cells: artifact.cells.length, identity: artifact.artifactIdentity };
}

function writeArtifact(file, artifact) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`);
}

function sameTerminal(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function validateLevel53Comparison(baseline, promoted) {
  if (sameTerminal(baseline, promoted)) return 'exact';
  if (baseline.win && !promoted.win) throw new Error('Level 53 win regression');
  if (!baseline.win && promoted.win) return 'new_win';
  if (baseline.win && promoted.win) {
    if (promoted.movesToTarget < baseline.movesToTarget) return 'earlier_win';
    if (promoted.movesToTarget > baseline.movesToTarget) throw new Error('Level 53 slower win');
    throw new Error('Level 53 changed same-speed winning outcome');
  }
  throw new Error('Level 53 changed losing outcome');
}

function parseArgs(argv) {
  let mode = null;
  let out = null;
  let golden52 = null;
  let baseline53 = null;
  let file = null;
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--capture-level53' || arg === '--verify') {
      if (mode) throw new Error('choose exactly one mode');
      mode = arg.slice(2);
    } else if (arg === '--validate') {
      if (mode) throw new Error('choose exactly one mode');
      mode = 'validate';
      file = argv[++index];
      if (!file) throw new Error('--validate needs a file');
    } else if (arg === '--out' || arg === '--golden52' || arg === '--baseline53') {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} needs a path`);
      if (arg === '--out') out = value;
      if (arg === '--golden52') golden52 = value;
      if (arg === '--baseline53') baseline53 = value;
    } else {
      throw new Error(`unknown argument ${arg}`);
    }
  }
  if (!mode) throw new Error('choose --capture-level53, --validate, or --verify');
  if (mode === 'capture-level53' && (!out || golden52 || baseline53 || file)) {
    throw new Error('--capture-level53 requires only --out');
  }
  if (mode === 'validate' && (out || golden52 || baseline53)) {
    throw new Error('--validate accepts only one file');
  }
  if (mode === 'verify' && (!out || !golden52 || !baseline53 || file)) {
    throw new Error('--verify requires --golden52, --baseline53, and --out');
  }
  return { mode, out, golden52, baseline53, file };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveFile(file) {
  return path.isAbsolute(file) ? file : path.join(ROOT, file);
}

function evaluateCells(levelNumbers, seeds) {
  const levelByNumber = new Map(LEVELS.map((level) => [level.level, level]));
  const cells = [];
  for (const levelNumber of levelNumbers) {
    const level = levelByNumber.get(levelNumber);
    if (!level) throw new Error(`missing Level ${levelNumber}`);
    for (const seed of seeds) {
      cells.push({ level: levelNumber, seed, terminal: playToTerminal(level, seed) });
    }
  }
  return cells;
}

async function evaluateCellsParallel(levelNumbers, seeds) {
  const workerCount = Math.max(1, Math.min(os.cpus().length - 1, 9, levelNumbers.length));
  const chunkSize = Math.ceil(levelNumbers.length / workerCount);
  const chunks = [];
  for (let index = 0; index < levelNumbers.length; index += chunkSize) {
    chunks.push(levelNumbers.slice(index, index + chunkSize));
  }
  const workers = chunks.map((levels) => new Worker(__filename, {
    workerData: { promotionReplayWorker: true, levelNumbers: levels, seeds },
  }));
  try {
    const parts = await Promise.all(workers.map((worker) => new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
    })));
    return parts.flat();
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}

async function captureLevel53(out) {
  const sources = currentSources();
  assertExactObject(sources, BASE_SOURCES, 'baseline source manifest');
  const cells = await evaluateCellsParallel([53], LEVEL53_SEEDS);
  const artifact = makeLevel53Baseline(cells, sources);
  validateLevel53Baseline(artifact, BASE_SOURCES);
  writeArtifact(resolveFile(out), artifact);
  return artifact;
}

function compareGolden52(golden, promotedCells) {
  validateOrderedCells(promotedCells, GOLDEN52_LEVELS, GOLDEN52_SEEDS);
  for (let index = 0; index < golden.cells.length; index++) {
    const expected = golden.cells[index].challenger;
    const actual = promotedCells[index].terminal;
    if (!sameTerminal(actual, expected)) {
      const { level, seed } = promotedCells[index];
      throw new Error(`golden translation mismatch at Level ${level} seed ${seed}`);
    }
  }
  return promotedCells.length;
}

async function verifyPromotion(goldenFile, baselineFile, out) {
  const goldenPath = resolveFile(goldenFile);
  const baselinePath = resolveFile(baselineFile);
  if (fileIdentity(goldenPath) !== GOLDEN52_SHA256) throw new Error('golden 1-52 file hash differs');
  const golden = readJson(goldenPath);
  const baseline = readJson(baselinePath);
  validateGolden52(golden);
  validateLevel53Baseline(baseline, BASE_SOURCES);

  const sourceBeforeGolden = currentSources();
  if (sourceBeforeGolden.engine !== BASE_SOURCES.engine || sourceBeforeGolden.levels !== BASE_SOURCES.levels) {
    throw new Error('protected source identity differs');
  }
  const promoted52 = await evaluateCellsParallel(GOLDEN52_LEVELS, GOLDEN52_SEEDS);
  const exactMatches = compareGolden52(golden, promoted52);
  const frozenSources = currentSources();
  assertExactObject(frozenSources, sourceBeforeGolden, 'candidate source identity during golden replay');

  // This is the sealed reveal. No Level 53 promoted execution occurs before
  // every golden 1-52 terminal tuple matches and the candidate hash is frozen.
  const promoted53 = await evaluateCellsParallel([53], LEVEL53_SEEDS);
  assertExactObject(currentSources(), frozenSources, 'candidate source identity during Level 53 replay');

  const counts = { exact: 0, earlierWins: 0, newWins: 0 };
  const level53 = promoted53.map((cell, index) => {
    const baselineCell = baseline.cells[index];
    const classification = validateLevel53Comparison(baselineCell.terminal, cell.terminal);
    if (classification === 'exact') counts.exact += 1;
    if (classification === 'earlier_win') counts.earlierWins += 1;
    if (classification === 'new_win') counts.newWins += 1;
    return {
      level: 53,
      seed: cell.seed,
      baseline: baselineCell.terminal,
      promoted: cell.terminal,
      classification,
    };
  });

  const result = {
    schemaVersion: 1,
    experiment: 'target-aware-promotion-rehearsal',
    mode: 'promotion-verification',
    order: 'level-major',
    sources: frozenSources,
    golden52: { fileSha256: GOLDEN52_SHA256, identity: golden.artifactIdentity, exactMatches },
    baseline53: { identity: baseline.artifactIdentity },
    level53: { cells: level53, counts },
  };
  const artifact = { ...result, artifactIdentity: artifactIdentity(result) };
  writeArtifact(resolveFile(out), artifact);
  return artifact;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === 'capture-level53') {
    const artifact = await captureLevel53(args.out);
    console.log(`wrote ${resolveFile(args.out)}`);
    console.log(`${artifact.cells.length} Level 53 baseline cells; ${artifact.artifactIdentity}`);
    return;
  }
  if (args.mode === 'validate') {
    const artifact = readJson(resolveFile(args.file));
    const result = validateLevel53Baseline(artifact, BASE_SOURCES);
    console.log(`VALID Level 53 baseline ${result.cells} cells; ${result.identity}`);
    return;
  }
  const artifact = await verifyPromotion(args.golden52, args.baseline53, args.out);
  console.log(`wrote ${resolveFile(args.out)}`);
  console.log(`${artifact.golden52.exactMatches} golden matches; Level 53 ${JSON.stringify(artifact.level53.counts)}`);
  console.log(`candidate ${artifact.sources.bot}; result ${artifact.artifactIdentity}`);
}

if (!isMainThread && workerData && workerData.promotionReplayWorker) {
  parentPort.postMessage(evaluateCells(workerData.levelNumbers, workerData.seeds));
} else if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  LEVEL53_SEEDS,
  artifactIdentity,
  makeLevel53Baseline,
  validateLevel53Baseline,
  validateGolden52,
  validateLevel53Comparison,
  writeArtifact,
  parseArgs,
  playToTerminal,
  captureLevel53,
  verifyPromotion,
};
