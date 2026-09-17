#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const crypto = require('node:crypto');

const { makeRng } = require('./engine');
const { sampleShape, shapeSignature, screen, screenVerdict, gateVerdict } = require('./generate-levels');
const { deriveCandidate, verifyCandidate } = require('./level-author');
const { analyzeLandmarkFrontier, initialPuzzle, replayLandmarkRoute } = require('./landmark-frontier');
const { search } = require('./oracle/search');
const { rankState: harvestRankState } = require('./oracle/harvest-policy');
const { verifyWitness } = require('./oracle/verify');
const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');
const {
  BREADTH_BINS,
  CELL_CAPACITY,
  GRID_SIZE,
  HARVEST_BINS,
  SOURCE_PATHS,
  boardIdentity,
  buildArchive,
  identity,
  pairedHarvestAdvantage,
  renderMapHtml,
  summarizeBreadth,
} = require('./board-map-elites-core');

const ROOT = path.resolve(__dirname, '..');
const LANDMARK = 2048;
const DEFAULT_DESCRIPTOR_SEEDS = Object.freeze([42000000, 42000001, 42000002]);
const DEFAULT_SAMPLER_SEED = 20260918;
const DEFAULT_COUNT = 36;
const DEFAULT_FULL = 16;
const LANDMARK_OPTIONS = Object.freeze({
  mode: 'bounded', maxNodes: 1, beamWidth: 1, actionsPerState: 32,
  pathWidth: 3, maxPathStates: 100000, maxResults: 128, maxMoves: 1,
});
const ORACLE_MAX_EXPANDED_STATES = 600;
const ORACLE_BUDGET_MS = 30000;

function fileHash(relative) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, relative))).digest('hex');
}

function sourceHashes() {
  return Object.fromEntries(SOURCE_PATHS.map((relative) => [relative, fileHash(relative)]));
}

function subjectIdentityFor(config, sources = sourceHashes()) {
  return identity({
    sources,
    config: {
      gridSize: GRID_SIZE,
      cellCapacity: CELL_CAPACITY,
      axes: { breadth: BREADTH_BINS, harvest: HARVEST_BINS },
      samplerSeed: config.samplerSeed,
      sampledShapes: config.count,
      fullyEvaluatedLimit: config.full,
      level: config.level,
      descriptorSeeds: config.descriptorSeeds,
      landmark: LANDMARK,
      landmarkOptions: LANDMARK_OPTIONS,
      oracleMaxExpandedStates: ORACLE_MAX_EXPANDED_STATES,
      oracleBudgetMs: ORACLE_BUDGET_MS,
      objective: 'first target crossing for both paired policies',
    },
  });
}

function immediateRankState(state) {
  return state.score;
}

function measureBreadth(candidate, seeds = DEFAULT_DESCRIPTOR_SEEDS) {
  const rows = seeds.map((seed) => {
    const puzzle = initialPuzzle(candidate, seed);
    const result = analyzeLandmarkFrontier({
      ...puzzle, landmark: LANDMARK, options: LANDMARK_OPTIONS,
    });
    for (const route of result.routes) {
      replayLandmarkRoute({ ...puzzle, landmark: LANDMARK }, route);
    }
    return {
      seed,
      standing: result.standing,
      complete: result.complete,
      distinctOutcomeCountLowerBound: result.distinctOutcomeCountLowerBound,
      routes: result.routes,
      diagnostics: result.diagnostics,
    };
  });
  return { ...summarizeBreadth(rows), landmark: LANDMARK, rows };
}

