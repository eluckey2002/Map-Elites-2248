#!/usr/bin/env node
// PROTOTYPE — starts one isolated fixed-seed Funnel Sprint board.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { LEVEL, SEED, buildLevel } = require('./level');

const PORT = Number(process.env.FUNNEL_SPRINT_PORT || 8255);
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
  console.log('FUNNEL SPRINT — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Do three feeder lanes create a distinct routing-and-timing problem?');
  console.log('');
  console.log('State');
  console.log('  seed: ' + SEED);
  console.log('  grid: 5x5');
  console.log('  target: 22,000');
  console.log('  moves: 8');
  console.log('  minimum chain: 3');
  console.log('  fixed-seed bot: target in 8, score 41,216');
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
