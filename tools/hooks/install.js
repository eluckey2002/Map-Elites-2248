#!/usr/bin/env node
// Installs a stub pre-push hook in this clone's shared hooks directory. The
// stub runs the repository's own tools/hooks/pre-push, so every worktree uses
// the checked-in version and later changes to it apply without reinstalling.
// Re-run once on clones installed before 2026-09-25, which hold a stale copy.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..', '..');
const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: ROOT, encoding: 'utf8' }).trim();
const hooksDir = path.resolve(ROOT, common, 'hooks');
fs.mkdirSync(hooksDir, { recursive: true });
const target = path.join(hooksDir, 'pre-push');
const stub = [
  '#!/bin/sh',
  '# Installed by tools/hooks/install.js: delegate to the checked-in hook.',
  'exec sh "$(git rev-parse --show-toplevel)/tools/hooks/pre-push" "$@"',
  '',
].join('\n');
fs.writeFileSync(target, stub);
fs.chmodSync(target, 0o755);
process.stdout.write(`installed ${target}\n`);
