// Trains the self-taught player by self-play on every core at once. The
// workers share one set of tables and update it without locks (the usual
// "Hogwild" way; rare clashing updates do no harm). Progress goes to
// progress.jsonl every 30 seconds and the tables to weights.bin every 5
// minutes, so a stopped run can carry on.
// Usage: node prototypes/climb/train-td.js outDir minutes [threads] [alpha]
const fs = require('fs');
const os = require('os');
const path = require('path');
const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');
const td = require('./td');

// evan's usual settings (2026-10-30): 7 values from 8, Equal odds.
const SETTINGS = {poolSize: 7, poolStart: 8, fallOdds: 'equal'};
// Training boards never reuse the check boards (seeds 1 to 100).
const SEED_BASE = 1000000;

function bestPow2(state) {
  let best = 0;
  for (const row of state.board) for (const c of row) if (c && !c.stone && Number.isInteger(Math.log2(c.v))) best = Math.max(best, c.v);
  return best;
}

if (!isMainThread) {
  const {buffer, id, threads, start, alpha} = workerData;
  const weights = new Float32Array(buffer);
  for (let k = 0; ; k++) {
    const seed = SEED_BASE + start + id + k * threads;
    let best = 0;
    const end = td.trainGame(weights, SETTINGS, seed, alpha, (before, after) => { best = Math.max(best, bestPow2(after)); });
    parentPort.postMessage({seed, best: Math.max(best, bestPow2(end)), moves: end.moves, climbs: end.slides, score: end.score});
  }
}

if (isMainThread) {
  const [outDir, minutesArg, threadsArg, alphaArg] = process.argv.slice(2);
  if (!outDir) throw new Error('Usage: train-td.js outDir minutes [threads] [alpha]');
  const minutes = Number(minutesArg || 10);
  const threads = Number(threadsArg || os.cpus().length);
  const alpha = Number(alphaArg || 0.1);
  fs.mkdirSync(outDir, {recursive: true});
  const wPath = path.join(outDir, 'weights.bin');
  const pPath = path.join(outDir, 'progress.jsonl');
  const weights = td.newWeights(true);
  let games = 0;
  let seconds = 0;
  if (fs.existsSync(wPath)) {
    weights.set(new Float32Array(fs.readFileSync(wPath).buffer.slice(0)));
    const lines = fs.existsSync(pPath) ? fs.readFileSync(pPath, 'utf8').trim().split('\n').filter(Boolean) : [];
    if (lines.length) ({games, seconds} = JSON.parse(lines[lines.length - 1]));
  }
  const save = () => {
    fs.writeFileSync(wPath + '.tmp', Buffer.from(weights.buffer));
    fs.renameSync(wPath + '.tmp', wPath);
  };
  const recent = [];
  const t0 = Date.now();
  const startGames = games;
  const workers = [];
  for (let id = 0; id < threads; id++) {
    const w = new Worker(__filename, {workerData: {buffer: weights.buffer, id, threads, start: startGames, alpha}});
    w.on('message', g => { games++; recent.push(g); if (recent.length > 500) recent.shift(); });
    w.on('error', e => { console.error(e); process.exitCode = 1; });
    workers.push(w);
  }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const report = () => {
    const line = {
      time: new Date().toISOString(), games, seconds: seconds + Math.round((Date.now() - t0) / 1000), threads, alpha,
      bestTile: med(recent.map(g => g.best)), moves: med(recent.map(g => g.moves)), climbs: med(recent.map(g => g.climbs)),
      over128K: recent.filter(g => g.best >= 131072).length / Math.max(1, recent.length),
    };
    fs.appendFileSync(pPath, JSON.stringify(line) + '\n');
    console.log(JSON.stringify(line));
  };
  const tick = setInterval(report, 30000);
  const saver = setInterval(save, 300000);
  setTimeout(async () => {
    clearInterval(tick); clearInterval(saver);
    for (const w of workers) await w.terminate();
    report(); save();
  }, minutes * 60000);
}
