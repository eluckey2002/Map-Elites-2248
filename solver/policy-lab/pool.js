'use strict';
const path = require('node:path');
const { Worker } = require('node:worker_threads');

function createPool(size = 4) {
  if (!Number.isInteger(size) || size < 1 || size > 4) throw new Error('at most four workers');
  const workers = Array.from({ length: size }, () => new Worker(path.join(__dirname, 'worker.js')));
  let cursor = 0;
  const tails = workers.map(() => Promise.resolve());
  return {
    size,
    run(job) {
      const i = cursor++ % size;
      const work = tails[i].then(() => new Promise((resolve, reject) => {
        const worker = workers[i];
        const done = message => { cleanup(); message.error ? reject(new Error(message.error)) : resolve(message); };
        const error = err => { cleanup(); reject(err); };
        const cleanup = () => { worker.off('message', done); worker.off('error', error); };
        worker.once('message', done); worker.once('error', error); worker.postMessage(job);
      }));
      tails[i] = work.catch(() => {});
      return work;
    },
    async close() { await Promise.all(workers.map(w => w.terminate())); },
  };
}
module.exports = { createPool };
