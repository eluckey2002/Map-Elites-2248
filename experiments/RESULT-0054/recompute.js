#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const { decide } = require('./result');
const { FINAL_SUBJECT_IDENTITY } = require('./subject');

function recompute(file = path.join(__dirname, 'output', 'archive.json')) {
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (artifact.finalSubjectIdentity !== FINAL_SUBJECT_IDENTITY) throw new Error('recomputation subject identity mismatch');
  return decide(artifact);
}

if (require.main === module) {
  try { process.stdout.write(`${JSON.stringify(recompute())}\n`); }
  catch (error) { process.stderr.write(`FAIL: ${error.message}\n`); process.exitCode = 1; }
}

module.exports = { recompute };
