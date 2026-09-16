#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const { registrationStamp, requireProtocolOrExit } = require('../../solver/experiment-guard');
const { analyzeChoiceRecovery } = require('../../solver/choice-recovery-descriptors');
const {
  CONFIRMATION_SEEDS,
  DEEP_SEARCH,
  RECOVERY_ALTERNATIVES,
  RECOVERY_CANDIDATE_POOL,
  RESULT,
  ROOT,
  SHALLOW_SEARCH,
  SLACK_MOVES,
  artifactWithIdentity,
  profiles,
  sourceHashes,
} = require('./subject');

function analyzeArm(level, seed, search) {
  return analyzeChoiceRecovery({
    level,
    seed,
    search,
    recoveryAlternatives: RECOVERY_ALTERNATIVES,
    recoveryCandidatePool: RECOVERY_CANDIDATE_POOL,
  });
}

function makeRow(level, seed) {
  const slackLevel = { ...level, moves: level.moves + SLACK_MOVES };
  return {
    level: level.level,
    dimensions: `${level.gridW}x${level.gridH}`,
    seed,
    tightMoves: level.moves,
    slackMoves: slackLevel.moves,
    shallow: {
      tight: analyzeArm(level, seed, SHALLOW_SEARCH),
      slack: analyzeArm(slackLevel, seed, SHALLOW_SEARCH),
    },
    deep: {
      tight: analyzeArm(level, seed, DEEP_SEARCH),
      slack: analyzeArm(slackLevel, seed, DEEP_SEARCH),
    },
  };
}

function measured(analysis) {
  return analysis.recoveryStanding !== 'UNKNOWN';
}

function recoveryRate(analysis) {
  return analysis.descriptors.oneDetourRecoveryWitnessRate;
}

function summarizeRows(rows) {
  const initialChoices = rows.map(({ deep }) => deep.tight.descriptors.initialViableStartFraction);
  const choiceRange = Math.max(...initialChoices) - Math.min(...initialChoices);
  const choiceInvariance = rows.filter(({ shallow, deep }) => {
    const values = [shallow.tight, shallow.slack, deep.tight, deep.slack]
      .map(({ descriptors }) => descriptors.initialViableStartFraction);
    return new Set(values).size === 1;
  }).length;

  const eligible = rows.filter(({ deep }) => (
    measured(deep.tight) && measured(deep.slack) && recoveryRate(deep.tight) < 1
  ));
  const improved = eligible.filter(({ deep }) => (
    recoveryRate(deep.slack) - recoveryRate(deep.tight) >= 0.125
  )).length;
  const decreased = eligible.filter(({ deep }) => (
    recoveryRate(deep.slack) < recoveryRate(deep.tight)
  )).length;

  const stableArms = rows.flatMap(({ shallow, deep }) => [
    [shallow.tight, deep.tight],
    [shallow.slack, deep.slack],
  ]).filter(([shallow, deep]) => measured(shallow) && measured(deep));
  const stableRates = stableArms.filter(([shallow, deep]) => (
    Math.abs(recoveryRate(shallow) - recoveryRate(deep)) <= 0.25
  )).length;

  const p1Supported = choiceRange >= 0.2 && choiceInvariance === rows.length;
  const p2Supported = eligible.length >= 12
    && improved / eligible.length >= 0.75
    && decreased === 0;
  const p3Supported = stableArms.length >= 48
    && stableRates / stableArms.length >= 0.75;
  return {
    P1: {
      outcome: p1Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      range: choiceRange,
      invariantRows: choiceInvariance,
      totalRows: rows.length,
      required: 'range >= 0.20 and exact invariance in all 32 rows',
    },
    P2: {
      outcome: p2Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      eligibleNonCeilingPairs: eligible.length,
      improved,
      decreased,
      improvementRate: eligible.length ? improved / eligible.length : null,
      required: 'at least 12 eligible non-ceiling pairs, >=75% improve by >=0.125, zero decreases',
    },
    P3: {
      outcome: p3Supported ? 'SUPPORTED' : 'INCONCLUSIVE',
      comparableArms: stableArms.length,
      stableRates,
      stabilityRate: stableArms.length ? stableRates / stableArms.length : null,
      required: 'at least 48 comparable arms and >=75% within 0.25',
    },
    descriptorDisposition: p1Supported && p2Supported && p3Supported
      ? 'ELIGIBLE_FOR_A_SEPARATE_MAP_CORPUS'
      : 'REVISE_BEFORE_MAP_CORPUS',
  };
}

function buildCorpus({ levels = profiles(), seeds = CONFIRMATION_SEEDS } = {}) {
  const rows = levels.flatMap((level) => seeds.map((seed) => makeRow(level, seed)));
  return {
    schemaVersion: 1,
    result: RESULT,
    reportable: true,
    proofStanding: 'exact initial-state choice fraction; replayed lower bounds for found recovery continuations; UNKNOWN for bounded misses; heuristic_observation for panel generalization',
    definitions: {
      choiceDensityConstruct: 'how many meaningful choices a puzzle offers',
      initialViableStartFraction: 'fraction of nonblocked opening tiles that can start at least one legal chain',
      recoveryConstruct: 'ability to remain solvable after a non-solution move',
      oneDetourRecoveryWitnessRate: 'fraction of up to eight lowest-scoring non-reference candidates from a deterministic 64-candidate pool for which bounded search finds and replays a continuation to target',
      exclusions: ['exact reachability after a miss', 'natural move frequency', 'difficulty', 'fun', 'player preference'],
    },
    panel: {
      levels: levels.map(({ level, gridW, gridH, moves, minChain, tileScale, target, blockers }) => ({
        level, gridW, gridH, tightMoves: moves, slackMoves: moves + SLACK_MOVES,
        minChain, tileScale, target, blockers,
      })),
      seeds,
      shallowSearch: SHALLOW_SEARCH,
      deepSearch: DEEP_SEARCH,
      recoveryAlternatives: RECOVERY_ALTERNATIVES,
      recoveryCandidatePool: RECOVERY_CANDIDATE_POOL,
    },
    sources: sourceHashes(),
    rows,
    decision: summarizeRows(rows),
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
  if (!output) throw new Error('usage: run.js --protocol RESULT-0032 --out <path>');
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

module.exports = { buildCorpus, makeRow, summarizeRows };
