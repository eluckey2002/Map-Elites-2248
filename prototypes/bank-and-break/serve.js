#!/usr/bin/env node
// PROTOTYPE — starts one isolated candidate server for paired human play.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { SHARED, buildVariants } = require('./variants');

const SEED = 316;
const BASE_PORT = Number(process.env.BANK_BREAK_PORT || 8250);
const REFERENCE = Object.freeze({
  'bank-break-fixed-bottom-gate': { targetMove: 10, fullBudgetScore: 51968 },
});

const servers = buildVariants().map((candidate, index) => {
  const port = BASE_PORT + index;
  const recordingsDir = path.join(__dirname, 'sessions', candidate.name);
  const candidateIdentity = identity(candidate);
  const server = createAuthoringServer({
    store: { schemaVersion: 1, candidates: [candidate] },
    receipt: { candidateIdentity },
    fixedSeed: SEED,
    recordingsDir,
  });
  server.listen(port, '127.0.0.1');
  return {
    server,
    candidate,
    candidateIdentity,
    port,
    url: 'http://127.0.0.1:' + port + '/index.html?candidate=' + candidate.level + '&seed=' + SEED,
  };
});

console.clear();
console.log('BANK AND BREAK — THROWAWAY PLAY PROTOTYPE');
console.log('');
console.log('Question');
console.log('  Does the fixed gate make build separately → thaw → harvest feel real?');
console.log('');
console.log('Shared state');
console.log('  seed: ' + SEED);
console.log('  grid: ' + SHARED.gridW + 'x' + SHARED.gridH);
console.log('  target: ' + SHARED.target.toLocaleString());
console.log('  moves: ' + SHARED.moves);
console.log('  minimum chain: ' + SHARED.minChain);
console.log('');
console.log('Board');
for (const entry of servers) {
  const reference = REFERENCE[entry.candidate.name];
  console.log('  ' + entry.candidate.level + '  ' + entry.candidate.name);
  console.log('        fixed-seed bot: target in ' + reference.targetMove + ', full-budget ' + reference.fullBudgetScore.toLocaleString());
  console.log('        ' + entry.url);
}
console.log('');
console.log('Sessions');
console.log('  ' + path.join(__dirname, 'sessions'));
console.log('');
console.log('Press Ctrl-C to stop the server.');

function stop() {
  let pending = servers.length;
  for (const { server } of servers) {
    server.close(() => {
      pending -= 1;
      if (pending === 0) process.exit(0);
    });
  }
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);
