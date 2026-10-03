'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_PARAMS } = require('../bot');
const {
  admit, compareFitness, stageDecision, summarizePairs, twoAxis,
} = require('../ruler/core');
const { oneGeneVariants, shortMyopic } = require('../ruler/policies');
const { BLOCKS, LEVELS, NULL_LEVELS, MAX_GAMES, MUTANTS, STAGE2_LIMIT, STAGE3_LIMIT } = require('../ruler/config');

function outcome(win, moves, moveBudget = 30) {
  return { win, movesToTarget: win ? moves : null, moveBudget };
}

function grid(levels, seeds, make) {
  return levels.flatMap((level, levelIndex) => seeds.map((seed, seedIndex) => ({
    level, seed, ...make(levelIndex, seedIndex),
  })));
}

test('ruler A/A has zero wins gained, zero lost and exactly zero moves saved', () => {
  const levels = [1, 2];
  const seeds = [10, 11, 12];
  const cells = grid(levels, seeds, (levelIndex, seedIndex) => {
    const result = outcome(true, 10 + levelIndex + seedIndex);
    return { candidate: result, champion: { ...result } };
  });
  const result = summarizePairs(cells, levels, seeds);
  assert.equal(result.winsGained, 0);
  assert.equal(result.winsLost, 0);
  assert.equal(result.meanMovesSaved, 0);
  assert.equal(result.moveSe, 0);
});

test('ruler compares wins before mutual-win moves', () => {
  const levels = [1, 2];
  const seeds = [10, 11];
  const cells = grid(levels, seeds, (levelIndex, seedIndex) => ({
    candidate: levelIndex === 0 && seedIndex === 0 ? outcome(true, 25) : outcome(true, 20),
    champion: levelIndex === 0 && seedIndex === 0 ? outcome(false, null) : outcome(true, 10),
  }));
  const result = summarizePairs(cells, levels, seeds);
  assert.equal(result.winsGained, 1);
  assert.equal(result.winsLost, 0);
  assert.equal(result.meanMovesSaved, -10);
  assert.equal(compareFitness(result, { netWins: 0, meanMovesSaved: 0 }), 1);
  assert.equal(stageDecision(result, 1), 'ADVANCE');
});

test('two-axis SE catches seed-wide variation when level means are equal', () => {
  const result = twoAxis([1, -1, 1, -1, 1, -1, 1, -1], 2, 4);
  assert.equal(result.seLevel, 0);
  assert.ok(result.seSeed > 0);
  assert.equal(result.se, result.seSeed);
});

test('ruler rejects a missing or reordered paired cell', () => {
  const levels = [1, 2];
  const seeds = [10, 11];
  const cells = grid(levels, seeds, () => ({
    candidate: outcome(true, 10), champion: outcome(true, 11),
  }));
  assert.throws(() => summarizePairs(cells.slice(1), levels, seeds), /wrong size/);
  [cells[0], cells[1]] = [cells[1], cells[0]];
  assert.throws(() => summarizePairs(cells, levels, seeds), /level-major/);
});

test('admission refuses synthetic entrant with screen +3% and fresh -3%', () => {
  const screen = { netWins: 0, meanMovesSaved: 3, relativeMovesPct: 3, moveCi95: [1, 5] };
  const fresh = { netWins: 0, meanMovesSaved: -3, relativeMovesPct: -3 };
  assert.deepEqual(admit(screen, fresh), {
    admitted: false, reason: 'fresh-not-better-than-champion',
  });
});

test('admission accepts synthetic entrant positive on screen and fresh block', () => {
  const screen = { netWins: 0, meanMovesSaved: 3, relativeMovesPct: 3, moveCi95: [1, 5] };
  const fresh = { netWins: 0, meanMovesSaved: 3, relativeMovesPct: 3 };
  assert.deepEqual(admit(screen, fresh), { admitted: true, reason: 'fresh-rank' });
});

test('admission ranks same-cell entrants on fresh number only', () => {
  const screen = { netWins: 0, meanMovesSaved: 7, moveCi95: [1, 13] };
  const fresh = { netWins: 0, meanMovesSaved: 2 };
  const incumbentFresh = { netWins: 0, meanMovesSaved: 3 };
  assert.equal(admit(screen, fresh, incumbentFresh).admitted, false);
});

test('winner-curse panel has 30 unique one-gene champion variants', () => {
  const variants = oneGeneVariants();
  assert.equal(variants.length, 30);
  assert.equal(new Set(variants.map(({ policyId }) => policyId)).size, 30);
  for (const variant of variants) {
    const changed = Object.keys(DEFAULT_PARAMS).filter((key) => variant.params[key] !== DEFAULT_PARAMS[key]);
    assert.deepEqual(changed, [variant.gene]);
  }
  assert.equal(shortMyopic().width, 8);
  assert.equal(shortMyopic().pathWidth, 1);
});

test('declared seed blocks are disjoint and worst-case measured games stay below 60,000', () => {
  const ranges = Object.values(BLOCKS).map(({ start, count }) => [start, start + count - 1]);
  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      assert.ok(ranges[i][1] < ranges[j][0] || ranges[j][1] < ranges[i][0],
        'seed blocks overlap');
    }
  }
  assert.equal(LEVELS.length * 6, 72);
  assert.equal(LEVELS.length * 50, 600);
  assert.equal(LEVELS.length * 250, 3000);
  assert.equal(NULL_LEVELS.length * 100, 1000);
  const controls = 2 * 1000 + 2 * 3000 + 50 * 2 * 72 + 2 * (72 + 600)
    + 2 * 72 + 30 * 2 * 72;
  const map = 72 + MUTANTS * 72
    + 600 + STAGE2_LIMIT * 600
    + 3000 + STAGE3_LIMIT * 3000
    + 72 + STAGE3_LIMIT * 72
    + 3000 + STAGE3_LIMIT * 3000;
  assert.ok(controls + map <= MAX_GAMES, String(controls + map) + ' games');
});
