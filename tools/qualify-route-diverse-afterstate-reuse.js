#!/usr/bin/env node
// Frozen-panel qualification only. It compares the unchanged per-candidate
// scorer to an exact afterstate-feature cache; it does not play an outcome
// game, open a seed, or alter the champion.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const {
  makeRng,
  createLevelState,
  executeChain,
  applyGravity,
  spawnNewTiles,
  tickBlockers,
} = require('../solver/engine');
const { analyzeMove, DEFAULT_PARAMS } = require('../solver/bot');
const {
  generateRouteDiverseSupplement,
  routeSignature,
  scoreSupplementCandidate,
  SUPPLEMENT_LIMIT,
} = require('../solver/route-diverse-challenger');
const {
  analyzeRouteDiverseMoveWithAfterstateReuse,
  scoreSupplementCandidates,
} = require('../solver/route-diverse-afterstate-reuse');
const { ROOT, fileHash, loadCorpus } = require('../solver/oracle/corpus');

const LOOKAHEAD_BASE = 987654321;
const TRAINING_FILE = 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json';
const DIVERSITY = Object.freeze({ searchWidth: 384, supplementLimit: SUPPLEMENT_LIMIT });
const DEFAULT_OUT = path.join(ROOT, 'docs/learning-cycles/LC-0025-route-diverse-afterstate-reuse.json');

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
  return chain ? chain.map(({ x, y }) => `${x},${y}`).join('|') : null;
}

function timed(fn) {
  const started = process.hrtime.bigint();
  const result = fn();
  return { result, ns: Number(process.hrtime.bigint() - started) };
}

function mapSnapshotsToState(state, chain) {
  return chain.map(({ x, y }) => state.grid[y][x]);
}

function supplementalCandidates(state, options) {
  const champion = analyzeMove(state, options);
  if (!champion.selectedChain || champion.reason === 'bomb-priority' || champion.reason === 'immediate-target-win') {
    return { champion, championChain: null, candidates: [] };
  }
  const existing = new Set(champion.candidates.map(({ chain }) => routeSignature(chain)));
  const candidates = generateRouteDiverseSupplement(state, options.diversity)
    .flatMap((candidate) => {
      const signature = routeSignature(candidate.chain);
      return existing.has(signature) ? [] : [{ ...candidate, signature }];
    });
  return {
    champion,
    championChain: mapSnapshotsToState(state, champion.selectedChain),
    candidates,
  };
}

function selectedFromScores(champion, championChain, candidates) {
  const championCandidate = champion.candidates.find(({ id }) => id === champion.selectedId);
  const winner = candidates.reduce((best, candidate) => (
    !best || candidate.policyScore > best.policyScore ? candidate : best
  ), null);
  return winner && championCandidate && winner.policyScore > championCandidate.policyScore
    ? winner.chain
    : championChain;
}

function compareState({ id, label, level, seed, state }) {
  const options = {
    diversity: DIVERSITY,
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  };
  const { champion, championChain, candidates } = supplementalCandidates(state, options);
  const params = { ...DEFAULT_PARAMS };
  const baseline = timed(() => candidates.map((candidate) => ({
    ...candidate,
    policyScore: scoreSupplementCandidate(state, candidate, options.lookaheadRngFactory, params),
  })));
  const cached = timed(() => scoreSupplementCandidates(
    state,
    candidates,
    options.lookaheadRngFactory,
    params,
  ));

  if (baseline.result.length !== cached.result.candidates.length) {
    throw new Error(`${id}: cached candidate count changed`);
  }
  for (let index = 0; index < baseline.result.length; index += 1) {
    const oldCandidate = baseline.result[index];
    const newCandidate = cached.result.candidates[index];
    if (oldCandidate.signature !== newCandidate.signature || oldCandidate.policyScore !== newCandidate.policyScore) {
      throw new Error(`${id}: cached score diverged at supplemental candidate ${index}`);
    }
  }

  const publicSelected = analyzeRouteDiverseMoveWithAfterstateReuse(state, options).selectedChain;
  let selectedChain = publicSelected;
  if (candidates.length) {
    const baselineSelected = selectedFromScores(champion, championChain, baseline.result);
    const cachedSelected = selectedFromScores(champion, championChain, cached.result.candidates);
    if (chainKey(baselineSelected) !== chainKey(cachedSelected)) {
      throw new Error(`${id}: cached ordering changed the selected route`);
    }
    if (chainKey(cachedSelected) !== chainKey(publicSelected)) {
      throw new Error(`${id}: public challenger diverged from cached qualification`);
    }
    selectedChain = cachedSelected;
  }

  const championCandidate = champion.candidates.find(({ id: candidateId }) => candidateId === champion.selectedId);
  const reversals = championCandidate
    ? baseline.result.filter(({ points, policyScore }) => (
      points < championCandidate.immediatePoints && policyScore > championCandidate.policyScore
    )).length
    : 0;
  return {
    id,
    label,
    level,
    seed,
    supplementalCandidates: candidates.length,
    uniqueAfterstates: cached.result.cacheEntries,
    reusedAfterstateEvaluations: cached.result.cacheHits,
    lowerImmediateHigherAfterstateReversals: reversals,
    baselineScoringNs: baseline.ns,
    cachedScoringNs: cached.ns,
    selectedChain: chainKey(selectedChain),
  };
}

