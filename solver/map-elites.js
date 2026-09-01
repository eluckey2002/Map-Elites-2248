#!/usr/bin/env node
// A small, inspectable MAP-Elites experiment for learning quality-diversity.
// It never changes the champion: policies are parameter objects passed through
// chooseMove's existing public seam, and the committed defaults are the fixed
// reference against which screen and holdout fitness are measured.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { LEVELS } = require('../src/game');
const { DEFAULT_PARAMS } = require('./bot');
const { pairedLift, mean } = require('./policy-eval');
const { createPool } = require('./policy-pool');
const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');
const {
  axesFromPilot, axesIdentity, cellForBehavior, placeElite, policyIdentity, renderMapHtml,
  validateAxes,
} = require('./map-elites-core');

const ROOT = path.join(__dirname, '..');
const PROTECTED_COMMIT = '52f500c03a11699cb6bd7c3cab7f6a232470e0dd';
const PROTECTED_HASHES = Object.freeze({
  'solver/bot.js': '9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840',
  'solver/engine.js': '4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6',
  'solver/level-author.js': '305731fbfd7e664075dc177e8be48f5bf530d1f8475f5fd8c501cef84149b257',
  'solver/generate-levels.js': 'd7a8bf832fa0baea07045cb5546ce6683a3dca0c49024262658f09f23ecc3842',
  'src/game.js': '9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115',
});

const SCREEN_LEVELS = [1, 10, 20, 30, 40, 52];
const HOLDOUT_LEVELS = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 52];
const GENES = Object.freeze({
  wRoll: { minimum: 0, maximum: 6, step: 0.75 },
  wPlace: { minimum: 0, maximum: 6, step: 0.75 },
  turnover: { minimum: 0, maximum: 300, step: 36 },
  width: { minimum: 8, maximum: 24, step: 4, integer: true },
  bombMax: { minimum: 4, maximum: 12, step: 2, integer: true },
  wHarvest: { minimum: 0, maximum: 4, step: 0.75 },
  pathWidth: { minimum: 1, maximum: 8, step: 2, integer: true },
});

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, gene) {
  return Math.max(gene.minimum, Math.min(gene.maximum, value));
}

function mutate(parent, rng) {
  const child = { ...parent, offerFull: 0, tieBreak: 'degree' };
  const names = Object.keys(GENES);
  const count = 1 + Math.floor(rng() * 3);
  const touched = new Set();
  while (touched.size < count) touched.add(names[Math.floor(rng() * names.length)]);
  for (const name of touched) {
    const gene = GENES[name];
    const direction = rng() < 0.5 ? -1 : 1;
    const distance = 1 + Math.floor(rng() * 2);
    let value = clamp(child[name] + direction * distance * gene.step, gene);
    if (gene.integer) value = Math.round(value);
    else value = Math.round(value * 1000) / 1000;
    child[name] = value;
  }
  if (policyIdentity(child) === policyIdentity(parent)) {
    const name = names[Math.floor(rng() * names.length)];
    const gene = GENES[name];
    const value = child[name] === gene.maximum ? child[name] - gene.step : child[name] + gene.step;
    child[name] = gene.integer ? Math.round(clamp(value, gene)) : Math.round(clamp(value, gene) * 1000) / 1000;
  }
  return child;
}

function pilotPolicies() {
  const policy = (name, overrides) => ({ name, params: { ...DEFAULT_PARAMS, offerFull: 0, ...overrides } });
  return [
    policy('champion', {}),
    policy('short-myopic', { wRoll: 0, wPlace: 0, wHarvest: 0, turnover: 0, width: 8, pathWidth: 1 }),
    policy('turnover-low', { turnover: 0 }),
    policy('turnover-high', { turnover: 300 }),
    policy('rollout-low', { wRoll: 0 }),
    policy('rollout-high', { wRoll: 6 }),
    policy('placement-low', { wPlace: 0 }),
    policy('placement-high', { wPlace: 6 }),
    policy('harvest-low', { wHarvest: 0 }),
    policy('harvest-high', { wHarvest: 4 }),
    policy('one-path', { pathWidth: 1 }),
  ];
}

function parseArgs(argv) {
  const number = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index === -1 ? fallback : Number(argv[index + 1]);
  };
  const string = (name, fallback) => {
    const index = argv.indexOf(`--${name}`);
    return index === -1 ? fallback : argv[index + 1];
  };
  return {
    seed: number('seed', 20260822),
    iterations: number('iterations', 48),
    screenSeedCount: number('screen-seeds', 6),
    holdoutSeedCount: number('holdout-seeds', 12),
    screenSeedStart: number('screen-seed-start', 2_000_000),
    holdoutSeedStart: number('holdout-seed-start', 3_000_000),
    bins: number('bins', 5),
    out: string('out', 'solver/map-elites-output'),
    axesFrom: string('axes-from', null),
    replay: string('replay', null),
    archive: string('archive', null),
  };
}

