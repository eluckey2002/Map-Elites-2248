'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { axis, pairedSummary, gameAccounting, assertParityCells } = require('../policy-lab/recompute');

test('independent arithmetic retains the level uncertainty when seed columns tie', () => {
  const result = axis([1, 1, 3, 3], 2, 2);
  assert.equal(result.mean, 2);
  assert.equal(result.seLevel, 1);
  assert.equal(result.seSeed, 0);
  assert.equal(result.se, 1);
  assert.deepEqual(result.ci95, [0.040000000000000036, 3.96]);
});

test('independent arithmetic cannot turn missing mutual wins into zero-effect observations', () => {
  assert.equal(axis([null, null, null, null], 2, 2).mean, null);
  assert.throws(() => axis([1, 2, 3], 2, 2), /incomplete grid/);
  const empty = { games: [] };
  assert.throws(() => pairedSummary(empty, empty), /panel not 580 games/);
});

test('independent accounting counts both parity games and refuses duplicate panels', () => {
  const raw = { config: { historicalReplayGames: 180 }, panels: [
    { block: 'G', arm: 'champion', games: [{}, {}] },
    { block: 'G', arm: 'parity-base', games: [{ parityOutcome: {} }] },
    { block: 'C1', arm: 'champion', games: [{}, {}] },
  ] };
  assert.deepEqual(gameAccounting(raw), { controls: 2, proposals: 2, jointSearch: 0, confirmation: 0, replays: 182, buffer: 0 });
  raw.panels.push(raw.panels[2]);
  assert.throws(() => gameAccounting(raw), /duplicate control panel/);
  raw.panels.pop(); delete raw.panels[1].games[0].parityOutcome;
  assert.throws(() => gameAccounting(raw), /missing counted parity replay/);
});

test('independent paired arithmetic refuses null winning move counts', () => {
  const games = Array.from({ length: 580 }, (_, i) => ({ level: Math.floor(i / 10) + 1, seed: 60000000 + i % 10, outcome: { win: true, movesToTarget: 2 } }));
  const panel = { seeds: Array.from({ length: 10 }, (_, i) => 60000000 + i), games };
  const damaged = { ...panel, games: structuredClone(games) };
  damaged.games[579].outcome.movesToTarget = null;
  assert.throws(() => pairedSummary(damaged, panel), /invalid winning move count/);
});

test('independent parity audit rejects 200 duplicate identities and cells outside the frozen recipe', () => {
  const games = Array.from({ length: 200 }, (_, i) => ({ level: i % 58 + 1, seed: 60000000 + Math.floor(i / 58) }));
  assert.doesNotThrow(() => assertParityCells({ block: 'G', games }, 60000000));
  assert.throws(() => assertParityCells({ block: 'G', games: Array(200).fill(games[0]) }, 60000000), /repeated or undeclared/);
  const outside = structuredClone(games); outside[199].seed = 60000009;
  assert.throws(() => assertParityCells({ block: 'G', games: outside }, 60000000), /repeated or undeclared/);
});
