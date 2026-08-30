/*
Oracle, frozen before the evaluator implementation:
- Question: Does production level authoring depend only on the versioned calib-1 evaluator, never the live bot?
- PASS means: the compliant control and all real checks exit 0, authored bytes remain identical after every
  live DEFAULT_PARAMS value changes, and the named source/import constraints hold exactly.
- FAIL means: the planted `require('./bot')` defect exits nonzero with the message
  "production authoring must import ./calibrations/calib-1 and not ./bot", or a real check reports drift.
- Frozen inputs: this file, the literal control sources below, the bounded shape, and the contract's calib-1 identity.
- Free variables: temporary directory names, process ids, test timing, and unrelated environment variables.
*/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SOLVER = path.join(__dirname, '..');

function localRequires(source) {
  return [...source.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)].map((match) => match[1]);
}

function assertEvaluatorBoundary({ levelAuthor, evaluator }) {
  assert.match(
    levelAuthor,
    /require\(\s*['"]\.\/calibrations\/calib-1['"]\s*\)/,
    'production authoring must import ./calibrations/calib-1 and not ./bot',
  );
  assert.doesNotMatch(
    levelAuthor,
    /require\(\s*['"]\.\/bot['"]\s*\)/,
    'production authoring must import ./calibrations/calib-1 and not ./bot',
  );
  assert.doesNotMatch(evaluator, /require\(\s*['"][^'"]*bot(?:\.js)?['"]\s*\)/, 'frozen evaluator must not import live bot');
  assert.deepEqual(localRequires(evaluator), ['../engine'], 'frozen evaluator local import graph must contain only ../engine');
}

const control = process.env.EVALUATOR_BOUNDARY_CONTROL;
if (control) {
  test(`evaluator-boundary ${control} control`, () => {
    const levelAuthor = control === 'defect'
      ? "const { chooseMove } = require('./bot');\n"
      : "const { chooseMove } = require('./calibrations/calib-1');\n";
    const evaluator = "const engine = require('../engine');\nmodule.exports = { chooseMove() {} };\n";
    assertEvaluatorBoundary({ levelAuthor, evaluator });
  });
} else {
  const { deriveCandidate, serialize } = require('../level-author');
  const { DEFAULT_PARAMS } = require('../bot');
  const { CALIBRATION_PARAMS } = require('../calibrations/calib-1');

  test('production authoring imports the versioned evaluator and not the live bot', () => {
    assertEvaluatorBoundary({
      levelAuthor: fs.readFileSync(path.join(SOLVER, 'level-author.js'), 'utf8'),
      evaluator: fs.readFileSync(path.join(SOLVER, 'calibrations', 'calib-1.js'), 'utf8'),
    });
  });

  test('production authoring passes the complete frozen calibration parameters', () => {
    assert.deepEqual(CALIBRATION_PARAMS, {
      wRoll: 1,
      wPlace: 1,
      turnover: 40,
      width: 24,
      bombMax: 9,
      tieBreak: 'degree',
      wHarvest: 0,
    });
    const source = fs.readFileSync(path.join(SOLVER, 'calibrations', 'calib-1.js'), 'utf8');
    assert.match(source, /\{\s*\.\.\.CALIBRATION_PARAMS\s*\}/);
    assert.doesNotMatch(source, /DEFAULT_PARAMS/);
  });

  test('live bot parameter changes cannot move frozen evaluator output', () => {
    const shape = {
      schemaVersion: 1,
      name: 'bounded-evaluator-boundary',
      level: 1,
      demand: 0.7,
      demandStatus: 'provisional-proposal',
      moves: 1,
      minChain: 2,
      gridW: 2,
      gridH: 2,
      blockers: [],
    };
    const before = deriveCandidate(shape);
    const saved = { ...DEFAULT_PARAMS };
    Object.assign(DEFAULT_PARAMS, {
      wRoll: 101,
      wPlace: 103,
      turnover: 107,
      width: 1,
      bombMax: 1,
      tieBreak: 'none',
      wHarvest: 109,
    });
    try {
      const after = deriveCandidate(shape);
      assert.equal(serialize(after.store), serialize(before.store));
      assert.equal(serialize(after.receipt), serialize(before.receipt));
      assert.equal(after.store.candidates[0].target, before.store.candidates[0].target);
      assert.deepEqual(after.receipt.fitting, before.receipt.fitting);
      assert.deepEqual(after.receipt.holdout, before.receipt.holdout);
      assert.deepEqual(after.receipt.calibration, before.receipt.calibration);
    } finally {
      Object.assign(DEFAULT_PARAMS, saved);
    }
  });
}
