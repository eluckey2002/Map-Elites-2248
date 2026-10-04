'use strict';

const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

function createPool(size = Math.max(1, Math.min(os.cpus().length - 1, 8))) {
  const workers = Array.from({ length: size }, () => new Worker(path.join(__dirname, 'worker.js')));
  const idle = [...workers];
  const queue = [];
  const pending = new Map();
  let nextId = 1;
  let stopped = false;

  function pump() {
    while (!stopped && idle.length && queue.length) {
      const worker = idle.pop();
      const item = queue.shift();
      pending.set(item.id, { ...item, worker });
      worker.postMessage(item.job);
    }
  }

  for (const worker of workers) {
    worker.on('message', (message) => {
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      idle.push(worker);
      if (message.error) item.reject(new Error(message.error));
      else item.resolve(message);
      pump();
    });
    worker.on('error', (error) => {
      stopped = true;
      for (const item of pending.values()) item.reject(error);
      pending.clear();
      for (const item of queue) item.reject(error);
      queue.length = 0;
    });
  }

  return {
    size,
    run(job) {
      if (stopped) return Promise.reject(new Error('worker pool stopped'));
      return new Promise((resolve, reject) => {
        const id = nextId++;
        queue.push({ id, job: { ...job, id }, resolve, reject });
        pump();
      });
    },
    async close() {
      stopped = true;
      await Promise.all(workers.map((worker) => worker.terminate()));
    },
  };
}

module.exports = { createPool };
