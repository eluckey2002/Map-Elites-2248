// Trains the larger self-taught player (td6.js) by self-play on every core,
// the same way as train-td.js: shared tables updated without locks,
// progress.jsonl every 30 seconds, model.bin (+ model.bin.json with its game
// count) every 5 minutes, and a rerun carries on from them.
// Usage: node prototypes/climb/train-td6.js outDir minutes [threads] [alpha]
const fs = require('fs');
const os = require('os');
const path = require('path');
const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');
const td = require('./td6');

// evan's usual settings (2026-10-30): 7 values from 8, Equal odds.
const SETTINGS = {poolSize: 7, poolStart: 8, fallOdds: 'equal'};
// Training boards never reuse the check boards (seeds 1 to 100) or the
// pilot's training boards (from 1,000,000).
const SEED_BASE = 100000000;

function bestPow2(state) {
  let best = 0;
  for (const row of state.board) for (const c of row) if (c && !c.stone && Number.isInteger(Math.log2(c.v))) best = Math.max(best, c.v);
  return best;
}

if (!isMainThread) {
  const {buffers, id, threads, start, alpha} = workerData;
  const m = {w: new Float32Array(buffers[0]), e: new Float32Array(buffers[1]), a: new Float32Array(buffers[2])};
  for (let k = 0; ; k++) {
    const seed = SEED_BASE + start + id + k * threads;
    let best = 0;
    const end = td.trainGame(m, SETTINGS, seed, alpha, (before, after) => { best = Math.max(best, bestPow2(after)); });
    parentPort.postMessage({best: Math.max(best, bestPow2(end)), moves: end.moves, climbs: end.slides});
  }
}

if (isMainThread) {
  const [outDir, minutesArg, threadsArg, alphaArg] = process.argv.slice(2);
  if (!outDir) throw new Error('Usage: train-td6.js outDir minutes [threads] [alpha]');
  const minutes = Number(minutesArg || 10);
  const threads = Number(threadsArg || os.cpus().length);
  const alpha = Number(alphaArg || 1);
  fs.mkdirSync(outDir, {recursive: true});
  const mPath = path.join(outDir, 'model.bin');
  const metaPath = mPath + '.json';
  const pPath = path.join(outDir, 'progress.jsonl');
  const m = td.newModel(true);
  const parts = [m.w, m.e, m.a];
  let games = 0;
  let seconds = 0;
  if (fs.existsSync(mPath)) {
    const fd = fs.openSync(mPath, 'r');
    for (const p of parts) fs.readSync(fd, new Uint8Array(p.buffer), 0, p.byteLength, null);
    fs.closeSync(fd);
    if (fs.existsSync(metaPath)) ({games, seconds} = JSON.parse(fs.readFileSync(metaPath, 'utf8')));
  }
  const recent = [];
  const t0 = Date.now();
  const save = () => {
    const meta = JSON.stringify({games, seconds: seconds + Math.round((Date.now() - t0) / 1000)});
    const fd = fs.openSync(mPath + '.tmp', 'w');
    for (const p of parts) fs.writeSync(fd, new Uint8Array(p.buffer));
    fs.closeSync(fd);
    fs.writeFileSync(metaPath + '.tmp', meta);
    fs.renameSync(mPath + '.tmp', mPath);
    fs.renameSync(metaPath + '.tmp', metaPath);
  };
  const startGames = games;
  const workers = [];
  for (let id = 0; id < threads; id++) {
    const w = new Worker(__filename, {workerData: {buffers: parts.map(p => p.buffer), id, threads, start: startGames, alpha}});
    w.on('message', g => { games++; recent.push(g); if (recent.length > 500) recent.shift(); });
    w.on('error', e => { console.error(e); process.exitCode = 1; });
    workers.push(w);
  }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const report = () => {
    const line = {
      time: new Date().toISOString(), games, seconds: seconds + Math.round((Date.now() - t0) / 1000), threads, alpha,
      bestTile: med(recent.map(g => g.best)), moves: med(recent.map(g => g.moves)), climbs: med(recent.map(g => g.climbs)),
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
