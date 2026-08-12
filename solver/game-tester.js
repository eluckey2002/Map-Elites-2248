// Compares tile-scaling policies across all 50 levels and reports what each
// one does to achievable score, win rate, and the target curve.
//
// A policy answers one question: what tile scale does level N use? Everything
// else (targets, win rates, monotonicity) is DERIVED from measurement, not
// authored. Add a policy to POLICIES and re-run.
//
//   node solver/game-tester.js               # all policies, 150 seeds
//   node solver/game-tester.js --seeds 300
//   node solver/game-tester.js --policy chapters --detail
const fs = require('fs');
const ROOT = require('path').join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require(`${ROOT}/solver/engine`);
const { chooseMove } = require(`${ROOT}/solver/bot`);

const LOOKAHEAD_BASE = 987654321; // must match solver/sweep.js
const argv = process.argv.slice(2);
const SEEDS = Number(argv[argv.indexOf('--seeds') + 1]) || 150;
const DETAIL = argv.includes('--detail');
const ONLY = argv.includes('--policy') ? argv[argv.indexOf('--policy') + 1] : null;
const MOVES_SWEEP = argv.includes('--moves-sweep');
const JSON_OUT = argv.includes('--json');

// ---------------------------------------------------------------------------
// The difficulty curve, as DEMAND: what share of a level's achievable score the
// target asks for. Win rate is the outcome and is reported, not the input --
// it saturates at the easy end, where every trivially-winnable level maps to
// 100% and the target has nowhere left to climb. Demand does not saturate, so
// the tutorial ladder can rise on an unchanging board, which is what the
// original hand-authored curve did: level 1 asks 500 of ~5,800 achievable.
// ---------------------------------------------------------------------------
const DEMAND_ANCHORS = [[1, 0.09], [5, 0.45], [10, 0.80], [20, 0.90], [35, 1.00], [50, 1.08]];

function targetDemand(level) {
  for (let i = 0; i < DEMAND_ANCHORS.length - 1; i++) {
    const [aL, aD] = DEMAND_ANCHORS[i];
    const [bL, bD] = DEMAND_ANCHORS[i + 1];
    if (level >= aL && level <= bL) return aD + ((level - aL) / (bL - aL)) * (bD - aD);
  }
  return DEMAND_ANCHORS[DEMAND_ANCHORS.length - 1][1];
}

// ---------------------------------------------------------------------------
// POLICIES - each maps a level number to a tile scale (any positive integer;
// verified above to be an exact isomorphism). `ctx.baseMedian(level)` gives the
// unscaled median score there, so a policy can aim at a score curve rather than
// guess at a schedule.
// ---------------------------------------------------------------------------

// Scale chosen so this level's achievable score lands on a smooth geometric
// ramp from level 1's natural ceiling up to `ramp` times it by level 50. This
// is the lever doing the work: it cancels the level-to-level jaggedness in what
// the board can pay, which is what makes a target curve rise smoothly.
function smoothScale(ramp) {
  return (level, ctx) => {
    const anchor = ctx.baseMedian(1);
    const wanted = anchor * ramp ** ((level - 1) / 49);
    return Math.max(1, Math.round(wanted / ctx.baseMedian(level)));
  };
}

// smoothScale, then the smallest bump that keeps the target above the previous
// level's. Safe now that demand rises on its own: the repair only has to cover
// integer-rounding residue, so it does not ratchet the way it did when every
// easy level derived an identical target and scale was the only way to climb.
// The scale is deliberately NOT held non-decreasing. Forcing that ratchets:
// each repair raises a floor that later repairs must clear, and level 50 runs
// away to x99 / 478,000 instead of x27 / 130,000. The cost of letting it float
// is mild jitter in starting tile values between levels (x21, x16, x21 across
// 37-43), which is invisible next to a five-fold inflation of every late target.
function smoothMonotone(ramp) {
  const inner = smoothScale(ramp);
  return (level, ctx, prev) => {
    let scale = inner(level, ctx);
    while (prev && ctx.targetFor(level, scale) <= prev.derived && scale < 100000) scale += 1;
    return scale;
  };
}