function measureHarvest(candidate, seeds = DEFAULT_DESCRIPTOR_SEEDS, searchFn = search) {
  const policies = [
    { id: 'immediate', rankStateFn: immediateRankState },
    { id: 'harvest', rankStateFn: harvestRankState },
  ];
  const rows = [];
  for (const seed of seeds) {
    for (const policy of policies) {
      const result = searchFn({
        level: candidate,
        seed,
        budgetMs: ORACLE_BUDGET_MS,
        maxExpandedStates: ORACLE_MAX_EXPANDED_STATES,
        includeBaseline: false,
        rankStateFn: policy.rankStateFn,
      });
      if (result.terminationReason === 'time-budget') {
        throw new Error(`${policy.id} search hit the emergency time budget for seed ${seed}`);
      }
      if (result.best) verifyWitness({ level: candidate, seed }, result.best);
      rows.push({
        seed,
        policy: policy.id,
        standing: result.best ? 'replayed_win' : 'UNKNOWN',
        moves: result.best?.movesUsed ?? null,
        score: result.best?.score ?? null,
        expandedStates: result.stats.expandedStates,
        generatedActions: result.stats.generatedActions,
        terminationReason: result.terminationReason,
        witness: result.best,
      });
    }
  }
  return { ...pairedHarvestAdvantage(rows, candidate.moves), rows };
}

function evaluateShape(shape, seeds = DEFAULT_DESCRIPTOR_SEEDS) {
  const authored = deriveCandidate(shape);
  const candidate = authored.store.candidates[0];
  const verdict = gateVerdict(authored.receipt);
  let verified = null;
  try {
    verified = verifyCandidate(authored.store, authored.receipt);
  } catch (error) {
    return {
      shape, candidate, receipt: authored.receipt, boardIdentity: boardIdentity(candidate),
      eligible: false, exclusion: `authoring verifier: ${error.message}`,
    };
  }
  if (!verdict.pass) {
    return {
      shape, candidate, receipt: authored.receipt, boardIdentity: boardIdentity(candidate),
      eligible: false, exclusion: `authoring gates: ${verdict.failures.join(', ')}`,
      quality: { rule: 'lower verified holdout win rate ranks first', winRate: verdict.winRate },
    };
  }
  const breadth = measureBreadth(candidate, seeds);
  const harvest = measureHarvest(candidate, seeds);
  return {
    shape,
    candidate,
    receipt: authored.receipt,
    boardIdentity: boardIdentity(candidate),
    eligible: true,
    exclusion: null,
    quality: {
      rule: 'lower verified holdout win rate ranks first after existing authoring gates',
      winRate: verified.winRate,
      bombRate: verified.bombRate,
      terminalCounts: verified.terminalCounts,
    },
    descriptors: { breadth, harvest },
  };
}

function generateShapes({ count, full, samplerSeed, level = 56 }) {
  const rng = makeRng(samplerSeed);
  const seen = new Set();
  const screened = [];
  for (let index = 0; index < count; index++) {
    const shape = sampleShape(rng, level, index);
    const signature = shapeSignature(shape);
    if (seen.has(signature)) continue;
    seen.add(signature);
    const result = screen(shape);
    screened.push({ shape, screen: result, rejection: screenVerdict(result) });
  }
  return { screened, selected: screened.filter(({ rejection }) => !rejection).slice(0, full) };
}

function buildRun(config, registration, onProgress = () => {}) {
  const generated = generateShapes(config);
  const evaluations = [];
  for (const [index, entry] of generated.selected.entries()) {
    onProgress(`evaluate ${index + 1}/${generated.selected.length} ${entry.shape.name}`);
    evaluations.push(evaluateShape(entry.shape, config.descriptorSeeds));
  }
  const archive = buildArchive(evaluations);
  const occupiedBreadthBins = new Set(archive.map(({ cell }) => cell.split(',')[0])).size;
  const occupiedHarvestBins = new Set(archive.map(({ cell }) => cell.split(',')[1])).size;
  const sources = sourceHashes();
  const body = {
    schemaVersion: 1,
    kind: 'board-map-elites',
    registration: registrationStamp(registration),
    finalSubjectIdentity: subjectIdentityFor(config, sources),
    config: {
      gridSize: GRID_SIZE,
      cellCapacity: CELL_CAPACITY,
      axes: { breadth: BREADTH_BINS, harvest: HARVEST_BINS },
      samplerSeed: config.samplerSeed,
      sampledShapes: config.count,
      fullyEvaluatedLimit: config.full,
      level: config.level,
      descriptorSeeds: config.descriptorSeeds,
      landmark: LANDMARK,
      landmarkOptions: LANDMARK_OPTIONS,
      oracleMaxExpandedStates: ORACLE_MAX_EXPANDED_STATES,
      oracleBudgetMs: ORACLE_BUDGET_MS,
      objective: 'first target crossing for both paired policies',
    },
    sources,
    screened: generated.screened,
    evaluations,
    archive,
    summary: {
      screened: generated.screened.length,
      screenSurvivors: generated.screened.filter(({ rejection }) => !rejection).length,
      evaluated: evaluations.length,
      eligible: evaluations.filter(({ eligible }) => eligible).length,
      occupiedCells: archive.length,
      occupiedBreadthBins,
      occupiedHarvestBins,
      premise: archive.length >= 4 && occupiedBreadthBins >= 2 && occupiedHarvestBins >= 2
        ? 'SUPPORTED_AT_BOUNDED_SCOPE' : 'DISCONFIRMED_AT_BOUNDED_SCOPE',
    },
  };
  const { registration: _registration, ...identifiedBody } = body;
  return { ...body, artifactIdentity: identity(identifiedBody) };
}

