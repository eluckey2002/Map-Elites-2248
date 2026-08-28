// Does offering the lookahead the untrimmed chain translate into game score?
//
// `chooseMove` receives candidates already cut back to a mergeable-sum prefix,
// so the larger chain the walk found is discarded before `rolloutValue` and
// `harvestValue` -- the terms that exist to price future board damage -- can
// weigh it. On opening boards the bot plays 5,120 where its own untrimmed walk
// reached 9,600 (level 52 seed 2) and 9,920 (level 51 seed 2).
//
// Finding better chains is not the same claim as playing better. An off-lattice
// sum makes a tile that can never merge again, which is a loss the player could
// not have avoided, so a bot that scores more while winning less is worse. Only
// outcomes settle it, and win rate is a falsifier here, not a footnote.
//
// Arms are pinned explicitly rather than read from DEFAULT_PARAMS, so this
// keeps measuring the same comparison after the default flips.
//
//   node solver/chain-offer-ablation.js                              # 300 seeds
//   node solver/chain-offer-ablation.js --seeds 100 --first 5000000  # pilot
//
// Seed sets in use across the project, all disjoint: 0-39 search screen,
// 1e6+ search holdout, 2e6+ width ablation, 3e6+ routing confirmation,
// 4e6+ routing pilot, 5e6+ this pilot, 6e6+ this confirmation. Nothing is ever
// reported on seeds it was selected on.
//
// Pre-registered at .orch/runs/chain-offer-2026-08-21/preregistration.md:
// t > 3 on paired score is the bar, a fall in win rate falsifies, and only the
// confirmation seed set is reportable.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const { DEFAULT_PARAMS } = require('./bot');
const { pairedLift, mean } = require('./policy-eval');
const { createPool } = require('./policy-pool');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : Number(argv[i + 1]); };
const strFlag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };

const SEED_COUNT = flag('seeds', 300);
const FIRST = flag('first', 6e6);
const OUT = strFlag('out', null);
const SHARDS = flag('shards', 3);
const LEVEL_NUMBERS = LEVELS.map((l) => l.level);
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => FIRST + i);

const ARMS = [
  { name: 'trimmed only', params: { ...DEFAULT_PARAMS, offerFull: 0 } },
  { name: 'untrimmed offered', params: { ...DEFAULT_PARAMS, offerFull: 1 } },
];

// Level-major cell order is what the cluster-robust standard error relies on.
async function runSharded(pool, params) {
  const size = Math.ceil(LEVEL_NUMBERS.length / SHARDS);
  const chunks = [];
  for (let i = 0; i < LEVEL_NUMBERS.length; i += size) chunks.push(LEVEL_NUMBERS.slice(i, i + size));
  const parts = await Promise.all(chunks.map((c) => pool.run(params, c, SEEDS)));
  const scores = parts.flatMap((p) => p.scores);
  const wins = parts.reduce((a, p) => a + p.winRate * p.scores.length, 0);
  return { scores, winRate: wins / scores.length };
}

