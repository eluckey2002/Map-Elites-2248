// Trains the staged self-taught player (tds.js) on every core, the same way
// as train-td6.js (shared tables updated without locks, progress.jsonl every
// 30 seconds, model.bin + model.bin.json every 10 minutes, a rerun carries
// on). A share of the games (startShare, default 0.5) start from a random
// board in boards.jsonl (game states a stronger bot reached) instead of a
// fresh board. Progress lines describe the fresh-board games only.
// Usage: node prototypes/climb/train-tds.js outDir boards.jsonl minutes [threads] [alpha] [startShare]
const fs = require('fs');
const os = require('os');
const path = require('path');
const {Worker, isMainThread, parentPort, workerData} = require('worker_threads');
const td = require('./tds');

// evan's usual settings (2026-10-30): 7 values from 8, Equal odds.
const SETTINGS = {poolSize: 7, poolStart: 8, fallOdds: 'equal'};
// Training boards never reuse the check boards (seeds 1 to 100) or earlier
// training seeds (from 1,000,000 and 100,000,000).
const SEED_BASE = 200000000;

function bestPow2(state) {
  let best = 0;
  for (const row of state.board) for (const c of row) if (c && !c.stone && Number.isInteger(Math.log2(c.v))) best = Math.max(best, c.v);
  return best;
}

if (!isMainThread) {
  const {buffers, id, threads, start, alpha, boardsPath, startShare} = workerData;
  const boards = fs.readFileSync(boardsPath, 'utf8').split('\n').filter(Boolean);
  const pick = require('./players').makeRng(SEED_BASE + id);
  const m = {w: new Float32Array(buffers[0]), e: new Float32Array(buffers[1]), a: new Float32Array(buffers[2])};
  for (let k = 0; ; k++) {
    const seed = SEED_BASE + start + id + k * threads;
    let best = 0;
    const from = pick() < startShare ? JSON.parse(boards[Math.floor(pick() * boards.length)]) : null;
    const end = td.trainGame(m, SETTINGS, seed, alpha, from, (before, after) => { best = Math.max(best, bestPow2(after)); });
    parentPort.postMessage({fresh: !from, best: Math.max(best, bestPow2(end)), moves: end.moves, climbs: end.slides});
  }
}

if (isMainThread) {
  const [outDir, boardsPath, minutesArg, threadsArg, alphaArg, shareArg] = process.argv.slice(2);
  if (!boardsPath) throw new Error('Usage: train-tds.js outDir boards.jsonl minutes [threads] [alpha] [startShare]');
  const startShare = Number(shareArg || 0.5);
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
    const w = new Worker(__filename, {workerData: {buffers: parts.map(p => p.buffer), id, threads, start: startGames, alpha, boardsPath: path.resolve(boardsPath), startShare}});
    w.on('message', g => { games++; if (!g.fresh) return; recent.push(g); if (recent.length > 500) recent.shift(); });
    w.on('error', e => { console.error(e); process.exitCode = 1; });
    workers.push(w);
  }
  const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const report = () => {
    const line = {
      time: new Date().toISOString(), games, startShare, seconds: seconds + Math.round((Date.now() - t0) / 1000), threads, alpha,
      bestTile: med(recent.map(g => g.best)), moves: med(recent.map(g => g.moves)), climbs: med(recent.map(g => g.climbs)),
    };
    fs.appendFileSync(pPath, JSON.stringify(line) + '\n');
    console.log(JSON.stringify(line));
  };
  const tick = setInterval(report, 30000);
  const saver = setInterval(save, 600000);
  setTimeout(async () => {
    clearInterval(tick); clearInterval(saver);
    for (const w of workers) await w.terminate();
    report(); save();
  }, minutes * 60000);
}
