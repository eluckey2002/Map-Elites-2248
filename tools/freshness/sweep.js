#!/usr/bin/env node
// BL-0022 criterion 4/7 worktree sweep. REPORT-ONLY, built-ins only.
// Usage: node tools/freshness/sweep.js [mainCloneDir=cwd]
//
// It only runs read-only git commands (worktree list, rev-parse, status,
// rev-list, merge-base) and reads lease files. It never removes, deletes,
// resets, merges, pulls or writes anything in the repos it inspects.
// "Removal candidates" are a printed list for a human/future mechanism.
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// A lease heartbeat older than this is "not fresh" (criterion 4 staleness threshold).
const HEARTBEAT_STALE_MS = 30 * 60 * 1000; // 30 minutes

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

// process.kill(pid, 0) sends no signal; throws ESRCH if no such process,
// EPERM if it exists but belongs to someone else (treated as alive).
// UNVERIFIED: Windows semantics of signal 0 beyond what the test file exercises.
function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

function parseWorktrees(text) {
  const list = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      cur = { path: line.slice(9), branch: '(detached)' };
      list.push(cur);
    } else if (cur && line.startsWith('branch ')) {
      cur.branch = line.slice(7).replace(/^refs\/heads\//, '');
    } else if (cur && line.startsWith('HEAD ')) {
      cur.head = line.slice(5);
    } else if (cur && line === 'bare') {
      cur.bare = true;
    }
  }
  return list;
}

function classifyLease(gitDir, now) {
  const file = path.join(gitDir, 'agent-lease');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return { cls: 'absent' }; }
  let lease;
  try { lease = JSON.parse(raw); } catch { return { cls: 'absent', note: 'unparseable lease treated as absent' }; }
  const hb = lease && typeof lease === 'object' && !Array.isArray(lease)
    ? (typeof lease.heartbeat === 'number' ? lease.heartbeat : Date.parse(lease.heartbeat)) : NaN;
  if (Number.isNaN(hb) || typeof lease.host !== 'string') {
    return { cls: 'absent', note: 'malformed lease treated as absent' };
  }
  if (lease.host !== os.hostname()) return { cls: 'foreign-host' };
  const fresh = now - hb <= HEARTBEAT_STALE_MS;
  if (fresh || pidAlive(lease.pid)) return { cls: 'live' };
  return { cls: 'stale-local-dead-pid' };
}

function main() {
  const mainDir = path.resolve(process.argv[2] || process.cwd());
  const wl = git(mainDir, ['worktree', 'list', '--porcelain']);
  if (!wl.ok) {
    console.error('sweep: git worktree list failed in ' + mainDir + ': ' + wl.err);
    process.exit(2);
  }
  const now = Date.now();
  const candidates = [];
  for (const wt of parseWorktrees(wl.out)) {
    const dotGit = path.join(wt.path, '.git');
    let st = null;
    try { st = fs.statSync(dotGit); } catch { /* missing */ }
    if (!st) { console.log(`[SKIP] ${wt.path} | no .git entry (prunable/missing)`); continue; }
    if (st.isDirectory()) { console.log(`[SKIP] ${wt.path} | .git is a directory (real clone), never touched`); continue; }

    const gd = git(wt.path, ['rev-parse', '--absolute-git-dir']);
    const merged = git(wt.path, ['merge-base', '--is-ancestor', 'HEAD', 'origin/main']).ok;
    const dirty = git(wt.path, ['status', '--porcelain']).out.length > 0;
    // Unpushed = commits reachable from HEAD that are on no remote-tracking ref.
    const unpushedN = parseInt(git(wt.path, ['rev-list', '--count', 'HEAD', '--not', '--remotes']).out, 10) || 0;
    const clean = !dirty && unpushedN === 0;
    const lease = gd.ok ? classifyLease(gd.out, now) : { cls: 'absent', note: 'git dir unreadable' };

    const isCand = merged && clean && lease.cls === 'stale-local-dead-pid';
    if (isCand) candidates.push(wt.path);
    console.log(
      `[${isCand ? 'CANDIDATE' : 'REPORT'}] ${wt.path} | branch=${wt.branch}` +
      ` | merged-into-origin/main=${merged ? 'yes' : 'no'}` +
      ` | tree=${clean ? 'clean' : 'not-clean(' + (dirty ? 'uncommitted' : '') + (dirty && unpushedN ? ',' : '') + (unpushedN ? unpushedN + ' unpushed' : '') + ')'}` +
      ` | lease=${lease.cls}${lease.note ? ' (' + lease.note + ')' : ''}`
    );
  }
  console.log(`removal candidates (merged + clean + stale-local-dead-pid lease; REPORT-ONLY, nothing removed): ${candidates.length}`);
  for (const c of candidates) console.log('  ' + c);
}

main();
