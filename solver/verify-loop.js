// Deterministic health check for the shipped level curve. Exit 0 = PASS, 1 = FAIL.
//
// Replaces the lockout-fix gate of 2026-08-08, whose thresholds described the
// pre-retune game and had been failing against committed code for days -- it
// still demanded 30% on Level 26 from a run predating the score-pace ceiling.
// A gate asserting a world that no longer exists is a red light nobody can act
// on, so these thresholds are drawn from the 2026-08-12 retune instead.
//
// Seeds start at CHECK_SEED_BASE, disjoint from the 0-149 range the targets
// were fitted on, so passing here is not the same measurement that set them.
//
// What this does NOT catch: it samples levels rather than sweeping all 50, so a
// single mistuned level between samples can hide. It says nothing about whether
// the curve is FUN -- only that every sampled level is winnable and none dies
// early. And it measures the reference bot, which is a weak stand-in for a
// skilled player, so it sets a floor on human success, not an estimate of it.
const { LEVELS } = require('../src/game.js');
const {
  makeRng, createLevelState, executeChain, applyGravity, spawnNewTiles,
  tickBlockers, checkBombs,
} = require('./engine');
const { chooseMove } = require('./bot');

const LOOKAHEAD_BASE = 987654321; // must match solver/sweep.js
const CHECK_SEED_BASE = 100000;
const SEEDS = 60;
const SAMPLED = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

function play(level, rng) {
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

function measure(level) {
  let wins = 0;
  let lockouts = 0;
  let bombs = 0;
  for (let s = 0; s < SEEDS; s++) {
    const r = play(level, makeRng(CHECK_SEED_BASE + s));
    if (r.score >= level.target) wins += 1;
    if (r.end === 'no valid moves') lockouts += 1;
    if (r.end === 'bomb exploded') bombs += 1;
  }
  return { winRate: wins / SEEDS, lockRate: lockouts / SEEDS, bombRate: bombs / SEEDS };
}

const checks = [];
const add = (name, actual, pass, detail) => checks.push({ name, actual, pass, detail });

// Every level carries the two fields the retune depends on.
const missing = LEVELS.filter((l) => !l.target || !l.tileScale);
add('every level has a target and a tileScale', `${LEVELS.length - missing.length}/${LEVELS.length}`,
  missing.length === 0, 'a missing tileScale silently reverts that level to 1x');

// Tile scale only ever steps up, and only by doubling, so tiles stay powers of two.
const scales = LEVELS.map((l) => l.tileScale);
const ladderOk = scales.every((s, i) => Number.isInteger(Math.log2(s)) && (i === 0 || s === scales[i - 1] || s === scales[i - 1] * 2));
add('tile scale doubles and never steps back', [...new Set(scales)].join(','), ladderOk,
  'the game deals 2/4/8 times the scale; a non-power-of-two would deal off-family tiles');

const measured = SAMPLED.map((n) => ({ level: n, ...measure(LEVELS.find((l) => l.level === n)) }));

const first = measured.find((m) => m.level === 1);
add('level 1 is a guaranteed win', first.winRate, first.winRate >= 1.0, 'the tutorial must not be losable');

const worst = measured.reduce((a, b) => (a.winRate < b.winRate ? a : b));
add('hardest sampled level stays winnable', `${(worst.winRate * 100).toFixed(0)}% at level ${worst.level}`,
  worst.winRate >= 0.20, 'floor 20%; before the retune 34 levels sat at 0%');

const lockiest = measured.reduce((a, b) => (a.lockRate > b.lockRate ? a : b));
add('board lockouts stay rare', `${(lockiest.lockRate * 100).toFixed(0)}% at level ${lockiest.level}`,
  lockiest.lockRate <= 0.10, 'ceiling 10%; a lockout is a dead board, not a fair loss');

const bombiest = measured.filter((m) => m.level >= 40).reduce((a, b) => (a.bombRate > b.bombRate ? a : b));
add('bomb explosions stay rare on 40-50', `${(bombiest.bombRate * 100).toFixed(0)}% at level ${bombiest.level}`,
  bombiest.bombRate <= 0.05, 'ceiling 5%');

// Difficulty trends downward in win rate across the game, allowing local wobble.
const early = measured.filter((m) => m.level <= 20).reduce((s, m) => s + m.winRate, 0) / measured.filter((m) => m.level <= 20).length;
const late = measured.filter((m) => m.level >= 35).reduce((s, m) => s + m.winRate, 0) / measured.filter((m) => m.level >= 35).length;
add('late levels are harder than early ones', `${(early * 100).toFixed(0)}% early vs ${(late * 100).toFixed(0)}% late`,
  late < early, 'the curve must actually descend, not just wobble');

console.log(`Level curve verify (${SEEDS} seeds from ${CHECK_SEED_BASE}, sampled levels ${SAMPLED.join(', ')}):`);
for (const c of checks) console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}: ${c.actual} (${c.detail})`);
console.log();
console.log('lvl   target   win   lockout');
for (const m of measured) {
  const lvl = LEVELS.find((l) => l.level === m.level);
  console.log(`${String(m.level).padStart(3)}  ${String(lvl.target).padStart(7)}  ${`${(m.winRate * 100).toFixed(0)}%`.padStart(4)}  ${`${(m.lockRate * 100).toFixed(0)}%`.padStart(8)}`);
}

const allPass = checks.every((c) => c.pass);
console.log(allPass ? '\nRESULT: PASS' : '\nRESULT: FAIL');
process.exit(allPass ? 0 : 1);
