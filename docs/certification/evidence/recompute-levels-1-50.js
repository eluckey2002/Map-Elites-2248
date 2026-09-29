// Levels 1-50 target recompute (CK-12), method matching
// solver/game-tester.js's 'powers2' policy (the shipped policy), which is the
// method DECISION-0003/RESULT-0008 record: live bot, 150 seeds from 0,
// sawtooth demand within power-of-two tile-scale chapters.
const path = require('path');
// Usage: node recompute-levels-1-50.js <checkout-at-8e1e232> <path-to-current-src/game.js> [--sample]
const ROOT = path.resolve(process.argv[2]);
const MAIN_GAME = path.resolve(process.argv[3]);
const SAMPLE_ONLY = process.argv.includes('--sample');
const { LEVELS } = require(path.join(ROOT, 'src/game'));
const { LEVELS: MAIN_LEVELS } = require(MAIN_GAME);
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require(path.join(ROOT, 'solver/engine'));
const { chooseMove } = require(path.join(ROOT, 'solver/bot'));

const LOOKAHEAD_BASE = 987654321;
const SEEDS = 150;

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
function roundTarget(v) {
  const step = v >= 100000 ? 1000 : v >= 10000 ? 100 : v >= 1000 ? 50 : 10;
  return Math.max(step, Math.floor(v / step) * step);
}
const quantile = (sorted, q) => sorted[Math.min(Math.floor(sorted.length * q), sorted.length - 1)];

function playOut(level, rng) {
  const state = createLevelState(level, rng);
  for (let i = 0; i < level.moves + 5; i++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) });
    if (!chain) return { score: state.score };
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score };
    if (state.moves >= state.maxMoves) return { score: state.score };
  }
  return { score: state.score };
}

// Fixed printed seed for level sampling (Mulberry32), not a game seed.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SAMPLE_SEED = 20260927;
const rand = mulberry32(SAMPLE_SEED);
const pool = [];
for (let l = 1; l <= 50; l++) pool.push(l);
const picks = [];
while (picks.length < (SAMPLE_ONLY ? 10 : 50) && pool.length) {
  const idx = Math.floor(rand() * pool.length);
  picks.push(pool.splice(idx, 1)[0]);
}
picks.sort((a, b) => a - b);
console.log('sample seed:', SAMPLE_SEED, 'picked levels:', picks.join(','));

for (const lvl of picks) {
  const oldDef = LEVELS.find((l) => l.level === lvl);
  const mainDef = MAIN_LEVELS.find((l) => l.level === lvl);
  const scale = chapterFor(lvl).scale;
  const level = { ...oldDef, target: Infinity, tileScale: scale };
  const scores = [];
  for (let s = 0; s < SEEDS; s++) scores.push(playOut(level, makeRng(s)).score);
  scores.sort((a, b) => a - b);
  const median = quantile(scores, 0.5);
  const demand = sawtoothDemand(lvl);
  const derived = roundTarget(median * demand);
  console.log(JSON.stringify({
    level: lvl, scale, medianScore: median, demand: Number(demand.toFixed(4)),
    recomputedTarget: derived, shippedTarget: mainDef.target, shippedScale: mainDef.tileScale,
    match: derived === mainDef.target && scale === mainDef.tileScale,
  }));
}
