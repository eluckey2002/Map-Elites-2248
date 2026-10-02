'use strict';

const { parentPort } = require('node:worker_threads');
const { performance } = require('node:perf_hooks');
const { play } = require('./game');

parentPort.on('message', (job) => {
  try {
    const started = performance.now();
    const games = job.seeds.map((seed) => ({
      stage: job.stage,
      arm: job.arm,
      policyId: job.policy.policyId,
      level: job.levelData.level,
      seed,
      outcome: play(job.levelData, seed, job.policy),
    }));
    parentPort.postMessage({ id: job.id, games, cpuSeconds: (performance.now() - started) / 1000 });
  } catch (error) {
    parentPort.postMessage({ id: job.id, error: error.stack || String(error) });
  }
});
