#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { search } = require('../../solver/oracle/search');
const { verifyWitness } = require('../../solver/oracle/verify');
const {
  POLICIES, RESULT, SUBJECT_IDENTITY, loadPanel, seal, sourceHashes, subject,
} = require('./subject');

const ROOT = path.resolve(__dirname, '../..');

function currentProtocolCommit() {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const tracked = execFileSync('git', ['ls-tree', '-r', '--name-only', sha, `experiments/${RESULT}/protocol.md`], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (!tracked) throw new Error(`HEAD (${sha}) does not contain experiments/${RESULT}/protocol.md -- register the protocol and commit it first`);
  return sha;
}

function run() {
  const { corpus } = loadPanel();
  const rows = [];
  for (const puzzle of corpus.puzzles) {
    for (const policy of POLICIES) {
      const result = search({
        level: puzzle.input.level,
        seed: puzzle.input.seed,
        budgetMs: subject.budgetMs,
        maxExpandedStates: subject.maxExpandedStates,
        includeBaseline: subject.includeBaseline,
        rankStateFn: policy.rankState,
      });
      if (result.best) verifyWitness(puzzle.input, result.best);
      rows.push({
        puzzleIdentity: puzzle.puzzleIdentity,
        policy: policy.id,
        outcome: result.best ? 'win' : 'no-win',
        moves: result.best?.movesUsed ?? null,
        score: result.best?.score ?? null,
        expandedStates: result.stats.expandedStates,
        terminationReason: result.terminationReason,
        witness: result.best,
      });
    }
  }
  const sealed = seal({
    schemaVersion: 1,
    result: RESULT,
    subjectIdentity: SUBJECT_IDENTITY,
    corpusIdentity: corpus.manifestIdentity,
    sources: sourceHashes(),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    rows,
  });
  // registration is provenance metadata about the artifact, not measured
  // content, so it is added after sealing and excluded from artifactIdentity
  // (the gate's own recomputation strips it before hashing, to match).
  return { ...sealed, registration: { protocol: RESULT, protocolCommit: currentProtocolCommit(), exploratory: false } };
}

function main(argv = process.argv.slice(2)) {
  const index = argv.indexOf('--out');
  const out = index >= 0 ? argv[index + 1] : null;
  if (!out || out.startsWith('--')) throw new Error('usage: node experiments/RESULT-0047/run.js --out <new-file.json>');
  const resolved = path.resolve(out);
  if (fs.existsSync(resolved)) throw new Error('refusing to overwrite an existing run');
  const artifact = run();
  fs.writeFileSync(resolved, `${JSON.stringify(artifact, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ artifactIdentity: artifact.artifactIdentity, rows: artifact.rows.length })}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 1; }
}

module.exports = { main, run };
