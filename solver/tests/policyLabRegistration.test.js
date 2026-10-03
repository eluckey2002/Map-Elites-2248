'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { assertRegistration } = require('../policy-lab/registration');

test('registration check rejects a sibling retained in the object store and accepts reachable registration', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'policy-registration-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git(['init']); git(['config', 'user.name', 'Registration Test']); git(['config', 'user.email', 'registration@example.invalid']);
  fs.writeFileSync(path.join(root, 'README'), 'synthetic fixture\n'); git(['add', '.']); git(['commit', '-m', 'base']);
  const base = git(['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(root, 'PLAN.md'), 'frozen synthetic plan\n'); git(['add', '.']); git(['commit', '-m', 'registration']);
  const registration = git(['rev-parse', 'HEAD']);
  fs.writeFileSync(path.join(root, 'receipt.json'), '{}\n'); git(['add', '.']); git(['commit', '-m', 'receipt child']);
  assert.equal(assertRegistration(root, registration, 'PLAN.md'), 'frozen synthetic plan\n');
  git(['checkout', '-b', 'sibling', base]);
  fs.writeFileSync(path.join(root, 'PLAN.md'), 'frozen synthetic plan\n'); git(['add', '.']); git(['commit', '-m', 'flattened sibling']);
  assert.equal(git(['cat-file', '-t', registration]), 'commit');
  assert.throws(() => assertRegistration(root, registration, 'PLAN.md'), /not reachable/);
});
