#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const { verifyArtifact } = require('../../solver/verify-board-map-elites');
const { FINAL_SUBJECT_IDENTITY } = require('./subject');

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: verify.js <archive.json>');
  const artifact = JSON.parse(fs.readFileSync(path.resolve(argv[0]), 'utf8'));
  const result = verifyArtifact(artifact);
  if (artifact.finalSubjectIdentity !== FINAL_SUBJECT_IDENTITY) throw new Error('experiment subject identity mismatch');
  process.stdout.write(`PASS ${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; }
}

module.exports = { main };
