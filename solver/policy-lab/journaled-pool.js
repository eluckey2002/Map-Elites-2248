'use strict';

// For a future preregistered harness. The stopped run's frozen pool and
// controller remain byte-identical; this adapter must be frozen before use.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createPool } = require('./pool');

function atomicJson(file, value) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  const fd = fs.openSync(temporary, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify(value) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
  const directory = fs.openSync(path.dirname(file), 'r');
  try { fs.fsyncSync(directory); } finally { fs.closeSync(directory); }
}

function createJournaledPool(size, { directory, runId, poolFactory = createPool }) {
  if (!Number.isInteger(size) || size < 1 || size > 4) throw new Error('at most four workers');
  if (!directory || !runId) throw new Error('a fresh journal directory and runId are required');
  // An existing directory, even an interrupted one, is never resumed or reused.
  fs.mkdirSync(directory);
  atomicJson(path.join(directory, 'manifest.json'), { runId, workers: size, kind: 'job-journal' });
  const pool = poolFactory(size);
  return {
    size,
    async run(job) {
      const id = crypto.createHash('sha256').update(JSON.stringify(job)).digest('hex');
      const claim = path.join(directory, `${id}.dispatched.json`);
      const fd = fs.openSync(claim, 'wx');
      try { fs.writeFileSync(fd, JSON.stringify({ id, runId, job }) + '\n'); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      const dir = fs.openSync(directory, 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
      const result = await pool.run(job);
      // Retain each completed level job before its promise resolves to a panel's
      // Promise.all. A later job failure or controller loss cannot discard it.
      atomicJson(path.join(directory, `${id}.completed.json`), { id, runId, job, result });
      return result;
    },
    close: () => pool.close(),
  };
}

module.exports = { createJournaledPool };
