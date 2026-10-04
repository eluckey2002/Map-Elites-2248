#!/usr/bin/env node
'use strict';
/*
 * Freshness check (BL-0022 criteria 2 and 7).
 *
 *   node tools/freshness/check.js [repoDir=cwd]
 *
 * SELF-CONTAINED on purpose: node built-ins only, nothing imported from the
 * inspected checkout, so a copy of this single file can live outside any repo
 * and still inspect a stale or pre-existing checkout (criterion 1).
 *
 * It reports, for the checkout at repoDir, after `git fetch --all`:
 *   (a) commits the checkout lacks from its own upstream (HEAD..@{upstream}),
 *   (b) commits it lacks from origin/main (HEAD..origin/main) that touch
 *       EVIDENCE_LEDGER.md, LEDGER-INDEX.md or CURRENT.md,
 *   (c) whether its current branch is already merged into origin/main.
 * and prints the exact git command that would bring it current.
 *
 * Reading of criterion 2's "either count of evidence-touching commits": the
 * evidence-path filter is applied to BOTH comparison bases. The two counts are
 *   upstreamEvidence = commits in HEAD..@{upstream} touching an evidence file
 *   mainEvidence     = commits in HEAD..origin/main touching an evidence file
 * and the script exits 1 when EITHER is above zero. Plain (non-evidence)
 * behind-counts are reported but never fail the check.
 *
 * Exit codes: 0 fresh (or nothing checkable, stated clearly), 1 stale evidence,
 *             2 could not check (not a git repo, or fetch failed so refs may be
 *             out of date).
 *
 * Criterion 7: this script NEVER pulls, merges, resets, checks out or edits
 * the working tree. Its only write is the ref update `git fetch` performs. The
 * fix command is printed for a human or agent to run; it is never run here.
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const EVIDENCE_FILES = ['EVIDENCE_LEDGER.md', 'LEDGER-INDEX.md', 'CURRENT.md'];
const MAIN_REF = 'origin/main';

function git(cwd, args) {
  const r = spawnSync('git', args, {
    cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return { ok: r.status === 0, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}

function count(cwd, range, withFilter) {
  const args = ['rev-list', '--count', range];
  if (withFilter) args.push('--', ...EVIDENCE_FILES.map((f) => `:(top)${f}`));
  const r = git(cwd, args);
  return r.ok ? Number(r.out) : null;
}

function check(repoArg) {
  const lines = [];
  const say = (s) => lines.push(s);
  const dir = path.resolve(repoArg || process.cwd());
  const top = git(dir, ['rev-parse', '--show-toplevel']);
  if (!top.ok) {
    say(`freshness: ${dir} is not a git checkout; cannot check.`);
    return { code: 2, lines };
  }
  const cwd = top.out;
  say(`freshness: checking ${cwd}`);

  const remotes = git(cwd, ['remote']).out.split(/\r?\n/).filter(Boolean);
  let fetchFailed = false;
  if (remotes.length) {
    const f = git(cwd, ['fetch', '--all', '--quiet']);
    if (!f.ok) {
      fetchFailed = true;
      say(`WARNING: git fetch failed (${f.err.split(/\r?\n/)[0] || 'unknown error'}); counts below use possibly stale refs.`);
    }
  } else {
    say('NOTE: no remotes configured; nothing to fetch.');
  }

  const branchR = git(cwd, ['symbolic-ref', '--short', '-q', 'HEAD']);
  const branch = branchR.ok ? branchR.out : null;
  say(branch ? `branch: ${branch}` : 'branch: (detached HEAD)');

  let upstreamBehind = null;
  let upstreamEvidence = 0;
  let upstreamName = null;
  const up = git(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']);
  if (branch && up.ok) {
    upstreamName = up.out;
    upstreamBehind = count(cwd, `HEAD..${upstreamName}`, false);
    upstreamEvidence = count(cwd, `HEAD..${upstreamName}`, true) || 0;
    say(`(a) lacks from upstream ${upstreamName}: ${upstreamBehind} commit(s), ${upstreamEvidence} touching evidence files`);
  } else {
    say(branch ? '(a) no upstream configured for this branch; upstream comparison skipped.'
      : '(a) detached HEAD has no upstream; upstream comparison skipped.');
  }

  let mainEvidence = 0;
  let mainBehind = null;
  let merged = null;
  const hasMain = git(cwd, ['rev-parse', '--verify', '-q', `${MAIN_REF}^{commit}`]).ok;
  if (hasMain) {
    mainBehind = count(cwd, `HEAD..${MAIN_REF}`, false);
    mainEvidence = count(cwd, `HEAD..${MAIN_REF}`, true) || 0;
    say(`(b) lacks from ${MAIN_REF}: ${mainBehind} commit(s), ${mainEvidence} touching ${EVIDENCE_FILES.join(', ')}`);
    merged = git(cwd, ['merge-base', '--is-ancestor', 'HEAD', MAIN_REF]).ok;
    say(`(c) ${branch ? `branch ${branch}` : 'HEAD'} is ${merged ? '' : 'NOT '}already merged into ${MAIN_REF}`
      + (merged && mainBehind > 0 ? ' (so "up to date with upstream" can hide a stale ledger)' : ''));
  } else {
    say(`(b) no ${MAIN_REF} ref (no origin remote, or it has no main); origin/main comparison skipped.`);
    say('(c) merged-into-origin/main unknown for the same reason.');
  }

  const stale = upstreamEvidence > 0 || mainEvidence > 0;
  const q = JSON.stringify(cwd);
  const cmds = [];
  const mainCmd = [];
  if (mainEvidence > 0) {
    if (!branch) mainCmd.push(`git -C ${q} switch --detach ${MAIN_REF}`);
    // Merged: HEAD is an ancestor of origin/main, so ff-ing the CURRENT branch is
    // valid and never switches branches (a linked worktree cannot switch to main
    // while the primary clone has it checked out).
    else if (merged) mainCmd.push(`git -C ${q} merge --ff-only ${MAIN_REF}`);
    else mainCmd.push(`git -C ${q} merge --ff-only ${MAIN_REF}   # or rebase onto ${MAIN_REF} if the branch has its own commits`);
  }
  if (upstreamBehind > 0 && !(upstreamName === MAIN_REF && mainCmd.length)) cmds.push(`git -C ${q} merge --ff-only ${upstreamName}`);
  cmds.push(...mainCmd);
  if (stale) {
    say('STALE: this checkout is missing newer evidence. Do not read its ledger as current.');
    say('To bring it current (NOT run by this script), run:');
    [...new Set(cmds)].forEach((c) => say(`  ${c}`));
  } else if (fetchFailed) {
    say('UNVERIFIED: fetch failed, so freshness could not be confirmed.');
  } else if (hasMain || upstreamName) {
    say('FRESH: no missing evidence-touching commits.');
  } else {
    say('UNCHECKED: no upstream and no origin/main to compare against.');
  }
  return { code: stale ? 1 : (fetchFailed ? 2 : 0), lines };
}

module.exports = { check };

if (require.main === module) {
  const { code, lines } = check(process.argv[2]);
  process.stdout.write(`${lines.join('\n')}\n`);
  process.exitCode = code;
}
