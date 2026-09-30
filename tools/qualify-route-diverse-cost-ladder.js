#!/usr/bin/env node
// Qualification-only fixed ladder. Every candidate uses known training and
// captured-corpus inputs; it opens no outcome seed and does not modify policy.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { LEVELS } = require('../src/game');
const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../solver/engine');
const { analyzeMove } = require('../solver/bot');
const { analyzeRouteDiverseMove, generateRouteDiverseSupplement, routeSignature, SUPPLEMENT_LIMIT } = require('../solver/route-diverse-challenger');
const { ROOT, fileHash, loadCorpus } = require('../solver/oracle/corpus');
const { qualify } = require('./qualify-route-diverse-boundedness');

const WIDTHS = Object.freeze([384, 256, 128, 64]);
const LOOKAHEAD_BASE = 987654321;
const TRAINING_PATH = path.join(ROOT, 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json');
const DEFAULT_OUT = path.join(ROOT, 'docs/learning-cycles/LC-0022-route-diverse-cost-ladder.json');

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

function recordedChain(state, recorded) {
  return recorded.tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    if (!tile || tile.value !== value) throw new Error(`training recording mismatch at ${x},${y}`);
    return tile;
  });
}

function trainingState() {
  const recording = JSON.parse(fs.readFileSync(TRAINING_PATH, 'utf8'));
  const level = LEVELS.find(({ level: number }) => number === recording.candidateLevel);
  const rng = makeRng(recording.seed);
  const state = createLevelState(level, rng);
  executeChain(state, recordedChain(state, recording.chains[0]));
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return { recording, state };
}

function routeRecovery(diversity) {
  const { recording, state } = trainingState();
  const expected = routeSignature(recordedChain(state, recording.chains[1]));
  const supplement = generateRouteDiverseSupplement(state, diversity);
  return {
    recovered: supplement.some(({ chain }) => routeSignature(chain) === expected),
    candidates: supplement.length,
    capRespected: supplement.length <= SUPPLEMENT_LIMIT,
  };
}

function fallbackIdentity(diversity) {
  const state = {
    gridWidth: 2,
    gridHeight: 2,
    minChain: 3,
    tileScale: 1,
    score: 0,
    targetScore: 100,
    moves: 0,
    maxMoves: 5,
    grid: [
      [{ x: 0, y: 0, value: 2 }, { x: 1, y: 0, value: 2 }],
      [{ x: 0, y: 1, value: 2 }, { x: 1, y: 1, value: 4 }],
    ],
  };
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE);
  const champion = analyzeMove(state, { lookaheadRngFactory });
  const challenger = analyzeRouteDiverseMove(state, { lookaheadRngFactory, diversity });
  const key = (chain) => chain.map(({ x, y }) => `${x},${y}`).join('|');
  return {
    preserved: challenger.supplementWon === false && key(challenger.selectedChain) === key(champion.selectedChain),
  };
}

function runLadder() {
  const corpus = loadCorpus();
  const results = WIDTHS.map((searchWidth) => {
    const diversity = { searchWidth, supplementLimit: SUPPLEMENT_LIMIT };
    const boundedness = qualify(diversity, corpus);
    const recovery = routeRecovery(diversity);
    const fallback = fallbackIdentity(diversity);
    const eligible = recovery.recovered
      && recovery.capRespected
      && fallback.preserved
      && boundedness.qualification.maxSupplementCandidates <= SUPPLEMENT_LIMIT
      && boundedness.qualification.wallClockRatio <= 2;
    return {
      diversity,
      recovery,
      fallback,
      qualification: boundedness.qualification,
      eligible,
    };
  });
  const selected = results.find(({ eligible }) => eligible) || null;
  const body = {
    schemaVersion: 1,
    kind: 'route-diverse-cost-ladder-qualification',
    scope: 'predeclared widths 384, 256, 128, and 64 on frozen training and captured-corpus inputs only; not an outcome experiment',
    selectionRule: 'select the largest listed width satisfying route recovery, cap, fallback identity, and a qualification wall-clock ratio at or below 2.0',
    sources: {
      tool: fileHash(__filename),
      boundednessTool: fileHash(path.join(ROOT, 'tools/qualify-route-diverse-boundedness.js')),
      challenger: fileHash(path.join(ROOT, 'solver/route-diverse-challenger.js')),
      champion: fileHash(path.join(ROOT, 'solver/bot.js')),
      trainingRecording: fileHash(TRAINING_PATH),
    },
    results,
    selected: selected ? selected.diversity : null,
    outcome: selected ? 'CONFIGURATION_QUALIFIED' : 'NO_CONFIGURATION_QUALIFIED',
  };
  return { ...body, artifactIdentity: identity(body) };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? DEFAULT_OUT : path.resolve(process.argv[outIndex + 1]);
  if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a path');
  if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
  const artifact = runLadder();
  fs.writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ outcome: artifact.outcome, selected: artifact.selected, results: artifact.results }, null, 2));
}

if (require.main === module) main();

module.exports = { WIDTHS, fallbackIdentity, routeRecovery, runLadder };
