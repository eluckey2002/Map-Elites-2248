#!/usr/bin/env node
// BL-0022 criterion 3 one-time rollout sweep. REPORT-ONLY, built-ins only.
// Usage: node tools/freshness/rollout.js [mainCloneDir=cwd]
//
// Runs the sibling check.js over every worktree listed by
// `git worktree list --porcelain` from the main clone and prints one line per
// worktree plus a summary. It NEVER runs a printed fix command and never pulls,
// merges, resets, checks out, switches, rebases, cleans, stashes, removes or
// writes in the inspected repos (check.js's own `git fetch --all` ref update is
// the only write, and it is allowed).
//
// Exit: 1 if any STALE; else 2 if any UNVERIFIED or MISSING; else 0.
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CHECK = path.join(__dirname, 'check.js');

function parseWorktrees(text) {
  const list = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      cur = { path: line.slice(9), branch: '(detached)', bare: false };
      list.push(cur);
    } else if (cur && line.startsWith('branch ')) {
      cur.branch = line.slice(7).replace(/^refs\/heads\//, '');
    } else if (cur && line === 'bare') {
      cur.bare = true;
    }
  }
  return list;
}

function inspect(wt) {
  if (!fs.existsSync(wt.path)) {
    return { label: 'MISSING', behind: '?', fixes: [], note: 'path not on disk' };
  }
  if (wt.bare) {
    return { label: 'UNVERIFIED', behind: '?', fixes: [], note: 'bare entry, no working tree to check' };
  }
  const timeoutMs = Number(process.env.ROLLOUT_CHECK_TIMEOUT_MS) > 0 ? Number(process.env.ROLLOUT_CHECK_TIMEOUT_MS) : 60000;
  const r = spawnSync('node', [CHECK, wt.path], { encoding: 'utf8', timeout: timeoutMs, killSignal: 'SIGKILL' });
  if ((r.error && r.error.code === 'ETIMEDOUT') || r.signal) {
    return { label: 'UNVERIFIED', behind: '?', fixes: [], note: `check timed out after ${timeoutMs} ms` };
  }
  if (r.error) {
    return { label: 'UNVERIFIED', behind: '?', fixes: [], note: `check.js did not run: ${r.error.message}` };
  }
  const lines = (r.stdout || '').split(/\r?\n/);
  let behind = '?';
  for (const l of lines) {
    const m = /^\(b\) lacks from origin\/main: \d+ commit\(s\), (\d+) touching/.exec(l);
    if (m) { behind = m[1]; break; }
  }
  const unchecked = r.status === 0 ? lines.find((l) => l.startsWith('UNCHECKED:')) : undefined;
  const label = unchecked ? 'UNVERIFIED' : r.status === 0 ? 'FRESH' : r.status === 1 ? 'STALE' : 'UNVERIFIED';
  const fixes = [];
  const i = lines.findIndex((l) => l.startsWith('To bring it current'));
  if (i >= 0) {
    for (const l of lines.slice(i + 1)) {
      if (l.startsWith('  ')) fixes.push(l); else break;
    }
  }
  let note = '';
  if (label === 'UNVERIFIED') {
    const why = unchecked || lines.find((l) => /^(WARNING|UNVERIFIED|UNCHECKED|freshness: .*not a git)/.test(l))
      || (r.stderr || '').split(/\r?\n/)[0] || `check.js exit ${r.status}`;
    note = why;
  }
  return { label, behind, fixes, note };
}

function main() {
  const mainDir = path.resolve(process.argv[2] || process.cwd());
  const wl = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: mainDir, encoding: 'utf8' });
  if (wl.error || wl.status !== 0) {
    const why = wl.error ? wl.error.message : (wl.stderr || '').trim().split(/\r?\n/)[0];
    console.log(`[UNVERIFIED] ${mainDir} | branch=(detached) | evidence-behind=? | git worktree list failed: ${why}`);
    console.log('rollout: 0 worktrees, 0 fresh, 0 stale, 1 unverified, 0 missing');
    process.exitCode = 2;
    return;
  }
  const counts = { FRESH: 0, STALE: 0, UNVERIFIED: 0, MISSING: 0 };
  const out = [];
  const stale = [];
  const wts = parseWorktrees(wl.stdout);
  for (const wt of wts) {
    const r = inspect(wt);
    counts[r.label] += 1;
    out.push(`[${r.label}] ${wt.path} | branch=${wt.branch} | evidence-behind=${r.behind}${r.note ? ` | ${r.note}` : ''}`);
    if (r.label === 'STALE') stale.push({ wt, fixes: r.fixes });
  }
  out.push(`rollout: ${wts.length} worktrees, ${counts.FRESH} fresh, ${counts.STALE} stale, ${counts.UNVERIFIED} unverified, ${counts.MISSING} missing`);
  for (const s of stale) {
    out.push(`fix for ${s.wt.path} (NOT run by this script):`);
    s.fixes.forEach((f) => out.push(f));
  }
  process.stdout.write(`${out.join('\n')}\n`);
  process.exitCode = counts.STALE ? 1 : (counts.UNVERIFIED || counts.MISSING ? 2 : 0);
}

main();
