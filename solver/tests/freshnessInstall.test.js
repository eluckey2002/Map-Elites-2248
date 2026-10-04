'use strict';
// BL-0022 criterion 1: installer + SessionStart launcher. Real temp dirs only;
// the real home directory is never read or written by these tests.
const test = require('node:test');
const { after } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// TOOLS_DIR may be overridden so the mutation self-check can test mutated copies.
const TOOLS = process.env.FRESHNESS_TOOLS_DIR || path.join(__dirname, '..', '..', 'tools', 'freshness');
const INSTALL = path.join(TOOLS, 'install.js');
const LAUNCHER = path.join(TOOLS, 'session-freshness.js');
const WARNING = 'FRESHNESS WARNING: this checkout is missing newer evidence commits; run the printed git command before trusting EVIDENCE_LEDGER.md';

const TMP_PREFIX = 'fresh-';
const made = [];
const tmp = (label) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), `${TMP_PREFIX}${label}-`)); made.push(d); return d; };
after(() => {
  for (const d of made) fs.rmSync(d, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});
const GIT_ENV = { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (cwd, ...args) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: GIT_ENV });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
  return r.stdout;
};

const SETTINGS = {
  env: { A: '1' },
  permissions: { allow: ['Bash(ls:*)'] },
  hooks: {
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo pre' }] }],
    SessionStart: [
      { matcher: 'startup|resume', hooks: [{ type: 'command', command: 'python briefing.py' }] },
      { hooks: [{ type: 'command', command: 'orca || echo {}', timeout: 10 }] },
    ],
  },
  voiceEnabled: true,
};

function fixture() {
  const dir = tmp('inst');
  const settings = path.join(dir, 'settings.json');
  const text = JSON.stringify(SETTINGS, null, 2) + '\n';
  fs.writeFileSync(settings, text);
  return { dir, settings, text, target: path.join(dir, 'hooks') };
}
const run = (f, ...extra) => spawnSync(process.execPath, [INSTALL, '--target-dir', f.target, '--settings', f.settings, ...extra], { encoding: 'utf8' });
const backups = (f) => fs.readdirSync(f.dir).filter((n) => n.startsWith('settings.json.bak-freshness-'));
const read = (f) => JSON.parse(fs.readFileSync(f.settings, 'utf8'));
const ours = (j) => j.hooks.SessionStart.filter((e) => e.hooks.some((h) => h.command.includes('session-freshness.js')));

test('dry-run writes nothing and prints a diff', () => {
  const f = fixture();
  const r = run(f, '--dry-run');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(f.settings, 'utf8'), f.text);
  assert.equal(fs.existsSync(f.target), false);
  assert.deepEqual(backups(f), []);
  assert.match(r.stdout, /^\+.*session-freshness\.js/m);
});

test('real run copies both scripts, adds one entry, backs up, preserves everything else', () => {
  const f = fixture();
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  for (const n of ['check.js', 'session-freshness.js']) {
    assert.equal(fs.readFileSync(path.join(f.target, n), 'utf8'), fs.readFileSync(path.join(TOOLS, n), 'utf8'));
  }
  const j = read(f);
  assert.equal(ours(j).length, 1);
  assert.equal(j.hooks.SessionStart.length, 3);
  const e = ours(j)[0];
  assert.equal(e.matcher, 'startup|resume');
  assert.equal(e.hooks[0].timeout, 10);
  assert.match(e.hooks[0].command, /^node ".*\/session-freshness\.js"$/);
  const b = backups(f);
  assert.equal(b.length, 1);
  assert.equal(fs.readFileSync(path.join(f.dir, b[0]), 'utf8'), f.text);
  // every original key and hook survives unchanged
  const expected = JSON.parse(f.text);
  expected.hooks.SessionStart.push(e);
  assert.deepEqual(j, expected);
  assert.equal(fs.readFileSync(f.settings, 'utf8'), JSON.stringify(j, null, 2) + '\n');
});

test('second run is a no-op: no new entry, no new backup, file bytes unchanged', () => {
  const f = fixture();
  run(f);
  const after1 = fs.readFileSync(f.settings, 'utf8');
  const r = run(f);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(fs.readFileSync(f.settings, 'utf8'), after1);
  assert.equal(ours(read(f)).length, 1);
  assert.equal(backups(f).length, 1);
});

test('invalid JSON or missing settings refuses and writes nothing', () => {
  const f = fixture();
  fs.writeFileSync(f.settings, '{ "hooks": ');
  const r = run(f);
  assert.notEqual(r.status, 0);
  assert.equal(fs.readFileSync(f.settings, 'utf8'), '{ "hooks": ');
  assert.equal(fs.existsSync(f.target), false);
  assert.deepEqual(backups(f), []);
  fs.rmSync(f.settings);
  const r2 = run(f);
  assert.notEqual(r2.status, 0);
  assert.equal(fs.existsSync(f.settings), false);
  assert.equal(fs.existsSync(f.target), false);
});

