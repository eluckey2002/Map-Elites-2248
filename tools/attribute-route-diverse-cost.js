#!/usr/bin/env node
// A frozen-corpus diagnostic. It attributes work in the real challenger path;
// it does not play, rank, or evaluate an outcome game.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const { makeRng, createLevelState } = require('../solver/engine');
const {
  analyzeRouteDiverseMove,
  generateRouteDiverseSupplement,
  routeSignature,
  scoreSupplementCandidate,
  SUPPLEMENT_LIMIT,
} = require('../solver/route-diverse-challenger');
const { analyzeMove, DEFAULT_PARAMS } = require('../solver/bot');
const { ROOT, fileHash, loadCorpus } = require('../solver/oracle/corpus');

const LOOKAHEAD_BASE = 987654321;
const TRAINING_RECORDING = 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json';
const DIVERSITY = Object.freeze({ searchWidth: 384, supplementLimit: SUPPLEMENT_LIMIT });
const DEFAULT_OUT = path.join(ROOT, 'docs/learning-cycles/LC-0023-route-diverse-cost-attribution.json');
const STAGES = Object.freeze([
  'championAnalysisNs',
  'supplementGenerationNs',
  'supplementScoringNs',
  'winnerSelectionNs',
]);

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

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function timed(timings, key, fn) {
  const started = process.hrtime.bigint();
  const result = fn();
  timings[key] = Number(process.hrtime.bigint() - started);
  return result;
}

function mapSnapshotsToState(state, chain) {
  return chain.map(({ x, y }) => state.grid[y][x]);
}

// This mirrors the public challenger composition while timing its exported
// real components externally. The caller compares its decision to the public
// chooser so the diagnostic cannot silently time an invented policy.
function attributedAnalysis(state, options = {}) {
  const timings = {};
  const champion = timed(timings, 'championAnalysisNs', () => analyzeMove(state, options));
  const championChain = champion.selectedChain && mapSnapshotsToState(state, champion.selectedChain);
  if (!champion.selectedChain || champion.reason === 'bomb-priority' || champion.reason === 'immediate-target-win') {
    return { champion, championChain, generated: [], supplement: [], winner: null, timings };
  }
  const params = { ...DEFAULT_PARAMS, ...options.params };
  const existingSignatures = new Set(champion.candidates.map(({ chain }) => routeSignature(chain)));
  const generated = timed(timings, 'supplementGenerationNs', () => (
    generateRouteDiverseSupplement(state, options.diversity)
  ));
  const supplement = timed(timings, 'supplementScoringNs', () => generated.flatMap((candidate) => {
    const signature = routeSignature(candidate.chain);
    if (existingSignatures.has(signature)) return [];
    return [{
      ...candidate,
      signature,
      policyScore: scoreSupplementCandidate(state, candidate, options.lookaheadRngFactory, params),
    }];
  }));
  const winner = timed(timings, 'winnerSelectionNs', () => supplement.reduce((best, candidate) => (
    !best || candidate.policyScore > best.policyScore ? candidate : best
  ), null));
  return { champion, championChain, generated, supplement, winner, timings };
}

function validateAttribution(row) {
  for (const stage of STAGES) {
    if (!Number.isFinite(row.timings[stage]) || row.timings[stage] < 0) {
      throw new Error(`invalid timing for ${row.puzzleIdentity}: ${stage}`);
    }
  }
  if (row.scoredSupplementCandidates !== row.supplementCandidates) {
    throw new Error(`scored/supplement count mismatch for ${row.puzzleIdentity}`);
  }
  return true;
}

function measurePuzzle(puzzleIdentity, descriptors) {
  const descriptor = descriptors[0];
  const recording = JSON.parse(fs.readFileSync(path.join(ROOT, descriptor.file), 'utf8'));
  const state = createLevelState(descriptor.candidate, makeRng(recording.seed));
  const options = {
    diversity: DIVERSITY,
    lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + state.moves),
  };
  const mirrored = attributedAnalysis(state, options);
  const publicAnalysis = analyzeRouteDiverseMove(state, options);
  const chainKey = (chain) => chain.map(({ x, y }) => `${x},${y}`).join('|');
  const mirroredSelected = mirrored.winner
    && mirrored.winner.policyScore > mirrored.champion.candidates.find(({ id }) => id === mirrored.champion.selectedId).policyScore
    ? mirrored.winner.chain
    : mirrored.championChain;
  if (chainKey(mirroredSelected) !== chainKey(publicAnalysis.selectedChain)) {
    throw new Error(`external attribution diverged from public challenger for ${puzzleIdentity}`);
  }
  const row = {
    puzzleIdentity,
    level: descriptor.levelNumber,
    seed: recording.seed,
    training: descriptors.some(({ file }) => file === TRAINING_RECORDING),
    reason: mirrored.champion.reason,
    supplementCandidates: mirrored.supplement.length,
    championImmediatePoints: mirrored.champion.candidates.find(({ id }) => id === mirrored.champion.selectedId)?.immediatePoints ?? null,
    generatedSupplementCandidates: mirrored.generated.length,
    scoredSupplementCandidates: mirrored.supplement.length,
    timings: Object.fromEntries(STAGES.map((stage) => [stage, numberOrZero(mirrored.timings[stage])])),
  };
  row.immediatePointEligibleCandidates = row.championImmediatePoints === null
    ? 0
    : mirrored.supplement.filter(({ points }) => points >= row.championImmediatePoints).length;
  validateAttribution(row);
  return row;
}

