'use strict';
const { parentPort } = require('node:worker_threads');
const { performance } = require('node:perf_hooks');
const { play } = require('./play');
const { chooserFor, chooseLab } = require('./chooser');
const { chooseMove } = require('../bot');
const { play: rulerPlay } = require('../ruler/game');
const fs = require('node:fs');
const path = require('node:path');

// Record actual dynamic fs reads as well as the runner's input manifest.
const reads = new Set();
const originalRead = fs.readFileSync;
fs.readFileSync = function (file, ...args) { if (typeof file === 'string') reads.add(path.resolve(file)); return originalRead.call(this, file, ...args); };
const chainKey = chain => chain?.map(t => `${t.x},${t.y}`).join('|') ?? null;
parentPort.on('message', job => {
  try {
    reads.clear();
    const started = performance.now(), cpuStart = process.threadCpuUsage();
    let inertTotal = 0, inertIdentical = 0;
    const games = job.seeds.map(seed => {
      const onPosition = !job.inert ? undefined : (state, options) => {
        inertTotal++;
        if (chainKey(chooseLab(state, options)) === chainKey(chooseMove(state, options))) inertIdentical++;
      };
      const outcome = play(job.levelData, seed, chooserFor(job.policy), { lookaheadBase: job.policy.lookaheadBase, onPosition });
      const replay = job.parity ? rulerPlay(job.levelData, seed, job.policy) : null;
      return { level: job.levelData.level, seed, outcome, ...(replay ? { parityOutcome: replay } : {}) };
    });
    const cpu = process.threadCpuUsage(cpuStart);
    parentPort.postMessage({ games, inertTotal, inertIdentical,
      workerElapsedSeconds: (performance.now() - started) / 1000, threadCpuSeconds: (cpu.user + cpu.system) / 1000000,
      filesRead: [...new Set([...reads, ...Object.keys(require.cache)])].sort() });
  } catch (error) { parentPort.postMessage({ error: error.stack || String(error) }); }
});