function launcher(cwd, scriptDir, extraEnv) {
  return spawnSync(process.execPath, [path.join(scriptDir, 'session-freshness.js')], {
    cwd, encoding: 'utf8', env: { ...GIT_ENV, ...extraEnv }, timeout: 30000,
  });
}

function staleCheckout() {
  const root = tmp('stale');
  const origin = path.join(root, 'origin.git');
  fs.mkdirSync(origin);
  git(origin, 'init', '--bare', '-b', 'main');
  const a = path.join(root, 'a');
  const b = path.join(root, 'b');
  git(root, 'clone', origin, a);
  git(a, 'checkout', '-B', 'main');
  fs.writeFileSync(path.join(a, 'EVIDENCE_LEDGER.md'), 'v1\n');
  git(a, 'add', '.'); git(a, 'commit', '-m', 'one'); git(a, 'push', '-u', 'origin', 'main');
  git(root, 'clone', origin, b);
  fs.writeFileSync(path.join(a, 'EVIDENCE_LEDGER.md'), 'v2\n');
  git(a, 'commit', '-am', 'two'); git(a, 'push');
  return b; // one evidence commit behind
}

test('launcher: stale checkout -> exit 0 and the WARNING line', () => {
  const r = launcher(staleCheckout(), TOOLS, {});
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.split('\n')[0], WARNING);
  assert.match(r.stdout, /STALE/);
  assert.match(r.stdout, /merge --ff-only/);
});

test('launcher: non-git directory -> exit 0 and nothing printed', () => {
  const r = launcher(tmp('nogit'), TOOLS, { GIT_CEILING_DIRECTORIES: os.tmpdir() });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '');
});

test('launcher: a failed git probe in a real checkout -> exit 0 and one UNVERIFIED probe line', () => {
  const r = launcher(staleCheckout(), TOOLS, { FRESHNESS_PROBE_TIMEOUT_MS: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^UNVERIFIED: .*probe/);
  assert.equal(r.stdout.trim().split('\n').length, 1);
});

test('launcher: a hanging check.js is killed within the timeout, exit 0, one UNVERIFIED line', () => {
  const dir = tmp('hang');
  fs.copyFileSync(LAUNCHER, path.join(dir, 'session-freshness.js'));
  fs.writeFileSync(path.join(dir, 'check.js'), 'setInterval(() => {}, 1000);\n');
  const t0 = Date.now();
  const r = launcher(staleCheckout(), dir, { FRESHNESS_TIMEOUT_MS: '800' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(Date.now() - t0 < 15000, `took ${Date.now() - t0} ms`);
  assert.match(r.stdout, /^UNVERIFIED: .*timed out/);
  assert.equal(r.stdout.trim().split('\n').length, 1);
});

test('launcher: a crashing check.js still exits 0 with one UNVERIFIED line', () => {
  const dir = tmp('crash');
  fs.copyFileSync(LAUNCHER, path.join(dir, 'session-freshness.js'));
  fs.writeFileSync(path.join(dir, 'check.js'), 'process.exit(7);\n');
  const r = launcher(staleCheckout(), dir, {});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^UNVERIFIED: .*crashed/);
});

test('launcher: on timeout the hung git-fetch grandchild is killed too (no survivor)', async () => {
  const b = staleCheckout(); // clone b is behind origin by one commit, so fetch has work
  const dir = tmp('sleeper');
  const pidFile = path.join(dir, 'pid.txt');
  const sleeper = path.join(dir, 'sleeper.js');
  fs.writeFileSync(sleeper, `require('fs').writeFileSync(${JSON.stringify(pidFile)}, String(process.pid)); setTimeout(() => {}, 600000);\n`);
  git(b, 'config', 'remote.origin.uploadpack', `node ${sleeper.split(path.sep).join('/')}`);
  let pid = null;
  const alive = (p) => {
    try { process.kill(p, 0); } catch (e) { return e.code !== 'ESRCH'; }
    if (process.platform === 'linux') { // a zombie answers kill(0) but is dead
      try { return fs.readFileSync(`/proc/${p}/stat`, 'utf8').replace(/^.*\) /, '')[0] !== 'Z'; } catch (_) { return false; }
    }
    return true;
  };
  try {
    const r = launcher(b, TOOLS, { FRESHNESS_TIMEOUT_MS: '2000' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /^UNVERIFIED: .*timed out/);
    assert.ok(fs.existsSync(pidFile), 'sleeper never started, so the test did not exercise a hung fetch');
    pid = Number(fs.readFileSync(pidFile, 'utf8'));
    for (let i = 0; i < 30 && alive(pid); i++) await new Promise((res) => setTimeout(res, 100));
    assert.equal(alive(pid), false, `sleeper pid ${pid} survived the launcher timeout`);
  } finally {
    if (pid && alive(pid)) { try { process.kill(pid, 'SIGKILL'); } catch (_) { /* ignore */ } }
  }
});
