#!/usr/bin/env node
// Reproduces the live Forge Contracts freeze through the real browser page.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { playContractBot } = require('./screen');

const DEBUG_PORT = Number(process.env.CHROME_DEBUG_PORT || 9333);
const GAME_URL = process.env.FORGE_URL
  || 'http://127.0.0.1:8266/index.html?candidate=5912&seed=5';

function timeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function createPage() {
  const response = await fetch(
    `http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(GAME_URL)}`,
    { method: 'PUT' },
  );
  assert.equal(response.ok, true, `Chrome page creation failed: ${response.status}`);
  return response.json();
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await timeout(new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  }), 1500, 'Chrome debugging socket did not open');

  let id = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const messageId = ++id;
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
        socket.send(JSON.stringify({ id: messageId, method, params }));
      });
    },
  };
}

async function evaluate(client, expression) {
  const result = await client.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || 'browser evaluation failed');
  }
  return result.result.value;
}

async function waitForGame(client) {
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const ready = await evaluate(
      client,
      'Boolean(window.game && document.querySelector("[data-contract=tower]"))',
    );
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('Forge Contracts page did not become ready');
}

const armMove = `(() => {
  document.querySelector('[data-contract=tower]').click();
  const tiles = game.grid.flat().filter(Boolean);
  let chain = null;
  for (const first of tiles) {
    for (const second of tiles) {
      if (first === second || first.value !== second.value || !game.isAdjacent(first, second)) continue;
      for (const third of tiles) {
        if (third === first || third === second || !game.isAdjacent(second, third)) continue;
        if (third.value === second.value || third.value === second.value * 2) {
          chain = [first, second, third];
          break;
        }
      }
      if (chain) break;
    }
    if (chain) break;
  }
  if (!chain) throw new Error('No valid three-tile chain found');
  game.chain = chain;
  chain.forEach((tile) => { tile.selected = true; });
  game.updateChainIndicator();
  game.render();
  setTimeout(() => game.submitChain(), 0);
  return { armed: true, chainLength: chain.length };
})()`;

async function main() {
  const page = await createPage();
  const client = await connect(page.webSocketDebuggerUrl);
  try {
    await client.send('Runtime.enable');
    await waitForGame(client);
    if (process.env.VERIFY_FINAL_MOVE === '1') {
      await verifyFinalMoveBonus(client);
      return;
    }
    if (process.env.VERIFY_CAPTURE === '1') {
      await verifyCapture(client);
      return;
    }

    const armed = await evaluate(client, armMove);
    assert.deepEqual(armed, { armed: true, chainLength: 3 });
    await new Promise((resolve) => setTimeout(resolve, 350));

    const state = await timeout(
      evaluate(client, '({ score: game.score, moves: game.moves, animating: game.animating, chainLength: game.chain.length, undoDisabled: document.getElementById("undoBtn").disabled })'),
      1200,
      'FAIL: browser event loop froze after submitting a Forge contract move',
    );
    assert.equal(state.moves, 1, `move did not complete: ${JSON.stringify(state)}`);
    assert.equal(state.animating, false, `animation did not settle: ${JSON.stringify(state)}`);
    assert.equal(state.chainLength, 0, `chain did not clear: ${JSON.stringify(state)}`);
    assert.equal(state.undoDisabled, true, `undo became enabled: ${JSON.stringify(state)}`);
    console.log(`PASS: Forge move completed without freezing ${JSON.stringify(state)}`);
  } finally {
    client.close();
  }
}

async function verifyFinalMoveBonus(client) {
  const armed = await evaluate(client, `(() => {
    document.querySelector('[data-contract=tower]').click();
    const chain = [game.grid[4][0], game.grid[4][1], game.grid[4][2]];
    const values = [1024, 1024, 2048];
    chain.forEach((tile, index) => {
      tile.value = values[index];
      tile.selected = true;
    });
    game.chain = chain;
    game.moves = game.maxMoves - 1;
    game.score = game.targetScore - 24000 - 6144;
    game.updateChainIndicator();
    game.updateUI();
    game.render();
    game.submitChain();
    return { target: game.targetScore, maxMoves: game.maxMoves };
  })()`);
  assert.deepEqual(armed, { target: 69000, maxMoves: 12 });
  await new Promise((resolve) => setTimeout(resolve, 350));

  const settled = await evaluate(
    client,
    '({ score: game.score, moves: game.moves, complete: game.levelComplete, gameOver: game.gameOver })',
  );
  assert.deepEqual(settled, {
    score: 69000,
    moves: 12,
    complete: true,
    gameOver: false,
  });
  console.log(`PASS: final-move Forge bonus was applied before the terminal check ${JSON.stringify(settled)}`);
}

async function verifyCapture(client) {
  const reference = playContractBot('tower');
  assert.equal(reference.outcome, 'win');
  await evaluate(client, 'document.querySelector("[data-contract=tower]").click()');
  const sessionId = await evaluate(client, 'document.querySelector(".forge-panel").dataset.sessionId');
  assert.match(sessionId, /^[0-9a-f-]{36}$/i);

  for (const move of reference.moves) {
    const expression = `(() => {
      const expected = ${JSON.stringify(move.tiles)};
      const chain = expected.map(({ x, y, value }) => {
        const tile = game.grid[y][x];
        if (!tile || tile.value !== value) {
          throw new Error('reference/browser board mismatch at ' + x + ',' + y);
        }
        return tile;
      });
      game.chain = chain;
      chain.forEach((tile) => { tile.selected = true; });
      game.updateChainIndicator();
      game.render();
      game.submitChain();
      return true;
    })()`;
    assert.equal(await evaluate(client, expression), true);
    await new Promise((resolve) => setTimeout(resolve, 320));
  }

  const settled = await evaluate(
    client,
    '({ score: game.score, moves: game.moves, complete: game.levelComplete, captureText: document.querySelector(".forge-capture").textContent })',
  );
  assert.deepEqual(settled, {
    score: reference.score,
    moves: reference.movesUsed,
    complete: true,
    captureText: `Run recorded · ${reference.movesUsed} moves`,
  });

  const response = await fetch(`http://127.0.0.1:8266/api/forge-sessions/${sessionId}`);
  assert.equal(response.ok, true, `saved session was unreadable: ${response.status}`);
  const saved = await response.json();
  assert.equal(saved.status, 'complete');
  assert.equal(saved.outcome, 'win');
  assert.equal(saved.contractId, 'tower');
  assert.equal(saved.contractAwarded, true);
  assert.equal(saved.bonusAwarded, 24000);
  assert.equal(saved.movesUsed, reference.movesUsed);
  assert.equal(saved.score, reference.score);
  assert.equal(saved.moves.length, reference.movesUsed);
  assert.deepEqual(saved.moves.map(({ tiles }) => tiles), reference.moves.map(({ tiles }) => tiles));
  console.log(`PASS: completed Forge run was recorded and read back ${JSON.stringify({ sessionId, score: saved.score, moves: saved.movesUsed })}`);

  const savedPath = path.join(__dirname, 'snapshots', `${sessionId}.json`);
  fs.unlinkSync(savedPath);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
