#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { identity, serialize, validateCandidate } = require('./level-author');

const ROOT = path.join(__dirname, '..');
const MAX_BODY_BYTES = 256 * 1024;
const STATIC_FILES = new Map([
  ['/', { file: path.join(ROOT, 'src', 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/index.html', { file: path.join(ROOT, 'src', 'index.html'), type: 'text/html; charset=utf-8' }],
  ['/game.js', { file: path.join(ROOT, 'src', 'game.js'), type: 'text/javascript; charset=utf-8' }],
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function jsonResponse(response, status, value) {
  const body = `${JSON.stringify(value)}\n`;
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function requireInteger(value, name, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} is invalid`);
}

function validateRecording(recording, candidate, candidateIdentity, fixedSeed = null) {
  if (!recording || typeof recording !== 'object' || Array.isArray(recording)) throw new Error('recording must be an object');
  if (recording.schemaVersion !== 1) throw new Error('recording schemaVersion must be 1');
  if (recording.candidateIdentity !== candidateIdentity || recording.candidateLevel !== candidate.level) {
    const error = new Error('unknown candidate');
    error.code = 'UNKNOWN_CANDIDATE';
    throw error;
  }
  requireInteger(recording.seed, 'seed', 0, 0xffffffff);
  if (fixedSeed !== null && recording.seed !== fixedSeed) throw new Error('recording seed does not match pinned session');
  if (!['win', 'lose'].includes(recording.outcome)) throw new Error('outcome is invalid');
  if (typeof recording.reason !== 'string' || recording.reason.length < 1 || recording.reason.length > 100) throw new Error('reason is invalid');
  requireInteger(recording.score, 'score', 0, Number.MAX_SAFE_INTEGER);
  requireInteger(recording.movesUsed, 'movesUsed', 0, candidate.moves);
  if (!Array.isArray(recording.chains) || recording.chains.length !== recording.movesUsed) {
    throw new Error('chains must contain one ordered chain per move');
  }
  recording.chains.forEach((chain, chainIndex) => {
    if (!chain || typeof chain !== 'object' || !Array.isArray(chain.tiles)) throw new Error(`chain ${chainIndex} tiles are invalid`);
    if (chain.tiles.length < candidate.minChain) throw new Error(`chain ${chainIndex} is shorter than minChain`);
    requireInteger(chain.points, `chain ${chainIndex} points`, 0, Number.MAX_SAFE_INTEGER);
    chain.tiles.forEach((tile, tileIndex) => {
      if (!tile || typeof tile !== 'object') throw new Error(`chain ${chainIndex} tile ${tileIndex} is invalid`);
      requireInteger(tile.x, `chain ${chainIndex} tile ${tileIndex} x`, 0, candidate.gridW - 1);
      requireInteger(tile.y, `chain ${chainIndex} tile ${tileIndex} y`, 0, candidate.gridH - 1);
      requireInteger(tile.value, `chain ${chainIndex} tile ${tileIndex} value`, 1, Number.MAX_SAFE_INTEGER);
    });
  });
  return recording;
}

function recordingIdentity(recording) {
  return identity(recording);
}

function serializeRecording(recording) {
  return serialize(recording);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    request.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        settled = true;
        const error = new Error('request body is too large');
        error.code = 'TOO_LARGE';
        reject(error);
        request.resume();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!settled) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', (error) => {
      if (!settled) reject(error);
    });
  });
}

function createAuthoringServer(options = {}) {
  const store = options.store || readJson(path.join(__dirname, 'candidate-levels.json'));
  const receipt = options.receipt || readJson(path.join(__dirname, 'candidate-levels.receipt.json'));
  const recordingsDir = path.resolve(options.recordingsDir || path.join(ROOT, 'recordings'));
  const fixedSeed = options.fixedSeed === undefined ? null : options.fixedSeed;
  if (fixedSeed !== null) requireInteger(fixedSeed, 'fixed seed', 0, 0xffffffff);
  if (!Array.isArray(store.candidates) || store.candidates.length !== 1) throw new Error('candidate store must contain one candidate');
  const candidate = validateCandidate(store.candidates[0]);
  if (identity(candidate) !== receipt.candidateIdentity) throw new Error('candidate receipt binding mismatch');
  fs.mkdirSync(recordingsDir, { recursive: true });

  return http.createServer(async (request, response) => {
    const rawPath = (request.url || '/').split('?')[0];
    let pathname;
    try {
      pathname = decodeURIComponent(rawPath);
    } catch {
      jsonResponse(response, 400, { error: 'invalid path encoding' });
      return;
    }
    if (pathname.includes('..') || pathname.includes('\0') || pathname.includes('\\')) {
      jsonResponse(response, 400, { error: 'invalid path' });
      return;
    }

    if (request.method === 'GET' && STATIC_FILES.has(pathname)) {
      const asset = STATIC_FILES.get(pathname);
      const body = fs.readFileSync(asset.file);
      response.writeHead(200, { 'content-type': asset.type, 'content-length': body.length });
      response.end(body);
      return;
    }

    if (request.method === 'GET' && pathname === '/api/candidates') {
      jsonResponse(response, 200, { candidates: store.candidates, candidateIdentity: receipt.candidateIdentity });
      return;
    }

    if (request.method === 'GET' && pathname === `/api/candidates/${candidate.level}`) {
      jsonResponse(response, 200, { candidate, candidateIdentity: receipt.candidateIdentity });
      return;
    }

    if (request.method === 'POST' && pathname === '/api/recordings') {
      let raw;
      try {
        raw = await readBody(request);
      } catch (error) {
        jsonResponse(response, error.code === 'TOO_LARGE' ? 413 : 400, { error: error.message });
        return;
      }
      let recording;
      try {
        recording = JSON.parse(raw);
      } catch {
        jsonResponse(response, 400, { error: 'malformed JSON' });
        return;
      }
      try {
        validateRecording(recording, candidate, receipt.candidateIdentity, fixedSeed);
      } catch (error) {
        jsonResponse(response, error.code === 'UNKNOWN_CANDIDATE' ? 404 : 422, { error: error.message });
        return;
      }

      const recordingId = recordingIdentity(recording);
      const bytes = serializeRecording(recording);
      const destination = path.join(recordingsDir, `${recordingId}.json`);
      try {
        fs.writeFileSync(destination, bytes, { flag: 'wx' });
        jsonResponse(response, 201, { status: 'saved', recordingIdentity: recordingId });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          jsonResponse(response, 500, { error: 'recording write failed' });
          return;
        }
        const existing = fs.readFileSync(destination, 'utf8');
        if (existing === bytes) {
          jsonResponse(response, 200, { status: 'already-saved', recordingIdentity: recordingId });
        } else {
          jsonResponse(response, 409, { error: 'recording identity already has conflicting content' });
        }
      }
      return;
    }

    jsonResponse(response, 404, { error: 'not found' });
  });
}

function main() {
  const server = createAuthoringServer();
  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    process.stdout.write(`Authoring server: http://127.0.0.1:${port}/index.html\n`);
  });
}

if (require.main === module) main();

module.exports = {
  MAX_BODY_BYTES,
  createAuthoringServer,
  recordingIdentity,
  serializeRecording,
  validateRecording,
};
