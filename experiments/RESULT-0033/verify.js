#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { replayMergeSpread } = require('../../solver/merge-spread-descriptors');
const { addedIn } = require('../../tools/verify-experiments');
const { RESULT, ROOT, canonicalJson, identity, profiles, sourceHashes } = require('./subject');
const { buildCorpus } = require('./run');

function verifyRegistration(artifact) {
  const registration = artifact.registration;
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT) {
    throw new Error('artifact is not registered reportable RESULT-0033 evidence');
  }
  const protocolPath = `experiments/${RESULT}/protocol.md`;
  const registeredCommit = addedIn(protocolPath, ROOT);
  if (!registeredCommit || registration.protocolCommit !== registeredCommit) {
    throw new Error('artifact protocol commit does not match the registered protocol');
  }
  try {
    execFileSync('git', ['cat-file', '-e', `${registeredCommit}:${protocolPath}`], { cwd: ROOT, stdio: 'ignore' });
    execFileSync('git', ['merge-base', '--is-ancestor', registeredCommit, 'HEAD'], { cwd: ROOT, stdio: 'ignore' });
  } catch {
    throw new Error('registered protocol is not reachable from HEAD');
  }
}

function verifyIdentity(artifact) {
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
}

function verifyRow(row, level) {
  if (row.shallow.puzzleIdentity !== row.deep.puzzleIdentity) {
    throw new Error('search widths do not share puzzle identity');
  }
  replayMergeSpread(level, row.shallow);
  replayMergeSpread(level, row.deep);
  return true;
}

function verifyArtifact(artifact, { recompute = true } = {}) {
  verifyIdentity(artifact);
  verifyRegistration(artifact);
  if (canonicalJson(artifact.sources) !== canonicalJson(sourceHashes())) {
    throw new Error('source identity closure mismatch');
  }
  const byLevel = new Map(profiles().map((level) => [level.level, level]));
  for (const row of artifact.rows) verifyRow(row, byLevel.get(row.level));
  if (recompute) {
    const expected = buildCorpus();
    const { registration, artifactIdentity, ...body } = artifact;
    if (canonicalJson(body) !== canonicalJson(expected)) throw new Error('full corpus recomputation mismatch');
  }
  return { verdict: 'PASS', artifactIdentity: artifact.artifactIdentity, rows: artifact.rows.length, decision: artifact.decision };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <corpus.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8'));
  process.stdout.write(`PASS ${JSON.stringify(verifyArtifact(artifact))}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { verifyArtifact, verifyIdentity, verifyRow };
