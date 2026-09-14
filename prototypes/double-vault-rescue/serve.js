#!/usr/bin/env node
// PROTOTYPE — starts one isolated fixed-seed Double Vault Rescue board.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { LEVEL, SEED, buildLevel } = require('./level');

const PORT = Number(process.env.DOUBLE_VAULT_PORT || 8264);
const candidate = buildLevel();
const candidateIdentity = identity(candidate);
const recordingsDir = path.join(__dirname, 'sessions');
const server = createAuthoringServer({
  store: { schemaVersion: 1, candidates: [candidate] },
  receipt: { candidateIdentity },
  fixedSeed: SEED,
  recordingsDir,
});

server.listen(PORT, '127.0.0.1', () => {
  console.clear();
  console.log('DOUBLE VAULT RESCUE — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Does a short rescue move create a banked tile worth returning to?');
  console.log('');
  console.log('State');
  console.log('  seed: 34');
  console.log('  grid: 5x6');
  console.log('  target: 45,000');
  console.log('  moves: 12');
  console.log('  left vault: bomb expires after move 3');
  console.log('  right vault: opens after move 4; bomb expires after move 7');
  console.log('  current bot: target in 7, score 45,184');
  console.log('  bounded largest-chain: bomb explodes after move 3');
  console.log('');
  console.log('Play');
  console.log('  http://127.0.0.1:' + PORT + '/index.html?candidate=' + LEVEL + '&seed=' + SEED);
  console.log('');
  console.log('Sessions');
  console.log('  ' + recordingsDir);
  console.log('');
  console.log('Press Ctrl-C to stop the server.');
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