function seedRangeEnd(name, start, count) {
  if (!Number.isSafeInteger(start) || start < 0) {
    throw new Error(`${name} must be a non-negative safe integer`);
  }
  if (start > Number.MAX_SAFE_INTEGER - (count - 1)) {
    throw new Error(`${name} range exceeds Number.MAX_SAFE_INTEGER`);
  }
  const end = start + count - 1;
  return end;
}

function validateConfig(config) {
  if (!Number.isInteger(config.iterations) || config.iterations < 0 || config.iterations > 120) {
    throw new Error('iterations must be an integer from 0 to 120');
  }
  for (const [name, value] of [['screen-seeds', config.screenSeedCount], ['holdout-seeds', config.holdoutSeedCount]]) {
    if (!Number.isInteger(value) || value < 2 || value > 300) throw new Error(`${name} must be an integer from 2 to 300`);
  }
  if (!Number.isInteger(config.bins) || config.bins < 3 || config.bins > 8) {
    throw new Error('bins must be an integer from 3 to 8');
  }
  const screenStart = config.screenSeedStart ?? 2_000_000;
  const holdoutStart = config.holdoutSeedStart ?? 3_000_000;
  const screenEnd = seedRangeEnd('screen-seed-start', screenStart, config.screenSeedCount);
  const holdoutEnd = seedRangeEnd('holdout-seed-start', holdoutStart, config.holdoutSeedCount);
  if (screenStart <= holdoutEnd && holdoutStart <= screenEnd) {
    throw new Error('screen and holdout seed ranges overlap');
  }
}

function evaluationSeeds(config) {
  const screenStart = config.screenSeedStart ?? 2_000_000;
  const holdoutStart = config.holdoutSeedStart ?? 3_000_000;
  return {
    screenSeeds: Array.from({ length: config.screenSeedCount }, (_, index) => screenStart + index),
    holdoutSeeds: Array.from({ length: config.holdoutSeedCount }, (_, index) => holdoutStart + index),
  };
}

function resolveAxes(config, pilotBehaviors) {
  const pilotAxes = axesFromPilot(pilotBehaviors, {
    count: config.bins,
    minimumChainRange: 0.15,
    minimumPatienceRange: 0.02,
  });
  if (!config.axesFrom) return { axes: pilotAxes, axesSource: null };

  const sourcePath = resolveFromRoot(config.axesFrom);
  const sourceBytes = fs.readFileSync(sourcePath);
  const source = JSON.parse(sourceBytes.toString('utf8'));
  validateAxes(source.axes, config.bins);
  const chainStyle = JSON.parse(JSON.stringify(source.axes.chainStyle));
  const patience = JSON.parse(JSON.stringify(source.axes.patience));
  const axes = { chainStyle, patience, pilot: pilotAxes.pilot };
  return {
    axes,
    axesSource: {
      archiveSha256: crypto.createHash('sha256').update(sourceBytes).digest('hex'),
      axesSha256: axesIdentity(axes),
    },
  };
}

async function evaluateMany(pool, policies, levelNumbers, seeds) {
  return Promise.all(policies.map(async (entry) => ({
    ...entry,
    result: await pool.run(entry.params, levelNumbers, seeds),
  })));
}

function screenCandidate(entry, referenceScores, axes, levelCount, seedCount) {
  const lift = pairedLift(entry.result.scores, referenceScores, { levelCount, seedCount });
  const location = cellForBehavior(entry.result.behavior, axes);
  return {
    policyId: policyIdentity(entry.params),
    origin: entry.name,
    params: entry.params,
    cell: location.cell,
    behavior: entry.result.behavior,
    fitness: lift.logLift,
    screen: {
      lift: lift.lift,
      winRate: entry.result.winRate,
      meanScore: mean(entry.result.scores),
      scores: entry.result.scores,
    },
  };
}

function archiveRows(archive) {
  return [...archive.values()].sort((a, b) => {
    const [ax, ay] = a.cell.split(',').map(Number);
    const [bx, by] = b.cell.split(',').map(Number);
    return ay - by || ax - bx || a.policyId.localeCompare(b.policyId);
  });
}

