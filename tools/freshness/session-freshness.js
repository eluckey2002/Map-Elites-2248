#!/usr/bin/env node
'use strict';
/*
 * SessionStart launcher for the freshness check (BL-0022 criterion 1).
 *
 * Runs the sibling check.js against process.cwd() with a hard timeout and
 * GIT_TERMINAL_PROMPT=0, prints its stdout (a SessionStart hook's stdout is
 * added to the session context), and ALWAYS exits 0 so a failure here can
 * never block or break a session. Silent when cwd is not a git checkout.
 * Timeout: FRESHNESS_TIMEOUT_MS (default 8000). The git probe timeout is
 * FRESHNESS_PROBE_TIMEOUT_MS (default 3000); a probe that errors or is killed
 * prints one UNVERIFIED line instead of silently skipping the check.
 */
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const WARNING = 'FRESHNESS WARNING: this checkout is missing newer evidence commits; run the printed git command before trusting EVIDENCE_LEDGER.md';
const timeoutMs = Number(process.env.FRESHNESS_TIMEOUT_MS) > 0 ? Number(process.env.FRESHNESS_TIMEOUT_MS) : 8000;

const probeTimeoutMs = Number(process.env.FRESHNESS_PROBE_TIMEOUT_MS) > 0 ? Number(process.env.FRESHNESS_PROBE_TIMEOUT_MS) : 3000;

function finish(text) {
  try { if (text) process.stdout.write(text.endsWith('\n') ? text : text + '\n'); } catch (_) { /* never fail */ }
  process.exit(0);
}

try {
  const cwd = process.cwd();
  const probe = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, encoding: 'utf8', timeout: probeTimeoutMs, windowsHide: true });
  if (probe.error || probe.signal) {
    const reason = probe.error ? (probe.error.code || probe.error.message) : `killed by ${probe.signal}`;
    finish(`UNVERIFIED: freshness probe failed (${reason}); this checkout's freshness was not checked.`);
  }
  if (probe.status !== 0 || String(probe.stdout).trim() !== 'true') finish('');

  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
  const child = spawn(process.execPath, [path.join(__dirname, 'check.js'), cwd], { cwd, env, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  let timedOut = false;
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', () => {});
  const timer = setTimeout(() => {
    timedOut = true;
    if (process.platform === 'win32') {
      // taskkill must run BEFORE child.kill: once the child is dead its tree cannot be walked.
      try { spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { timeout: 2000, windowsHide: true }); } catch (_) { /* ignore */ }
      try { child.kill('SIGKILL'); } catch (_) { /* ignore */ }
    } else {
      try { process.kill(-child.pid, 'SIGKILL'); } catch (_) { try { child.kill('SIGKILL'); } catch (_2) { /* ignore */ } }
    }
    // Give our direct child up to ~1 s to be reaped before exiting, so it is not left a zombie.
    const msg = `UNVERIFIED: freshness check timed out after ${timeoutMs} ms; this checkout's freshness was not checked.`;
    const grace = setTimeout(() => finish(msg), 1000);
    child.on('close', () => { clearTimeout(grace); finish(msg); });
    if (child.exitCode !== null || child.signalCode !== null) { clearTimeout(grace); finish(msg); }
  }, timeoutMs);
  child.on('error', (e) => { if (timedOut) return; clearTimeout(timer); finish(`UNVERIFIED: freshness check could not run (${e.message}).`); });
  child.on('close', (code) => {
    if (timedOut) return;
    clearTimeout(timer);
    if (code === 1) finish(WARNING + '\n' + out);
    else if (code === 0 || code === 2) finish(out);
    else finish(`UNVERIFIED: freshness check crashed (exit ${code}); this checkout's freshness was not checked.`);
  });
} catch (e) {
  finish(`UNVERIFIED: freshness launcher failed (${e && e.message}).`);
}
