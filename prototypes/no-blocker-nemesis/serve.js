#!/usr/bin/env node
// PROTOTYPE — starts one isolated fixed-seed No-Blocker Nemesis board.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { LEVEL, SEED, buildLevel } = require('./level');

const PORT = Number(process.env.NO_BLOCKER_NEMESIS_PORT || 8257);
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
  console.log('NO-BLOCKER NEMESIS — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Can one exact open-board seed create a meaningful setup puzzle?');
  console.log('');
  console.log('State');
  console.log('  seed: ' + SEED);
  console.log('  grid: 6x5');
  console.log('  target: 90,000');
  console.log('  moves: 12');
  console.log('  minimum chain: 3');
  console.log('  fixed-seed bot: target in 10, score 95,488');
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