function selectRepresentatives(entries, count = 3) {
  if (entries.length < count) throw new Error(`archive has ${entries.length} cells; need ${count} representatives`);
  const selected = [entries.slice().sort((a, b) => b.fitness - a.fitness || a.policyId.localeCompare(b.policyId))[0]];
  while (selected.length < count) {
    const remaining = entries.filter((entry) => !selected.includes(entry));
    remaining.sort((a, b) => {
      const distance = (candidate) => Math.min(...selected.map((picked) => {
        const [cx, cy] = candidate.cell.split(',').map(Number);
        const [px, py] = picked.cell.split(',').map(Number);
        return Math.abs(cx - px) + Math.abs(cy - py);
      }));
      return distance(b) - distance(a) || b.fitness - a.fitness || a.policyId.localeCompare(b.policyId);
    });
    selected.push(remaining[0]);
  }
  return selected;
}

async function runExperiment(config) {
  validateConfig(config);
  const { screenSeeds, holdoutSeeds } = evaluationSeeds(config);
  const rng = makeRng(config.seed);
  const pool = createPool();
  try {
    const pilots = await evaluateMany(pool, pilotPolicies(), SCREEN_LEVELS, screenSeeds);
    const { axes, axesSource } = resolveAxes(
      config, pilots.map((entry) => entry.result.behavior),
    );
    const reference = pilots.find((entry) => entry.name === 'champion');
    const archive = new Map();
    const seen = new Set();
    let replacements = 0;
    for (const pilot of pilots) {
      const candidate = screenCandidate(
        pilot, reference.result.scores, axes, SCREEN_LEVELS.length, screenSeeds.length,
      );
      seen.add(candidate.policyId);
      if (placeElite(archive, candidate)) replacements += 1;
    }

    let evaluatedMutants = 0;
    while (evaluatedMutants < config.iterations) {
      const current = archiveRows(archive);
      const batch = [];
      const wanted = Math.min(9, config.iterations - evaluatedMutants);
      let attempts = 0;
      while (batch.length < wanted && attempts < wanted * 30) {
        attempts += 1;
        const parent = current[Math.floor(rng() * current.length)];
        const params = mutate(parent.params, rng);
        const policyId = policyIdentity(params);
        if (seen.has(policyId)) continue;
        seen.add(policyId);
        batch.push({ name: `mutant-of-${parent.policyId}`, params });
      }
      if (!batch.length) break;
      const results = await evaluateMany(pool, batch, SCREEN_LEVELS, screenSeeds);
      for (const result of results) {
        const candidate = screenCandidate(
          result, reference.result.scores, axes, SCREEN_LEVELS.length, screenSeeds.length,
        );
        if (placeElite(archive, candidate)) replacements += 1;
      }
      evaluatedMutants += batch.length;
      process.stderr.write(`MAP-Elites screen ${evaluatedMutants}/${config.iterations}; ${archive.size} occupied cells\n`);
    }

    const entries = archiveRows(archive);
    const chainCells = new Set(entries.map((entry) => entry.cell.split(',')[0]));
    const patienceCells = new Set(entries.map((entry) => entry.cell.split(',')[1]));
    if (entries.length < 3 || chainCells.size < 2 || patienceCells.size < 2) {
      throw new Error(`DESCRIPTORS INVALID: archive occupies ${entries.length} cells, ${chainCells.size} chain bins, ${patienceCells.size} patience bins`);
    }

    const representativeEntries = selectRepresentatives(entries);
    const holdoutInputs = [
      { name: 'champion', params: reference.params },
      ...representativeEntries.map((entry) => ({ name: entry.policyId, params: entry.params })),
    ];
    const holdout = await evaluateMany(pool, holdoutInputs, HOLDOUT_LEVELS, holdoutSeeds);
    const holdoutReference = holdout[0].result;
    const representatives = holdout.slice(1).map((entry) => {
      const elite = representativeEntries.find((candidate) => candidate.policyId === entry.name);
      const lift = pairedLift(entry.result.scores, holdoutReference.scores, {
        levelCount: HOLDOUT_LEVELS.length, seedCount: holdoutSeeds.length,
      });
      return {
        policyId: elite.policyId,
        cell: elite.cell,
        holdout: {
          fitness: lift.logLift,
          lift: lift.lift,
          winRate: entry.result.winRate,
          meanScore: mean(entry.result.scores),
          scores: entry.result.scores,
        },
      };
    });

    return {
      schemaVersion: 1,
      experiment: '2248-map-elites-learning',
      explanation: {
        fitness: 'Paired geometric score lift versus the unchanged champion on identical games. Selection fitness is never reported as holdout evidence.',
        chainStyle: 'Mean number of tiles in each played chain. Left cells use more smaller chains; right cells use fewer larger chains.',
        patience: 'Share of total score earned in the final third of the move budget. Higher cells score later.',
        archive: 'Each behavior cell keeps its own highest-selection-fitness policy, even when another cell has a better global score.',
      },
      config: {
        seed: config.seed,
        iterations: config.iterations,
        bins: config.bins,
        screen: { levels: SCREEN_LEVELS, seedStart: screenSeeds[0], seeds: screenSeeds },
        holdout: { levels: HOLDOUT_LEVELS, seedStart: holdoutSeeds[0], seeds: holdoutSeeds },
      },
      protected: { commit: PROTECTED_COMMIT, hashes: PROTECTED_HASHES },
      axesSource,
      reference: {
        policyId: policyIdentity(reference.params),
        params: reference.params,
        screen: {
          meanScore: mean(reference.result.scores),
          winRate: reference.result.winRate,
          scores: reference.result.scores,
        },
        holdout: {
          meanScore: mean(holdoutReference.scores),
          winRate: holdoutReference.winRate,
          scores: holdoutReference.scores,
        },
      },
      axes,
      pilot: pilots.map((entry) => ({
        name: entry.name,
        policyId: policyIdentity(entry.params),
        behavior: entry.result.behavior,
      })),
      search: { evaluatedPilots: pilots.length, evaluatedMutants, replacements },
      archive: entries,
      representatives,
    };
  } finally {
    await pool.close();
  }
}

