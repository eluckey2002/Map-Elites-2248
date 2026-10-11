'use strict';
// The policy-terms-loop closeout (RESULT-0081 and RESULT-0082) finished at
// CLOSEOUT_COMMIT. Its audits also pin the bytes of shared files that later
// work keeps editing (CURRENT.md, the ledger, tools/verify-experiments.js,
// src/game.js), so run on the live tree they fail for reasons that say nothing
// about the evidence. The tests run those audits at CLOSEOUT_COMMIT instead,
// and separately require that the closeout's own files are unchanged since.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../../..');
const CLOSEOUT_COMMIT = '1b1950ec5047e7f8169f1298531c837286514a31';
const CLOSEOUT_PATHS = [
  'docs/goals/policy-terms-loop',
  'solver/policy-lab',
  'experiments/RESULT-0081',
  'experiments/RESULT-0082',
  'solver/tests/fixtures/poststop-inventory-preload.js',
];

let snapshot = null;

// A detached worktree at CLOSEOUT_COMMIT, made once per test process and
// removed when it exits.
function closeoutRoot() {
  if (snapshot) return snapshot;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-closeout-'));
  execFileSync('git', ['worktree', 'add', '--detach', '--quiet', dir, CLOSEOUT_COMMIT], { cwd: ROOT, stdio: 'pipe' });
  process.on('exit', () => {
    try { execFileSync('git', ['worktree', 'remove', '--force', dir], { cwd: ROOT, stdio: 'pipe' }); } catch {}
    fs.rmSync(dir, { recursive: true, force: true });
  });
  snapshot = dir;
  return dir;
}

// Files under CLOSEOUT_PATHS that existed at `commit` and were modified,
// deleted or retyped since, in `root`'s working tree. New files are allowed.
function changedCloseoutFiles(root = ROOT, commit = CLOSEOUT_COMMIT, paths = CLOSEOUT_PATHS) {
  return execFileSync('git', ['diff', '--name-only', '--diff-filter=MDT', commit, '--', ...paths],
    { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);
}

module.exports = { CLOSEOUT_COMMIT, CLOSEOUT_PATHS, closeoutRoot, changedCloseoutFiles };
