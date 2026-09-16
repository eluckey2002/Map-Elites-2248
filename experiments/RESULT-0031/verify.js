#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { addedIn } = require('../../tools/verify-experiments');
const { replayWitnessAnalysis } = require('../../solver/puzzle-descriptor-witness');
const {
  RESULT,
  ROOT,
  canonicalJson,
  identity,
  sourceHashes,
} = require('./subject');
const { buildCorpus, capConformance } = require('./run');

function verifyRegistration(artifact) {
  const registration = artifact.registration;
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT) {
    throw new Error('artifact is not registered reportable RESULT-0031 evidence');
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

function verifyArtifact(artifact, { recompute = true } = {}) {
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
  verifyRegistration(artifact);
  if (canonicalJson(artifact.sources) !== canonicalJson(sourceHashes())) {
    throw new Error('source identity closure mismatch');
  }
  for (const row of artifact.rows) {
    if (row.shallow.puzzleIdentity !== row.puzzleIdentity || row.deep.puzzleIdentity !== row.puzzleIdentity) {
      throw new Error(`search arms do not share puzzle identity for level ${row.level} seed ${row.seed}`);
    }
    replayWitnessAnalysis(row.shallow);
    replayWitnessAnalysis(row.deep);
  }
  if (capConformance(artifact.rows).outcome !== 'PASS') throw new Error('combined candidate cap exceeded');
  if (recompute) {
    const expected = buildCorpus();
    if (canonicalJson(body) !== canonicalJson(expected)) throw new Error('full corpus recomputation mismatch');
  }
  return { verdict: 'PASS', artifactIdentity, rows: artifact.rows.length, decision: artifact.decision };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <corpus.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8'));
  process.stdout.write(`PASS ${JSON.stringify(verifyArtifact(artifact))}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyArtifact };
