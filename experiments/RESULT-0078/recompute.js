#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { summarize, validateCorpus } = require('./subject');
function recompute(file) { const corpus = JSON.parse(fs.readFileSync(file, 'utf8')); const checked = validateCorpus(corpus); return { schemaVersion: 1, result: corpus.result, qualification: corpus.qualification, artifactIdentity: corpus.artifactIdentity, finalSubjectIdentity: checked.finalSubjectIdentity, ...summarize(corpus) }; }
if (require.main === module) { try { if (process.argv.length !== 3) throw new Error('usage: node recompute.js corpus.json'); process.stdout.write(`${JSON.stringify(recompute(path.resolve(process.argv[2])))}\n`); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; } }
module.exports = { recompute };
