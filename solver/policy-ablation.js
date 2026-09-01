// Width-pinned ablation: is the searched policy actually a better POLICY, or
// did the search just buy itself more compute?
//
// The winner of policy-search-01 changed three things at once — the ranking
// weights, the bomb-search depth, and the candidate width (12 -> 27). Width is
// not a strategy: it is the number of candidates the lookahead is allowed to
// score, so raising it makes the bot think harder per move and costs
// proportional time. A gain that is entirely width is a real gain in score and
// a fake gain in policy quality, and only one of those transfers to a cheaper
// setting or a different search budget.
//
// So each arm changes one thing against the shipped bot:
//
//   ref            shipped bot
//   width-only     shipped weights,  width 27      -> how much is compute?
//   weights-only   searched weights, width 12      -> how much is strategy?
//   +bombMax       weights-only, plus bomb depth 8 -> how much is the depth cut?
//   full           the searched winner             -> do they add up?
//
// Run on a THIRD seed set, disjoint from both the search screen and the
// search's own holdout, so no arm is being scored on anything ever selected on.
//
//   node solver/policy-ablation.js
//   node solver/policy-ablation.js --seeds 300 --out .orch/policy-ablation-01.json
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
const OUT = strFlag('out', null);

const { registrationStamp, requireProtocolOrExit } = require('./experiment-guard');
// Refuse before spending the run, not after it. Writing an artifact means
// producing evidence a generalizing claim may rest on, so --out requires a
// protocol registered in advance; --exploratory runs without one and says so.
const REGISTRATION = OUT
  ? requireProtocolOrExit(process.argv, { name: 'policy-ablation --out' })
  : { exploratory: true, protocolCommit: null, resultId: null };
const REGISTRATION_STAMP = registrationStamp(REGISTRATION);
const LEVEL_NUMBERS = LEVELS.map((l) => l.level);
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => 2e6 + i); // third, disjoint set

const SEARCHED = { wRoll: 0.813, wPlace: 1.432, turnover: 44.655, width: 27, bombMax: 8 };

const ARMS = [
  { name: 'ref (shipped)',   params: { ...DEFAULT_PARAMS } },
  { name: 'width-only',      params: { ...DEFAULT_PARAMS, width: SEARCHED.width } },
  { name: 'weights-only',    params: { ...DEFAULT_PARAMS, wRoll: SEARCHED.wRoll, wPlace: SEARCHED.wPlace, turnover: SEARCHED.turnover } },
  { name: 'weights+bombMax', params: { ...DEFAULT_PARAMS, wRoll: SEARCHED.wRoll, wPlace: SEARCHED.wPlace, turnover: SEARCHED.turnover, bombMax: SEARCHED.bombMax } },
  { name: 'full (searched)', params: { ...SEARCHED } },
];

// Splits one arm's games across workers by level block. Cells stay level-major
// in the original level order, which is what the cluster-robust SE relies on.
const SHARDS = flag('shards', 3);
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
  console.log('Width-pinned ablation');
  console.log(`  ${LEVEL_NUMBERS.length} levels x ${SEED_COUNT} seeds = ${LEVEL_NUMBERS.length * SEED_COUNT} games per arm`);
  console.log(`  seeds ${SEEDS[0]}..${SEEDS[SEEDS.length - 1]} — disjoint from the search screen (0-39) and its holdout (1e6+)`);
  console.log(`  ${pool.size} workers, ${SHARDS} shards per arm\n`);

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

  console.log('\n=== ABLATION (all lifts vs the shipped bot, on unseen seeds) ===\n');
  console.log('arm               width  bombMax     lift   clustSE   naiveSE      t   winRate   rel.cost');
  console.log('---------------   -----  -------   ------   -------   -------   ----   -------   --------');
  for (const r of rows) {
    console.log(
      `${r.name.padEnd(15)}   ${String(r.params.width).padStart(5)}  ${String(r.params.bombMax).padStart(7)}`
      + `   ${(((r.lift * 100) >= 0 ? '+' : '') + (r.lift * 100).toFixed(2) + '%').padStart(6)}`
      + `   ${((r.se * 100).toFixed(2) + '%').padStart(7)}   ${((r.seNaive * 100).toFixed(2) + '%').padStart(7)}`
      + `   ${r.t.toFixed(1).padStart(4)}   ${((r.winRate * 100).toFixed(1) + '%').padStart(7)}`
      + `   ${r.relCost.toFixed(2)}x`,
    );
  }

  const by = (n) => rows.find((r) => r.name.startsWith(n));
  const full = by('full'), widthOnly = by('width-only'), weightsOnly = by('weights-only');
  console.log('\n--- decomposition ---');
  console.log(`full searched policy      ${(full.lift * 100).toFixed(2)}%  (t ${full.t.toFixed(1)}, ${full.relCost.toFixed(2)}x cost)`);
  console.log(`  of which width alone    ${(widthOnly.lift * 100).toFixed(2)}%  (t ${widthOnly.t.toFixed(1)}, ${widthOnly.relCost.toFixed(2)}x cost)`);
  console.log(`  of which weights alone  ${(weightsOnly.lift * 100).toFixed(2)}%  (t ${weightsOnly.t.toFixed(1)}, ${weightsOnly.relCost.toFixed(2)}x cost)`);
  const share = full.lift !== 0 ? (widthOnly.lift / full.lift) * 100 : 0;
  console.log(`\nWidth accounts for ${share.toFixed(0)}% of the searched policy's gain.`);
  if (weightsOnly.t > 3) {
    console.log(`The weight change is a REAL strategy gain at fixed compute: ${(weightsOnly.lift * 100).toFixed(2)}% at width 12, t = ${weightsOnly.t.toFixed(1)}.`);
  } else {
    console.log(`At fixed compute the weight change is NOT established: ${(weightsOnly.lift * 100).toFixed(2)}% at t = ${weightsOnly.t.toFixed(1)} (needs t > 3).`);
  }

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
