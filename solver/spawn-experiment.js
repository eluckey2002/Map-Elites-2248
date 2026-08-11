// Tests the README's structural diagnosis: spawns are 2/4/8, merge remnants
// land on 32/64+, and chains extend only to an equal or double tile, so there
// is no bridge between spawned value and remnant value -- the "hole at 16".
// If that is the binding constraint, putting 16 into the spawn pool should
// raise achievable score sharply. If scores barely move, the diagnosis is
// wrong and the ceiling is elsewhere.
//
// engine.js keeps randomSpawnValue module-private, so the spawn step is
// replicated here with an injectable table. Each variant consumes exactly one
// rng() call per tile, as the original does, so the BASELINE variant must
// reproduce solver/target-calibration.js bit for bit. That equality is the
// correctness check on this replication -- if it fails, ignore every number
// below.
const ROOT = require('path').join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const {
  makeRng, createLevelState, executeChain, applyGravity, tickBlockers, checkBombs,
} = require(`${ROOT}/solver/engine`);
const { chooseMove } = require(`${ROOT}/solver/bot`);

const LOOKAHEAD_BASE = 987654321;
const SEEDS = Number(process.argv[2] || 200);
const LEVELS_UNDER_TEST = [11, 20, 26, 30, 40, 45, 50];

// [cumulativeProbability, value] -- must consume exactly one rng() call.
const VARIANTS = {
  'baseline 2/4/8': [[0.6, 2], [0.9, 4], [1.0, 8]],
  '+16 at 10%': [[0.5, 2], [0.75, 4], [0.9, 8], [1.0, 16]],
  '+16 at 5%': [[0.55, 2], [0.83, 4], [0.95, 8], [1.0, 16]],
  '+16/32 at 12%': [[0.5, 2], [0.74, 4], [0.88, 8], [0.96, 16], [1.0, 32]],
};

function spawn(state, rng, table) {
  for (let col = 0; col < state.gridWidth; col++) {
    for (let row = 0; row < state.gridHeight; row++) {
      if (!state.grid[row][col]) {
        const r = rng();
        const value = table.find(([p]) => r < p)[1];
        state.grid[row][col] = { x: col, y: row, value, blocker: null, blockerDuration: 0, bombTimer: 0 };
      }
    }
  }
}

function playOut(level, rng, table) {
  const state = createLevelState(level, rng);
  for (let i = 0; i < level.moves + 5; i++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) });
    if (!chain) return { score: state.score, end: 'lockout' };
    executeChain(state, chain);
    applyGravity(state);
    spawn(state, rng, table);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score, end: 'bomb' };
    if (state.moves >= state.maxMoves) return { score: state.score, end: 'out of moves' };
  }
  return { score: state.score, end: 'hard cap' };
}

function measure(shipped, table) {
  const level = { ...shipped, target: Infinity };
  const scores = [];
  let lockouts = 0;
  for (let seed = 0; seed < SEEDS; seed++) {
    const out = playOut(level, makeRng(seed), table);
    scores.push(out.score);
    if (out.end === 'lockout') lockouts += 1;
  }
  scores.sort((a, b) => a - b);
  return {
    median: scores[Math.floor(scores.length / 2)],
    max: scores[scores.length - 1],
    winRate: scores.filter((s) => s >= shipped.target).length / scores.length,
    lockouts,
  };
}

const names = Object.keys(VARIANTS);
console.log(`seeds per level: ${SEEDS}\n`);
console.log(`lvl  target  ${names.map((n) => n.padEnd(16)).join('')}`);
const results = {};
for (const num of LEVELS_UNDER_TEST) {
  const shipped = LEVELS.find((l) => l.level === num);
  const cells = names.map((n) => {
    const r = measure(shipped, VARIANTS[n]);
    results[`${num}|${n}`] = r;
    return `${String(r.median).padStart(6)} ${(r.winRate * 100).toFixed(0).padStart(3)}%   `.padEnd(16);
  });
  console.log(`${String(num).padStart(3)}  ${String(shipped.target).padStart(6)}  ${cells.join('')}`);
}
console.log('\n(cell = median score, then win rate against the shipped target)');
console.log(`\nlevel 26 baseline median = ${results['26|baseline 2/4/8'].median} (target-calibration.js recorded 7832 at 200 seeds)`);
