'use strict';
// BL-0022 criterion 3: the rollout sweep labels every worktree and is read-only.
// Real temp repos, real worktrees, no mocks.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// ROLLOUT_SCRIPT override lets the mutation self-check point at a mutated copy.
const ROLLOUT = process.env.ROLLOUT_SCRIPT || path.join(__dirname, '..', '..', 'tools', 'freshness', 'rollout.js');
const norm = (p) => p.split(path.sep).join('/');

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

function fixture(t) {
  const root = norm(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rollout-'))));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bare = `${root}/origin.git`;
  const main = `${root}/main`;
  git(root, 'init', '--bare', '-b', 'main', bare);
  git(root, 'clone', bare, main);
  git(main, 'config', 'user.email', 't@t'); git(main, 'config', 'user.name', 't');
  fs.writeFileSync(`${main}/EVIDENCE_LEDGER.md`, 'one\n');
  git(main, 'add', 'EVIDENCE_LEDGER.md'); git(main, 'commit', '-m', 'init');
  git(main, 'push', 'origin', 'HEAD:main');
  git(main, 'fetch', 'origin');
  const oldSha = git(main, 'rev-parse', 'HEAD').trim();
  const addWt = (name, ref) => {
    const p = `${root}/${name}`;
    git(main, 'worktree', 'add', '-b', name, p, ref);
    git(p, 'config', 'user.email', 't@t'); git(p, 'config', 'user.name', 't');
    return p;
  };
  // Push an evidence commit so origin/main moves ahead of oldSha.
  const advance = () => {
    fs.writeFileSync(`${main}/EVIDENCE_LEDGER.md`, 'one\ntwo\n');
    git(main, 'commit', '-am', 'evidence');
    git(main, 'push', 'origin', 'HEAD:main');
    git(main, 'fetch', 'origin');
  };
  const snap = () => {
    const paths = git(main, 'worktree', 'list', '--porcelain').split(/\r?\n/)
      .filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9));
    return git(main, 'worktree', 'list', '--porcelain') + '\n--\n' + git(main, 'branch', '-a') + '\n--\n' +
      paths.filter((p) => fs.existsSync(p)).sort().map((p) => `## ${p}\n${git(p, 'rev-parse', 'HEAD')}` +
        git(p, 'status', '--porcelain', '--untracked-files=all')).join('\n');
  };
  return { root, main, oldSha, addWt, advance, snap };
}

function rollout(main) {
  const r = spawnSync('node', [ROLLOUT, main], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout, err: r.stderr };
}
const lineFor = (out, p) => out.split('\n').find((l) => l.includes(` ${p} |`)) || '';

function runCase(t, build, expectCode, check) {
  const f = fixture(t);
  const ctx = build(f);
  const before = f.snap();
  const r = rollout(f.main);
  assert.equal(r.status, expectCode, `exit code; stderr=${r.err}; out=${r.out}`);
  check(r.out, ctx, f);
  assert.equal(f.snap(), before, 'worktree list / branch -a / per-tree HEAD + status must be byte-identical');
}

test('fresh + stale + missing: labels, summary, exit 1, read-only', (t) =>
  runCase(t, (f) => {
    const stale = f.addWt('stale', f.oldSha);
    f.advance();
    const fresh = f.addWt('fresh', 'origin/main');
    const gone = f.addWt('gone', 'origin/main');
    fs.rmSync(gone, { recursive: true, force: true }); // no `git worktree prune`
    return { stale, fresh, gone };
  }, 1, (out, { stale, fresh, gone }, f) => {
    assert.match(lineFor(out, fresh), /^\[FRESH\] .* \| branch=fresh \| evidence-behind=0$/);
    assert.match(lineFor(out, stale), /^\[STALE\] .* \| branch=stale \| evidence-behind=1$/);
    assert.match(lineFor(out, gone), /^\[MISSING\] .* \| branch=gone \| evidence-behind=\?/);
    // main clone sits on the pushed tip: fresh.
    assert.match(lineFor(out, f.main), /^\[FRESH\]/);
    assert.match(out, /^rollout: 4 worktrees, 2 fresh, 1 stale, 0 unverified, 1 missing$/m);
    assert.match(out, /^ {2}git -C .*merge --ff-only origin\/main/m, 'stale fix command printed, indented');
  }));

test('no stale, one missing: exit 2', (t) =>
  runCase(t, (f) => {
    f.advance();
    const fresh = f.addWt('fresh', 'origin/main');
    const gone = f.addWt('gone', 'origin/main');
    fs.rmSync(gone, { recursive: true, force: true });
    return { fresh, gone };
  }, 2, (out, { fresh, gone }) => {
    assert.match(lineFor(out, fresh), /^\[FRESH\]/);
    assert.match(lineFor(out, gone), /^\[MISSING\]/);
    assert.match(out, /^rollout: 3 worktrees, 2 fresh, 0 stale, 0 unverified, 1 missing$/m);
  }));

test('all fresh: exit 0', (t) =>
  runCase(t, (f) => {
    f.advance();
    return { fresh: f.addWt('fresh', 'origin/main') };
  }, 0, (out, { fresh }) => {
    assert.match(lineFor(out, fresh), /^\[FRESH\] .* evidence-behind=0$/);
    assert.match(out, /^rollout: 2 worktrees, 2 fresh, 0 stale, 0 unverified, 0 missing$/m);
  }));

test('detached HEAD worktree is labelled (detached) and does not crash', (t) =>
  runCase(t, (f) => {
    const stale = `${f.root}/det`;
    git(f.main, 'worktree', 'add', '--detach', stale, f.oldSha);
    f.advance();
    return { stale };
  }, 1, (out, { stale }) => {
    assert.match(lineFor(out, stale), /^\[STALE\] .* \| branch=\(detached\) \| evidence-behind=1$/);
  }));

test('git failure (not a repo): UNVERIFIED, exit 2, no crash', () => {
  const dir = norm(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'rollout-nogit-'))));
  try {
    const r = rollout(dir);
    assert.equal(r.status, 2, r.err);
    assert.match(r.out, /^\[UNVERIFIED\] /m);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
