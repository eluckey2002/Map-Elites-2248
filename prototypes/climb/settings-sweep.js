// Plays several bots on the default settings and on each single change from
// it, spread over all CPU cores. Every bot plays the same seeds, so the same
// tile drops, on every setting. One JSON line per game goes to the output
// file; a rerun skips games already in it.
// Usage: node prototypes/climb/settings-sweep.js out.jsonl [games] [bot...]
//   [--shard i/n]  play only every n-th game, starting at i (for several machines)
//   [--variants a,b]  play only these variants
const fs = require('fs');
const os = require('os');
const {fork} = require('child_process');

// The default plus one change at a time. Each entry is a settings patch.
const VARIANTS = {
  default: {},
  'pool-4': {poolSize: 4},
  'pool-6': {poolSize: 6},
  'pool-7': {poolSize: 7},
  'start-4': {poolStart: 4},
  'start-8': {poolStart: 8},
  'odds-soft': {fallOdds: 'soft'},
  'odds-gentle': {fallOdds: 'gentle'},
  'odds-halving': {fallOdds: 'halving'},
  'trigger-score': {slideTrigger: 'score'},
  'trigger-moves': {slideTrigger: 'moves'},
  'climb-at-4x': {slideAmount: 4},
  'pacing-speeds-up': {pacing: 'speeds-up'},
  'pacing-slows-down': {pacing: 'slows-down'},
};

// Two kinds of bot, each at two strengths. Both are fair.
const BOTS = {
  'playout-weak': {kind: 'playout', opts: {plays: 8}},
  'playout-strong': {kind: 'playout', opts: {plays: 32}},
  'lookahead-weak': {kind: 'lookahead', opts: {depth: 2, widths: [6, 4], samples: [2], leafPlays: 1}},
  'lookahead-strong': {kind: 'lookahead', opts: {depth: 2, widths: [8, 6], samples: [4], leafPlays: 2}},
  'lookahead-points': {kind: 'lookahead', opts: {depth: 2, widths: [12, 12], samples: [8]}},
  greedy: {kind: 'greedy'},
};

function chooserFor(bot) {
  const {greedyChain} = require('./players');
  if (bot.kind === 'greedy') return state => greedyChain(state);
  if (bot.kind === 'playout') return require('./playout').playoutChooser(bot.opts);
  return require('./lookahead').lookaheadChooser(bot.opts);
}

if (process.argv[2] === '--worker') {
  const E = require('./engine');
  const {playRandomGame} = require('./players');
  process.on('message', job => {
    if (!job) return process.exit(0);
    const t0 = Date.now();
    // Best tile counts powers of 2 only (evan, 2026-10-30): an odd sum such
    // as 9,437,184 is not a tile anyone is aiming for.
    const pow2 = v => (v > 0 && Number.isInteger(Math.log2(v)) ? v : 0);
    let bestPow2 = 0;
    for (const row of E.newGame(VARIANTS[job.variant], job.seed).board) for (const cell of row) if (cell) bestPow2 = Math.max(bestPow2, pow2(cell.v));
    const onMove = (before, after, events) => {
      bestPow2 = Math.max(bestPow2, pow2(events.sum), ...events.dropped.map(d => pow2(d[2])));
    };
    const {state, capped} = playRandomGame(VARIANTS[job.variant], job.seed, {chooser: chooserFor(BOTS[job.bot]), maxMoves: 3000, onMove});
    process.send({...job, ...E.summary(state), bestPow2, capped, ms: Date.now() - t0});
  });
  return;
}

const args = process.argv.slice(2);
const flag = name => {
  const i = args.indexOf(name);
  if (i < 0) return null;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const shard = (flag('--shard') || '0/1').split('/').map(Number);
const onlyVariants = flag('--variants');
const out = args[0];
const games = Number(args[1] || 100);
const bots = args.slice(2).length ? args.slice(2) : ['playout-weak', 'playout-strong', 'lookahead-weak', 'lookahead-strong'];
for (const b of bots) if (!BOTS[b]) throw new Error(`Unknown bot ${b}`);
const variants = onlyVariants ? onlyVariants.split(',') : Object.keys(VARIANTS);
for (const v of variants) if (!VARIANTS[v]) throw new Error(`Unknown variant ${v}`);

const done = new Set();
if (fs.existsSync(out)) {
  for (const line of fs.readFileSync(out, 'utf8').split('\n').filter(Boolean)) {
    const g = JSON.parse(line);
    done.add(`${g.variant}|${g.bot}|${g.seed}`);
  }
}
const jobs = [];
let n = 0;
for (let seed = 1; seed <= games; seed++) {
  for (const bot of bots) {
    for (const variant of variants) {
      if (n++ % shard[1] !== shard[0]) continue;
      if (!done.has(`${variant}|${bot}|${seed}`)) jobs.push({variant, bot, seed});
    }
  }
}
console.log(`${jobs.length} games to play`);
let left = jobs.length;
for (let w = 0; w < Math.min(os.cpus().length, jobs.length); w++) {
  const child = fork(__filename, ['--worker']);
  const next = () => child.send(jobs.shift() || null);
  child.on('message', g => {
    fs.appendFileSync(out, JSON.stringify(g) + '\n');
    if (--left % 50 === 0) console.log(`${left} left`);
    next();
  });
  next();
}

module.exports = {VARIANTS, BOTS};
