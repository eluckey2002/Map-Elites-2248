// Does flipping the chain walk to heaviest-first past the multiplier cap
// improve whole-game play?
//
// `chainMultiplier` tops out at 5 and reaches it at 9 tiles. Below that,
// lowest-value-first is what keeps the walk alive long enough to earn the cap
// (RESULT-0011). At or past it the multiplier cannot rise again, so a further
// tile contributes exactly its own value x 5 -- yet the walk still takes the
// smallest tile it can reach, suppressing the only term still paying.
//
// Motivation from replayed human play: across 111 moves the owner's payoff
// chains were SHORTER than their typical move (11.4 tiles vs 15.4) but carried
// a much larger sum (2,957 vs 2,286), and 77 of 111 moves were already at or
// past the cap.
//
// Stage 1 screens thresholds and is SELECTION DATA ONLY. Stage 2 evaluates the
// single selected threshold on disjoint confirmation seeds and is the only
// reportable number.
//
//   node solver/heavy-after-ablation.js             # screen only
//   node solver/heavy-after-ablation.js --confirm   # screen, then one confirmation
const { LEVELS } = require('../src/game');
const { DEFAULT_PARAMS } = require('./bot');
const { pairedLift, mean } = require('./policy-eval');
const { createPool, runSharded } = require('./policy-pool');

// policy-pool's runSharded keeps cells level-major, which the cluster-robust SE
// in policy-eval.js depends on. It returns no timing, so wall time is measured
// here for the relative-cost column only.
async function timedRun(pool, params, levelNumbers, seeds) {
  const started = Date.now();
  const result = await runSharded(pool, params, levelNumbers, seeds);
  return { ...result, wallSeconds: (Date.now() - started) / 1000 };
}

const CONFIRM = process.argv.includes('--confirm');
const SCREEN_LEVEL_NUMBERS = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 53];
const SCREEN_LEVELS = SCREEN_LEVEL_NUMBERS;
// Disjoint from every range this project has used: level authoring (0-149,
// 100k), MAP-Elites (4M screen, 5M holdout), multipath (9M screen, 10M confirm).
const SCREEN_SEEDS = Array.from({ length: 40 }, (_, i) => 11_000_000 + i);
const CONFIRM_LEVELS = LEVELS.map((l) => l.level);
const CONFIRM_SEEDS = Array.from({ length: 300 }, (_, i) => 12_000_000 + i);
// 0 is the shipped bot (flip disabled) and is the reference, not a candidate.
// 9 is the cap itself; 7 and 11 bracket it so a threshold effect is visible
// rather than assumed.
const THRESHOLDS = [0, 7, 9, 11, 13];

function compare(candidate, reference, levelCount, seedCount) {
  const lift = pairedLift(candidate.scores, reference.scores, { levelCount, seedCount });
  return {
    ...lift,
    winRate: candidate.winRate,
    meanScore: mean(candidate.scores),
    relCost: candidate.wallSeconds / reference.wallSeconds,
  };
}

function printRows(title, rows, referenceWinRate) {
  console.log(`\n=== ${title} ===\n`);
  console.log('heavyAfter     lift      t   winRate   winDelta   rel.cost');
  console.log('----------   ------   ----   -------   --------   --------');
  for (const row of rows) {
    const winDelta = row.winRate - referenceWinRate;
    console.log(
      `${String(row.heavyAfter).padStart(10)}   ${(`${row.lift >= 0 ? '+' : ''}${(row.lift * 100).toFixed(2)}%`).padStart(6)}`
      + `   ${row.t.toFixed(1).padStart(4)}   ${(`${(row.winRate * 100).toFixed(2)}%`).padStart(7)}`
      + `   ${(`${winDelta >= 0 ? '+' : ''}${(winDelta * 100).toFixed(2)}pp`).padStart(8)}`
      + `   ${(`${row.relCost.toFixed(2)}x`).padStart(8)}`,
    );
  }
}

async function main() {
  const pool = createPool();
  try {
    console.log('Heaviest-first-past-the-cap ablation');
    console.log(`screen: ${SCREEN_LEVELS.length} levels x ${SCREEN_SEEDS.length} seeds, thresholds ${THRESHOLDS.join(', ')}`);
    console.log(`confirmation: ${CONFIRM_LEVELS.length} levels x ${CONFIRM_SEEDS.length} seeds, one selected threshold`);

    const screenRuns = [];
    for (const heavyAfter of THRESHOLDS) {
      const result = await timedRun(
        pool, { ...DEFAULT_PARAMS, heavyAfter }, SCREEN_LEVELS, SCREEN_SEEDS,
      );
      screenRuns.push({ heavyAfter, result });
      process.stderr.write(`screen heavyAfter ${heavyAfter} done\n`);
    }

    const screenReference = screenRuns[0].result;
    const screenRows = screenRuns.map(({ heavyAfter, result }) => ({
      heavyAfter,
      ...compare(result, screenReference, SCREEN_LEVELS.length, SCREEN_SEEDS.length),
    }));
    printRows('SCREEN (selection only)', screenRows, screenReference.winRate);

    const selected = screenRows.slice(1).sort((a, b) => b.lift - a.lift)[0];
    console.log(`\nselected heavyAfter ${selected.heavyAfter} by screen lift ${(selected.lift * 100).toFixed(2)}%`);
    if (!CONFIRM) return;

    const confirmReference = await timedRun(
      pool, { ...DEFAULT_PARAMS, heavyAfter: 0 }, CONFIRM_LEVELS, CONFIRM_SEEDS,
    );
    process.stderr.write('confirmation reference done\n');
    const confirmCandidate = await timedRun(
      pool, { ...DEFAULT_PARAMS, heavyAfter: selected.heavyAfter },
      CONFIRM_LEVELS, CONFIRM_SEEDS,
    );
    process.stderr.write('confirmation candidate done\n');

    const confirmed = {
      heavyAfter: selected.heavyAfter,
      ...compare(confirmCandidate, confirmReference, CONFIRM_LEVELS.length, CONFIRM_SEEDS.length),
    };
    printRows('CONFIRMATION (reportable)', [confirmed], confirmReference.winRate);

    const winDelta = confirmed.winRate - confirmReference.winRate;
    const supported = confirmed.lift > 0 && confirmed.t > 3 && winDelta >= 0;
    console.log(`\nVERDICT: ${supported ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
    console.log(JSON.stringify({
      selectedHeavyAfter: selected.heavyAfter,
      screenLift: selected.lift,
      confirmation: {
        lift: confirmed.lift, se: confirmed.se, t: confirmed.t,
        referenceWinRate: confirmReference.winRate, candidateWinRate: confirmed.winRate,
      },
    }, null, 2));
  } finally {
    await pool.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
