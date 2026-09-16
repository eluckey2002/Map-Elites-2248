#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const {
  ExactSearchLimit,
  analyzePuzzle,
  exactScoreEnvelope,
  identity,
} = require('../../solver/puzzle-descriptors');
const {
  BASE_LEVEL,
  MAX_NODES,
  REGIONS,
  REQUIRED_PER_REGION,
  RESULT,
  ROOT,
  artifactWithIdentity,
  sourceHashes,
} = require('./subject');

function value(matrix, move, cap) {
  return matrix[move][cap] || 0;
}

function targetForRegion(regionId, envelope) {
  const maximumCap = envelope.maximumCap;
  const beforeBudgetAll = value(envelope.scoresUpTo, BASE_LEVEL.moves - 1, maximumCap);
  const finalAll = value(envelope.scoresUpTo, BASE_LEVEL.moves, maximumCap);
  const firstAll = value(envelope.scoresUpTo, 1, maximumCap);
  const firstShort = value(envelope.scoresUpTo, 1, BASE_LEVEL.minChain);
  const firstBelowLong = value(envelope.scoresUpTo, 1, 4);
  const finalShort = value(envelope.scoresUpTo, BASE_LEVEL.moves, BASE_LEVEL.minChain);
  const finalBelowLong = value(envelope.scoresUpTo, BASE_LEVEL.moves, 4);

  if (regionId === 'relaxed-short') return firstShort > 0 ? firstShort : null;
  if (regionId === 'relaxed-long') return firstAll > firstBelowLong ? firstBelowLong + 1 : null;
  if (regionId === 'tight-short') return finalShort > firstShort ? firstShort + 1 : null;
  if (regionId === 'tight-long') {
    const threshold = Math.max(beforeBudgetAll, finalBelowLong);
    return finalAll > threshold ? threshold + 1 : null;
  }
  throw new Error(`unknown region ${regionId}`);
}

function expectedRegion(descriptor) {
  const pace = descriptor.budgetTightness <= 0.5 ? 'relaxed' : 'tight';
  const chain = descriptor.chainLengthDependence <= 3 ? 'short' : 'long';
  return `${pace}-${chain}`;
}

function compactScreen(envelope, target, eligible, reason = null) {
  return {
    seed: envelope.seed,
    standing: 'exact_result',
    eligible,
    target,
    reason,
    maxima: {
      oneMoveCap3: value(envelope.scoresUpTo, 1, 3),
      oneMoveCap4: value(envelope.scoresUpTo, 1, 4),
      oneMoveAll: value(envelope.scoresUpTo, 1, envelope.maximumCap),
      fullBudgetCap3: value(envelope.scoresUpTo, BASE_LEVEL.moves, 3),
      fullBudgetCap4: value(envelope.scoresUpTo, BASE_LEVEL.moves, 4),
      fullBudgetAll: value(envelope.scoresUpTo, BASE_LEVEL.moves, envelope.maximumCap),
    },
    search: envelope.stats,
  };
}

function screenRegion(region) {
  const screened = [];
  const instances = [];
  for (let offset = 0; offset < region.seedCount && instances.length < REQUIRED_PER_REGION; offset++) {
    const seed = region.seedStart + offset;
    let envelope;
    try {
      envelope = exactScoreEnvelope({ level: BASE_LEVEL, seed, maxNodes: MAX_NODES });
    } catch (error) {
      if (!(error instanceof ExactSearchLimit)) throw error;
      screened.push({
        seed,
        standing: 'UNKNOWN',
        eligible: false,
        target: null,
        reason: error.message,
      });
      continue;
    }
    const target = targetForRegion(region.id, envelope);
    if (target === null) {
      screened.push(compactScreen(envelope, null, false, 'predeclared target contrast is absent'));
      continue;
    }
    const level = { ...BASE_LEVEL, target, name: `${BASE_LEVEL.name}-${region.id}` };
    const instance = analyzePuzzle({ level, seed, target, maxNodes: MAX_NODES });
    const observed = instance.descriptor.reachable ? expectedRegion(instance.descriptor) : null;
    const eligible = instance.search.complete && observed === region.id;
    screened.push(compactScreen(envelope, target, eligible, eligible ? null : `observed ${observed || instance.descriptor.standing}`));
    if (eligible) instances.push({ region: region.id, ...instance });
  }
  return { region: region.id, screened, instances };
}

function initialBoardIdentity(instance) {
  return identity(instance.initialBoard);
}

function disposition(regions) {
  const instances = regions.flatMap((region) => region.instances);
  const occupied = Object.fromEntries(regions.map((region) => [region.region, region.instances.length]));
  const distinctStartingBoards = new Set(instances.map(initialBoardIdentity)).size;
  const strictCounterfactuals = instances.every(({ descriptor }) => (
    descriptor.counterfactuals.bestScoreWithFewerMoves < descriptor.target
    && descriptor.counterfactuals.bestScoreBelowRequiredCap < descriptor.target
  ));
  const fullOccupancy = regions.every((region) => region.instances.length >= REQUIRED_PER_REGION);
  const supported = fullOccupancy && distinctStartingBoards >= 12 && strictCounterfactuals;
  return {
    verdict: supported ? 'SUPPORTED' : 'INCONCLUSIVE',
    occupied,
    distinctStartingBoards,
    strictCounterfactuals,
    descriptorDecision: supported
      ? {
        budgetTightness: 'PROMOTE_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS',
        chainLengthDependence: 'PROMOTE_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS',
      }
      : {
        budgetTightness: 'REJECT_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS',
        chainLengthDependence: 'REJECT_FOR_EXACT_MICRO_PUZZLE_INSTANCE_MAPS',
      },
    scope: 'blocker-free 3x3, minChain 3, tileScale 1, two-move exact generated puzzles only',
  };
}

function buildCorpus() {
  const regions = REGIONS.map(screenRegion);
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    proofStanding: 'exact_result within corpus; owner decision for scoped descriptor promotion',
    generator: {
      baseLevel: BASE_LEVEL,
      regions: REGIONS,
      requiredPerRegion: REQUIRED_PER_REGION,
      maxNodes: MAX_NODES,
      selection: 'first exact qualifying seeds in each frozen disjoint range',
    },
    sources: sourceHashes(),
    regions,
    representatives: Object.fromEntries(regions
      .filter((region) => region.instances.length > 0)
      .map((region) => [region.region, region.instances[0].puzzleIdentity])),
    decision: disposition(regions),
  };
}

function flag(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  const candidate = argv[index + 1];
  return candidate && !candidate.startsWith('--') ? candidate : null;
}

function main(argv = process.argv.slice(2)) {
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable corpus refuses --exploratory');
  const output = flag(argv, '--out');
  if (!output) throw new Error('usage: run.js --protocol RESULT-0029 --out <path>');
  const destination = path.resolve(ROOT, output);
  if (fs.existsSync(destination)) throw new Error(`refusing to overwrite ${output}`);
  const artifact = artifactWithIdentity(buildCorpus(), registrationStamp(registration));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(artifact, null, 2)}\n`);
  process.stdout.write(`WROTE ${output} ${artifact.artifactIdentity}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { buildCorpus, disposition, expectedRegion, screenRegion, targetForRegion };
