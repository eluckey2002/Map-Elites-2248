#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    ...options,
  }).trim();
}

function verifyFrozenExperiment(result) {
  if (!/^RESULT-\d{4}$/.test(result)) throw new Error('usage: verify-frozen-experiment.js RESULT-NNNN');
  const relativeCorpus = `experiments/${result}/corpus.json`;
  const relativeVerifier = `experiments/${result}/verify.js`;
  if (!fs.existsSync(path.join(ROOT, relativeCorpus))) throw new Error(`missing ${relativeCorpus}`);
  if (!fs.existsSync(path.join(ROOT, relativeVerifier))) throw new Error(`missing ${relativeVerifier}`);

  const evidenceCommit = git(['log', '--diff-filter=A', '--format=%H', '--reverse', '--', relativeCorpus])
    .split('\n')[0];
  if (!evidenceCommit) throw new Error(`no committed evidence found for ${result}`);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), `${result.toLowerCase()}-verify-`));
  let attached = false;
  try {
    git(['worktree', 'add', '--detach', temporary, evidenceCommit], { stdio: ['ignore', 'pipe', 'pipe'] });
    attached = true;
    const output = execFileSync('node', [relativeVerifier, relativeCorpus], {
      cwd: temporary,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    process.stdout.write(`${output}\n`);
    process.stdout.write(`FROZEN TREE ${evidenceCommit}\n`);
    return { result, evidenceCommit, output };
  } finally {
    if (attached) git(['worktree', 'remove', '--force', temporary], { stdio: ['ignore', 'pipe', 'pipe'] });
    else fs.rmSync(temporary, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (process.argv.length !== 3) throw new Error('usage: verify-frozen-experiment.js RESULT-NNNN');
    verifyFrozenExperiment(process.argv[2]);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyFrozenExperiment };
