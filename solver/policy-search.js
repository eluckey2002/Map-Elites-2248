// Search over BOT POLICIES rather than over boards.
//
//   node solver/policy-search.js                       # default budget
//   node solver/policy-search.js --gens 20 --lambda 12
//   node solver/policy-search.js --screen-seeds 60 --holdout-seeds 300
//   node solver/policy-search.js --out .orch/policy-search-01.json
//
// WHY THIS SHAPE, in three rules that the board search broke:
//
// 1. FIXED SCREEN SEEDS. Every policy in the search is scored on the identical
//    (level, seed) grid. Because the engine is fully seeded, that makes the
//    search objective DETERMINISTIC — a policy has one true screen fitness, not
//    an estimate. There is therefore no winner's curse inside the search, and
//    MAP-Elites-style "keep the best" is safe here for the same reason.
//    The risk does not vanish, it MOVES: from selection bias to overfitting the
//    screen set, which is what rule 2 measures.
//
// 2. NEVER REPORT THE NUMBER YOU SELECTED ON. Finalists are re-scored on
//    disjoint holdout seeds AND on every shipped level, not just the search
//    subset. The headline number is always the holdout one. The gap between
//    screen and holdout is the generalization gap and is printed, because a
//    large one is the signal that the search found seed-specific luck.
//
// 3. SIZE THE SAMPLE FROM THE NOISE FLOOR, AND CLUSTER IT. Fitness is a PAIRED
//    per-cell ratio against the shipped policy, so between-board and
//    between-seed variance cancels rather than being averaged down. The
//    standard error is CLUSTER-ROBUST (see policy-eval.js): 250 seeds of one
//    level are one board, not 250 independent draws, and the naive error
//    inflates t by about sqrt(seeds per level). A lift smaller than ~3
//    clustered SE is not a finding.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const { DEFAULT_PARAMS } = require('./bot');
const { pairedLift, mean } = require('./policy-eval');
const { createPool, runSharded } = require('./policy-pool');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]);
};
const strFlag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};

const GENS = flag('gens', 12);
const LAMBDA = flag('lambda', 9);   // offspring per generation
const MU = flag('mu', 3);           // parents kept
const SCREEN_SEED_COUNT = flag('screen-seeds', 40);
const HOLDOUT_SEED_COUNT = flag('holdout-seeds', 250);
const FINALISTS = flag('finalists', 5);
const OUT = strFlag('out', null);

// A spread of the shipped curve: small early boards, the mid-game, the scaled
// late levels, and the one generated level. Kept small so the screen is cheap;
// the holdout runs every level, which is where level-overfitting would show.
const SCREEN_LEVELS = [1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51]
  .filter((n) => LEVELS.some((l) => l.level === n));
const HOLDOUT_LEVELS = LEVELS.map((l) => l.level);

// Disjoint by construction, and far apart so no shared PRNG state is possible.
const SCREEN_SEEDS = Array.from({ length: SCREEN_SEED_COUNT }, (_, i) => i);
const HOLDOUT_SEEDS = Array.from({ length: HOLDOUT_SEED_COUNT }, (_, i) => 1e6 + i);

// ---------------------------------------------------------------------------
// Genome. Bounds are generous but not unbounded: `width` and `bombMax` both buy
// accuracy with search time, so an unbounded search would drift toward "think
// harder" and report a win that is really just a bigger compute budget.
// ---------------------------------------------------------------------------
const GENES = {
  wRoll:    { min: 0, max: 6,   step: 0.25, int: false },
  wPlace:   { min: 0, max: 6,   step: 0.25, int: false },
  turnover: { min: 0, max: 300, step: 12,   int: false },
  width:    { min: 1, max: 32,  step: 3,    int: true },
  bombMax:  { min: 2, max: 14,  step: 1.5,  int: true },
};

