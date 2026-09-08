#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { LEVELS } = require('../../src/game');
const {
  applyGravity,
  canExtendChain,
  chainMultiplier,
  chainValue,
  checkBombs,
  createLevelState,
  executeChain,
  findGreedyChains,
  isValidChain,
  isBlockedTile,
  makeRng,
  spawnNewTiles,
  tickBlockers,
} = require('../../solver/engine');
const {
  registrationStamp,
  requireProtocolOrExit,
} = require('../../solver/experiment-guard');
const { sha16 } = require('../../tools/verify-experiments');

const ROOT = path.join(__dirname, '..', '..');
const RESULT = 'RESULT-0030';
const GREED_CENTERS = Object.freeze([0.35, 0.6, 0.85]);
const TIMING_SLOPES = Object.freeze([-0.25, 0, 0.25]);
const SOURCE_PATHS = Object.freeze([
  'experiments/RESULT-0030/run.js',
  'experiments/RESULT-0030/verify.js',
  'solver/engine.js',
  'solver/experiment-guard.js',
  'src/game.js',
  'tools/verify-experiments.js',
]);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function objectIdentity(value) {
  return crypto.createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function subjectIdentity(subject) {
  return objectIdentity({
    greedCenter: subject.greedCenter,
    timingSlope: subject.timingSlope,
  }).slice(0, 12);
}

const SUBJECTS = Object.freeze(GREED_CENTERS.flatMap((greedCenter) => (
  TIMING_SLOPES.map((timingSlope) => Object.freeze({
    id: subjectIdentity({ greedCenter, timingSlope }),
    greedCenter,
    timingSlope,
  }))
)));

function clamp(value, min = 0.05, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function scheduledGreedTarget(subject, moveNumber, moveBudget) {
  if (!Number.isInteger(moveNumber) || moveNumber < 1) throw new Error('moveNumber must be a positive integer');
  if (!Number.isInteger(moveBudget) || moveBudget < 1 || moveNumber > moveBudget) {
    throw new Error('moveBudget must cover moveNumber');
  }
  const progress = moveBudget === 1 ? 0.5 : (moveNumber - 1) / (moveBudget - 1);
  return clamp(subject.greedCenter + subject.timingSlope * ((2 * progress) - 1));
}

function chainKey(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function canReachMinimum(state, chain) {
  if (chain.length >= state.minChain) return true;
  const last = chain.at(-1);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const x = last.x + dx;
      const y = last.y + dy;
      if (x < 0 || x >= state.gridWidth || y < 0 || y >= state.gridHeight) continue;
      const neighbor = state.grid[y][x];
      if (!neighbor || isBlockedTile(neighbor) || chain.includes(neighbor)) continue;
      if (!canExtendChain(chain, neighbor)) continue;
      if (canReachMinimum(state, [...chain, neighbor])) return true;
    }
  }
  return false;
}

function hasAnyValidMove(state) {
  for (const row of state.grid) {
    for (const tile of row) {
      if (tile && !isBlockedTile(tile) && canReachMinimum(state, [tile])) return true;
    }
  }
  return false;
}

function resolveEmptyCandidatePool(state) {
  if (hasAnyValidMove(state)) {
    throw new Error('bounded candidate pool exhausted before an actual game terminal');
  }
  return 'no valid moves';
}

function candidatePool(state) {
  const paths = findGreedyChains(state, {
    limit: Infinity,
    preferMergeableSum: false,
    tieBreak: 'degree',
    pathWidth: 8,
  });
  const seen = new Set();
  const candidates = [];

  for (const { chain } of paths) {
    for (let length = state.minChain; length <= chain.length; length++) {
      const prefix = chain.slice(0, length);
      const key = chainKey(prefix);
      if (seen.has(key)) continue;
      seen.add(key);
      const points = Math.floor(chainValue(prefix) * chainMultiplier(prefix.length));
      candidates.push({ chain: prefix, key, points });
    }
  }

  candidates.sort((a, b) => b.points - a.points || a.key.localeCompare(b.key));
  return candidates;
}

function chooseSyntheticMove(state, subject, moveNumber, moveBudget) {
  const candidates = candidatePool(state);
  if (candidates.length === 0) return null;
  const beamMaxPoints = candidates[0].points;
  const targetGreed = scheduledGreedTarget(subject, moveNumber, moveBudget);
  let selected = candidates[0];
  let selectedDistance = Math.abs((selected.points / beamMaxPoints) - targetGreed);
  for (const candidate of candidates.slice(1)) {
    const distance = Math.abs((candidate.points / beamMaxPoints) - targetGreed);
    if (distance < selectedDistance) {
      selected = candidate;
      selectedDistance = distance;
    }
  }
  if (!isValidChain(selected.chain, state.minChain)) throw new Error('candidate pool produced an illegal chain');
  return {
    chain: selected.chain,
    points: selected.points,
    beamMaxPoints,
    beamGreedRatio: selected.points / beamMaxPoints,
    targetGreed,
  };
}

function summarizeEpisode(moveTrace, moveBudget) {
  const finalScore = moveTrace.reduce((sum, move) => sum + move.points, 0);
  let cumulative = 0;
  let halfMove = 0;
  for (let index = 0; index < moveTrace.length; index++) {
    cumulative += moveTrace[index].points;
    if (halfMove === 0 && cumulative >= finalScore / 2) halfMove = index + 1;
  }
  return {
    finalScore,
    halfScoreMove: halfMove && moveBudget ? halfMove / moveBudget : 0,
    meanBeamGreedRatio: moveTrace.length
      ? moveTrace.reduce((sum, move) => sum + move.beamGreedRatio, 0) / moveTrace.length
      : 0,
  };
}

function playSynthetic(levelData, seed, subject) {
  const rng = makeRng(seed);
  const state = createLevelState(levelData, rng);
  const moveTrace = [];
  let outcome = 'lose';
  let reason = 'out of moves';

  while (state.moves < state.maxMoves) {
    const selection = chooseSyntheticMove(state, subject, state.moves + 1, state.maxMoves);
    if (!selection) {
      reason = resolveEmptyCandidatePool(state);
      break;
    }
    const scoreBefore = state.score;
    executeChain(state, selection.chain);
    const points = state.score - scoreBefore;
    if (points !== selection.points) throw new Error('selected points disagree with engine scoring');
    moveTrace.push({
      points,
      beamMaxPoints: selection.beamMaxPoints,
      beamGreedRatio: selection.beamGreedRatio,
      targetGreed: selection.targetGreed,
    });
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) {
      reason = 'bomb exploded';
      break;
    }
    if (state.score >= state.targetScore) {
      outcome = 'win';
      reason = 'target reached';
      break;
    }
  }

  return {
    outcome,
    reason,
    score: state.score,
    moves: state.moves,
    moveBudget: state.maxMoves,
    moveTrace,
    ...summarizeEpisode(moveTrace, state.maxMoves),
  };
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [
    relative,
    sha16(path.join(ROOT, relative)),
  ]));
}

