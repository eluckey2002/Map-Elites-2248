#!/usr/bin/env node
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { recordSession } = require('./record-session');
const { LEVELS } = require('../src/game');

const ROOT = path.join(__dirname, '..');
const STATIC_FILES = new Map([
  ['/', ['src/bot-vision.html', 'text/html; charset=utf-8']],
  ['/bot-vision.html', ['src/bot-vision.html', 'text/html; charset=utf-8']],
  ['/bot-vision.css', ['src/bot-vision.css', 'text/css; charset=utf-8']],
  ['/bot-vision.js', ['src/bot-vision.js', 'text/javascript; charset=utf-8']],
]);

function jsonResponse(response, status, value) {
  const body = `${JSON.stringify(value)}\n`;
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  response.end(body);
}

function boundedInteger(raw, name, min, max) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) throw new Error(`${name} must be an integer`);
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }
  return value;
}

function createBotVisionServer() {
  return http.createServer((request, response) => {
    let url;
    try {
      url = new URL(request.url || '/', 'http://127.0.0.1');
    } catch {
      jsonResponse(response, 400, { error: 'invalid URL' });
      return;
    }

    if (request.method === 'GET' && STATIC_FILES.has(url.pathname)) {
      const [relativePath, type] = STATIC_FILES.get(url.pathname);
      const body = fs.readFileSync(path.join(ROOT, relativePath));
      response.writeHead(200, {
        'content-type': type,
        'content-length': body.length,
        'cache-control': 'no-store',
      });
      response.end(body);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/favicon.ico') {
      response.writeHead(204, { 'cache-control': 'public, max-age=86400' });
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/levels') {
      jsonResponse(response, 200, {
        levels: LEVELS.map((level) => ({
          level: level.level,
          gridW: level.gridW,
          gridH: level.gridH,
          target: level.target,
          moves: level.moves,
          minChain: level.minChain,
          blockers: level.blockers.length,
        })),
      });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/session') {
      let levelNumber;
      let seed;
      try {
        levelNumber = boundedInteger(url.searchParams.get('level'), 'level', 1, 9999);
        seed = boundedInteger(url.searchParams.get('seed'), 'seed', 0, 0xffffffff);
      } catch (error) {
        jsonResponse(response, 400, { error: error.message });
        return;
      }
      const level = LEVELS.find((entry) => entry.level === levelNumber);
      if (!level) {
        jsonResponse(response, 400, { error: `level ${levelNumber} is unavailable` });
        return;
      }

      try {
        jsonResponse(response, 200, recordSession(level, seed));
      } catch (error) {
        jsonResponse(response, 500, { error: `session generation failed: ${error.message}` });
      }
      return;
    }

    jsonResponse(response, 404, { error: 'not found' });
  });
}

function main() {
  const port = Number(process.env.BOT_VISION_PORT || 2249);
  const server = createBotVisionServer();
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Bot Vision: http://127.0.0.1:${server.address().port}/\n`);
  });
}

if (require.main === module) main();

module.exports = { boundedInteger, createBotVisionServer };
