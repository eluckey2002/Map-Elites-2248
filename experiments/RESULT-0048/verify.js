#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const {
  BOARD_COUNT,
  RESULT,
  ROOT,
  canonicalJson,
  identity,
  sourceHashes,
} = require('./subject');

function verifyIdentity(artifact) {
  const { artifactIdentity, registration, ...body } = artifact;
  if (identity(body) !== artifactIdentity) throw new Error('artifact identity mismatch');
}

function verifyRows(artifact) {
  if (artifact.rows.length !== BOARD_COUNT) throw new Error(`expected ${BOARD_COUNT} board rows`);
  const openingIds = new Set();
  for (const row of artifact.rows) {
    if (openingIds.has(row.openingIdentity)) throw new Error('duplicate opening identity');
    openingIds.add(row.openingIdentity);
    if (row.arms.length !== 4) throw new Error('paired row does not contain all four spawn arms');
    if (new Set(row.arms.map(({ arm }) => arm)).size !== 4) throw new Error('paired row repeats a spawn arm');
    for (const arm of row.arms) {
      if (arm.trace.length > artifact.panel.moveLimit) throw new Error('trace exceeds move limit');
      for (let i = 0; i < arm.trace.length; i++) {
        if (arm.trace[i].move !== i + 1) throw new Error('trace move sequence is not contiguous');
        if (i && arm.trace[i].score <= arm.trace[i - 1].score) throw new Error('score did not increase after a legal move');
      }
    }
  }
}

function verifyArtifact(artifact) {
  verifyIdentity(artifact);
  if (!artifact.registration || artifact.registration.protocol !== RESULT || artifact.registration.exploratory !== false) {
    throw new Error('artifact is not registered RESULT-0048 evidence');
  }
  if (canonicalJson(artifact.sources) !== canonicalJson(sourceHashes())) throw new Error('source identity closure mismatch');
  verifyRows(artifact);
  return { verdict: 'PASS', artifactIdentity: artifact.artifactIdentity, boards: artifact.rows.length };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <corpus.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(ROOT, argv[0]), 'utf8'));
  process.stdout.write(`PASS ${JSON.stringify(verifyArtifact(artifact))}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { verifyArtifact, verifyIdentity, verifyRows };
