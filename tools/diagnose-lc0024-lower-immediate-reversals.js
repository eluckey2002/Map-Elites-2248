#!/usr/bin/env node
// Frozen-pool diagnostic only. It compares candidates the existing challenger
// already generated and scored; it never opens a new game or changes policy.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../solver/engine');
const { analyzeRouteDiverseMove, SUPPLEMENT_LIMIT } = require('../solver/route-diverse-challenger');
const { ROOT, fileHash, loadCorpus } = require('../solver/oracle/corpus');
const { attributedAnalysis } = require('./attribute-route-diverse-cost');

const LOOKAHEAD_BASE = 987654321;
const TRAINING_FILE = 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json';
const DIVERSITY = Object.freeze({ searchWidth: 384, supplementLimit: SUPPLEMENT_LIMIT });
const DEFAULT_OUT = path.join(ROOT, 'docs/learning-cycles/LC-0024-lower-immediate-reversals.json');

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

function chainKey(chain) {
  return chain.map(({ x, y }) => `${x},${y}`).join('|');
}

function selectedChain(mirrored) {
  const selected = mirrored.champion.candidates.find(({ id }) => id === mirrored.champion.selectedId);
  return mirrored.winner && selected && mirrored.winner.policyScore > selected.policyScore
    ? mirrored.winner.chain
    : mirrored.championChain;
}

function candidateWitness(candidate) {
  return {
    immediatePoints: candidate.points,
    policyScore: candidate.policyScore,
    chain: candidate.chain.map(({ x, y, value }) => ({ x, y, value })),
  };
}

function findReversals(champion, supplement) {
  return supplement
    .filter((candidate) => (
      candidate.points < champion.immediatePoints && candidate.policyScore > champion.policyScore
    ))
    .map(candidateWitness);
}

function validateRow(row) {
  if (row.comparedCandidates !== row.supplementCandidates) {
    throw new Error(`${row.id}: candidate comparison count mismatch`);
  }
  for (const reversal of row.reversals) {
    if (!(reversal.immediatePoints < row.champion.immediatePoints)) {
      throw new Error(`${row.id}: reversal does not have lower immediate points`);
    }
    if (!(reversal.policyScore > row.champion.policyScore)) {
      throw new Error(`${row.id}: reversal does not beat champion policy score`);
    }
  }
  return true;
}

function compareState({ id, label, state, level, seed }) {
  const options = {
    diversity: DIVERSITY,
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  };
  const mirrored = attributedAnalysis(state, options);
  const publicAnalysis = analyzeRouteDiverseMove(state, options);
  if (chainKey(selectedChain(mirrored)) !== chainKey(publicAnalysis.selectedChain)) {
    throw new Error(`${id}: external comparison diverged from public challenger`);
  }
  const selected = mirrored.champion.candidates.find(({ id: candidateId }) => candidateId === mirrored.champion.selectedId);
  const champion = selected
    ? { immediatePoints: selected.immediatePoints, policyScore: selected.policyScore }
    : { immediatePoints: null, policyScore: null };
  const row = {
    id,
    label,
    level,
    seed,
    champion,
    supplementCandidates: mirrored.supplement.length,
    comparedCandidates: mirrored.supplement.length,
    reversals: selected ? findReversals(champion, mirrored.supplement) : [],
  };
  validateRow(row);
  return row;
}

function corpusRows(corpus) {
  return corpus.puzzles.map(({ puzzleIdentity, recordings }) => {
    const descriptor = recordings[0];
    const recording = JSON.parse(fs.readFileSync(path.join(ROOT, descriptor.file), 'utf8'));
    return compareState({
      id: `corpus:${puzzleIdentity}`,
      label: 'frozen-corpus-initial-state',
      state: createLevelState(descriptor.candidate, makeRng(recording.seed)),
      level: descriptor.levelNumber,
      seed: recording.seed,
    });
  });
}

function trainingRow(corpus) {
  const descriptor = corpus.puzzles.flatMap(({ recordings }) => recordings)
    .find(({ file }) => file === TRAINING_FILE);
  if (!descriptor) throw new Error('missing frozen training recording');
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, TRAINING_FILE), 'utf8'));
  const rng = makeRng(recording.seed);
  const state = createLevelState(descriptor.candidate, rng);
  const first = recording.chains[0].tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    if (!tile || tile.value !== value) throw new Error(`training tile mismatch at ${x},${y}`);
    return tile;
  });
  executeChain(state, first);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  return compareState({
    id: 'training:human-move-two',
    label: 'frozen-human-training-state',
    state,
    level: descriptor.levelNumber,
    seed: recording.seed,
  });
}

function diagnose() {
  const corpus = loadCorpus();
  const rows = [...corpusRows(corpus), trainingRow(corpus)];
  const comparedCandidates = rows.reduce((total, row) => total + row.comparedCandidates, 0);
  const reversals = rows.flatMap((row) => row.reversals.map((reversal) => ({ state: row.id, ...reversal })));
  const body = {
    schemaVersion: 1,
    kind: 'lower-immediate-policy-score-reversal-diagnostic',
    scope: '20 frozen corpus initial states plus the frozen Level 54 human move-two state; every existing route-diverse supplemental candidate at width 384; no fresh seed or outcome experiment',
    corpus: { path: 'docs/oracle/corpus.json', identity: corpus.manifestIdentity, puzzles: corpus.puzzles.length },
    diversity: DIVERSITY,
    sources: {
      tool: fileHash(__filename),
      attributionTool: fileHash(path.join(ROOT, 'tools/attribute-route-diverse-cost.js')),
      challenger: fileHash(path.join(ROOT, 'solver/route-diverse-challenger.js')),
      champion: fileHash(path.join(ROOT, 'solver/bot.js')),
      engine: fileHash(path.join(ROOT, 'solver/engine.js')),
      trainingRecording: fileHash(path.join(ROOT, TRAINING_FILE)),
    },
    states: rows.length,
    comparedCandidates,
    reversalCount: reversals.length,
    outcome: reversals.length ? 'REVERSALS_FOUND' : 'NO_REVERSAL_IN_FROZEN_POOL',
    reversals,
    rows,
  };
  return { ...body, artifactIdentity: identity(body) };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? DEFAULT_OUT : path.resolve(process.argv[outIndex + 1]);
  if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a path');
  if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
  const artifact = diagnose();
  fs.writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ outcome: artifact.outcome, states: artifact.states, comparedCandidates: artifact.comparedCandidates, reversalCount: artifact.reversalCount }, null, 2));
}

if (require.main === module) main();

module.exports = { compareState, diagnose, findReversals, validateRow };
