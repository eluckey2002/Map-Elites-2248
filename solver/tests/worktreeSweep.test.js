'use strict';
// BL-0022 criteria 4/6/7: the sweep is report-only. Real temp repos, real worktrees.
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// SWEEP_SCRIPT override lets the mutation self-check point at a mutated copy.
const SWEEP = process.env.SWEEP_SCRIPT || path.join(__dirname, '..', '..', 'tools', 'freshness', 'sweep.js');
const norm = (p) => p.split(path.sep).join('/');

function git(cwd, ...args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

function fixture(t) {
  const root = norm(fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sweep-'))));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bare = `${root}/origin.git`;
  const main = `${root}/main`;
  git(root, 'init', '--bare', '-b', 'main', bare);
  git(root, 'clone', bare, main);
  git(main, 'config', 'user.email', 't@t'); git(main, 'config', 'user.name', 't');
  fs.writeFileSync(`${main}/a.txt`, '1');
  git(main, 'add', 'a.txt'); git(main, 'commit', '-m', 'init');
  git(main, 'push', 'origin', 'HEAD:main');
  git(main, 'fetch', 'origin');
  const addWt = (name) => {
    const p = `${root}/${name}`;
    git(main, 'worktree', 'add', '-b', name, p, 'origin/main');
    git(p, 'config', 'user.email', 't@t'); git(p, 'config', 'user.name', 't');
    return p;
  };
  const leasePath = (wt) => `${norm(git(wt, 'rev-parse', '--absolute-git-dir').trim())}/agent-lease`;
  const snap = () => git(main, 'worktree', 'list', '--porcelain') + '\n--\n' + git(main, 'branch', '-a');
  return { root, main, addWt, leasePath, snap };
}

function sweep(main) {
  const r = spawnSync('node', [SWEEP, main], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
const lineFor = (out, p) => out.split('\n').find((l) => l.includes(p + ' |')) || '';

function deadPid() {
  const c = spawnSync('node', ['-e', '']);
  return c.pid; // child has exited and been reaped
}
const lease = (o) => JSON.stringify({ pid: process.pid, host: os.hostname(), heartbeat: Date.now(), ...o });
const OLD = () => Date.now() - 24 * 3600 * 1000;

function run(t, setup, check) {
  const f = fixture(t);
  const wt = f.addWt('feat');
  setup(f, wt);
  const before = f.snap();
  const out = sweep(f.main);
  check(lineFor(out, wt), out, wt);
  assert.equal(f.snap(), before, 'worktree list / branch -a must be byte-identical');
  assert.ok(fs.existsSync(wt), 'worktree dir still exists');
}

test('live lease (fresh heartbeat): reported live, not a candidate', (t) =>
  run(t, (f, wt) => fs.writeFileSync(f.leasePath(wt), lease({})), (l, out) => {
    assert.match(l, /lease=live/); assert.match(l, /^\[REPORT\]/);
    assert.match(out, /removal candidates .*: 0/);
  }));

test('live lease via alive pid despite old heartbeat', (t) =>
  run(t, (f, wt) => fs.writeFileSync(f.leasePath(wt), lease({ heartbeat: OLD() })), (l) => {
    assert.match(l, /lease=live/); assert.match(l, /^\[REPORT\]/);
  }));

test('stale lease + dead pid + merged + clean: candidate (reported only)', (t) =>
  run(t, (f, wt) => fs.writeFileSync(f.leasePath(wt), lease({ pid: deadPid(), heartbeat: OLD() })), (l, out, wt) => {
    assert.match(l, /lease=stale-local-dead-pid/); assert.match(l, /^\[CANDIDATE\]/);
    assert.match(l, /merged-into-origin\/main=yes/); assert.match(l, /tree=clean/);
    assert.match(out, /removal candidates .*: 1/);
  }));

test('absent lease: report-only, never a candidate', (t) =>
  run(t, () => {}, (l, out) => {
    assert.match(l, /lease=absent/); assert.match(l, /^\[REPORT\]/);
    assert.match(out, /removal candidates .*: 0/);
  }));

test('foreign-host lease: report-only', (t) =>
  run(t, (f, wt) => fs.writeFileSync(f.leasePath(wt), lease({ host: 'some-other-host-xyz', pid: deadPid(), heartbeat: OLD() })), (l) => {
    assert.match(l, /lease=foreign-host/); assert.match(l, /^\[REPORT\]/);
  }));

test('dirty tree with stale dead-pid lease: not a candidate', (t) =>
  run(t, (f, wt) => {
    fs.writeFileSync(f.leasePath(wt), lease({ pid: deadPid(), heartbeat: OLD() }));
    fs.writeFileSync(`${wt}/dirty.txt`, 'x');
  }, (l) => {
    assert.match(l, /not-clean\(uncommitted/); assert.match(l, /^\[REPORT\]/);
  }));

test('unpushed commits with stale dead-pid lease: not a candidate', (t) =>
  run(t, (f, wt) => {
    fs.writeFileSync(f.leasePath(wt), lease({ pid: deadPid(), heartbeat: OLD() }));
    fs.writeFileSync(`${wt}/b.txt`, 'b'); git(wt, 'add', 'b.txt'); git(wt, 'commit', '-m', 'local');
  }, (l) => {
    assert.match(l, /1 unpushed/); assert.match(l, /merged-into-origin\/main=no/); assert.match(l, /^\[REPORT\]/);
  }));

test('merged-and-clean but live lease: reported, not candidate', (t) =>
  run(t, (f, wt) => fs.writeFileSync(f.leasePath(wt), lease({})), (l) => {
    assert.match(l, /merged-into-origin\/main=yes/); assert.match(l, /tree=clean/); assert.match(l, /^\[REPORT\]/);
  }));

test('real clone (.git is a directory) is skipped', (t) => {
  const f = fixture(t);
  const clone = `${f.root}/realclone`;
  git(f.root, 'clone', `${f.root}/origin.git`, clone);
  // register the clone's path as if listed: sweep it as the main dir; it is its own main worktree
  const before = git(clone, 'worktree', 'list', '--porcelain') + git(clone, 'branch', '-a');
  const out = sweep(clone);
  assert.match(out, /\[SKIP\] .*realclone \| \.git is a directory/);
  assert.match(out, /removal candidates .*: 0/);
  assert.equal(git(clone, 'worktree', 'list', '--porcelain') + git(clone, 'branch', '-a'), before);
  assert.ok(fs.existsSync(`${clone}/.git`));
});