function trainingState(corpus) {
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
  return { descriptor, recording, state };
}

function qualify() {
  const corpus = loadCorpus();
  const rows = corpus.puzzles.map(({ puzzleIdentity, recordings }) => {
    const descriptor = recordings[0];
    const recording = JSON.parse(fs.readFileSync(path.join(ROOT, descriptor.file), 'utf8'));
    return compareState({
      id: `corpus:${puzzleIdentity}`,
      label: 'frozen-corpus-initial-state',
      level: descriptor.levelNumber,
      seed: recording.seed,
      state: createLevelState(descriptor.candidate, makeRng(recording.seed)),
    });
  });
  const training = trainingState(corpus);
  rows.push(compareState({
    id: 'training:human-move-two',
    label: 'frozen-human-training-state',
    level: training.descriptor.levelNumber,
    seed: training.recording.seed,
    state: training.state,
  }));

  const total = (key) => rows.reduce((sum, row) => sum + row[key], 0);
  const body = {
    schemaVersion: 1,
    kind: 'route-diverse-afterstate-reuse-qualification',
    scope: 'all existing route-diverse supplemental candidates at width 384 across 20 frozen corpus initial states plus the frozen Level 54 human move-two state; baseline versus exact afterstate-feature cache only; no fresh seed, outcome game, or policy promotion',
    corpus: { path: 'docs/oracle/corpus.json', identity: corpus.manifestIdentity, puzzles: corpus.puzzles.length },
    diversity: DIVERSITY,
    sources: {
      tool: fileHash(__filename),
      frozenRouteGenerator: fileHash(path.join(ROOT, 'solver/route-diverse-challenger.js')),
      reuseCandidate: fileHash(path.join(ROOT, 'solver/route-diverse-afterstate-reuse.js')),
      champion: fileHash(path.join(ROOT, 'solver/bot.js')),
      engine: fileHash(path.join(ROOT, 'solver/engine.js')),
      trainingRecording: fileHash(path.join(ROOT, TRAINING_FILE)),
    },
    states: rows.length,
    supplementalCandidates: total('supplementalCandidates'),
    uniqueAfterstates: total('uniqueAfterstates'),
    reusedAfterstateEvaluations: total('reusedAfterstateEvaluations'),
    lowerImmediateHigherAfterstateReversals: total('lowerImmediateHigherAfterstateReversals'),
    baselineScoringNs: total('baselineScoringNs'),
    cachedScoringNs: total('cachedScoringNs'),
    outcome: 'EXACT_ORDERING_PRESERVED',
    rows,
  };
  if (body.supplementalCandidates !== body.uniqueAfterstates + body.reusedAfterstateEvaluations) {
    throw new Error('afterstate reuse accounting does not reconcile');
  }
  if (body.lowerImmediateHigherAfterstateReversals !== 186) {
    throw new Error(`expected all 186 known reversals, found ${body.lowerImmediateHigherAfterstateReversals}`);
  }
  return { ...body, artifactIdentity: identity(body) };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? DEFAULT_OUT : path.resolve(process.argv[outIndex + 1]);
  if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a path');
  if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
  const artifact = qualify();
  fs.writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({
    outcome: artifact.outcome,
    states: artifact.states,
    supplementalCandidates: artifact.supplementalCandidates,
    uniqueAfterstates: artifact.uniqueAfterstates,
    reusedAfterstateEvaluations: artifact.reusedAfterstateEvaluations,
    reversals: artifact.lowerImmediateHigherAfterstateReversals,
    cachedToBaselineScoringRatio: artifact.cachedScoringNs / artifact.baselineScoringNs,
  }, null, 2));
}

if (require.main === module) main();

module.exports = { compareState, qualify, supplementalCandidates };
