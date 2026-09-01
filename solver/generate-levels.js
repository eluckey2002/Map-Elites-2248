#!/usr/bin/env node
// Proposes level shapes instead of a human hand-picking them, then runs the
// survivors through the existing authoring pipeline unchanged.
//
// Two stages, because the full pipeline is 450 bot games (~5-18s per shape) and
// most random shapes are not worth that. The screen plays a handful of seeds
// with no target, which is enough to spot a board that locks up or that no bot
// can score on, and throws those away for ~1% of the cost.
//
// The screen's seeds must not touch the pipeline's own ranges: the fitting run
// owns 0-149 and the holdout owns 100000-100299. A shape screened on seeds it
// is later measured on would be measuring its own training set.

const fs = require('node:fs');
const path = require('node:path');

const { makeRng } = require('./engine');
const {
  DEFAULT_GATES,
  deriveCandidate,
  playMeasured,
  serialize,
  tileScaleForLevel,
  verifyCandidate,
} = require('./level-author');
const {
  EXECUTION_PATH,
  identity,
  sourceIdentities,
  verifyChallengeBundle,
  verifyEntitlement,
} = require('./seed-variance');

const SCREEN_SEEDS = Object.freeze({ start: 500000, count: 24 });

// Sampling ranges, narrowed after the first batch (seed 42, 120 shapes).
//
// That batch produced fifteen gate-passing candidates, ten of which the bot won
// 100% of the time - the pipeline's expensive half was mostly spent proving
// that unloseable levels are winnable. The one candidate a human played and
// enjoyed, gen-0010, was the smallest board, the tightest move budget and the
// highest demand in the batch, and the only one the bot won less than 90% of
// the time.
//
// So the ranges below drop the huge generous boards, tighten the move budget,
// and start demand where the old range topped out. The previous ranges are in
// git history if this turns out to overshoot into levels nothing can win.
//
// minChain is capped at 4 on measured evidence, not taste: a 5-tile minimum
// produced dead boards over and over (the rejected level-53 candidate, then
// gen-0000 and gen-0021, plus a long tail of screen drops).
const SPACE = Object.freeze({
  gridW: [4, 7],
  gridH: [5, 8],
  minChain: [3, 4],
  demand: [0.8, 0.95],
  demandStep: 0.05,
  blockerCount: [0, 3],
  blockerTypes: ['stone', 'ice', 'bomb'],
  iceDuration: [3, 12],
  bombTimer: [8, 20],
  // Move budget is drawn relative to board area rather than absolutely: 24
  // moves is generous on a 5x7 and stingy on an 8x9.
  movesPerCell: [0.5, 0.75],
});

function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function sampleShape(rng, level, index, space = SPACE) {
  const gridW = randInt(rng, ...space.gridW);
  const gridH = randInt(rng, ...space.gridH);
  const cells = gridW * gridH;
  const movesLow = Math.round(cells * space.movesPerCell[0]);
  const movesHigh = Math.round(cells * space.movesPerCell[1]);
  const demandSteps = Math.round((space.demand[1] - space.demand[0]) / space.demandStep);

  const blockers = [];
  const taken = new Set();
  const wanted = randInt(rng, ...space.blockerCount);
  for (let i = 0; i < wanted; i++) {
    const x = randInt(rng, 0, gridW - 1);
    const y = randInt(rng, 0, gridH - 1);
    const key = `${x},${y}`;
    if (taken.has(key)) continue; // a collision just means one fewer blocker
    taken.add(key);
    const type = pick(rng, space.blockerTypes);
    const blocker = { type, x, y };
    if (type === 'ice') blocker.duration = randInt(rng, ...space.iceDuration);
    if (type === 'bomb') blocker.timer = randInt(rng, ...space.bombTimer);
    blockers.push(blocker);
  }

  return {
    schemaVersion: 1,
    name: `gen-${String(index).padStart(4, '0')}`,
    level,
    demand: Number((space.demand[0] + randInt(rng, 0, demandSteps) * space.demandStep).toFixed(2)),
    demandStatus: 'provisional-proposal',
    moves: randInt(rng, movesLow, movesHigh),
    minChain: randInt(rng, ...space.minChain),
    gridW,
    gridH,
    blockers,
  };
}