// Tiles stay on powers of two - 2/4/8, 4/8/16, 8/16/32 - by letting the scale
// double only at chapter breaks and giving the fine control to demand instead.
// Demand sawtooths: it resets down when a chapter hands you bigger tiles, then
// tightens across the chapter. That keeps the target rising smoothly through a
// x2 jump in achievable score, and gives each chapter a shape - room to breathe
// when the numbers grow, squeezing by the end.
const CHAPTERS = [
  { from: 1, to: 10, scale: 1, demand: [0.09, 0.80] },
  { from: 11, to: 20, scale: 2, demand: [0.55, 0.85] },
  { from: 21, to: 30, scale: 4, demand: [0.58, 0.90] },
  { from: 31, to: 40, scale: 8, demand: [0.62, 0.96] },
  { from: 41, to: 50, scale: 16, demand: [0.66, 1.06] },
];

const chapterFor = (l) => CHAPTERS.find((c) => l >= c.from && l <= c.to);

function sawtoothDemand(level) {
  const c = chapterFor(level);
  const t = (level - c.from) / (c.to - c.from);
  return c.demand[0] + t * (c.demand[1] - c.demand[0]);
}

const POLICIES = [
  {
    name: 'flat',
    description: 'ships today: every level uses 2/4/8',
    scaleFor: () => 1,
  },
  {
    name: 'chapters',
    description: 'doubles where the game already changes chapter',
    scaleFor: (l) => (l <= 10 ? 1 : l <= 25 ? 2 : l <= 30 ? 4 : l <= 39 ? 8 : 16),
  },
  {
    name: 'every15',
    description: 'doubles every 15 levels - slowest doubling ramp',
    scaleFor: (l) => 2 ** Math.floor((l - 1) / 15),
  },
  {
    name: 'smooth6',
    description: 'per-level scale, achievable score rises 6x across the game',
    scaleFor: smoothScale(6),
  },
  {
    name: 'smooth12',
    description: 'per-level scale, achievable score rises 12x across the game',
    scaleFor: smoothScale(12),
  },
  {
    name: 'smooth25',
    description: 'per-level scale, achievable score rises 25x across the game',
    scaleFor: smoothScale(25),
  },
  {
    name: 'rising12',
    description: 'smooth12 plus a repair that keeps every target above the last',
    scaleFor: smoothMonotone(12),
  },
  {
    name: 'rising25',
    description: 'smooth25 plus a repair that keeps every target above the last',
    scaleFor: smoothMonotone(25),
  },
  {
    name: 'powers2',
    description: 'tiles stay powers of two; demand sawtooths within each chapter',
    scaleFor: (l) => chapterFor(l).scale,
    demandFor: sawtoothDemand,
  },
];

// ---------------------------------------------------------------------------

function playOut(level, rng) {
  const state = createLevelState(level, rng);
  for (let i = 0; i < level.moves + 5; i++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) });
    if (!chain) return { score: state.score, moves: state.moves, end: 'no valid moves' };
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score, moves: state.moves, end: 'bomb exploded' };
    if (state.moves >= state.maxMoves) return { score: state.score, moves: state.moves, end: 'out of moves' };
  }
  return { score: state.score, moves: state.moves, end: 'hard cap' };
}

// A uniform tile scale should be an exact isomorphism. This is the assumption
// every derived number below rests on, so it is measured, not asserted.
function verifyScaleInvariance() {
  const failures = [];
  let checks = 0;
  for (const lvl of [1, 15, 26, 35, 50]) {
    const base = LEVELS.find((l) => l.level === lvl);
    // Non-powers-of-2 included deliberately: the isomorphism argument rests on
    // equal-or-double matching plus summing merges, which any integer scale
    // preserves. If that reasoning is wrong, 3/5/7 are where it shows.
    for (const scale of [2, 3, 4, 5, 7, 16]) {
      for (let seed = 0; seed < 4; seed++) {
        const a = playOut({ ...base, target: Infinity, tileScale: 1 }, makeRng(seed));
        const b = playOut({ ...base, target: Infinity, tileScale: scale }, makeRng(seed));
        checks += 1;
        if (b.score !== a.score * scale || b.moves !== a.moves || b.end !== a.end) {
          failures.push(`level ${lvl} scale ${scale} seed ${seed}: ${a.score}x${scale}=${a.score * scale} but got ${b.score} (${a.end} vs ${b.end})`);
        }
      }
    }
  }
  return { checks, failures };
}

