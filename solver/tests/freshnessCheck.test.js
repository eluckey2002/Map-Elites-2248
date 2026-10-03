const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// FRESHNESS_SCRIPT lets a mutation self-check point these tests at a broken copy.
const SCRIPT = process.env.FRESHNESS_SCRIPT || path.join(__dirname, '..', '..', 'tools', 'freshness', 'check.js');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Real repos: a bare "origin", a "pusher" clone that advances origin/main, and a
// "subject" clone that is the checkout under inspection.
function makeWorld() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-'));
  const origin = path.join(root, 'origin.git');
  const pusher = path.join(root, 'pusher');
  const subject = path.join(root, 'subject');
  git(root, 'init', '--bare', '-b', 'main', origin);
  git(root, 'clone', origin, pusher);
  for (const d of [pusher]) {
    git(d, 'config', 'user.email', 't@example.com');
    git(d, 'config', 'user.name', 'T');
    git(d, 'checkout', '-B', 'main');
  }
  fs.writeFileSync(path.join(pusher, 'EVIDENCE_LEDGER.md'), 'v1\n');
  fs.writeFileSync(path.join(pusher, 'README.md'), 'v1\n');
  git(pusher, 'add', '.');
  git(pusher, 'commit', '-m', 'seed');
  git(pusher, 'push', 'origin', 'main');
  git(root, 'clone', origin, subject);
  git(subject, 'config', 'user.email', 't@example.com');
  git(subject, 'config', 'user.name', 'T');
  const advance = (file, text) => {
    fs.writeFileSync(path.join(pusher, file), text);
    git(pusher, 'add', file);
    git(pusher, 'commit', '-m', `touch ${file}`);
    git(pusher, 'push', 'origin', 'main');
  };
  return { root, origin, pusher, subject, advance, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function run(dir) {
  const r = spawnSync(process.execPath, [SCRIPT, dir], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

test('a checkout one evidence commit behind origin/main fails and prints the fix command', () => {
  const w = makeWorld();
  try {
    w.advance('EVIDENCE_LEDGER.md', 'v2\n');
    const r = run(w.subject);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /lacks from origin\/main: 1 commit\(s\), 1 touching/);
    assert.match(r.out, /merge --ff-only origin\/main/);
  } finally { w.cleanup(); }
});

test('an up-to-date checkout passes (baseline)', () => {
  const w = makeWorld();
  try {
    const r = run(w.subject);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /FRESH/);
  } finally { w.cleanup(); }
});

test('a checkout behind only on non-evidence files passes but reports the lag', () => {
  const w = makeWorld();
  try {
    w.advance('README.md', 'v2\n');
    const r = run(w.subject);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /lacks from origin\/main: 1 commit\(s\), 0 touching/);
  } finally { w.cleanup(); }
});

test('a merged branch that looks up to date with its upstream is still caught', () => {
  const w = makeWorld();
  try {
    git(w.subject, 'checkout', '-b', 'topic');
    git(w.subject, 'push', '-u', 'origin', 'topic');
    w.advance('CURRENT.md', 'next\n');
    const r = run(w.subject);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /lacks from upstream origin\/topic: 0 commit/);
    assert.match(r.out, /branch topic is already merged into origin\/main/);
  } finally { w.cleanup(); }
});

test('detached HEAD, no upstream and no origin remote are reported without crashing', () => {
  const w = makeWorld();
  try {
    git(w.subject, 'checkout', '--detach');
    let r = run(w.subject);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /detached HEAD/);

    git(w.subject, 'checkout', '-b', 'local-only');
    r = run(w.subject);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /no upstream configured/);

    git(w.subject, 'remote', 'remove', 'origin');
    r = run(w.subject);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /no origin\/main ref/);
    assert.match(r.out, /UNCHECKED/);
  } finally { w.cleanup(); }
});

test('a non-git directory exits 2 instead of crashing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freshness-nogit-'));
  try {
    const r = run(dir);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /not a git checkout/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the check leaves HEAD, branch, refs of the work tree and files unchanged', () => {
  const w = makeWorld();
  try {
    w.advance('EVIDENCE_LEDGER.md', 'v2\n');
    fs.writeFileSync(path.join(w.subject, 'scratch.txt'), 'dirty\n');
    const snap = () => ({
      head: git(w.subject, 'rev-parse', 'HEAD'),
      branch: git(w.subject, 'symbolic-ref', 'HEAD'),
      status: git(w.subject, 'status', '--porcelain'),
      ledger: fs.readFileSync(path.join(w.subject, 'EVIDENCE_LEDGER.md'), 'utf8'),
      localBranches: git(w.subject, 'for-each-ref', 'refs/heads'),
    });
    const before = snap();
    const r = run(w.subject);
    assert.equal(r.code, 1, r.out);
    assert.deepEqual(snap(), before);
    assert.equal(before.ledger, 'v1\n');
  } finally { w.cleanup(); }
});
