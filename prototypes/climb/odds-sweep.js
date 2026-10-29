// Plays the play-out player on every fall-odds and pool-size setting, spread
// over all CPU cores. One JSON line per game goes to the output file; a rerun
// skips games already in it.
// Usage: node prototypes/climb/odds-sweep.js out.jsonl [games] [plays...]
const fs = require('fs');
const os = require('os');
const {fork} = require('child_process');

if (process.argv[2] === '--worker') {
  const E = require('./engine');
  const {playRandomGame} = require('./players');
  const {playoutChooser} = require('./playout');
  process.on('message', job => {
    if (!job) return process.exit(0);
    const t0 = Date.now();
    const settings = {fallOdds: job.odds, poolSize: job.pool};
    const {state, capped} = playRandomGame(settings, job.seed, {chooser: playoutChooser({plays: job.plays}), maxMoves: 3000});
    process.send({...job, ...E.summary(state), capped, ms: Date.now() - t0});
  });
  return;
}

const out = process.argv[2];
const games = Number(process.argv[3] || 30);
const playsList = (process.argv.slice(4).length ? process.argv.slice(4) : ['32']).map(Number);
const done = new Set();
if (fs.existsSync(out)) {
  for (const line of fs.readFileSync(out, 'utf8').split('\n').filter(Boolean)) {
    const g = JSON.parse(line);
    done.add(`${g.odds}|${g.pool}|${g.plays}|${g.seed}`);
  }
}
const jobs = [];
for (let seed = 1; seed <= games; seed++) {
  for (const plays of playsList) {
    for (const odds of ['halving', 'soft', 'gentle', 'equal']) {
      for (const pool of [4, 5, 6, 7]) {
        if (!done.has(`${odds}|${pool}|${plays}|${seed}`)) jobs.push({odds, pool, plays, seed});
      }
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
    if (--left % 20 === 0) console.log(`${left} left`);
    next();
  });
  next();
}
