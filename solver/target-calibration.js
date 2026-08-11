// Compares every level's shipped target against what the current bot actually
// scores there, with the target raised out of reach so each run plays its full
// move budget. The point is RELATIVE calibration: a level whose target sits at
// a much higher multiple of achievable score than its neighbours is mistuned,
// and that comparison needs no model of how a skilled player performs.
const ROOT = require('path').join(__dirname, '..');
const { LEVELS } = require(`${ROOT}/src/game`);
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require(`${ROOT}/solver/engine`);
const { chooseMove } = require(`${ROOT}/solver/bot`);

const LOOKAHEAD_BASE = 987654321; // must match solver/sweep.js
const SEEDS = Number(process.argv[2] || 200);

function playOut(level, rng) {
  const state = createLevelState(level, rng);
  for (let i = 0; i < level.moves + 5; i++) {
    const chain = chooseMove(state, { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + i) });
    if (!chain) return { score: state.score, end: 'no valid moves' };
    executeChain(state, chain);
    applyGravity(state);
    spawnNewTiles(state, rng);
    tickBlockers(state);
    if (checkBombs(state)) return { score: state.score, end: 'bomb exploded' };
    if (state.moves >= state.maxMoves) return { score: state.score, end: 'out of moves' };
  }
  return { score: state.score, end: 'hard cap' };
}

const rows = [];
for (const shipped of LEVELS) {
  const level = { ...shipped, target: Infinity };
  const scores = [];
  let died = 0;
  for (let seed = 0; seed < SEEDS; seed++) {
    const out = playOut(level, makeRng(seed));
    scores.push(out.score);
    if (out.end !== 'out of moves') died += 1;
  }
  scores.sort((a, b) => a - b);
  const median = scores[Math.floor(scores.length / 2)];
  const max = scores[scores.length - 1];
  rows.push({
    level: shipped.level,
    target: shipped.target,
    moves: shipped.moves,
    minChain: shipped.minChain,
    grid: `${shipped.gridW}x${shipped.gridH}`,
    blockers: shipped.blockers.length,
    botMedian: median,
    botMax: max,
    // How many times the bot's typical score the target demands. Higher means
    // the level asks for more above ordinary play.
    demand: Number((shipped.target / median).toFixed(2)),
    botWinRate: Number((scores.filter((s) => s >= shipped.target).length / scores.length).toFixed(3)),
    diedEarly: died,
  });
}

const demands = rows.map((r) => r.demand).sort((a, b) => a - b);
const medianDemand = demands[Math.floor(demands.length / 2)];

console.log(`seeds per level: ${SEEDS}   median demand across all levels: ${medianDemand}\n`);
console.log('lvl  grid  mv  mc  blk   target  botMed  botMax  demand  botWin  died');
for (const r of rows) {
  const flag = r.demand >= medianDemand * 1.25 ? '  <== high' : '';
  console.log(
    `${String(r.level).padStart(3)}  ${r.grid.padEnd(5)} ${String(r.moves).padStart(3)} ${String(r.minChain).padStart(3)} ${String(r.blockers).padStart(3)}   ${String(r.target).padStart(6)}  ${String(r.botMedian).padStart(6)}  ${String(r.botMax).padStart(6)}  ${String(r.demand).padStart(6)}  ${String(r.botWinRate).padStart(6)}  ${String(r.diedEarly).padStart(4)}${flag}`,
  );
}
