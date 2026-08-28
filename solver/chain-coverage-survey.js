// chain-coverage.js, but survivable: one child process per board.
//
// `chain-coverage.js` asks the right question -- how much of the board's best
// move does the chain walk actually find -- and guards the expensive half with
// a try/catch documented as "board too large to enumerate; no ground truth
// here". That guard catches the enumerator's own Set-size error. It cannot
// catch a V8 heap exhaustion, which aborts the process rather than throwing:
//
//     node solver/chain-coverage.js --levels 11 --seeds 1
//     FATAL ERROR: Ineffective mark-compacts near heap limit
//
// Level 11 is 5x8 = 40 cells at minChain 3, the largest board in the curve and
// the first entry in that script's own default level list, so the documented
// invocation dies before printing a single row. Nothing is wrong with the
// measure; the process just doesn't survive taking it.
//
// So run each board in its own child, capped on heap and wall clock. A board
// that blows either cap is recorded as unmeasured and the survey continues,
// which is the behaviour chain-coverage.js already documents and cannot
// currently deliver. Measured on 16 boards across levels 31-53: 13 completed
// (35,335 to 2,638,174 distinct actions, 0.1s to 6.4s), 3 were killed at a 2GB
// cap after roughly 25s.
//
//   node solver/chain-coverage-survey.js
//   node solver/chain-coverage-survey.js --levels 31,35,53 --seeds 3
//   node solver/chain-coverage-survey.js --cap-mb 4096 --cap-ms 120000
//
// Reading the ratio: the denominator is the best chain on the board whose sum
// stays on the mergeable lattice (FACT-0006), because that is what the walk is
// trying to find. The numerator is the best chain the walk actually returns,
// and `buildGreedyChain` falls through to the full walk when no prefix has a
// mergeable sum -- so a walk that finds no mergeable chain at all can score
// ABOVE the denominator. Ratios over 1.00 mean that fall-through happened, not
// that the walk beat ground truth. They are left unclamped so they stay visible.
//
// Which boards complete is not random: the ones that finish are the ones with
// fewer legal chains. Any mean over the completed set is a mean over the
// sparser half of the curve, and should be quoted with the set, never alone.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const {
  makeRng, createLevelState, findGreedyChains, chainValue, chainMultiplier,
} = require('./engine');
const { enumerateLegalChains } = require('./exact-score');
const { LEVELS } = require(`${ROOT}/src/game`);

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i === -1 ? d : argv[i + 1]; };

const points = (chain) => Math.floor(chainValue(chain) * chainMultiplier(chain.length));

// FACT-0006: only a sum equal to the tile scale times a power of two can ever
// be matched again. Same test as engine.js's isMergeableSum, and the same one
// chain-coverage.js uses, so the two scripts agree on the denominator.
function isMergeableSum(sum, scale) {
  if (sum <= 0 || sum % scale !== 0) return false;
  const n = sum / scale;
  return (n & (n - 1)) === 0;
}

function bestGreedy(state, tieBreak) {
  // No preferMergeableSum here: findGreedyChains already defaults it to true,
  // which is how bot.js calls it. Measuring the walk the bot does not play
  // would make the whole survey meaningless.
  return findGreedyChains(state, { tieBreak })
    .reduce((best, c) => (c.points > best ? c.points : best), 0);
}

// One board, in a child process. Prints a single JSON line so the parent never
// has to parse anything the enumerator wrote to stdout.
function measureOneBoard(level, seed) {
  const levelData = LEVELS.find((l) => l.level === level);
  if (!levelData) throw new Error(`no such level: ${level}`);

  const state = createLevelState(levelData, makeRng(seed));
  const plain = bestGreedy(state, 'none');
  const degree = bestGreedy(state, 'degree');

  const scale = state.tileScale || 1;
  let truth = 0;
  let actions = 0;
  for (const chain of enumerateLegalChains(state)) {
    actions++;
    if (!isMergeableSum(chainValue(chain), scale)) continue;
    const p = points(chain);
    if (p > truth) truth = p;
  }

  return { level, seed, plain, degree, truth, actions };
}

