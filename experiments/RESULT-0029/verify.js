#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { addedIn } = require('../../tools/verify-experiments');
const { analyzePuzzle, canonicalJson, identity, replayDescriptorWitnesses } = require('../../solver/puzzle-descriptors');
const {
  MAX_NODES,
  RESULT,
  ROOT,
  canonicalJson: subjectCanonicalJson,
  sourceHashes,
} = require('./subject');
const { buildCorpus, expectedRegion } = require('./run');

function verifyRegistration(artifact) {
  const registration = artifact.registration;
  if (!registration || registration.exploratory !== false || registration.protocol !== RESULT) {
    throw new Error('artifact is not registered reportable RESULT-0029 evidence');
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

function stablePuzzle(instance) {
  return {
    puzzleIdentity: instance.puzzleIdentity,
    level: instance.level,
    seed: instance.seed,
    initialBoard: instance.initialBoard,
    spawnStreamIdentity: instance.spawnStreamIdentity,
    descriptor: instance.descriptor,
    search: instance.search,
    replays: instance.replays,
  };
}

function verifyPuzzleInstance(instance) {
  const recomputed = analyzePuzzle({
    level: instance.level,
    seed: instance.seed,
    target: instance.descriptor.target,
    maxNodes: MAX_NODES,
  });
  if (canonicalJson(stablePuzzle(instance)) !== canonicalJson(stablePuzzle(recomputed))) {
    throw new Error(`descriptor recomputation mismatch for ${instance.puzzleIdentity}`);
  }
  replayDescriptorWitnesses(instance);
  if (expectedRegion(instance.descriptor) !== instance.region) {
    throw new Error(`instance ${instance.puzzleIdentity} is filed in the wrong region`);
  }
  return true;
}

function verifyArtifact(artifact) {
  verifyIdentity(artifact);
  verifyRegistration(artifact);
  if (subjectCanonicalJson(artifact.sources) !== subjectCanonicalJson(sourceHashes())) {
    throw new Error('source identity closure mismatch');
  }
  for (const region of artifact.regions) {
    for (const instance of region.instances) verifyPuzzleInstance(instance);
  }

  const expected = buildCorpus();
  const { registration, artifactIdentity, ...body } = artifact;
  if (canonicalJson(body) !== canonicalJson(expected)) throw new Error('full corpus recomputation mismatch');
  return {
    verdict: 'PASS',
    artifactIdentity,
    decision: artifact.decision,
    instances: artifact.regions.reduce((sum, region) => sum + region.instances.length, 0),
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <corpus.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8'));
  const receipt = verifyArtifact(artifact);
  process.stdout.write(`PASS ${JSON.stringify(receipt)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { verifyArtifact, verifyPuzzleInstance };
