#!/usr/bin/env node

const path = require('node:path');
const { verifyUniverse } = require('./universe-map-core');

const ROOT = path.join(__dirname, '..');

function main() {
  const problems = verifyUniverse(ROOT);
  if (problems.length) {
    console.error('UNIVERSE MAP INVALID');
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }
  console.log('UNIVERSE MAP PASS: five cards, selected evidence, identities, and generated views agree');
}

if (require.main === module) main();
