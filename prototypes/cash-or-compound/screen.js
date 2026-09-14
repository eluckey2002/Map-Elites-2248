#!/usr/bin/env node
// PROTOTYPE — finite screen for a voluntary cash-now versus compound-later arc.

const { assess } = require('./model');

const DEFAULT_SEEDS = 512;
const SHAPES = Object.freeze([
  Object.freeze({ name: 'compact-open', level: 5910, gridW: 5, gridH: 5, moves: 16, minChain: 3, tileScale: 32, blockers: [] }),
  Object.freeze({ name: 'tall-open', level: 5911, gridW: 5, gridH: 6, moves: 18, minChain: 3, tileScale: 32, blockers: [] }),
]);

function parseSeeds(argv) {
  const argument = argv.find((value) => value.startsWith('--seeds='));
  if (!argument) return DEFAULT_SEEDS;
  const seeds = Number(argument.slice('--seeds='.length));
  if (!Number.isInteger(seeds) || seeds < 1 || seeds > 100000) {
    throw new Error('--seeds must be an integer from 1 through 100000');
  }
  return seeds;
}

function compact(result) {
  return {
    shape: result.level.name,
    seed: result.seed,
    target: result.targetRace.target,
    race: {
      compound: result.targetRace.compoundMoves,
      noHarvest: result.targetRace.noHarvestMoves,
      cashNow: result.targetRace.cashMoves,
    },
    fullBudgetScore: {
      compound: result.compound.score,
      noHarvest: result.noHarvest.score,
      cashNow: result.cashNow.score,
    },
    firstHarvestDivergence: {
      move: result.divergence.move,
      compoundPoints: result.divergence.points,
      noHarvestPointsOnSameBoard: result.divergence.localNoHarvestPoints,
    },
    laterHarvest: {
      move: result.laterHarvest.move,
      points: result.laterHarvest.points,
      chainLength: result.laterHarvest.chainLength,
      builtTilesReused: result.laterHarvest.reused.length,
      createdMoves: result.laterHarvest.reused.map(({ createdMove }) => createdMove),
      values: result.laterHarvest.reused.map(({ valueNow }) => valueNow),
    },
    scoreLift: {
      overNoHarvest: result.scoreLiftOverNoHarvest,
      overCashNow: result.scoreLiftOverCash,
    },
    rank: result.rank,
  };
}

function main(argv = process.argv.slice(2)) {
  const seeds = parseSeeds(argv);
  const accepted = [];
  const started = Date.now();

  for (const level of SHAPES) {
    for (let seed = 0; seed < seeds; seed += 1) {
      const result = assess(level, seed);
      if (result) accepted.push(result);
    }
  }

  accepted.sort((left, right) => right.rank - left.rank);
  const selected = accepted.slice(0, 10).map(compact);
  const output = {
    standing: 'exploratory prototype screen; not evidence-ledger evidence',
    question: 'Can current rules produce an optional early sacrifice that builds tiles reused in a later payoff, while cash-now remains viable?',
    sourcePopulation: { shapes: SHAPES.map(({ name }) => name), seedsPerShape: seeds },
    admission: {
      harvestTermChangesAChoice: true,
      laterChainReusesAtLeastTwoBuiltTiles: true,
      laterReuseIncludesTheTileCreatedByTheDivergenceMove: true,
      compoundPolicyReachesACommonTargetBeforeBothAlternatives: true,
      bothAlternativesStillReachThatTargetWithinTheMoveBudget: true,
    },
    acceptedCount: accepted.length,
    selected,
    elapsedSeconds: (Date.now() - started) / 1000,
  };

  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    return;
  }

  console.clear();
  console.log('CASH OR COMPOUND — THROWAWAY LOGIC PROTOTYPE');
  console.log('');
  console.log(output.question);
  console.log('');
  console.log(`Screened ${SHAPES.length * seeds} exact shape/seed pairs in ${output.elapsedSeconds.toFixed(1)}s.`);
  console.log(`${accepted.length} passed every mechanical admission condition.`);
  console.log('');
  if (!selected.length) {
    console.log('No playable candidate. Current open-board rules did not produce the intended arc in this population.');
    return;
  }
  console.log('Top candidates');
  for (const row of selected) {
    console.log(`  ${row.shape} seed ${row.seed} · target ${row.target.toLocaleString()}`);
    console.log(`    target race: compound ${row.race.compound}, no-harvest ${row.race.noHarvest}, cash-now ${row.race.cashNow}`);
    console.log(`    first harvest-driven divergence: move ${row.firstHarvestDivergence.move}, ${row.firstHarvestDivergence.compoundPoints.toLocaleString()} now vs ${row.firstHarvestDivergence.noHarvestPointsOnSameBoard.toLocaleString()}`);
    console.log(`    later payoff: move ${row.laterHarvest.move}, ${row.laterHarvest.points.toLocaleString()} points, ${row.laterHarvest.builtTilesReused} built tiles reused`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { DEFAULT_SEEDS, SHAPES, compact, main, parseSeeds };
