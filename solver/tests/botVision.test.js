const { test } = require('node:test');
const assert = require('node:assert/strict');

const { LEVELS } = require('../../src/game');
const {
  makeRng, createLevelState, executeChain, applyGravity, tickBlockers,
} = require('../engine');
const { analyzeMove, chooseMove, DEFAULT_PARAMS } = require('../bot');
const { recordSession, snapshotBoard } = require('../record-session');
const { createBotVisionServer } = require('../bot-vision-server');

const LOOKAHEAD_BASE = 987654321;
const chainKey = (chain) => chain && chain.map(({ x, y }) => `${x},${y}`).join('|');

function stateFromSnapshot(session, move) {
  return {
    grid: move.boardBefore.map((row, y) => row.map((tile, x) => (
      tile ? { x, y, ...tile } : null
    ))),
    gridWidth: session.gridW,
    gridHeight: session.gridH,
    score: move.scoreBefore,
    moves: move.index,
    maxMoves: session.maxMoves,
    targetScore: session.targetScore,
    minChain: session.minChain,
    tileScale: session.tileScale,
  };
}

function recomputeScore(candidate, params) {
  return candidate.raw.immediate
    + params.wRoll * candidate.raw.rollout
    + params.wPlace * candidate.raw.placement
    + params.turnover * candidate.raw.turnover
    + params.wHarvest * candidate.raw.harvest;
}

function contributionMatches(candidate, params) {
  return candidate.contributions.immediate === candidate.raw.immediate
    && candidate.contributions.rollout === candidate.raw.rollout * params.wRoll
    && candidate.contributions.placement === candidate.raw.placement * params.wPlace
    && candidate.contributions.turnover === candidate.raw.turnover * params.turnover
    && candidate.contributions.harvest === candidate.raw.harvest * params.wHarvest;
}

test('analyzeMove preserves the production chooser across representative level shapes', () => {
  for (const number of [1, 20, 30, 40, 52, 53]) {
    const level = LEVELS.find(({ level: value }) => value === number);
    for (const seed of [0, 1]) {
      const state = createLevelState(level, makeRng(seed));
      const options = { lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE) };
      const before = JSON.stringify(state);
      assert.equal(
        chainKey(analyzeMove(state, options).selectedChain),
        chainKey(chooseMove(state, options)),
        `Level ${number}, seed ${seed}`,
      );
      assert.equal(JSON.stringify(state), before, `Level ${number}, seed ${seed} mutated`);
    }
  }
});

test('the known short Level 52 session remains exact and deterministic', () => {
  const level = LEVELS.find(({ level }) => level === 52);
  const first = recordSession(level, 2000000);
  const second = recordSession(level, 2000000);

  assert.deepEqual(first.outcome, { result: 'win', movesUsed: 14, finalScore: 116288 });
  assert.equal(first.moves.length, 14);
  assert.equal(first.sessionIdentity, second.sessionIdentity);
  assert.equal(first.sessionIdentity.length, 64);
  assert.equal(first.policy.identity.length, 64);
  assert.deepEqual(first.policy.params, DEFAULT_PARAMS);
  for (const entry of Object.values(first.identities.code)) {
    assert.match(entry.path, /^(solver|src)\//);
    assert.match(entry.sha256, /^[a-f0-9]{64}$/);
  }
});

test('a real Bot Vision session reconstructs every transition and score component', () => {
  const level = LEVELS.find(({ level }) => level === 52);
  const session = recordSession(level, 2000000);

  for (const move of session.moves) {
    assert.ok(Array.isArray(move.boardBefore));
    assert.ok(Array.isArray(move.boardAfter));
    assert.ok(Array.isArray(move.spawnDelta));
    assert.ok(move.decision.params);
    assert.ok(move.decision.candidates.length > 0);
    assert.equal(chainKey(move.chain), chainKey(move.decision.selectedChain));
    assert.ok(move.decision.candidates.some(({ id }) => id === move.decision.selectedId));

    const reconstructed = stateFromSnapshot(session, move);
    const productionChoice = chooseMove(reconstructed, {
      lookaheadRngFactory: () => makeRng(LOOKAHEAD_BASE + move.index),
      params: session.policy.params,
    });
    assert.equal(chainKey(productionChoice), chainKey(move.decision.selectedChain));
    const chain = move.chain.map(({ x, y }) => reconstructed.grid[y][x]);
    assert.equal(executeChain(reconstructed, chain), move.points);
    applyGravity(reconstructed);
    assert.deepEqual(snapshotBoard(reconstructed), move.boardAfterGravity);
    for (const spawned of move.spawnDelta) {
      assert.equal(reconstructed.grid[spawned.y][spawned.x], null);
      reconstructed.grid[spawned.y][spawned.x] = {
        ...spawned,
        blocker: null,
        blockerDuration: 0,
        bombTimer: 0,
      };
    }
    tickBlockers(reconstructed);
    assert.deepEqual(snapshotBoard(reconstructed), move.boardAfter);
    assert.equal(reconstructed.score, move.scoreAfter);

    for (const candidate of move.decision.candidates) {
      const expected = recomputeScore(candidate, move.decision.params);
      assert.ok(Math.abs(candidate.policyScore - expected) < 1e-9);
      assert.equal(contributionMatches(candidate, move.decision.params), true);
      assert.equal(candidate.twoMovePoints, candidate.raw.immediate + candidate.raw.rollout);
      assert.deepEqual(candidate.weights, {
        immediate: 1,
        wRoll: move.decision.params.wRoll,
        wPlace: move.decision.params.wPlace,
        turnover: move.decision.params.turnover,
        wHarvest: move.decision.params.wHarvest,
      });
      assert.deepEqual(candidate.contributions, {
        immediate: candidate.raw.immediate,
        rollout: candidate.raw.rollout * move.decision.params.wRoll,
        placement: candidate.raw.placement * move.decision.params.wPlace,
        turnover: candidate.raw.turnover * move.decision.params.turnover,
        harvest: candidate.raw.harvest * move.decision.params.wHarvest,
      });
    }
  }
});

test('the arithmetic assertion rejects a controlled broken contribution twin', () => {
  const level = LEVELS.find(({ level }) => level === 52);
  const session = recordSession(level, 2000000);
  const candidate = structuredClone(session.moves[0].decision.candidates[0]);
  candidate.contributions.turnover += 1;
  assert.equal(contributionMatches(candidate, session.policy.params), false);
});

test('Bot Vision server returns the exact session and rejects malformed identities', async (t) => {
  const server = createBotVisionServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;

  const response = await fetch(`${origin}/api/session?level=52&seed=2000000`);
  assert.equal(response.status, 200);
  const session = await response.json();
  assert.deepEqual(session.outcome, { result: 'win', movesUsed: 14, finalScore: 116288 });
  assert.equal(session.moves.length, 14);

  for (const url of [
    '/api/session?level=52&seed=not-a-seed',
    '/api/session?level=999&seed=0',
    '/api/session?level=52&seed=-1',
  ]) {
    const rejected = await fetch(`${origin}${url}`);
    assert.equal(rejected.status, 400, url);
  }

  const page = await fetch(`${origin}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Bot candidate pool/);
  for (const asset of ['/bot-vision.css', '/bot-vision.js', '/favicon.ico']) {
    const loaded = await fetch(`${origin}${asset}`);
    assert.ok([200, 204].includes(loaded.status), asset);
  }
});