function scoreDistribution(shipped, scale, seedBase) {
  const level = { ...shipped, target: Infinity, tileScale: scale };
  const scores = [];
  let died = 0;
  for (let s = 0; s < SEEDS; s++) {
    const out = playOut(level, makeRng(seedBase + s));
    scores.push(out.score);
    if (out.end !== 'out of moves') died += 1;
  }
  scores.sort((a, b) => a - b);
  return { scores, died };
}

const quantile = (sorted, q) => sorted[Math.min(Math.floor(sorted.length * q), sorted.length - 1)];

// Round to a number that reads as authored rather than computed. Rounds DOWN,
// so a level never comes out harder than its intended win rate. The step stays
// ~1% of the value: a coarser step than the ladder's per-level increment would
// swallow the increment whole and force the scale search to overshoot.
function roundTarget(v) {
  const step = v >= 100000 ? 1000 : v >= 10000 ? 100 : v >= 1000 ? 50 : 10;
  return Math.max(step, Math.floor(v / step) * step);
}

// ---------------------------------------------------------------------------

console.log('Verifying that a uniform tile scale is an exact isomorphism...');
const inv = verifyScaleInvariance();
if (inv.failures.length) {
  console.log(`  FAIL - ${inv.failures.length}/${inv.checks} checks broke the assumption:`);
  inv.failures.slice(0, 5).forEach((f) => console.log(`    ${f}`));
  console.log('  Derived numbers below would be invalid. Stopping.');
  process.exit(1);
}
console.log(`  PASS - ${inv.checks}/${inv.checks} checks: score scales exactly, play is identical.\n`);

// How achievable score responds to the move budget, per level. Needed because
// inside a chapter the tile scale is fixed, so moves is the only lever left to
// stop achievable score sagging as blockers accumulate - which is what makes a
// target step backwards. Measured, not derived: unlike tile scale, changing the
// budget is not an isomorphism.
if (MOVES_SWEEP) {
  const DELTAS = [-6, -3, 0, 3, 6, 10];
  const out = {};
  process.stderr.write('Sweeping move budgets');
  for (const shipped of LEVELS) {
    out[shipped.level] = {};
    for (const d of DELTAS) {
      const moves = Math.max(8, shipped.moves + d);
      const dist = scoreDistribution({ ...shipped, moves }, 1, 0);
      out[shipped.level][moves] = {
        median: quantile(dist.scores, 0.5),
        died: dist.died,
      };
    }
    process.stderr.write('.');
  }
  process.stderr.write('\n');
  fs.writeFileSync(`${ROOT}/solver/.moves-scores.json`, JSON.stringify({ seeds: SEEDS, levels: out }, null, 1));
  console.log('lvl  authored   ' + DELTAS.map((d) => (d >= 0 ? `+${d}` : `${d}`).padStart(8)).join(''));
  for (const shipped of LEVELS) {
    const cells = Object.values(out[shipped.level]).map((v) => String(v.median).padStart(8)).join('');
    console.log(`${String(shipped.level).padStart(3)}  ${String(shipped.moves).padStart(8)}   ${cells}`);
  }
  process.exit(0);
}

// Because scaling is exact, the base distribution is measured ONCE per level
// and every policy is derived from it by multiplication. It is also cached, so
// iterating on policies costs nothing after the first run.
const CACHE = `${ROOT}/solver/.base-scores.json`;
const base = new Map();
const cached = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : null;
if (cached && cached.seeds === SEEDS) {
  for (const [lvl, d] of Object.entries(cached.levels)) base.set(Number(lvl), d);
  console.log(`Reusing cached base measurement (${SEEDS} seeds). Delete solver/.base-scores.json to remeasure.\n`);
} else {
  process.stderr.write('Measuring base score distribution per level');
  for (const shipped of LEVELS) {
    base.set(shipped.level, scoreDistribution(shipped, 1, 0));
    process.stderr.write('.');
  }
  process.stderr.write('\n\n');
  fs.writeFileSync(CACHE, JSON.stringify({ seeds: SEEDS, levels: Object.fromEntries(base) }));
}

const ctx = {
  baseMedian: (l) => quantile(base.get(l).scores, 0.5),
  targetFor: (l, scale) => roundTarget(quantile(base.get(l).scores, 0.5) * scale * targetDemand(l)),
};

