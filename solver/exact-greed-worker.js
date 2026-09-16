#!/usr/bin/env node

const { chainMultiplier, chainValue } = require('./engine');
const {
  ExactChainEnumerationLimitError,
  enumerateLegalChainsWithStats,
} = require('./exact-score');

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { input += chunk; });
    process.stdin.on('end', () => resolve(input));
    process.stdin.on('error', reject);
  });
}

function exactGreedyPoints(state, { maxPathStates = Infinity } = {}) {
  let enumeration;
  try {
    enumeration = enumerateLegalChainsWithStats(state, { maxPathStates });
  } catch (error) {
    if (error instanceof ExactChainEnumerationLimitError) {
      return {
        complete: false,
        reason: 'work-limit',
        visitedPathStates: error.visitedPathStates,
      };
    }
    throw error;
  }
  const { actions, visitedPathStates } = enumeration;
  let points = 0;
  for (const chain of actions) {
    points = Math.max(points, Math.floor(chainValue(chain) * chainMultiplier(chain.length)));
  }
  return { complete: true, points, legalChains: actions.length, visitedPathStates };
}

async function main() {
  const input = JSON.parse(await readStdin());
  const state = input.state || input;
  process.stdout.write(`${JSON.stringify(exactGreedyPoints(state, {
    maxPathStates: input.maxPathStates,
  }))}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { exactGreedyPoints };
