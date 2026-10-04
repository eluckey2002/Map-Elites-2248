'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { strongerPolicy } = require('../ruler/run');

test('holdout rule uses unrounded t just above 3 even when display rounds to 3', () => {
  const result = strongerPolicy({
    netWins: 0, relativeMovesPct: 3.0000004, meanMovesSaved: 3.0000004, moveSe: 1,
  });
  assert.equal(result.t, '3.000000');
  assert.equal(result.held, true);
});

test('holdout rule refuses t exactly 3', () => {
  assert.equal(strongerPolicy({
    netWins: 0, relativeMovesPct: 3, meanMovesSaved: 3, moveSe: 1,
  }).held, false);
});

test('holdout rule refuses net win regression despite positive lift and t above 3', () => {
  assert.equal(strongerPolicy({
    netWins: -1, relativeMovesPct: 4, meanMovesSaved: 4, moveSe: 1,
  }).held, false);
});