function withArtifactIdentity(body, registration) {
  return { ...body, artifactIdentity: objectIdentity(body), registration };
}

function writeNew(file, value) {
  if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function parseList(value, name) {
  if (!value) throw new Error(`--${name} is required`);
  const values = value.split(',').map((part) => Number(part));
  if (!values.length || values.some((item) => !Number.isSafeInteger(item) || item < 0)) {
    throw new Error(`--${name} must be comma-separated non-negative integers`);
  }
  if (new Set(values).size !== values.length) throw new Error(`--${name} contains duplicates`);
  return values;
}

function flag(argv, name) {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? null : argv[index + 1];
}

function runCells(levelNumbers, seeds, subjects = SUBJECTS) {
  const byLevel = new Map(LEVELS.map((level) => [level.level, level]));
  const levels = levelNumbers.map((levelNumber) => {
    const level = byLevel.get(levelNumber);
    if (!level) throw new Error(`unknown shipped level ${levelNumber}`);
    return level;
  });
  const cells = [];
  for (const subject of subjects) {
    for (const level of levels) {
      for (const seed of seeds) {
        cells.push({
          subjectId: subject.id,
          level: level.level,
          seed,
          ...playSynthetic(level, seed, subject),
        });
      }
    }
  }
  return cells;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: 'RESULT-0030 synthetic descriptor validation' });
  const kind = argv[0];
  if (!['controls', 'confirmation'].includes(kind)) {
    throw new Error('usage: run.js controls|confirmation --protocol RESULT-0030 --levels <csv> --seeds <csv> --out <path>');
  }
  const levels = parseList(flag(argv, 'levels'), 'levels');
  const seeds = parseList(flag(argv, 'seeds'), 'seeds');
  const output = flag(argv, 'out');
  if (!output) throw new Error('--out is required');
  const body = {
    schemaVersion: 1,
    result: RESULT,
    kind,
    sources: sourceHashes(),
    subjects: SUBJECTS,
    levels,
    seeds,
    cells: runCells(levels, seeds),
  };
  const artifact = withArtifactIdentity(body, registrationStamp(registration));
  writeNew(path.resolve(output), artifact);
  console.log(`WROTE ${kind} ${artifact.artifactIdentity}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  GREED_CENTERS,
  RESULT,
  SOURCE_PATHS,
  SUBJECTS,
  TIMING_SLOPES,
  candidatePool,
  canonicalJson,
  chooseSyntheticMove,
  objectIdentity,
  playSynthetic,
  resolveEmptyCandidatePool,
  runCells,
  scheduledGreedTarget,
  sourceHashes,
  subjectIdentity,
  summarizeEpisode,
  withArtifactIdentity,
  writeNew,
};
