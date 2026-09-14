#!/usr/bin/env node
// PROTOTYPE — serves an isolated contract layer without editing src/game.js.

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { identity } = require('../../solver/level-author');
const { playContractBot } = require('./screen');
const { LEVEL, SEED, buildLevel } = require('./level');

const ROOT = path.join(__dirname, '../..');
const HOST = '127.0.0.1';
const PORT = Number(process.env.FORGE_CONTRACTS_PORT || 8266);
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');
const candidate = buildLevel();
const candidateIdentity = identity(candidate);
const sourceHtml = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8');
const html = sourceHtml.replace(
  '<script src="game.js"></script>',
  '<script src="/game.js"></script><script src="/contracts.js"></script><script src="/forge.js"></script>',
);
const references = {
  spread: playContractBot('spread'),
  tower: playContractBot('tower'),
};
fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });

function send(response, status, type, body) {
  response.writeHead(status, { 'content-type': type, 'content-length': Buffer.byteLength(body), 'cache-control': 'no-store' });
  response.end(body);
}

function sessionPath(sessionId) {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) throw new Error('invalid session id');
  return path.join(SNAPSHOTS_DIR, `${sessionId}.json`);
}

function saveSession(payload) {
  if (!payload || payload.schemaVersion !== 1 || payload.standing !== 'throwaway Forge Contracts playtest; not evidence-ledger evidence') {
    throw new Error('invalid Forge session');
  }
  const target = sessionPath(payload.sessionId);
  if (fs.existsSync(target)) {
    const current = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (current.revision >= payload.revision) return false;
  }
  const temporary = `${target}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(payload, null, 2)}\n`);
  fs.renameSync(temporary, target);
  return true;
}

function latestSession() {
  const files = fs.readdirSync(SNAPSHOTS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ name, modified: fs.statSync(path.join(SNAPSHOTS_DIR, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified);
  if (files.length === 0) return null;
  return JSON.parse(fs.readFileSync(path.join(SNAPSHOTS_DIR, files[0].name), 'utf8'));
}

const server = http.createServer((request, response) => {
  const pathname = (request.url || '/').split('?')[0];
  if (request.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    send(response, 200, 'text/html; charset=utf-8', html);
    return;
  }
  if (request.method === 'GET' && pathname === '/game.js') {
    send(response, 200, 'text/javascript; charset=utf-8', fs.readFileSync(path.join(ROOT, 'src/game.js')));
    return;
  }
  if (request.method === 'GET' && pathname === '/contracts.js') {
    send(response, 200, 'text/javascript; charset=utf-8', fs.readFileSync(path.join(__dirname, 'contracts.js')));
    return;
  }
  if (request.method === 'GET' && pathname === '/forge.js') {
    send(response, 200, 'text/javascript; charset=utf-8', fs.readFileSync(path.join(__dirname, 'forge.js')));
    return;
  }
  if (request.method === 'GET' && pathname === `/api/candidates/${LEVEL}`) {
    send(response, 200, 'application/json; charset=utf-8', `${JSON.stringify({ candidate, candidateIdentity })}\n`);
    return;
  }
  if (request.method === 'POST' && pathname === '/api/forge-sessions') {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try {
        const saved = saveSession(JSON.parse(body));
        send(response, 200, 'application/json; charset=utf-8', `${JSON.stringify({ saved })}\n`);
      } catch (error) {
        send(response, 400, 'application/json; charset=utf-8', `${JSON.stringify({ error: error.message })}\n`);
      }
    });
    return;
  }
  if (request.method === 'GET' && pathname === '/api/forge-sessions/latest') {
    const session = latestSession();
    send(response, session ? 200 : 404, 'application/json; charset=utf-8', `${JSON.stringify(session || { error: 'no sessions' })}\n`);
    return;
  }
  const sessionMatch = pathname.match(/^\/api\/forge-sessions\/([0-9a-f-]{36})$/i);
  if (request.method === 'GET' && sessionMatch) {
    try {
      const body = fs.readFileSync(sessionPath(sessionMatch[1]), 'utf8');
      send(response, 200, 'application/json; charset=utf-8', body);
    } catch (error) {
      send(response, 404, 'application/json; charset=utf-8', '{"error":"session not found"}\n');
    }
    return;
  }
  send(response, 404, 'application/json; charset=utf-8', '{"error":"not found"}\n');
});

server.listen(PORT, HOST, () => {
  console.clear();
  console.log('FORGE CONTRACTS — THROWAWAY MECHANIC PROTOTYPE');
  console.log('');
  console.log('Question');
  console.log('  Does choosing spread versus tower meaningfully change your normal build-and-harvest plan?');
  console.log('');
  console.log('Contracts');
  console.log('  Spread Forge: hold four 1,024 tiles · +15,000');
  console.log('  Tower Forge: create one tile worth exactly 4,096 · +24,000');
  console.log('');
  console.log('Reference bot on this exact board');
  console.log(`  Spread: ${references.spread.outcome} in ${references.spread.movesUsed}, ${references.spread.score.toLocaleString()}`);
  console.log(`  Tower: ${references.tower.outcome} in ${references.tower.movesUsed}, ${references.tower.score.toLocaleString()}`);
  console.log('');
  console.log('Play');
  console.log(`  http://${HOST}:${PORT}/index.html?candidate=${LEVEL}&seed=${SEED}`);
  console.log('');
  console.log('Forge-specific state snapshots are saved under prototypes/forge-contracts/snapshots/.');
  console.log('They remain separate from standard replays because the standard engine does not contain these bonuses.');
  console.log('Press Ctrl-C to stop the server.');
});

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