function trainingScoreGate() {
  const recording = JSON.parse(fs.readFileSync(TRAINING_RECORDING, 'utf8'));
  const descriptor = loadCorpus().puzzles
    .flatMap(({ recordings }) => recordings)
    .find(({ file }) => file === 'play-sessions/ecc4053a8c93200f8ebf4b665df0a9d1f07405cf29d9e8a0d0ae0dcfa1887a78.json');
  const rng = makeRng(recording.seed);
  const state = createLevelState(descriptor.candidate, rng);
  const first = recording.chains[0].tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    if (!tile || tile.value !== value) throw new Error(`training tile mismatch at ${x},${y}`);
    return tile;
  });
  const { executeChain, applyGravity, spawnNewTiles, tickBlockers } = require('../solver/engine');
  executeChain(state, first);
  applyGravity(state);
  spawnNewTiles(state, rng);
  tickBlockers(state);
  const lookaheadRngFactory = () => makeRng(LOOKAHEAD_BASE + state.moves);
  const champion = analyzeMove(state, { lookaheadRngFactory });
  const selected = champion.candidates.find(({ id }) => id === champion.selectedId);
  const ownerSignature = routeSignature(recording.chains[1].tiles.map(({ x, y, value }) => {
    const tile = state.grid[y][x];
    if (!tile || tile.value !== value) throw new Error(`training owner tile mismatch at ${x},${y}`);
    return tile;
  }));
  const owner = generateRouteDiverseSupplement(state, DIVERSITY)
    .find(({ chain }) => routeSignature(chain) === ownerSignature);
  if (!owner) throw new Error('training route was not generated');
  return {
    championImmediatePoints: selected.immediatePoints,
    ownerImmediatePoints: owner.points,
    ownerSurvivesImmediatePointGate: owner.points >= selected.immediatePoints,
  };
}

function total(rows, getter) {
  return rows.reduce((sum, row) => sum + getter(row), 0);
}

function recommendation(dominant) {
  if (dominant === 'supplementScoringNs') {
    return {
      mechanism: 'immediate-point eligibility gate before afterstate scoring',
      change: 'Keep the full generated supplement, but invoke expensive afterstate scoring only for supplemental routes whose immediate points are at least the champion-selected route’s immediate points.',
      prediction: 'The scored supplemental-candidate count should fall materially while the frozen human route remains scoreable because its immediate points equal the champion route’s.',
      requiredQualification: 'Prove the frozen human route is still generated and scoreable, exact champion fallback is retained, the gate has an explicit counterexample test for a lower-immediate-point future-value winner, and the 128-route generation cap plus the 2× corpus boundary hold.',
    };
  }
  return {
    mechanism: 'early generator work budget',
    change: 'Preserve endpoint diversity but bound the dominant generator stage before the current exhaustive supplement construction completes.',
    prediction: 'The dominant generator-stage time and its associated work count should fall while the frozen human route remains generated.',
    requiredQualification: 'Prove the frozen human route remains generated, exact champion fallback is retained, and the 128-route cap plus the 2× corpus boundary hold.',
  };
}

function attribute() {
  const corpus = loadCorpus();
  const rows = corpus.puzzles.map(({ puzzleIdentity, recordings }) => measurePuzzle(puzzleIdentity, recordings));
  const qualificationRows = rows.filter(({ training }) => !training);
  if (qualificationRows.length !== 19) throw new Error(`expected 19 qualification puzzles, found ${qualificationRows.length}`);
  const stageTotals = Object.fromEntries(STAGES.map((stage) => [stage, total(qualificationRows, (row) => row.timings[stage]) ]));
  const challengerOnlyStages = ['supplementGenerationNs', 'supplementScoringNs', 'winnerSelectionNs'];
  const dominant = challengerOnlyStages.reduce((best, stage) => (
    stageTotals[stage] > stageTotals[best] ? stage : best
  ));
  const body = {
    schemaVersion: 1,
    kind: 'route-diverse-cost-attribution',
    scope: 'one initial decision state from each frozen captured puzzle at the sole route-recovering lower width, 384; diagnostic only, not an outcome experiment',
    corpus: { path: 'docs/oracle/corpus.json', identity: corpus.manifestIdentity, puzzles: corpus.puzzles.length },
    diversity: DIVERSITY,
    sources: {
      tool: fileHash(__filename),
      challenger: fileHash(path.join(ROOT, 'solver/route-diverse-challenger.js')),
      champion: fileHash(path.join(ROOT, 'solver/bot.js')),
      engine: fileHash(path.join(ROOT, 'solver/engine.js')),
    },
    qualification: {
      puzzles: qualificationRows.length,
      stageTotals,
      dominantStage: dominant,
      dominantShareOfChallengerOnlyTime: stageTotals[dominant] / total(qualificationRows, (row) => (
        row.timings.supplementGenerationNs + row.timings.supplementScoringNs + row.timings.winnerSelectionNs
      )),
      totalScoredSupplementCandidates: total(qualificationRows, (row) => row.scoredSupplementCandidates),
      totalImmediatePointEligibleCandidates: total(qualificationRows, (row) => row.immediatePointEligibleCandidates),
    },
    trainingScoreGate: trainingScoreGate(),
    recommendation: recommendation(dominant),
    rows,
  };
  return { ...body, artifactIdentity: identity(body) };
}

function main() {
  const outIndex = process.argv.indexOf('--out');
  const out = outIndex === -1 ? DEFAULT_OUT : path.resolve(process.argv[outIndex + 1]);
  if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('--out needs a path');
  if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${out}`);
  const artifact = attribute();
  fs.writeFileSync(out, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ qualification: artifact.qualification, recommendation: artifact.recommendation }, null, 2));
}

if (require.main === module) main();

module.exports = { attribute, attributedAnalysis, measurePuzzle, trainingScoreGate, validateAttribution };
