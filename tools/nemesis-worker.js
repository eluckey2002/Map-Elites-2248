'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');

// A result is exact or absent. Eviction and timeouts never become bot losses.
class ResultCache extends Map {
  constructor(limit) { super(); this.limit = limit; }
  get(key) {
    const value = super.get(key);
    if (super.has(key)) { super.delete(key); super.set(key, value); }
    return value;
  }
  set(key, value) {
    super.delete(key);
    super.set(key, value);
    while (this.size > this.limit) super.delete(this.keys().next().value);
    return this;
  }
}

function createNemesisRunner({ sources, timeoutMs = 120000, maxPending = 4, cacheLimit = 128,
  workerFile = __filename } = {}) {
  for (const value of [timeoutMs, maxPending, cacheLimit]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error('invalid Nemesis execution limit');
  }
  let worker = null, active = null, terminating = false, closed = false, nextId = 0;
  const queue = [];
  const pending = new Map();
  function finish(job, error, result) {
    clearTimeout(job.timer);
    pending.delete(job.key);
    if (error) job.reject(error); else job.resolve(result);
  }
  function discardWorker(error) {
    const old = worker;
    worker = null;
    if (active) { const job = active; active = null; finish(job, error); }
    if (!old) { drain(); return; }
    terminating = true;
    old.terminate().finally(() => { terminating = false; drain(); });
  }
  function drain() {
    if (closed || active || terminating || !queue.length) return;
    if (!worker) {
      try {
        const current = new Worker(workerFile, { workerData: { sources, cacheLimit } });
        worker = current;
        current.on('message', message => {
          if (worker !== current || !active || message.id !== active.id) return;
          const job = active;
          active = null;
          finish(job, message.error ? new Error(message.error) : null, message.result);
          drain();
        });
        current.on('error', error => { if (worker === current) discardWorker(error); });
        current.on('exit', code => {
          if (worker === current) discardWorker(new Error(`Nemesis worker exited (${code})`));
        });
        current.unref();
      } catch (error) {
        finish(queue.shift(), error);
        drain();
        return;
      }
    }
    active = queue.shift();
    // Queue slots are bounded; each active calculation gets its own CPU allowance.
    active.timer = setTimeout(() => {
      discardWorker(new Error('Nemesis calculation timed out; retry shortly'));
    }, timeoutMs);
    worker.postMessage({ id: active.id, query: active.query });
  }
  return {
    run(query) {
      if (closed) return Promise.reject(new Error('Nemesis runner closed'));
      const key = JSON.stringify(query);
      if (pending.has(key)) return pending.get(key).promise;
      if (pending.size >= maxPending) return Promise.reject(new Error('Nemesis is busy; retry shortly'));
      const job = { id: ++nextId, key, query };
      job.promise = new Promise((resolve, reject) => { job.resolve = resolve; job.reject = reject; });

      pending.set(key, job);
      queue.push(job);
      drain();
      return job.promise;
    },
    close() {
      closed = true;
      for (const job of queue.splice(0)) finish(job, new Error('Nemesis runner closed'));
      if (worker) discardWorker(new Error('Nemesis runner closed'));
    },
  };
}

if (!isMainThread) {
  const { POLICIES, listChallenges, oneChallenge } = require('./nemesis');
  const cache = new ResultCache(workerData.cacheLimit);
  parentPort.on('message', ({ id, query }) => {
    try {
      const policy = POLICIES.find(p => p.id === query.policy);
      if (!policy) throw new Error('unknown bot policy');
      const options = { cache, policy, ...(workerData.sources ? { sources: workerData.sources } : {}) };
      const result = query.level === null
        ? { challenges: listChallenges(options), policies: POLICIES, policy }
        : { challenge: oneChallenge(query.level, query.seed, options) };
      parentPort.postMessage({ id, result });
    } catch (error) { parentPort.postMessage({ id, error: error.message }); }
  });
}

module.exports = { createNemesisRunner, ResultCache };
