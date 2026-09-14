#!/usr/bin/env node
// PROTOTYPE — starts the exact screened Cash or Compound board.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { assess, playTargetBot } = require('./model');
const { LEVEL, SEED, buildLevel } = require('./level');

const HOST = '127.0.0.1';
const PORT = Number(process.env.CASH_COMPOUND_PORT || 8265);
const candidate = buildLevel();
const candidateIdentity = identity(candidate);
const recordingsDir = path.join(__dirname, 'sessions');
const screen = assess({ ...candidate, target: Infinity }, SEED);
const bot = playTargetBot(candidate, SEED);

if (!screen || bot.outcome !== 'win') {
  throw new Error('screened candidate no longer reproduces');
}

const server = createAuthoringServer({
  store: { schemaVersion: 1, candidates: [candidate] },
  receipt: { candidateIdentity },
  fixedSeed: SEED,
  recordingsDir,
});

server.listen(PORT, HOST, () => {
  console.clear();
  console.log('CASH OR COMPOUND — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Will you pass up points now to build several reusable tiles for one later chain?');
  console.log('');
  console.log('State');
  console.log('  seed: ' + SEED);
  console.log('  grid: 5x5 open board');
  console.log('  target: 59,000');
  console.log('  moves: 16');
  console.log('');
  console.log('Screened reference');
  console.log('  current bot: target in ' + bot.moves.length + ', crossing score ' + bot.score.toLocaleString());
  console.log('  same bot without its harvest term: target in ' + screen.targetRace.noHarvestMoves);
  console.log('  bounded cash-now policy: target in ' + screen.targetRace.cashMoves);
  console.log('  reference turn: move 5 takes 5,120 instead of 15,680');
  console.log('  payoff: move 7 scores 25,280 using four previously built tiles');
  console.log('');
  console.log('Play');
  console.log('  http://' + HOST + ':' + PORT + '/index.html?candidate=' + LEVEL + '&seed=' + SEED);
  console.log('');
  console.log('One question after playing');
  console.log('  Did you see and control a build-now/pay-later plan, or did this still feel like an ordinary open board?');
  console.log('');
  console.log('Sessions');
  console.log('  ' + recordingsDir);
  console.log('');
  console.log('Press Ctrl-C to stop the server.');
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