// Two shapes differing only in name are the same level. Blockers are sorted so
// that the same three blockers drawn in a different order collapse together.
function shapeSignature(shape) {
  const blockers = shape.blockers
    .map((b) => `${b.type}${b.x},${b.y}:${b.duration || b.timer || 0}`)
    .sort()
    .join('|');
  return [shape.gridW, shape.gridH, shape.moves, shape.minChain, shape.demand, blockers].join('/');
}

// Plays with no target, so every run burns the whole move budget and reports
// what the board is actually capable of. A win is impossible here by
// construction; only lockouts, bombs and scores are being read.
function screen(shape) {
  const level = {
    level: shape.level,
    target: Infinity,
    tileScale: tileScaleForLevel(shape.level),
    moves: shape.moves,
    minChain: shape.minChain,
    gridW: shape.gridW,
    gridH: shape.gridH,
    blockers: shape.blockers,
  };
  const scores = [];
  let lockouts = 0;
  let bombs = 0;
  for (let offset = 0; offset < SCREEN_SEEDS.count; offset++) {
    const outcome = playMeasured(level, SCREEN_SEEDS.start + offset);
    scores.push(outcome.score);
    if (outcome.reason === 'no valid moves') lockouts += 1;
    if (outcome.reason === 'bomb exploded') bombs += 1;
  }
  scores.sort((a, b) => a - b);
  return {
    lockouts,
    bombs,
    medianScore: scores[Math.floor(scores.length / 2)],
    minScore: scores[0],
  };
}

// A screen rejection is a cheap guess, not the real gate - the real gate is 300
// holdout seeds inside deriveCandidate. This only has to be right often enough
// to be worth skipping the expensive run.
function screenVerdict(result) {
  if (result.lockouts > 0) return `${result.lockouts}/${SCREEN_SEEDS.count} lockouts`;
  if (result.bombs > SCREEN_SEEDS.count * DEFAULT_GATES.maxBombRate) {
    return `${result.bombs}/${SCREEN_SEEDS.count} bombs`;
  }
  if (result.medianScore <= 0) return 'scores nothing';
  return null;
}

function gateVerdict(receipt) {
  const counts = receipt.holdout.terminalCounts;
  const winRate = counts.win / counts.total;
  const bombRate = counts.bombExploded / counts.total;
  const failures = [];
  if (counts.noValidMoves !== 0) failures.push(`${counts.noValidMoves} lockouts`);
  if (bombRate > DEFAULT_GATES.maxBombRate) failures.push(`bomb rate ${(bombRate * 100).toFixed(1)}%`);
  if (winRate < DEFAULT_GATES.minWinRate) failures.push(`win rate ${(winRate * 100).toFixed(1)}%`);
  return { pass: failures.length === 0, winRate, bombRate, counts, failures };
}

// Hardest first. Sorting the other way puts the levels the bot cannot lose at
// the top of the shortlist, which is exactly backwards for deciding what a
// human should spend an evening on: in the first batch the lowest bot win rate
// in the list was the only candidate that turned out to be fun, and the ten
// above it were levels the bot won every single time.
//
// This is a proxy and a thin one - it rests on one playthrough, and the bot is
// a weak player whose win rate is a floor on human success rather than an
// estimate of it. It ranks; it does not judge.
function rankShortlist(results) {
  return results
    .filter((entry) => entry.verdict.pass)
    .sort((a, b) => a.verdict.winRate - b.verdict.winRate);
}

function observeShortlist(results, entitlement, batchIdentity) {
  try {
    verifyEntitlement(entitlement, { currentIdentities: sourceIdentities() });
    return { status: 'PASS', batchIdentity, selected: rankShortlist(results).map((entry) => entry.shape.name) };
  } catch (error) {
    return { status: 'FAIL', batchIdentity, selected: [], error: error.message };
  }
}

function selectShortlist(results, bundle, consumerSubject) {
  const consumerObservation = {
    valid: observeShortlist(results, bundle.validEntitlement, consumerSubject.batchIdentity),
    broken: observeShortlist(results, bundle.brokenEntitlement, consumerSubject.batchIdentity),
  };
  verifyChallengeBundle(bundle, {
    currentIdentities: sourceIdentities(),
    executionPath: EXECUTION_PATH,
    consumerSubject,
    consumerObservation,
  });
  return rankShortlist(results);
}

function describe(shape) {
  const blockers = shape.blockers.length === 0
    ? 'no blockers'
    : shape.blockers.map((b) => b.type).sort().join('+');
  return `${shape.gridW}x${shape.gridH} moves=${shape.moves} chain=${shape.minChain} demand=${shape.demand} ${blockers}`;
}

function parseArgs(argv) {
  const args = {
    count: 60,
    level: 52,
    seed: 1,
    out: null,
    full: 12,
    space: null,
    selectFrom: null,
    seedVarianceBundle: null,
  };
  const optionNames = {
    'select-from': 'selectFrom',
    'seed-variance-bundle': 'seedVarianceBundle',
  };
  const paths = new Set(['out', 'space', 'selectFrom', 'seedVarianceBundle']);
  for (let i = 0; i < argv.length; i += 2) {
    const raw = argv[i].replace(/^--/, '');
    const key = optionNames[raw] || raw;
    const value = argv[i + 1];
    if (!(key in args)) throw new Error(`unknown option ${argv[i]}`);
    args[key] = paths.has(key) ? value : Number(value);
    if (!paths.has(key) && !Number.isFinite(args[key])) throw new Error(`${argv[i]} needs a number`);
  }
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.seedVarianceBundle) throw new Error('--seed-variance-bundle is required');
  const bundle = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.seedVarianceBundle), 'utf8'));
  if (args.selectFrom) {
    const batchPath = path.resolve(process.cwd(), args.selectFrom);
    const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
    if (!batch || !Array.isArray(batch.results)) throw new Error('selection input must contain results');
    const consumerSubject = {
      path: path.relative(path.join(__dirname, '..'), batchPath),
      sha256: require('node:crypto').createHash('sha256').update(fs.readFileSync(batchPath)).digest('hex'),
      batchIdentity: identity(batch),
    };
    const selected = selectShortlist(batch.results, bundle, consumerSubject);
    process.stdout.write(`SELECTED ${selected.map((entry) => entry.shape.name).join(',')}\n`);
    return { results: batch.results, passed: selected };
  }
  const rng = makeRng(args.seed);
  const started = Date.now();
  // An experiment can override any part of the sampling space without editing
  // the shipped defaults; whatever was actually used is recorded in --out.
  const space = args.space
    ? Object.freeze({ ...SPACE, ...JSON.parse(fs.readFileSync(path.resolve(process.cwd(), args.space), 'utf8')) })
    : SPACE;

  process.stdout.write(`Sampling ${args.count} shapes for level ${args.level} (sampler seed ${args.seed})\n`);
  process.stdout.write(`Screen: ${SCREEN_SEEDS.count} seeds from ${SCREEN_SEEDS.start}, no target\n`);
  if (args.space) process.stdout.write(`Space override: ${args.space}\n`);
  process.stdout.write('\n');

  const seen = new Set();
  const screened = [];
  let duplicates = 0;

  for (let i = 0; i < args.count; i++) {
    const shape = sampleShape(rng, args.level, i, space);
    const signature = shapeSignature(shape);
    if (seen.has(signature)) {
      duplicates += 1;
      continue;
    }
    seen.add(signature);
    const result = screen(shape);
    const rejection = screenVerdict(result);
    screened.push({ shape, screen: result, rejection });
    process.stdout.write(
      `  ${rejection ? 'drop' : 'keep'}  ${shape.name}  ${describe(shape)}  median=${result.medianScore}${rejection ? `  (${rejection})` : ''}\n`,
    );
  }

  const survivors = screened.filter((entry) => !entry.rejection);
  process.stdout.write(
    `\nScreened ${screened.length} shapes (${duplicates} duplicates skipped): ${survivors.length} survived\n`,
  );

  // The full pipeline is the expensive part, so only the first --full survivors
  // run it. They are already in sampler order, which is random, so this is a
  // sample of survivors rather than a biased slice.
  const runFull = survivors.slice(0, args.full);
  process.stdout.write(`Running the full 450-game pipeline on ${runFull.length} of them\n\n`);

  const results = [];
  for (const entry of runFull) {
    const at = Date.now();
    const authored = deriveCandidate(entry.shape);
    const verdict = gateVerdict(authored.receipt);
    results.push({ ...entry, candidate: authored.store.candidates[0], receipt: authored.receipt, verdict });
    process.stdout.write(
      `  ${verdict.pass ? 'PASS' : 'FAIL'}  ${entry.shape.name}  ${describe(entry.shape)}\n` +
      `        target=${authored.store.candidates[0].target} wins=${verdict.counts.win}/${verdict.counts.total}` +
      ` lockouts=${verdict.counts.noValidMoves} bombs=${verdict.counts.bombExploded}` +
      `${verdict.pass ? '' : `  (${verdict.failures.join(', ')})`}  ${((Date.now() - at) / 1000).toFixed(1)}s\n`,
    );
  }

  // gateVerdict above is this file's own reading of the thresholds, which is
  // only a preview. Anything about to be shown to a human is re-checked by the
  // pipeline's own verifier - it replays all 450 games and re-derives every
  // identity, so it also catches a candidate whose receipt does not match the
  // shape it claims to come from.
  throw new Error('verified seed-variance selection requires --select-from for the exact challenged batch');
  process.stdout.write(`\nConfirming ${passed.length} shortlisted candidates with the pipeline verifier\n`);
  for (const entry of passed) {
    try {
      verifyCandidate({ schemaVersion: 1, candidates: [entry.candidate] }, entry.receipt);
      entry.confirmed = true;
    } catch (error) {
      entry.confirmed = false;
      entry.confirmError = error.message;
      process.stdout.write(`  DISAGREES  ${entry.shape.name}: ${error.message}\n`);
    }
  }
  const disagreements = passed.filter((e) => !e.confirmed).length;
  process.stdout.write(
    disagreements === 0
      ? '  all confirmed\n'
      : `  ${disagreements} candidate(s) the verifier rejects - do not show these\n`,
  );

  process.stdout.write(`\n${passed.length} of ${results.length} passed every gate. Hardest for the bot first:\n`);
  for (const entry of passed) {
    process.stdout.write(
      `  ${(entry.verdict.winRate * 100).toFixed(0).padStart(3)}%  ${entry.shape.name}  ${describe(entry.shape)}  target=${entry.candidate.target}${entry.confirmed ? '' : '  [UNCONFIRMED]'}\n`,
    );
  }
  process.stdout.write(`\nTotal ${((Date.now() - started) / 1000).toFixed(1)}s\n`);

  if (args.out) {
    const outPath = path.resolve(process.cwd(), args.out);
    fs.writeFileSync(outPath, serialize({
      schemaVersion: 1,
      sampler: { seed: args.seed, count: args.count, level: args.level, full: args.full, space },
      screenSeeds: SCREEN_SEEDS,
      gates: DEFAULT_GATES,
      screened: screened.map((e) => ({ shape: e.shape, screen: e.screen, rejection: e.rejection })),
      results: results.map((e) => ({
        shape: e.shape,
        candidate: e.candidate,
        receipt: e.receipt,
        verdict: {
          pass: e.verdict.pass,
          winRate: e.verdict.winRate,
          failures: e.verdict.failures,
          verifierConfirmed: e.confirmed === undefined ? null : e.confirmed,
        },
      })),
    }));
    process.stdout.write(`Wrote ${outPath}\n`);
  }

  return { screened, results, passed };
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`FAIL: ${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  main,
  sampleShape,
  shapeSignature,
  screen,
  screenVerdict,
  gateVerdict,
  rankShortlist,
  observeShortlist,
  selectShortlist,
  SPACE,
  SCREEN_SEEDS,
};