async function main() {
  const pool = createPool();
  const t0 = Date.now();
  const isPilot = FIRST === 5e6;
  console.log(`Chain-offer ablation${isPilot ? ' [PILOT -- screen only, not reportable]' : ''}`);
  console.log(`  ${LEVEL_NUMBERS.length} levels x ${SEED_COUNT} seeds = ${LEVEL_NUMBERS.length * SEED_COUNT} games per arm`);
  console.log(`  seeds ${SEEDS[0]}..${SEEDS[SEEDS.length - 1]}, ${pool.size} workers\n`);

  const results = [];
  for (const arm of ARMS) {
    const t = Date.now();
    const r = await runSharded(pool, arm.params);
    results.push({ ...arm, ...r, wallSeconds: (Date.now() - t) / 1000 });
    process.stderr.write(`  ${arm.name} done (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }

  const ref = results[0];
  const layout = { levelCount: LEVEL_NUMBERS.length, seedCount: SEED_COUNT };
  const rows = results.map((r) => ({
    name: r.name,
    ...pairedLift(r.scores, ref.scores, layout),
    winRate: r.winRate,
    meanScore: mean(r.scores),
    relCost: r.wallSeconds / ref.wallSeconds,
  }));

  console.log('\n=== CHAIN-OFFER ABLATION (lift vs the trimmed-only bot, unseen seeds) ===\n');
  console.log('arm                   lift   clustSE   naiveSE      t   winRate   meanScore   rel.cost');
  console.log('-----------------   ------   -------   -------   ----   -------   ---------   --------');
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(17)}   ${(((r.lift * 100) >= 0 ? '+' : '') + (r.lift * 100).toFixed(2) + '%').padStart(6)}`
      + `   ${((r.se * 100).toFixed(2) + '%').padStart(7)}   ${((r.seNaive * 100).toFixed(2) + '%').padStart(7)}`
      + `   ${r.t.toFixed(1).padStart(4)}   ${((r.winRate * 100).toFixed(1) + '%').padStart(7)}`
      + `   ${r.meanScore.toFixed(0).padStart(9)}   ${r.relCost.toFixed(2)}x`,
    );
  }

  const arm = rows[1];

  // P1: the pre-registered outcome classes. Nothing here picks a bar after the fact.
  let p1;
  if (arm.lift > 0 && arm.t > 3) p1 = 'SUPPORTED';
  else if (arm.lift < 0 && arm.t < -3) p1 = 'FALSIFIED';
  else p1 = 'INCONCLUSIVE';
  console.log(`\nP1 (paired score, needs t > 3):  ${p1}`
    + `  -- ${(arm.lift * 100).toFixed(2)}% at t = ${arm.t.toFixed(1)}`);

  // P2: a bot that scores more while winning less is worse, not better.
  const winDelta = arm.winRate - ref.winRate;
  const p2 = winDelta < 0 ? 'FALSIFIED' : 'not falsified';
  console.log(`P2 (win rate must not fall):     ${p2}`
    + `  -- ${(ref.winRate * 100).toFixed(1)}% -> ${(arm.winRate * 100).toFixed(1)}%`
    + ` (${winDelta >= 0 ? '+' : ''}${(winDelta * 100).toFixed(1)} points)`);

  // P3: no compute-matched control exists -- width saturates, so it cannot buy
  // these candidates. Calibration only: width 12->24 was 1.36x for +1.10%.
  console.log(`P3 (is it just compute?):        ${arm.relCost.toFixed(2)}x cost for ${(arm.lift * 100).toFixed(2)}%`
    + `  -- calibration: width 12->24 was 1.36x for +1.10%`);

  const ranked = arm.byLevel.map((v, i) => [v, LEVEL_NUMBERS[i]]).sort((a, b) => b[0] - a[0]);
  console.log(`\nPer level: best L${ranked[0][1]} ${(ranked[0][0] * 100).toFixed(1)}%, `
    + `worst L${ranked[ranked.length - 1][1]} ${(ranked[ranked.length - 1][0] * 100).toFixed(1)}%, `
    + `${arm.byLevel.filter((v) => v < 0).length} of ${arm.byLevel.length} levels hurt.`);

  if (isPilot) {
    console.log('\nPILOT STOPPING RULE: continue to confirmation unless lift < 0 at t < -2.');
    console.log(`  -> ${arm.lift < 0 && arm.t < -2 ? 'STOP. Report FALSIFIED on the pilot.' : 'continue to the confirmation run.'}`);
  } else {
    console.log('\nAdoption is a separate decision. A stronger bot re-prices every future');
    console.log('level target, since a target is demand x measured achievable score.');
    console.log('Shipped levels keep the targets they were admitted with.');
  }

  if (OUT) {
    const outPath = path.isAbsolute(OUT) ? OUT : path.join(ROOT, OUT);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      preregistration: '.orch/runs/chain-offer-2026-08-21/preregistration.md',
      pilot: isPilot,
      levels: LEVEL_NUMBERS, seedCount: SEED_COUNT, firstSeed: SEEDS[0],
      outcomes: { P1: p1, P2: p2 },
      rows: rows.map(({ byLevel, ...keep }) => keep),
      perLevelLift: Object.fromEntries(rows.map((r) => [r.name, r.byLevel])),
    }, null, 2));
    console.log(`\nwrote ${outPath}`);
  }
  await pool.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
