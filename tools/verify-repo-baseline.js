#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REQUIRED_ANCESTOR = '8508c3b4aa2bac9eceaac0bcaf91e3838e303a53';
const EXPECTED_SAFETY_REFS = Object.freeze({
  'refs/heads/safety/2026-08-28-level-curve-retune': '52f500c03a11699cb6bd7c3cab7f6a232470e0dd',
  'refs/heads/safety/2026-08-28-map-elites-learning': 'be843368be8e19ec59501aae38f19eebaf188b87',
  'refs/heads/safety/2026-08-28-map-elites-measurement-controls': '8508c3b4aa2bac9eceaac0bcaf91e3838e303a53',
});

function assessBaseline(snapshot, { candidate = false } = {}) {
  const problems = [];

  if (!candidate && snapshot.branch !== 'main') {
    problems.push(`canonical branch: expected main, got ${snapshot.branch || 'detached'}`);
  }
  if (!candidate && snapshot.mainRemote !== snapshot.head) {
    problems.push(`remote main: expected ${snapshot.head}, got ${snapshot.mainRemote || 'missing'}`);
  }
  if (snapshot.dirtyPaths.length) {
    problems.push(`dirty checkout: ${snapshot.dirtyPaths.join(', ')}`);
  }
  if (!snapshot.requiredAncestorPresent) {
    problems.push(`HEAD does not contain required ancestor ${REQUIRED_ANCESTOR}`);
  }

  for (const [ref, expected] of Object.entries(EXPECTED_SAFETY_REFS)) {
    const actual = snapshot.remoteRefs[ref];
    if (actual !== expected) {
      problems.push(`remote safety ref ${ref}: expected ${expected}, got ${actual || 'missing'}`);
    }
  }

  for (const worktree of snapshot.worktrees) {
    if (!worktree.registered) {
      problems.push(`unregistered worktree: ${worktree.path}`);
    } else if (worktree.dirtyPaths.length) {
      problems.push(`dirty worktree ${worktree.path}: ${worktree.dirtyPaths.join(', ')}`);
    }
  }

  return problems;
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trimEnd();
}

function parseStatusPaths(raw) {
  return raw.split('\n').filter(Boolean).map((line) => line.slice(3));
}

function parseWorktrees(raw) {
  return raw.split(/\n\n+/).filter(Boolean).map((block) => {
    const fields = Object.fromEntries(block.split('\n').map((line) => {
      const split = line.indexOf(' ');
      return split === -1 ? [line, true] : [line.slice(0, split), line.slice(split + 1)];
    }));
    return { path: fields.worktree, registered: true, dirtyPaths: [] };
  });
}

function discoverWorktreeLikeDirectories(root) {
  const found = [];
  const searchRoots = [path.join(root, '.claude', 'worktrees'), path.join(root, '.orch', 'runs')];

  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    const gitMarker = path.join(directory, '.git');
    if (directory !== root && fs.existsSync(gitMarker)) {
      found.push(directory);
      return;
    }
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(path.join(directory, entry.name));
    }
  }

  for (const searchRoot of searchRoots) walk(searchRoot);
  return found;
}

function parseRemoteRefs(raw) {
  const refs = {};
  for (const line of raw.split('\n').filter(Boolean)) {
    const [hash, ref] = line.split(/\s+/);
    refs[ref] = hash;
  }
  return refs;
}

function collectSnapshot() {
  const cwd = process.cwd();
  const root = git(['rev-parse', '--show-toplevel'], cwd);
  const head = git(['rev-parse', 'HEAD'], cwd);
  const branch = git(['branch', '--show-current'], cwd);
  const dirtyPaths = parseStatusPaths(git(['status', '--porcelain'], cwd));
  const registered = parseWorktrees(git(['worktree', 'list', '--porcelain'], root));
  const registeredPaths = new Set(registered.map((worktree) => path.resolve(worktree.path)));

  for (const worktree of registered) {
    worktree.dirtyPaths = parseStatusPaths(git(['status', '--porcelain'], worktree.path));
  }
  for (const discovered of discoverWorktreeLikeDirectories(root)) {
    if (!registeredPaths.has(path.resolve(discovered))) {
      registered.push({ path: discovered, registered: false, dirtyPaths: [] });
    }
  }

  let requiredAncestorPresent = true;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', REQUIRED_ANCESTOR, 'HEAD'], { cwd, stdio: 'ignore' });
  } catch {
    requiredAncestorPresent = false;
  }

  const requestedRefs = [...Object.keys(EXPECTED_SAFETY_REFS), 'refs/heads/main'];
  const remoteRefs = parseRemoteRefs(git(['ls-remote', '--heads', 'origin', ...requestedRefs], root));

  return {
    branch,
    head,
    mainRemote: remoteRefs['refs/heads/main'],
    dirtyPaths,
    requiredAncestor: REQUIRED_ANCESTOR,
    requiredAncestorPresent,
    remoteRefs,
    worktrees: registered,
  };
}

function main() {
  const candidate = process.argv.includes('--candidate');
  let snapshot;
  try {
    snapshot = collectSnapshot();
  } catch (error) {
    console.error(`BASELINE INVALID: could not collect repository state: ${error.message}`);
    process.exit(2);
  }

  const problems = assessBaseline(snapshot, { candidate });
  if (problems.length) {
    console.error('BASELINE INVALID');
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }

  console.log(`BASELINE PASS ${snapshot.head} (${candidate ? 'candidate' : 'canonical'})`);
}

if (require.main === module) main();

module.exports = {
  EXPECTED_SAFETY_REFS,
  REQUIRED_ANCESTOR,
  assessBaseline,
  collectSnapshot,
  discoverWorktreeLikeDirectories,
  parseRemoteRefs,
  parseStatusPaths,
  parseWorktrees,
};
