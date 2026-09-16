#!/usr/bin/env node

const { buildCorpus } = require('./run');

const corpus = buildCorpus();
process.stdout.write(`${JSON.stringify(corpus.decision)}\n`);
