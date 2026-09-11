#!/usr/bin/env node
// PROTOTYPE — starts one isolated fixed-seed Builder Pocket board.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { LEVEL, SEED, buildLevel } = require('./level');

const PORT = Number(process.env.BUILDER_POCKET_PORT || 8256);
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
  console.log('BUILDER POCKET — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Can you deliberately store a valuable tile and recover it later?');
  console.log('');
  console.log('State');
  console.log('  seed: ' + SEED);
  console.log('  grid: 5x5');
  console.log('  target: 60,000');
  console.log('  moves: 12');
  console.log('  minimum chain: 3');
  console.log('  fixed-seed bot: target in 9, score 68,416');
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
