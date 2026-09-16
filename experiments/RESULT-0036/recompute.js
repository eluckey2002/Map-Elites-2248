#!/usr/bin/env node

const fs = require('node:fs');

const { buildCorpus } = require('./run');

const corpus = buildCorpus();
const output = `${JSON.stringify(corpus.decision)}\n`;
const outIndex = process.argv.indexOf('--out');

if (outIndex === -1) {
  process.stdout.write(output);
} else {
  const outputPath = process.argv[outIndex + 1];
  if (!outputPath) throw new Error('--out requires a path');
  fs.writeFileSync(outputPath, output);
}
