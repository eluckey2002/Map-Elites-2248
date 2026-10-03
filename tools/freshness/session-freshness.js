#!/usr/bin/env node
'use strict';
/*
 * SessionStart launcher for the freshness check (BL-0022 criterion 1).
 *
 * Runs the sibling check.js against process.cwd() with a hard timeout and
 * GIT_TERMINAL_PROMPT=0, prints its stdout (a SessionStart hook's stdout is
 * added to the session context), and ALWAYS exits 0 so a failure here can
 * never block or break a session. Silent when cwd is not a git checkout.
 * Timeout: FRESHNESS_TIMEOUT_MS (default 8000).
 */
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const WARNING = 'FRESHNESS WARNING: this checkout is missing newer evidence commits; run the printed git command before trusting EVIDENCE_LEDGER.md';
const timeoutMs = Number(process.env.FRESHNESS_TIMEOUT_MS) > 0 ? Number(process.env.FRESHNESS_TIMEOUT_MS) : 8000;

function finish(text) {
  try { if (text) process.stdout.write(text.endsWith('\n') ? text : text + '\n'); } catch (_) { /* never fail */ }
  process.exit(0);
}

try {
  const cwd = process.cwd();
  const probe = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, encoding: 'utf8', timeout: 3000, windowsHide: true });
  if (probe.error || probe.status !== 0 || probe.stdout.trim() !== 'true') finish('');

  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const child = spawn(process.execPath, [path.join(__dirname, 'check.js'), cwd], { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', () => {});
  const timer = setTimeout(() => {
    try { child.kill('SIGKILL'); } catch (_) { /* ignore */ }
    if (process.platform === 'win32') {
      try { spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { timeout: 2000, windowsHide: true }); } catch (_) { /* ignore */ }
    }
    finish(`UNVERIFIED: freshness check timed out after ${timeoutMs} ms; this checkout's freshness was not checked.`);
  }, timeoutMs);
  child.on('error', (e) => { clearTimeout(timer); finish(`UNVERIFIED: freshness check could not run (${e.message}).`); });
  child.on('close', (code) => {
    clearTimeout(timer);
    if (code === 1) finish(WARNING + '\n' + out);
    else if (code === 0 || code === 2) finish(out);
    else finish(`UNVERIFIED: freshness check crashed (exit ${code}); this checkout's freshness was not checked.`);
  });
} catch (e) {
  finish(`UNVERIFIED: freshness launcher failed (${e && e.message}).`);
}