function integerFlag(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) return fallback;
  const value = Number(argv[index + 1]);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} requires a positive integer`);
  return value;
}

function stringFlag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function parseArgs(argv) {
  const descriptorSeedStart = integerFlag(argv, '--descriptor-seed-start', DEFAULT_DESCRIPTOR_SEEDS[0]);
  const descriptorSeedCount = integerFlag(argv, '--descriptor-seeds', DEFAULT_DESCRIPTOR_SEEDS.length);
  return {
    out: stringFlag(argv, '--out'),
    count: integerFlag(argv, '--count', DEFAULT_COUNT),
    full: integerFlag(argv, '--full', DEFAULT_FULL),
    samplerSeed: integerFlag(argv, '--sampler-seed', DEFAULT_SAMPLER_SEED),
    level: integerFlag(argv, '--level', 56),
    descriptorSeeds: Array.from({ length: descriptorSeedCount }, (_, index) => descriptorSeedStart + index),
  };
}

function writeRun(artifact, out) {
  if (!out) throw new Error('usage: board-map-elites.js --protocol RESULT-NNNN --out <new-directory>');
  const directory = path.resolve(ROOT, out);
  if (fs.existsSync(directory)) throw new Error(`refusing to overwrite ${out}`);
  fs.mkdirSync(directory, { recursive: true });
  const artifactPath = path.join(directory, 'archive.json');
  const mapPath = path.join(directory, 'map.html');
  fs.writeFileSync(artifactPath, `${JSON.stringify(artifact)}\n`);
  fs.writeFileSync(mapPath, renderMapHtml(artifact));
  return { directory, artifactPath, mapPath };
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: 'board MAP-Elites' });
  const config = parseArgs(argv);
  const artifact = buildRun(config, registration, (message) => process.stderr.write(`${message}\n`));
  const paths = writeRun(artifact, config.out);
  const verifier = path.join(__dirname, 'verify-board-map-elites.js');
  const verification = execFileSync(process.execPath, [verifier, paths.artifactPath, paths.mapPath], {
    cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'],
  });
  process.stdout.write(`WROTE ${path.relative(ROOT, paths.artifactPath)} ${artifact.artifactIdentity}\n`);
  process.stdout.write(verification);
  return artifact;
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; }
}

module.exports = {
  DEFAULT_COUNT,
  DEFAULT_DESCRIPTOR_SEEDS,
  DEFAULT_FULL,
  DEFAULT_SAMPLER_SEED,
  LANDMARK,
  LANDMARK_OPTIONS,
  ORACLE_BUDGET_MS,
  ORACLE_MAX_EXPANDED_STATES,
  buildRun,
  evaluateShape,
  generateShapes,
  immediateRankState,
  measureBreadth,
  measureHarvest,
  parseArgs,
  sourceHashes,
  subjectIdentityFor,
  writeRun,
};
