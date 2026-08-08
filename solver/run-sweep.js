const path = require('node:path');
const { LEVELS } = require(path.join(__dirname, '..', 'src', 'game.js'));
const { sweepLevel } = require('./sweep');

const SEED_COUNT = 300;
const rangeArg = process.argv[2] || '40-50';
const [from, to] = rangeArg.split('-').map(Number);

const levels = LEVELS.filter((l) => l.level >= from && l.level <= to);

console.log(`Sweeping levels ${from}-${to}, ${SEED_COUNT} seeds each (greedy bot, defuse-first heuristic)\n`);
console.log('level  winRate  lossReasons');
console.log('-----  -------  -----------');

for (const levelData of levels) {
  const report = sweepLevel(levelData, SEED_COUNT);
  const pct = (report.winRate * 100).toFixed(1) + '%';
  const reasons = Object.entries(report.lossReasons)
    .map(([reason, count]) => `${reason}:${count}`)
    .join(', ') || '-';
  console.log(`${String(levelData.level).padEnd(5)}  ${pct.padEnd(7)}  ${reasons}`);
}
