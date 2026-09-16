#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { summarizeDeterministicGreed } = require('../RESULT-0037/result');
const { addedIn, parseFrontmatter, showAtCommit } = require('../../tools/verify-experiments');
const {
  EMERGENCY_TIMEOUT_MS,
  EXACT_MAX_PATH_STATES,
  EXPECTED_GAMES,
  PERCENTILES,
  PROFILE_LEVELS,
  RESULT,
  ROOT,
  SOURCE_PATHS,
  canonicalJson,
  identity,
  subjectIdentityFromSources,
} = require('./subject');

function verifyRegistration(artifact) {
  const registration = artifact.registration;
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT) {
    throw new Error('artifact is not registered reportable RESULT-0038 evidence');
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
  return registeredCommit;
}

function verifySourceClosure(artifact, registeredCommit) {
  const protocolPath = `experiments/${RESULT}/protocol.md`;
  const registeredProtocol = showAtCommit(registeredCommit, protocolPath, ROOT);
  const frozen = parseFrontmatter(registeredProtocol)?.version_freeze;
  if (!frozen) throw new Error('registered protocol has no version freeze');
  if (canonicalJson(Object.keys(artifact.sources).sort()) !== canonicalJson([...SOURCE_PATHS].sort())) {
    throw new Error('source identity closure mismatch');
  }
  for (const relative of SOURCE_PATHS) {
    if (typeof frozen[relative] !== 'string'
        || typeof artifact.sources[relative] !== 'string'
        || !artifact.sources[relative].startsWith(frozen[relative])) {
      throw new Error('source identity closure mismatch');
    }
  }
}

function verifyIdentity(artifact) {
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
}

function verifyRow(row) {
  if (row.denominator !== 'exact') throw new Error('row did not use exact denominator mode');
  if (row.denominatorObservations.length !== row.moves) throw new Error('denominator matrix is incomplete');
  for (const observation of row.denominatorObservations) {
    if (observation.maxPathStates !== EXACT_MAX_PATH_STATES) throw new Error('work cap mismatch');
    if (observation.timeoutMs !== EMERGENCY_TIMEOUT_MS) throw new Error('watchdog mismatch');
    if (observation.reason === 'timeout') throw new Error('emergency watchdog fired');
    if (observation.standing !== 'exact_result'
      && !(observation.standing === 'UNKNOWN' && observation.reason === 'work-limit')) {
      throw new Error('invalid denominator standing');
    }
  }
  const exactComplete = row.denominatorObservations.every(({ standing }) => standing === 'exact_result');
  if (row.exactComplete !== exactComplete) throw new Error('exact completeness mismatch');
  if (exactComplete !== Number.isFinite(row.descriptors.greedRatio)) {
    throw new Error('greed standing does not match exact completeness');
  }
  return true;
}

function verifyMatrix(rows, seeds) {
  const keys = rows.map(({ percentile, level, seed }) => `${percentile}/${level}/${seed}`);
  const expected = PERCENTILES.flatMap((percentile) => PROFILE_LEVELS.flatMap((level) => (
    seeds.map((seed) => `${percentile}/${level}/${seed}`)
  )));
  if (canonicalJson(keys) !== canonicalJson(expected)) throw new Error('confirmation matrix mismatch');
}

function verifyArtifact(artifact) {
  verifyIdentity(artifact);
  const registeredCommit = verifyRegistration(artifact);
  verifySourceClosure(artifact, registeredCommit);
  if (artifact.finalSubjectIdentity !== subjectIdentityFromSources(artifact.sources)) {
    throw new Error('final subject identity mismatch');
  }
  if (artifact.rows.length !== EXPECTED_GAMES) throw new Error('wrong game count');
  verifyMatrix(artifact.rows, artifact.panel.seeds);
  for (const row of artifact.rows) verifyRow(row);
  const decision = summarizeDeterministicGreed(artifact.rows, { expectedGames: EXPECTED_GAMES });
  if (canonicalJson(decision) !== canonicalJson(artifact.decision)) {
    throw new Error('decision recomputation mismatch');
  }
  return {
    verdict: 'PASS',
    artifactIdentity: artifact.artifactIdentity,
    rows: artifact.rows.length,
    decision: artifact.decision,
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <corpus.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8'));
  process.stdout.write(`PASS ${JSON.stringify(verifyArtifact(artifact))}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = {
  verifyArtifact,
  verifyIdentity,
  verifyMatrix,
  verifyRegistration,
  verifyRow,
  verifySourceClosure,
};