function runChild(level, seed, capMb, capMs) {
  const started = Date.now();
  const run = spawnSync(
    process.execPath,
    [`--max-old-space-size=${capMb}`, __filename, '--board', String(level), String(seed)],
    { encoding: 'utf8', timeout: capMs, maxBuffer: 64 * 1024 * 1024 },
  );
  const ms = Date.now() - started;

  if (run.status === 0 && run.stdout.trim()) {
    return { ...JSON.parse(run.stdout.trim().split('\n').pop()), ms, measured: true };
  }
  // ETIMEDOUT arrives as an error; spawnSync also reports the SIGTERM it sent.
  const timedOut = (run.error && run.error.code === 'ETIMEDOUT') || run.signal === 'SIGTERM';
  return {
    level, seed, ms, measured: false, why: timedOut ? 'wall-clock cap' : 'heap cap',
  };
}

function main() {
  const boardMode = argv.indexOf('--board');
  if (boardMode !== -1) {
    const level = Number(argv[boardMode + 1]);
    const seed = Number(argv[boardMode + 2]);
    console.log(JSON.stringify(measureOneBoard(level, seed)));
    return;
  }

  const levels = flag('levels', null)
    ? String(flag('levels')).split(',').map(Number)
    : LEVELS.map((l) => l.level);
  const seedCount = Number(flag('seeds', 3));
  const capMb = Number(flag('cap-mb', 2048));
  const capMs = Number(flag('cap-ms', 30000));
  const out = flag('out', path.join(ROOT, '.orch', 'chain-coverage-survey.json'));

  console.log(`Surveying ${levels.length} levels x ${seedCount} seeds `
    + `= ${levels.length * seedCount} boards, capped at ${capMb}MB and ${capMs}ms each.\n`);
  console.log('lvl seed |      ms |   shipped   tieBreak      truth |  shipped  tieBreak');
  console.log('---- ---- | ------- | --------   --------   -------- | -------  --------');

  const results = [];
  for (const level of levels) {
    for (let seed = 1; seed <= seedCount; seed++) {
      const row = runChild(level, seed, capMb, capMs);
      results.push(row);

      const head = `${String(level).padStart(4)} ${String(seed).padStart(4)} | ${String(row.ms).padStart(6)}ms`;
      if (!row.measured) {
        console.log(`${head} | unmeasured (${row.why})`);
        continue;
      }
      const share = (x) => (row.truth ? (x / row.truth).toFixed(2).padStart(7) : '   n/a ');
      console.log(`${head} | ${String(row.plain).padStart(8)}   ${String(row.degree).padStart(8)}`
        + `   ${String(row.truth).padStart(8)} | ${share(row.plain)}  ${share(row.degree)}`);
    }
  }

  // A board with no mergeable chain at all has no denominator, so it carries no
  // ratio even though the child completed. It stays in the raw results and out
  // of the means.
  const scored = results.filter((r) => r.measured && r.truth > 0);
  const mean = (f) => scored.reduce((s, r) => s + f(r), 0) / scored.length;

  console.log(`\n${results.filter((r) => r.measured).length}/${results.length} boards measured, `
    + `${scored.length} with a mergeable-chain denominator.`);
  if (scored.length) {
    console.log(`  shipped walk            ${mean((r) => r.plain / r.truth).toFixed(4)}`);
    console.log(`  + degree tie-break      ${mean((r) => r.degree / r.truth).toFixed(4)}`);
  }
  console.log('\nThese means cover only the boards that completed, which are the boards');
  console.log('with fewer legal chains. Quote them with the board set, never alone.');

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(results, null, 2)}\n`);
  console.log(`\nRaw per-board results: ${path.relative(ROOT, out)}`);
}

main();
