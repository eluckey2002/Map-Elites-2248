'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createJournaledPool, syncDirectory } = require('../policy-lab/journaled-pool');

test('Windows directory-sync branch avoids the unavailable directory open while POSIX still syncs', () => {
  const unavailable = { openSync: () => { throw Object.assign(new Error('directory open unavailable'), { code: 'EPERM' }); } };
  assert.doesNotThrow(() => syncDirectory('synthetic-directory', 'win32', unavailable));
  assert.throws(() => syncDirectory('synthetic-directory', 'linux', unavailable), /unavailable/);
  const events = [];
  syncDirectory('synthetic-directory', 'linux', { openSync: () => 7, fsyncSync: fd => events.push(['sync', fd]), closeSync: fd => events.push(['close', fd]) });
  assert.deepEqual(events, [['sync', 7], ['close', 7]]);
});

test('journal retains a completed job when a later job fails and refuses replay', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-journal-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, 'run');
  const pool = createJournaledPool(1, { directory, runId: 'synthetic', poolFactory: () => ({
    run: async job => { if (job.fail) throw new Error('planted worker failure'); return { synthetic: true, rows: [58] }; }, close: async () => {},
  }) });
  const first = { level: 58, synthetic: true };
  await pool.run(first);
  await assert.rejects(pool.run({ fail: true, synthetic: true }), /planted worker failure/);
  const files = fs.readdirSync(directory).filter(f => f.endsWith('.completed.json'));
  assert.equal(files.length, 1);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, files[0]))).result, { synthetic: true, rows: [58] });
  await assert.rejects(pool.run(first), /EEXIST/);
  assert.throws(() => createJournaledPool(1, { directory, runId: 'retry', poolFactory: () => { throw new Error('must not launch'); } }), /EEXIST/);
  await pool.close();
});

test('journal survives actual controller termination while another job is in flight', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-journal-kill-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const directory = path.join(root, 'run');
  const script = `
    const {createJournaledPool} = require(process.argv[1]);
    const pool = createJournaledPool(1, {directory: process.argv[2], runId: 'synthetic-kill',
      poolFactory: () => ({run: async job => job.pending ? new Promise(() => {}) : {synthetic: true, rows: [56,57,58]}, close: async () => {}})});
    setInterval(() => {}, 1000);
    (async () => {
      await pool.run({synthetic: true, completed: true});
      pool.run({synthetic: true, pending: true});
      process.stdout.write('checkpointed-and-pending\\n');
    })().catch(e => {process.stderr.write(e.stack); process.exit(1);});`;
  const child = spawn(process.execPath, ['-e', script, require.resolve('../policy-lab/journaled-pool'), directory], { stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill('SIGKILL'));
  let stderr = ''; child.stderr.on('data', data => { stderr += data; });
  const exited = once(child, 'exit');
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`child checkpoint timeout: ${stderr}`)), 10000);
    child.stdout.once('data', data => { clearTimeout(timer); String(data).includes('checkpointed-and-pending') ? resolve() : reject(new Error(String(data))); });
    child.once('error', e => { clearTimeout(timer); reject(e); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`child exited before checkpoint ${code}: ${stderr}`)); });
  });
  child.kill('SIGKILL');
  const [, signal] = await exited;
  assert.equal(signal, 'SIGKILL');
  const completed = fs.readdirSync(directory).filter(f => f.endsWith('.completed.json'));
  const dispatched = fs.readdirSync(directory).filter(f => f.endsWith('.dispatched.json'));
  assert.equal(completed.length, 1); assert.equal(dispatched.length, 2);
  const retained = JSON.parse(fs.readFileSync(path.join(directory, completed[0])));
  assert.deepEqual(retained.result, { synthetic: true, rows: [56, 57, 58] });
});
