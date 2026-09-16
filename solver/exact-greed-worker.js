#!/usr/bin/env node

const { chainMultiplier, chainValue } = require('./engine');
const { enumerateLegalChains } = require('./exact-score');

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    process.stdin.on('error', reject);
  });
}

function exactGreedyPoints(state) {
  const actions = enumerateLegalChains(state);
  let points = 0;
  for (const chain of actions) {
    points = Math.max(points, Math.floor(chainValue(chain) * chainMultiplier(chain.length)));
  }
  return { points, legalChains: actions.length };
}

async function main() {
  const state = JSON.parse(await readStdin());
  process.stdout.write(`${JSON.stringify(exactGreedyPoints(state))}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { exactGreedyPoints };
