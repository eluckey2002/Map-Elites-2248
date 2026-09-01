// Does retaining several partial chain paths improve whole-game play?
//
// Stage 1 selects a bounded path width on screen seeds. Stage 2 evaluates only
// that width on disjoint confirmation seeds. The confirmation is the reportable
// result; the screen result is selection data.
//
//   node solver/multipath-ablation.js             # screen only
//   node solver/multipath-ablation.js --confirm   # screen, then one confirmation
const { LEVELS } = require('../src/game');
const { DEFAULT_PARAMS } = require('./bot');
const { pairedLift, mean } = require('./policy-eval');
const { createPool } = require('./policy-pool');

const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');

const CONFIRM = process.argv.includes('--confirm');
// Refuse before spending the run, not after. --confirm produces the evidence a
// generalizing claim rests on, so it needs a protocol registered in advance.
const REGISTRATION = CONFIRM
  ? requireProtocolOrExit(process.argv, { name: 'multipath-ablation --confirm' })
  : { exploratory: true, protocolCommit: null, resultId: null };
const REGISTRATION_STAMP = registrationStamp(REGISTRATION);
const SCREEN_LEVEL_NUMBERS = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 53];
const SCREEN_LEVELS = SCREEN_LEVEL_NUMBERS.map((n) => LEVELS[n - 1]);
const SCREEN_SEEDS = Array.from({ length: 40 }, (_, i) => 9_000_000 + i);
const CONFIRM_LEVELS = LEVELS;
const CONFIRM_SEEDS = Array.from({ length: 300 }, (_, i) => 10_000_000 + i);
const WIDTHS = [1, 2, 4, 6, 8];
const SHARDS = 3;

async function runSharded(pool, params, levels, seeds) {
  const size = Math.ceil(levels.length / SHARDS);
  const chunks = [];
  for (let i = 0; i < levels.length; i += size) {
    chunks.push(levels.slice(i, i + size).map((level) => level.level));
  }
  const started = Date.now();
  const parts = await Promise.all(chunks.map((numbers) => pool.run(params, numbers, seeds)));
  const scores = parts.flatMap((part) => part.scores);
  const wins = parts.reduce((total, part) => total + part.winRate * part.scores.length, 0);
  return {
    scores,
    winRate: wins / scores.length,
    wallSeconds: (Date.now() - started) / 1000,
  };
}

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
  console.log('paths     lift      t   winRate   winDelta   rel.cost');
  console.log('-----   ------   ----   -------   --------   --------');
  for (const row of rows) {
    const winDelta = row.winRate - referenceWinRate;
    console.log(
      `${String(row.pathWidth).padStart(5)}   ${(`${row.lift >= 0 ? '+' : ''}${(row.lift * 100).toFixed(2)}%`).padStart(6)}`
      + `   ${row.t.toFixed(1).padStart(4)}   ${(`${(row.winRate * 100).toFixed(2)}%`).padStart(7)}`
      + `   ${(`${winDelta >= 0 ? '+' : ''}${(winDelta * 100).toFixed(2)}pp`).padStart(8)}`
      + `   ${(`${row.relCost.toFixed(2)}x`).padStart(8)}`,
    );
  }
}

async function main() {
  const pool = createPool();
  try {
    console.log('Multi-path chain-search ablation');
    console.log(`screen: ${SCREEN_LEVELS.length} levels x ${SCREEN_SEEDS.length} seeds, widths ${WIDTHS.join(', ')}`);
    console.log(`confirmation: ${CONFIRM_LEVELS.length} levels x ${CONFIRM_SEEDS.length} seeds, one selected width`);

    const screenRuns = [];
    for (const pathWidth of WIDTHS) {
      const result = await runSharded(
        pool, { ...DEFAULT_PARAMS, offerFull: 0, pathWidth }, SCREEN_LEVELS, SCREEN_SEEDS,
      );
      screenRuns.push({ pathWidth, result });
      process.stderr.write(`screen width ${pathWidth} done\n`);
    }

    const screenReference = screenRuns[0].result;
    const screenRows = screenRuns.map(({ pathWidth, result }) => ({
      pathWidth,
      ...compare(result, screenReference, SCREEN_LEVELS.length, SCREEN_SEEDS.length),
    }));
    printRows('SCREEN (selection only)', screenRows, screenReference.winRate);

    const selected = screenRows.slice(1).sort((a, b) => b.lift - a.lift)[0];
    console.log(`\nselected width ${selected.pathWidth} by screen lift ${(selected.lift * 100).toFixed(2)}%`);
    if (!CONFIRM) return;

    const confirmReference = await runSharded(
      pool, { ...DEFAULT_PARAMS, offerFull: 0, pathWidth: 1 }, CONFIRM_LEVELS, CONFIRM_SEEDS,
    );
    process.stderr.write('confirmation reference done\n');
    const confirmCandidate = await runSharded(
      pool, { ...DEFAULT_PARAMS, offerFull: 0, pathWidth: selected.pathWidth },
      CONFIRM_LEVELS, CONFIRM_SEEDS,
    );
    process.stderr.write('confirmation candidate done\n');

    const confirmed = {
      pathWidth: selected.pathWidth,
      ...compare(
        confirmCandidate, confirmReference, CONFIRM_LEVELS.length, CONFIRM_SEEDS.length,
      ),
    };
    printRows('CONFIRMATION (reportable)', [confirmed], confirmReference.winRate);

    const winDelta = confirmed.winRate - confirmReference.winRate;
    const supported = confirmed.lift > 0 && confirmed.t > 3 && winDelta >= 0;
    console.log(`\nVERDICT: ${supported ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
    console.log(JSON.stringify({
      selectedPathWidth: selected.pathWidth,
      screenLift: selected.lift,
      confirmation: {
        lift: confirmed.lift,
        se: confirmed.se,
        t: confirmed.t,
        referenceWinRate: confirmReference.winRate,
        candidateWinRate: confirmed.winRate,
        winDelta,
        referenceMeanScore: mean(confirmReference.scores),
        candidateMeanScore: confirmed.meanScore,
        relCost: confirmed.relCost,
        supported,
      },
    }, null, 2));
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