function resolveFromRoot(value) {
  return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

async function replayElite(archivePath, policyId) {
  const artifact = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  const elite = artifact.archive.find((entry) => entry.policyId === policyId);
  if (!elite) throw new Error(`unknown elite ${policyId}`);
  if (policyIdentity(elite.params) !== policyId) throw new Error(`policy identity mismatch for ${policyId}`);
  const levelNumbers = artifact.config.screen.levels;
  const levels = levelNumbers.map((number) => LEVELS.find((level) => level.level === number));
  if (levels.some((level) => !level)) throw new Error('archive names a level absent from this checkout');
  const { evaluatePolicy } = require('./policy-eval');
  const result = evaluatePolicy(elite.params, levels, artifact.config.screen.seeds);
  const lift = pairedLift(result.scores, artifact.reference.screen.scores, {
    levelCount: levelNumbers.length, seedCount: artifact.config.screen.seeds.length,
  });
  const location = cellForBehavior(result.behavior, artifact.axes);
  const problems = [];
  if (location.cell !== elite.cell) problems.push(`cell ${location.cell} != ${elite.cell}`);
  if (JSON.stringify(result.scores) !== JSON.stringify(elite.screen.scores)) problems.push('score vector differs');
  if (Math.abs(lift.logLift - elite.fitness) > 1e-12) problems.push('fitness differs');
  if (Math.abs(result.behavior.meanChainLength - elite.behavior.meanChainLength) > 1e-12
    || Math.abs(result.behavior.lateScoreShare - elite.behavior.lateScoreShare) > 1e-12) {
    problems.push('behavior differs');
  }
  if (problems.length) throw new Error(`elite replay failed: ${problems.join(', ')}`);
  return { status: 'PASS', policyId, cell: elite.cell, fitness: elite.fitness, behavior: elite.behavior };
}

async function main(argv = process.argv.slice(2)) {
  const config = parseArgs(argv);
  if (config.replay) {
    if (!config.archive) throw new Error('--replay requires --archive');
    const result = await replayElite(resolveFromRoot(config.archive), config.replay);
    console.log(`PASS elite ${result.policyId} cell ${result.cell} fitness ${(Math.expm1(result.fitness) * 100).toFixed(2)}%`);
    return result;
  }
  // Refuse before spending the run. A replay re-reads existing evidence and
  // produces no new claim, so only a fresh experiment needs a protocol.
  const registration = requireProtocolOrExit(process.argv, { name: 'map-elites' });
  const artifact = await runExperiment(config);
  artifact.registration = registrationStamp(registration);
  const outDir = resolveFromRoot(config.out);
  fs.mkdirSync(outDir, { recursive: true });
  const archivePath = path.join(outDir, 'archive.json');
  const mapPath = path.join(outDir, 'map.html');
  fs.writeFileSync(archivePath, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(mapPath, renderMapHtml(artifact));
  console.log(`PASS MAP-Elites: ${artifact.archive.length} occupied cells; ${artifact.representatives.length} representatives`);
  console.log(`pilot ranges: chain ${artifact.axes.pilot.chainRange.toFixed(3)} tiles; patience ${(artifact.axes.pilot.patienceRange * 100).toFixed(2)} points`);
  console.log(`wrote ${archivePath}`);
  console.log(`wrote ${mapPath}`);
  return artifact;
}

if (require.main === module) {
  main().catch((error) => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
}

module.exports = {
  GENES, HOLDOUT_LEVELS, PROTECTED_COMMIT, PROTECTED_HASHES, SCREEN_LEVELS,
  evaluationSeeds, main, mutate, parseArgs, replayElite, resolveAxes, runExperiment,
  selectRepresentatives, validateConfig,
};
