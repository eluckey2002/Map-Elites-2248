#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { summarize, validateCorpus } = require('./subject');

function recompute(file) {
  const corpus = JSON.parse(fs.readFileSync(file, 'utf8'));
  const validation = validateCorpus(corpus);
  return {
    schemaVersion: 1,
    result: corpus.result,
    artifactIdentity: corpus.artifactIdentity,
    finalSubjectIdentity: validation.finalSubjectIdentity,
    ...summarize(corpus),
  };
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: node recompute.js <corpus.json>');
  process.stdout.write(`${JSON.stringify(recompute(path.resolve(argv[0])))}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}

module.exports = { recompute };
