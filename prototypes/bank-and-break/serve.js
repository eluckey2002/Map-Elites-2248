#!/usr/bin/env node
// PROTOTYPE — starts one isolated candidate server for paired human play.

const path = require('node:path');

const { createAuthoringServer } = require('../../solver/authoring-server');
const { identity } = require('../../solver/level-author');
const { SHARED, buildVariants } = require('./variants');
const { CHALLENGES, SOURCE_SEED_COUNT } = require('./validation');

const HOST = '127.0.0.1';
const BASE_PORT = Number(process.env.BANK_BREAK_PORT || 8260);
const VALIDATION_ROUND = 'validation-2026-09-12';
const candidate = buildVariants()[0];

function createEntries(basePort = BASE_PORT) {
  return CHALLENGES.map((challenge, index) => {
    const port = basePort + index;
    const recordingsDir = path.join(
      __dirname,
      'sessions',
      candidate.name,
      VALIDATION_ROUND,
      `${challenge.role}-seed-${challenge.seed}`,
    );
    const candidateIdentity = identity(candidate);
    const server = createAuthoringServer({
      store: { schemaVersion: 1, candidates: [candidate] },
      receipt: { candidateIdentity },
      fixedSeed: challenge.seed,
      recordingsDir,
    });
    return {
      server,
      candidate,
      candidateIdentity,
      challenge,
      port,
      recordingsDir,
      url: `http://${HOST}:${port}/index.html?candidate=${candidate.level}&seed=${challenge.seed}`,
    };
  });
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    function onError(error) {
      reject(error);
    }
    server.once('error', onError);
    server.listen(port, HOST, () => {
      server.off('error', onError);
      resolve();
    });
  });
}

function closeServers(entries) {
  return Promise.all(entries.map(({ server }) => new Promise((resolve) => {
    server.close(() => resolve());
  })));
}

async function startServers(basePort = BASE_PORT) {
  const entries = createEntries(basePort);
  const started = [];
  try {
    for (const entry of entries) {
      await listen(entry.server, entry.port);
      started.push(entry);
    }
    return entries;
  } catch (error) {
    await closeServers(started);
    const detail = error.code ? `${error.code} on port ${basePort + started.length}` : error.message;
    throw new Error(
      `Could not start the validation set: ${detail}. Set BANK_BREAK_PORT to a free three-port range.`,
      { cause: error },
    );
  }
}

function printBanner(servers) {
  console.clear();
  console.log('BANK AND BREAK — THROWAWAY PLAY PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Does the fixed gate make build separately → thaw → harvest feel real?');
  console.log('');
  console.log('Shared state');
  console.log('  grid: ' + SHARED.gridW + 'x' + SHARED.gridH);
  console.log('  target: ' + SHARED.target.toLocaleString());
  console.log('  moves: ' + SHARED.moves);
  console.log('  minimum chain: ' + SHARED.minChain);
  console.log('');
  console.log('Validation set');
  console.log('  source population: integer seeds 0-' + (SOURCE_SEED_COUNT - 1));
  for (const entry of servers) {
    const { challenge } = entry;
    const botResult = challenge.bot.outcome === 'win'
      ? 'target in ' + challenge.bot.moves + ', crossing score ' + challenge.bot.score.toLocaleString()
      : 'misses target, ' + challenge.bot.score.toLocaleString() + ' after ' + challenge.bot.moves;
    const baselineResult = challenge.boundedLongest.outcome === 'win'
      ? 'target in ' + challenge.boundedLongest.moves + ', crossing score ' + challenge.boundedLongest.score.toLocaleString()
      : 'misses target, ' + challenge.boundedLongest.score.toLocaleString() + ' after ' + challenge.boundedLongest.moves;
    console.log('  ' + challenge.role + ' · seed ' + challenge.seed);
    console.log('        current bot: ' + botResult);
    console.log('        bounded largest-chain: ' + baselineResult);
    console.log('        ' + entry.url);
  }
  console.log('');
  console.log('Sessions');
  console.log('  ' + path.join(__dirname, 'sessions', candidate.name, VALIDATION_ROUND));
  console.log('');
  console.log('Press Ctrl-C to stop the server.');
}

async function main() {
  const servers = await startServers();
  printBanner(servers);

  async function stop() {
    await closeServers(servers);
    process.exit(0);
  }

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { BASE_PORT, closeServers, createEntries, startServers };
