#!/usr/bin/env node

const path = require('node:path');
const { verifyUniverse, writeUniverse } = require('./universe-map-core');

const ROOT = path.join(__dirname, '..');

function main() {
  if (process.argv.includes('--check')) {
    const problems = verifyUniverse(ROOT);
    if (problems.length) {
      console.error('UNIVERSE MAP BUILD CHECK FAILED');
      for (const problem of problems) console.error(`- ${problem}`);
      process.exitCode = 1;
      return;
    }
    console.log('UNIVERSE MAP BUILD CHECK PASS');
    return;
  }

  const outputs = writeUniverse(ROOT);
  console.log(`WROTE ${Object.keys(outputs).join(', ')}`);
}

if (require.main === module) main();