const pct = (v) => `${(v * 100).toFixed(0)}%`;
const policies = POLICIES.filter((p) => !ONLY || p.name === ONLY);
const summaries = [];

for (const policy of policies) {
  const rows = [];
  for (const shipped of LEVELS) {
    const scale = policy.scaleFor(shipped.level, ctx, rows[rows.length - 1]);
    const dist = base.get(shipped.level);
    const want = (policy.demandFor || targetDemand)(shipped.level);

    // Exact scaling means the scaled distribution is the base one times `scale`.
    const scaledMedian = quantile(dist.scores, 0.5) * scale;
    const derived = roundTarget(quantile(dist.scores, 0.5) * scale * want);
    const gotWin = dist.scores.filter((s) => s * scale >= derived).length / dist.scores.length;
    const winAtShipped = dist.scores.filter((s) => s * scale >= shipped.target).length / dist.scores.length;

    rows.push({
      level: shipped.level, scale, scaledMedian, derived, want, gotWin,
      shippedTarget: shipped.target, winAtShipped, died: dist.died,
    });
  }

  const dips = rows.filter((r, i) => i > 0 && r.derived < rows[i - 1].derived);
  // How close the SHIPPED targets already are to the intended curve under this
  // policy. Measured against each level's own intended win rate, so a tutorial
  // level sitting at 100% counts as correct rather than as too easy.
  const onCurve = rows.filter((r) => Math.abs(r.winAtShipped - r.gotWin) <= 0.15).length;
  const biggestJump = rows.reduce((m, r, i) => (i === 0 ? m : Math.max(m, r.derived / rows[i - 1].derived)), 1);
  const worstDip = rows.reduce((m, r, i) => (i === 0 ? m : Math.min(m, r.derived / rows[i - 1].derived)), 1);

  summaries.push({
    name: policy.name,
    description: policy.description,
    targetRange: `${rows[0].derived}-${rows[rows.length - 1].derived}`,
    finalTarget: rows[rows.length - 1].derived,
    dips: dips.length,
    dipLevels: dips.map((d) => d.level),
    biggestJump: biggestJump.toFixed(2),
    worstDip: worstDip.toFixed(2),
    onCurve,
  });

  if (JSON_OUT) {
    fs.writeFileSync(`${ROOT}/solver/.policy-${policy.name}.json`,
      JSON.stringify(rows.map((r) => ({ level: r.level, tileScale: r.scale, target: r.derived, winRate: r.gotWin })), null, 1));
    console.log(`wrote solver/.policy-${policy.name}.json`);
  }

  if (DETAIL || policies.length === 1) {
    console.log(`=== ${policy.name} - ${policy.description} ===`);
    console.log('lvl  scale   botMed   demand   newTarget   winRate   shippedTgt');
    for (const r of rows) {
      console.log(
        `${String(r.level).padStart(3)}  ${String(r.scale).padStart(5)}   ${String(r.scaledMedian).padStart(6)}   ${pct(r.want).padStart(6)}   ${String(r.derived).padStart(9)}   ${pct(r.gotWin).padStart(7)}   ${String(r.shippedTarget).padStart(10)}`,
      );
    }
    console.log();
  }
}

console.log('=== policy comparison ===');
console.log('policy      newTargetRange       final   dips  worstDip  maxJump  shippedTargetsOnCurve');
for (const s of summaries) {
  console.log(
    `${s.name.padEnd(10)}  ${s.targetRange.padEnd(18)}  ${String(s.finalTarget).padStart(6)}   ${String(s.dips).padStart(3)}    ${s.worstDip.padStart(6)}   ${s.biggestJump.padStart(6)}   ${String(s.onCurve).padStart(2)}/50`,
  );
}
console.log('\nnewTarget  = derived from measurement to hit the intended win rate.');
console.log('dips       = levels whose derived target is lower than the level before (breaks the sense of progress).');
console.log('worstDip   = largest single backward step, as a ratio (0.70 means a 30% drop).');
console.log('maxJump    = largest level-to-level target ratio (a jarring step at a chapter break).');
console.log('onCurve    = levels where the SHIPPED target already gives roughly the intended win rate.');
console.log(`seeds per level: ${SEEDS}`);
