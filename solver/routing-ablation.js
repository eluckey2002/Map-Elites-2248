// Does the chain walk's tie-break translate into game score?
//
// `chain-coverage.js` shows the tie-break finds better chains. That is not the
// same claim as playing better: a longer chain empties more of the board, and
// the lookahead may already have been compensating for the walk's blind spots.
// Only outcomes settle it.
//
// Arms are pinned explicitly rather than read from DEFAULT_PARAMS, so this
// keeps measuring the same comparison after the default flips.
//
//   node solver/routing-ablation.js                                  # 300 seeds
//   node solver/routing-ablation.js --seeds 100 --first 4000000      # pilot
//
// Seed sets in use across the project, all disjoint: 0-39 search screen,
// 1e6+ search holdout, 2e6+ width ablation, 3e6+ this confirmation,
// 4e6+ this pilot. Nothing is ever reported on seeds it was selected on.
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
const FIRST = flag('first', 3e6);
const OUT = strFlag('out', null);

const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');
// Refuse before spending the run, not after it. Writing an artifact means
// producing evidence a generalizing claim may rest on, so --out requires a
// protocol registered in advance; --exploratory runs without one and says so.
const REGISTRATION = OUT
  ? requireProtocolOrExit(process.argv, { name: 'routing-ablation --out' })
  : { exploratory: true, protocolCommit: null, resultId: null };
const REGISTRATION_STAMP = registrationStamp(REGISTRATION);
const SHARDS = flag('shards', 3);
const LEVEL_NUMBERS = LEVELS.map((l) => l.level);
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => FIRST + i);

const ARMS = [
  { name: 'plain walk', params: { ...DEFAULT_PARAMS, tieBreak: 'none' } },
  { name: 'degree tie-break', params: { ...DEFAULT_PARAMS, tieBreak: 'degree' } },
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
  console.log('Chain-routing ablation');
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
    params: r.params,
    ...pairedLift(r.scores, ref.scores, layout),
    winRate: r.winRate,
    meanScore: mean(r.scores),
    relCost: r.wallSeconds / ref.wallSeconds,
  }));

  console.log('\n=== ROUTING ABLATION (lift vs the plain walk, on unseen seeds) ===\n');
  console.log('arm                  lift   clustSE   naiveSE      t   winRate   meanScore   rel.cost');
  console.log('----------------   ------   -------   -------   ----   -------   ---------   --------');
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(16)}   ${(((r.lift * 100) >= 0 ? '+' : '') + (r.lift * 100).toFixed(2) + '%').padStart(6)}`
      + `   ${((r.se * 100).toFixed(2) + '%').padStart(7)}   ${((r.seNaive * 100).toFixed(2) + '%').padStart(7)}`
      + `   ${r.t.toFixed(1).padStart(4)}   ${((r.winRate * 100).toFixed(1) + '%').padStart(7)}`
      + `   ${r.meanScore.toFixed(0).padStart(9)}   ${r.relCost.toFixed(2)}x`,
    );
  }

  const arm = rows[1];
  console.log(`\n${arm.t > 3 ? 'ESTABLISHED' : 'NOT ESTABLISHED'}: `
    + `${(arm.lift * 100).toFixed(2)}% at t = ${arm.t.toFixed(1)} (needs t > 3).`);
  const ranked = arm.byLevel.map((v, i) => [v, LEVEL_NUMBERS[i]]).sort((a, b) => b[0] - a[0]);
  console.log(`Per level: best L${ranked[0][1]} ${(ranked[0][0] * 100).toFixed(1)}%, `
    + `worst L${ranked[ranked.length - 1][1]} ${(ranked[ranked.length - 1][0] * 100).toFixed(1)}%, `
    + `${arm.byLevel.filter((v) => v < 0).length} of ${arm.byLevel.length} levels hurt.`);
  console.log(`\nCalibration note: a target is demand x measured achievable score, so a level`);
  console.log(`authored after this change is pitched about ${(arm.lift * 100).toFixed(1)}% higher at the same demand.`);
  console.log('Shipped levels keep the targets they were admitted with.');

  if (OUT) {
    const outPath = path.isAbsolute(OUT) ? OUT : path.join(ROOT, OUT);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      registration: REGISTRATION_STAMP,
      levels: LEVEL_NUMBERS, seedCount: SEED_COUNT, firstSeed: SEEDS[0],
      rows: rows.map(({ byLevel, ...keep }) => keep),
      perLevelLift: Object.fromEntries(rows.map((r) => [r.name, r.byLevel])),
    }, null, 2));
    console.log(`\nwrote ${outPath}`);
  }
  await pool.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