function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(flag('seed', 20260819));
function gauss() {
  const u = Math.max(rng(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

const clamp = (v, g) => Math.min(g.max, Math.max(g.min, v));

// Mutates a random subset of genes rather than all of them, so a step is a
// small readable edit ("width up, turnover down") and a good parent is not
// destroyed wholesale by one draw.
function mutate(parent, scale = 1) {
  const child = { ...parent };
  const names = Object.keys(GENES);
  let touched = 0;
  while (touched === 0) {
    for (const name of names) {
      if (rng() < 0.45) {
        const g = GENES[name];
        let v = child[name] + gauss() * g.step * scale;
        v = clamp(v, g);
        child[name] = g.int ? Math.round(v) : Math.round(v * 1000) / 1000;
        touched += 1;
      }
    }
  }
  return child;
}

const key = (p) => Object.keys(GENES).map((k) => `${k}=${p[k]}`).join(' ');
const fmt = (p) => `w_roll ${p.wRoll} | w_place ${p.wPlace} | turnover ${p.turnover} | width ${p.width} | bombMax ${p.bombMax}`;

async function main() {
  const pool = createPool();
  const t0 = Date.now();
  const el = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

  console.log('Policy search over the 2248 bot');
  console.log(`  screen : ${SCREEN_LEVELS.length} levels x ${SCREEN_SEEDS.length} seeds = ${SCREEN_LEVELS.length * SCREEN_SEEDS.length} games/policy (fixed, deterministic)`);
  console.log(`  holdout: ${HOLDOUT_LEVELS.length} levels x ${HOLDOUT_SEEDS.length} seeds = ${HOLDOUT_LEVELS.length * HOLDOUT_SEEDS.length} games/policy (disjoint seeds)`);
  console.log(`  budget : ${GENS} generations x ${LAMBDA} offspring, mu=${MU}, ${pool.size} workers\n`);

  // The shipped policy is the reference every lift is measured against.
  const reference = { ...DEFAULT_PARAMS };
  const refScreen = await pool.run(reference, SCREEN_LEVELS, SCREEN_SEEDS);
  console.log(`[${el()}] reference (shipped bot): mean score ${mean(refScreen.scores).toFixed(0)}, win rate ${(refScreen.winRate * 100).toFixed(1)}%`);
  console.log(`           ${fmt(reference)}\n`);

  const seen = new Map(); // genome key -> screen result, so re-derived genomes are free
  seen.set(key(reference), { params: reference, lift: 0, se: 0, scores: refScreen.scores, winRate: refScreen.winRate });

  async function screen(params) {
    const k = key(params);
    if (seen.has(k)) return seen.get(k);
    const r = await pool.run(params, SCREEN_LEVELS, SCREEN_SEEDS);
    const lift = pairedLift(r.scores, refScreen.scores,
      { levelCount: SCREEN_LEVELS.length, seedCount: SCREEN_SEEDS.length });
    const entry = { params, ...lift, scores: r.scores, winRate: r.winRate };
    seen.set(k, entry);
    return entry;
  }

  // Generation 0 seeds the population with the shipped policy and hand-set
  // variants along each axis, so the search starts from a known-good point
  // instead of spending its first generations rediscovering one.
  let population = [
    { ...reference },
    { ...reference, width: 24 },
    { ...reference, turnover: 80 },
    { ...reference, wPlace: 0.5 },
    { ...reference, wRoll: 2 },
  ];

  let best = seen.get(key(reference));
  for (let gen = 0; gen <= GENS; gen++) {
    const scored = await Promise.all(population.map(screen));
    scored.sort((a, b) => b.lift - a.lift);
    const parents = scored.slice(0, MU);
    if (parents[0].lift > best.lift) best = parents[0];

    console.log(
      `[${el()}] gen ${String(gen).padStart(2)}  best ${(best.lift * 100 >= 0 ? '+' : '') + (best.lift * 100).toFixed(2)}%`
      + ` (SE ${(best.se * 100).toFixed(2)}%, t ${best.t.toFixed(1)})  ${fmt(best.params)}`,
    );

    if (gen === GENS) break;
    // Step size decays: broad early, refining late.
    const scale = 1.0 - 0.6 * (gen / GENS);
    population = [];
    for (let i = 0; i < LAMBDA; i++) {
      population.push(mutate(parents[i % parents.length].params, scale));
    }
    population.push(...parents.map((p) => p.params)); // elitism: (mu + lambda)
  }

  // -------------------------------------------------------------------------
  // Validation. This is the whole point of the exercise: the number above was
  // selected on, so it is not evidence. These are.
  // -------------------------------------------------------------------------
  const finalists = [...seen.values()]
    .sort((a, b) => b.lift - a.lift)
    .slice(0, FINALISTS);
  const candidates = [reference, ...finalists.map((f) => f.params)]
    .filter((p, i, arr) => arr.findIndex((q) => key(q) === key(p)) === i);

  console.log(`\n[${el()}] validating ${candidates.length} policies on holdout seeds x all ${HOLDOUT_LEVELS.length} levels...`);
  // Candidates run concurrently: they are independent, and validation is the
  // expensive half (every level x every holdout seed), so serialising it would
  // leave eight of nine workers idle for the longest phase of the run.
  // Sharded per policy AND sequential across policies: one policy spread over
  // every worker finishes in a predictable time, where running six policies
  // concurrently on one worker each meant the whole phase waited on the slowest
  // single-threaded arm. The first attempt at this run was killed part-way
  // through validation for exactly that reason.
  const holdout = [];
  for (const params of candidates) {
    holdout.push({ params, result: await runSharded(pool, params, HOLDOUT_LEVELS, HOLDOUT_SEEDS) });
    process.stderr.write(`  ${el()} ${holdout.length}/${candidates.length}\n`);
  }
  const refHold = holdout[0].result;

  const rows = holdout.map(({ params, result }) => {
    const lift = pairedLift(result.scores, refHold.scores,
      { levelCount: HOLDOUT_LEVELS.length, seedCount: HOLDOUT_SEEDS.length });
    const screened = seen.get(key(params));
    return {
      params,
      screenLift: screened ? screened.lift : null,
      holdoutLift: lift.lift,
      se: lift.se,
      t: lift.t,
      seNaive: lift.seNaive,
      winRate: result.winRate,
      avgMovesToTarget: result.avgMovesToTarget,
      // Per-level lift, already computed by the clustered estimator and
      // previously discarded. This is the row that says WHICH levels a policy
      // change helps — one level moved +8% while another moved -0.4% under the
      // same change, and that spread is invisible in the headline mean.
      byLevel: lift.byLevel,
    };
  });

  console.log('\n=== HOLDOUT RESULTS (the reportable numbers) ===\n');
  console.log('policy                                                    screen   holdout   clustSE   naiveSE      t    gap   winRate');
  console.log('-------------------------------------------------------   ------   -------   -------   -------   ----   ----   -------');
  for (const r of rows) {
    const g = r.screenLift === null ? '   -' : `${((r.holdoutLift - r.screenLift) * 100 >= 0 ? '+' : '') + ((r.holdoutLift - r.screenLift) * 100).toFixed(1)}`;
    console.log(
      `${fmt(r.params).padEnd(57)}   ${(r.screenLift === null ? '-' : ((r.screenLift * 100 >= 0 ? '+' : '') + (r.screenLift * 100).toFixed(2)) + '%').padStart(6)}`
      + `   ${((r.holdoutLift * 100 >= 0 ? '+' : '') + (r.holdoutLift * 100).toFixed(2) + '%').padStart(7)}`
      + `   ${((r.se * 100).toFixed(2) + '%').padStart(7)}   ${((r.seNaive * 100).toFixed(2) + '%').padStart(7)}`
      + `   ${r.t.toFixed(1).padStart(4)}   ${g.padStart(4)}   ${(r.winRate * 100).toFixed(1)}%`,
    );
  }

  const bestHold = rows.slice(1).sort((a, b) => b.holdoutLift - a.holdoutLift)[0];
  console.log('');
  if (!bestHold) {
    console.log('VERDICT: no candidate beat the shipped policy on the screen.');
  } else if (bestHold.t > 3) {
    console.log(`VERDICT: real gain. ${(bestHold.holdoutLift * 100).toFixed(2)}% over the shipped bot on unseen seeds and all levels, t = ${bestHold.t.toFixed(1)}.`);
    console.log(`         ${fmt(bestHold.params)}`);
    console.log(`         win rate ${(refHold.winRate * 100).toFixed(1)}% -> ${(bestHold.winRate * 100).toFixed(1)}%`);
  } else {
    console.log(`VERDICT: not established. Best holdout lift ${(bestHold.holdoutLift * 100).toFixed(2)}% at t = ${bestHold.t.toFixed(1)}; needs t > 3.`);
  }
  const gaps = rows.slice(1).map((r) => r.holdoutLift - r.screenLift);
  if (gaps.length) {
    console.log(`\nGeneralization gap (holdout - screen), mean ${(mean(gaps) * 100).toFixed(2)} points.`);
    console.log('A large negative gap means the search fitted the screen seeds; that is the winner\'s curse in its policy-search form.');
  }

  if (OUT) {
    const outPath = path.isAbsolute(OUT) ? OUT : path.join(ROOT, OUT);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      config: { GENS, LAMBDA, MU, SCREEN_LEVELS, SCREEN_SEED_COUNT, HOLDOUT_SEED_COUNT, HOLDOUT_LEVELS },
      reference,
      referenceHoldout: { meanScore: mean(refHold.scores), winRate: refHold.winRate },
      rows: rows.map(({ params, screenLift, holdoutLift, se, seNaive, t, winRate, avgMovesToTarget, byLevel }) =>
        ({ params, screenLift, holdoutLift, se, seNaive, t, winRate, avgMovesToTarget, byLevel })),
      searchTrace: [...seen.values()].map((e) => ({ params: e.params, screenLift: e.lift, se: e.se })),
    }, null, 2));
    console.log(`\nwrote ${outPath}`);

    // The run already played every one of these games. Keeping only six
    // summary numbers per policy threw away the whole (policy x level x seed)
    // score table, so each search left nothing behind for the next one and
    // any new question meant paying for the games again.
    //
    // The table is what answers questions the headline cannot: which levels
    // separate policies, which policies disagree about which boards, whether
    // a level is hard for everyone or only for the shipped bot. Those are
    // exactly the level-quality signals the board search failed to measure.
    //
    // Written as a sidecar so the main file stays readable. Cells are stored
    // level-major — cell (j, k) is level j, seed k, at index j * seeds + k —
    // matching the layout pairedLift already assumes. Roughly 1 MB per run.
    const cellsPath = `${outPath.replace(/\.json$/, '')}.cells.json`;
    fs.writeFileSync(cellsPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      layout: 'level-major: index = levelIndex * seeds.length + seedIndex',
      screen: {
        levels: SCREEN_LEVELS,
        seeds: SCREEN_SEEDS,
        policies: [...seen.values()].map((e) => ({ params: e.params, scores: e.scores })),
      },
      holdout: {
        levels: HOLDOUT_LEVELS,
        seeds: HOLDOUT_SEEDS,
        policies: holdout.map((h) => ({ params: h.params, scores: h.result.scores })),
      },
    }));
    const mb = (fs.statSync(cellsPath).size / 1e6).toFixed(1);
    console.log(`wrote ${cellsPath} (${mb} MB: `
      + `${seen.size} screened policies x ${SCREEN_LEVELS.length * SCREEN_SEEDS.length} cells, `
      + `${holdout.length} validated x ${HOLDOUT_LEVELS.length * HOLDOUT_SEEDS.length} cells)`);
  }

  await pool.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
