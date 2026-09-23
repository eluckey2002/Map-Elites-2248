#!/usr/bin/env node
// Serves the game and captures ordinary play sessions.
//
// The authoring server (solver/authoring-server.js) is bound to one candidate
// and writes receipted evidence into recordings/. This one serves the shipped
// level list and writes plain play sessions into play-sessions/, which is
// deliberately NOT the evidence corpus: these carry a level number and a seed,
// not a candidate identity, so they must not land where recording-replay and
// the receipt gate expect resolvable candidates.
//
//   node tools/play-server.js            # port 8248
//   PORT=9000 node tools/play-server.js
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');
const { listChallenges, oneChallenge } = require('./nemesis');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const STORE = path.join(ROOT, 'play-sessions');
const PORT = Number(process.env.PORT || 8248);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.ico': 'image/x-icon',
};

function readBody(request, limitBytes = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) { reject(new Error('payload too large')); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

// Enough to replay: a level number, a seed, and the exact chains drawn.
function validateSession(session) {
  const problems = [];
  if (!session || typeof session !== 'object') return ['session must be an object'];
  if (!Number.isInteger(session.candidateLevel)) problems.push('candidateLevel must be an integer');
  if (!Number.isInteger(session.seed) || session.seed < 0) problems.push('seed must be a non-negative integer');
  if (!Number.isInteger(session.movesUsed) || session.movesUsed < 0) problems.push('movesUsed must be a non-negative integer');
  if (typeof session.score !== 'number') problems.push('score must be a number');
  if (!['win', 'lose'].includes(session.outcome)) problems.push('outcome must be win or lose');
  if (!Array.isArray(session.chains)) problems.push('chains must be an array');
  else {
    session.chains.forEach((chain, i) => {
      if (!chain || !Array.isArray(chain.tiles) || chain.tiles.length === 0) problems.push(`chain ${i} has no tiles`);
      else if (!chain.tiles.every((t) => Number.isInteger(t.x) && Number.isInteger(t.y) && Number.isFinite(t.value))) {
        problems.push(`chain ${i} has a malformed tile`);
      }
    });
  }
  return problems;
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload) });
  response.end(payload);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sessionIdentity(session) {
  const { capturedAt: ignoredCapturedAt, source: ignoredSource, ...play } = session;
  return crypto.createHash('sha256').update(canonicalJson(play)).digest('hex');
}

function storedSessionId(store, session) {
  const identity = sessionIdentity(session);
  for (const name of fs.readdirSync(store).filter((entry) => entry.endsWith('.json'))) {
    try {
      const existing = JSON.parse(fs.readFileSync(path.join(store, name), 'utf8'));
      if (sessionIdentity(existing) === identity) return name.slice(0, -'.json'.length);
    } catch {
      // A malformed prior file is not a match and must not block new capture.
    }
  }
  return identity;
}

function createPlayServer({ store = STORE, now = () => new Date().toISOString(), challengeSources = null } = {}) {
  fs.mkdirSync(store, { recursive: true });
  const botCache = new Map();
  const nemesisOptions = () => ({ cache: botCache, ...(challengeSources ? { sources: challengeSources } : {}) });
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const { pathname } = url;

    if (request.method === 'GET' && pathname === '/api/nemesis') {
      const level = url.searchParams.get('level');
      const seed = url.searchParams.get('seed');
      if (level === null && seed === null) { json(response, 200, { challenges: listChallenges(nemesisOptions()) }); return; }
      const challenge = oneChallenge(Number(level), Number(seed), nemesisOptions());
      if (!challenge) { json(response, 400, { error: 'unknown level or seed' }); return; }
      json(response, 200, { challenge });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/play-sessions') {
      try {
        const session = JSON.parse(await readBody(request));
        const problems = validateSession(session);
        if (problems.length) { json(response, 400, { error: 'invalid session', problems }); return; }
        const id = storedSessionId(store, session);
        const stamped = { ...session, capturedAt: now(), source: 'play-server' };
        const body = `${JSON.stringify(stamped, null, 2)}\n`;
        // The identity excludes server-added capture metadata, so submitting
        // the same play again remains one benchmark row.
        const file = path.join(store, `${id}.json`);
        if (!fs.existsSync(file)) fs.writeFileSync(file, body);
        process.stdout.write(
          `captured level ${session.candidateLevel} seed ${session.seed}: `
          + `${session.outcome} ${session.score} in ${session.movesUsed} moves -> ${id.slice(0, 12)}\n`,
        );
        json(response, 200, { status: 'saved', id });
      } catch (error) {
        json(response, 400, { error: error.message });
      }
      return;
    }

    if (request.method === 'GET') {
      const name = pathname === '/' ? '/index.html' : pathname;
      if (name.includes('..') || name.includes('\0')) { json(response, 400, { error: 'bad path' }); return; }
      const file = path.join(SRC, name);
      if (file.startsWith(SRC) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        const body = fs.readFileSync(file);
        response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'content-length': body.length });
        response.end(body);
        return;
      }
      if (name === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    }

    json(response, 404, { error: 'not found' });
  });
}

if (require.main === module) {
  createPlayServer().listen(PORT, '127.0.0.1', () => {
    process.stdout.write(`Play server: http://127.0.0.1:${PORT}/index.html\nNemesis:     http://127.0.0.1:${PORT}/nemesis.html\nCapturing to ${STORE}\n`);
  });
}

module.exports = { createPlayServer, sessionIdentity, storedSessionId, validateSession };
