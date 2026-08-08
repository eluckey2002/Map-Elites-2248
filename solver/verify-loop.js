// Deterministic done-check for the lockout-fix orch-loop run
// (.orch/runs/lockout-fix-2026-08-08/worklog.md). Exit 0 = PASS, 1 = FAIL.
// Every threshold here is drawn from this session's measured baseline —
// see that worklog's `goal` for the numbers and why.
const { LEVELS } = require('../src/game.js');
const { sweepLevel } = require('./sweep');

const checks = [];

function check(name, actual, pass, detail) {
  checks.push({ name, actual, pass, detail });
}

const level1 = LEVELS.find((l) => l.level === 1);
const level11 = LEVELS.find((l) => l.level === 11);
const level26 = LEVELS.find((l) => l.level === 26);

const r1 = sweepLevel(level1, 30);
check('level 1 win rate (no regression)', r1.winRate, r1.winRate >= 1.0, 'must stay 100%');

const r11 = sweepLevel(level11, 30);
check('level 11 win rate (no regression)', r11.winRate, r11.winRate >= 0.6, 'baseline was 67%, floor at 60%');

const r26 = sweepLevel(level26, 100);
check('level 26 win rate (the actual target)', r26.winRate, r26.winRate >= 0.3, 'baseline was ~0%, target >=30%');

let bombExplosions = 0;
let bombSeeds = 0;
for (let lvl = 40; lvl <= 50; lvl++) {
  const level = LEVELS.find((l) => l.level === lvl);
  const report = sweepLevel(level, 50);
  bombExplosions += report.lossReasons['bomb exploded'] || 0;
  bombSeeds += report.seedCount;
}
check(
  'bomb-exploded rate on levels 40-50 (no regression)',
  `${bombExplosions}/${bombSeeds}`,
  bombExplosions / bombSeeds <= 0.02,
  'baseline was ~0-1/300 (~0%), ceiling 2%',
);

console.log('Lockout-fix verify:');
for (const c of checks) {
  console.log(`  [${c.pass ? 'PASS' : 'FAIL'}] ${c.name}: ${c.actual} (${c.detail})`);
}

const allPass = checks.every((c) => c.pass);
console.log(allPass ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(allPass ? 0 : 1);
