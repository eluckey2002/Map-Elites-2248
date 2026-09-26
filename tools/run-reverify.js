#!/usr/bin/env node
// Runs every command a live ledger record names in its `reverify` field and
// reports which records no longer reproduce (BL-0016 F1). Recorded reverify
// commands rot silently: on 2026-09-26 RESULT-0017's exited 1 while every gate
// was green. This is the nightly listener for that.
//
// Live means status `accepted`; a narrowed or superseded record's reverify is
// replaced by its correction's. Only backticked `node`, `python3`, and `git`
// commands run, from the repository root or from a directory named as
// "From `dir`, run `cmd`". A record with a `<placeholder>` or pipe in any
// command is reported as manual. A command passes when it exits 0.
// Does NOT compare output with the expected observation written in prose.
//
// Usage: node tools/run-reverify.js [--only ID,ID] [--timeout-min N] [--out file.json]

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

function reverifyPlan(text) {
  const plan = [];
  for (const record of text.split(/^### (?=[A-Z]+-\d{4}\b)/m).slice(1)) {
    const id = /^[A-Z]+-\d{4}/.exec(record)[0];
    const status = (/^- \*\*status:\*\*[ \t]*(\S+)/m.exec(record) || [])[1];
    if (status !== 'accepted') continue;
    const reverify = (/^- \*\*reverify:\*\*[ \t]*(.*)$/m.exec(record) || [])[1] || '';
    // "From `dir`, run `cmd`" sets the directory for that command only.
    const commands = [...reverify.matchAll(/(?:\bFrom `([^`\s]+)`, run )?`((?:node|python3|git)\s[^`]+)`/g)]
      .map((m) => ({ cwd: m[1] || '.', command: m[2] }));
    // A placeholder or pipe means a manual setup step; later commands depend on it.
    const manual = commands.some((c) => /<[a-z][\w -]*>| \| /.test(c.command));
    for (const c of commands) plan.push({ id, ...c, manual });
  }
  return plan;
}

function run(entry, timeoutMs) {
  const started = Date.now();
  const r = spawnSync(entry.command, {
    cwd: path.join(ROOT, entry.cwd), shell: '/bin/sh', encoding: 'utf8',
    timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024,
  });
  const tail = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-3).join(' | ').slice(0, 400);
  const outcome = r.error && r.error.code === 'ETIMEDOUT' ? 'TIMEOUT' : r.status === 0 ? 'PASS' : 'FAIL';
  return { outcome, exit: r.status, seconds: Math.round((Date.now() - started) / 1000), tail };
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
  const only = opt('--only') ? new Set(opt('--only').split(',')) : null;
  const timeoutMs = Number(opt('--timeout-min') || 30) * 60 * 1000;
  const plan = reverifyPlan(fs.readFileSync(path.join(ROOT, 'EVIDENCE_LEDGER.md'), 'utf8'))
    .filter((e) => !only || only.has(e.id));

  const cache = new Map(); // the same command is cited by many records
  const results = [];
  for (const entry of plan) {
    const key = `${entry.cwd}\0${entry.command}`;
    let result;
    if (entry.manual) result = { outcome: 'MANUAL' };
    else {
      if (!cache.has(key)) cache.set(key, run(entry, timeoutMs));
      result = cache.get(key);
    }
    results.push({ ...entry, ...result });
    console.log(`${result.outcome.padEnd(7)} ${entry.id}  ${entry.command.slice(0, 100)}`);
  }

  const failing = [...new Set(results.filter((r) => r.outcome === 'FAIL' || r.outcome === 'TIMEOUT').map((r) => r.id))];
  const summary = {
    records: new Set(results.map((r) => r.id)).size,
    commands: cache.size,
    failingRecords: failing,
    counts: results.reduce((c, r) => ({ ...c, [r.outcome]: (c[r.outcome] || 0) + 1 }), {}),
  };
  if (opt('--out')) fs.writeFileSync(opt('--out'), `${JSON.stringify({ summary, results }, null, 2)}\n`);
  console.log(`\n${JSON.stringify(summary)}`);
  if (failing.length) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { reverifyPlan };
