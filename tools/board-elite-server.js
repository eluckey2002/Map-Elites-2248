#!/usr/bin/env node
// Serve one board-search elite so the owner can play it in the original game.
//
//   node tools/board-elite-server.js --archive experiments/<RESULT-ID>/output/archive.json --list
//   node tools/board-elite-server.js --archive <archive.json> --board <boardIdentity prefix> [--port 8290]
//   node tools/board-elite-server.js --archive <archive.json> --write-batch solver/generated-batch-<name>.json
//
// It wraps solver/authoring-server.js (a hashed pilot input, so it is not
// edited) with the one file that server predates: src/game-library.js, which
// index.html now loads first. Recordings are written to recordings/ exactly as
// the authoring server writes them, bound to the elite's candidate identity.
// solver/human-benchmark.js resolves a recording through recording-replay's
// candidate index, which reads solver/generated-batch*.json, so --write-batch
// writes the archive's elites in that shape; a recording of any elite then
// resolves to its board.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createAuthoringServer } = require('../solver/authoring-server');

const ROOT = path.join(__dirname, '..');
const LIBRARY = path.join(ROOT, 'src', 'game-library.js');

function parseArgs(argv) {
  const args = { port: 8290, list: false, writeBatch: null };
  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (flag === '--list') { args.list = true; continue; }
    const value = argv[++index];
    if (value === undefined) throw new Error(`${flag} needs a value`);
    if (flag === '--archive') args.archive = value;
    else if (flag === '--board') args.board = value;
    else if (flag === '--port') args.port = Number(value);
    else if (flag === '--recordings') args.recordings = value;
    else if (flag === '--write-batch') args.writeBatch = value;
    else throw new Error(`unknown flag ${flag}`);
  }
  if (!args.archive) throw new Error('--archive is required');
  if (!Number.isInteger(args.port) || args.port < 0 || args.port > 65535) throw new Error('--port must be 0–65535');
  return args;
}

function eliteEntries(archive) {
  const receipts = new Map(archive.evaluations.filter((entry) => entry.eligible).map((entry) => [entry.boardIdentity, entry.receipt]));
  return archive.archive.flatMap(({ cell, elites }) => elites.map((elite) => ({ cell, ...elite, receipt: receipts.get(elite.boardIdentity) })));
}

function selectElite(archive, prefix) {
  if (!prefix || !/^[a-f0-9]{6,64}$/.test(prefix)) throw new Error('--board must be a hex boardIdentity prefix of at least 6 characters');
  const matches = eliteEntries(archive).filter((elite) => elite.boardIdentity.startsWith(prefix));
  if (matches.length !== 1) throw new Error(`--board ${prefix} matches ${matches.length} elites`);
  if (!matches[0].receipt) throw new Error('elite has no authoring receipt in this archive');
  return matches[0];
}

function eliteBatch(archive) {
  return {
    schemaVersion: 1,
    source: { kind: 'board-map-elites elites', protocol: archive.registration?.protocol ?? null, artifactIdentity: archive.artifactIdentity },
    results: eliteEntries(archive).map(({ candidate, receipt, cell, rank, boardIdentity }) => ({ candidate, receipt, cell, rank, boardIdentity })),
  };
}

function createEliteServer(elite, { recordingsDir } = {}) {
  const inner = createAuthoringServer({ store: { candidates: [elite.candidate] }, receipt: elite.receipt, recordingsDir });
  return http.createServer((request, response) => {
    if (request.method === 'GET' && (request.url || '').split('?')[0] === '/game-library.js') {
      const body = fs.readFileSync(LIBRARY);
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'content-length': body.length });
      response.end(body);
      return;
    }
    inner.emit('request', request, response);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const archive = JSON.parse(fs.readFileSync(path.resolve(args.archive), 'utf8'));
  const seeds = archive.config?.descriptorSeeds || [];
  if (args.writeBatch) {
    const out = path.resolve(args.writeBatch);
    if (!/^generated-batch.*\.json$/.test(path.basename(out))) throw new Error('--write-batch must name a generated-batch*.json file');
    if (fs.existsSync(out)) throw new Error(`refusing to overwrite ${args.writeBatch}`);
    fs.writeFileSync(out, `${JSON.stringify(eliteBatch(archive), null, 2)}\n`);
    process.stdout.write(`WROTE ${args.writeBatch}\n`);
    return;
  }
  if (args.list) {
    for (const elite of eliteEntries(archive)) {
      process.stdout.write(`${elite.boardIdentity.slice(0, 12)}  cell ${elite.cell}  rank ${elite.rank}  ${elite.candidate.gridW}x${elite.candidate.gridH}  target ${elite.candidate.target}  moves ${elite.candidate.moves}\n`);
    }
    return;
  }
  const elite = selectElite(archive, args.board);
  const server = createEliteServer(elite, { recordingsDir: args.recordings });
  server.listen(args.port, '127.0.0.1', () => {
    const { port } = server.address();
    process.stdout.write(`Elite ${elite.boardIdentity.slice(0, 12)} (cell ${elite.cell})\n`);
    for (const seed of seeds) process.stdout.write(`  http://127.0.0.1:${port}/?candidate=${elite.candidate.level}&seed=${seed}\n`);
  });
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exit(2); }
}

module.exports = { parseArgs, eliteBatch, eliteEntries, selectElite, createEliteServer };
