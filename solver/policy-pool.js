// Fixed worker pool. Kept separate from the search so the search reads as
// search and not as job plumbing.
const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

function createPool(size = Math.max(1, Math.min(os.cpus().length - 1, 9))) {
  const workers = Array.from({ length: size }, () => new Worker(path.join(__dirname, 'policy-worker.js')));
  const idle = [...workers];
  const queue = [];
  const pending = new Map();
  let nextId = 0;

  for (const w of workers) {
    w.on('message', (msg) => {
      const resolve = pending.get(msg.id);
      pending.delete(msg.id);
      idle.push(w);
      resolve(msg);
      pump();
    });
  }

  function pump() {
    while (idle.length && queue.length) {
      const { resolve, ...job } = queue.shift();
      const w = idle.pop();
      pending.set(job.id, resolve);
      w.postMessage(job); // job only, never the resolve fn: not structured-cloneable
    }
  }

  return {
    size,
    run(params, levelNumbers, seeds) {
      return new Promise((resolve) => {
        queue.push({ id: nextId++, params, levelNumbers, seeds, resolve });
        pump();
      });
    },
    async close() { await Promise.all(workers.map((w) => w.terminate())); },
  };
}


// Splits one policy's games across workers by level block, then reassembles in
// the original level order. Order matters: the cluster-robust standard error in
// policy-eval.js indexes cells level-major, so a reshuffle here would silently
// scramble which cells belong to which level and quietly corrupt every SE
// downstream. Chunks are kept small because level cost is wildly uneven — the
// late scaled boards run an order of magnitude slower than the early ones, so a
// few big chunks leave most workers idle waiting on the slowest.
async function runSharded(pool, params, levelNumbers, seeds, shards = 17) {
  const size = Math.max(1, Math.ceil(levelNumbers.length / shards));
  const chunks = [];
  for (let i = 0; i < levelNumbers.length; i += size) chunks.push(levelNumbers.slice(i, i + size));
  const parts = await Promise.all(chunks.map((c) => pool.run(params, c, seeds)));
  const scores = parts.flatMap((p) => p.scores);
  const wins = parts.reduce((a, p) => a + p.winRate * p.scores.length, 0);
  const targeted = parts.filter((p) => p.avgMovesToTarget !== null);
  return {
    scores,
    winRate: wins / scores.length,
    avgMovesToTarget: targeted.length
      ? targeted.reduce((a, p) => a + p.avgMovesToTarget, 0) / targeted.length : null,
  };
}

module.exports = { createPool, runSharded };
