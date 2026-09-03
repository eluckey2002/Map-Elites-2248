#!/usr/bin/env node
// Copies tools/hooks/pre-push into this clone's shared hooks directory so
// every worktree of this repository refuses to push a red experiment gate.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8' }).trim();
const hooksDir = path.resolve(ROOT, common, 'hooks');
fs.mkdirSync(hooksDir, { recursive: true });
const target = path.join(hooksDir, 'pre-push');
fs.copyFileSync(path.join(__dirname, 'pre-push'), target);
fs.chmodSync(target, 0o755);
process.stdout.write(`installed ${target}\n`);
