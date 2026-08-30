const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  CALIBRATION_VERSION,
  CALIBRATION_PARAMS,
  calibrationIdentity,
  calibrationStamp,
} = require('../calibration');
const frozenEvaluator = require('../calibrations/calib-1');
const { DEFAULT_PARAMS } = require('../bot');

const SOLVER = path.join(__dirname, '..');

test('the frozen ruler pins every live-bot parameter name', () => {
  assert.deepEqual(Object.keys(CALIBRATION_PARAMS).sort(), Object.keys(DEFAULT_PARAMS).sort());
  assert.deepEqual(CALIBRATION_PARAMS, {
    wRoll: 1,
    wPlace: 1,
    turnover: 40,
    width: 24,
    bombMax: 9,
    tieBreak: 'degree',
    wHarvest: 0,
    offerFull: 0,
    pathWidth: 1,
  });
  assert.notEqual(CALIBRATION_PARAMS, DEFAULT_PARAMS);
});

test('calibration identity covers the engine and versioned evaluator but not the live bot', () => {
  const expected = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(SOLVER, 'engine.js')))
    .update(fs.readFileSync(path.join(SOLVER, 'calibrations', 'calib-1.js')))
    .digest('hex');
  assert.equal(calibrationIdentity(), expected);
  assert.equal(calibrationIdentity(), calibrationIdentity());

  const source = fs.readFileSync(path.join(SOLVER, 'calibration.js'), 'utf8');
  assert.doesNotMatch(source, /['"]bot\.js['"]/);
});

test('calibration exports are frozen and evaluation has no ambient-state dependency', () => {
  assert.equal(Object.isFrozen(CALIBRATION_PARAMS), true);
  assert.equal(Object.isFrozen(frozenEvaluator.CALIBRATION_PARAMS), true);
  assert.equal(frozenEvaluator.CALIBRATION_PARAMS, CALIBRATION_PARAMS);
  assert.equal(frozenEvaluator.CALIBRATION_VERSION, CALIBRATION_VERSION);

  const originalWidth = CALIBRATION_PARAMS.width;
  CALIBRATION_PARAMS.width = 99;
  assert.equal(CALIBRATION_PARAMS.width, originalWidth);

  const tile = (x, value) => ({ x, y: 0, value, blocker: null, blockerDuration: 0, bombTimer: 0 });
  const makeState = () => ({
    grid: [[tile(0, 2), tile(1, 2), tile(2, 4)]],
    gridWidth: 3,
    gridHeight: 1,
    score: 0,
    moves: 0,
    maxMoves: 2,
    targetScore: 100,
    minChain: 2,
    tileScale: 1,
  });
  const beforeEnv = process.env.EVALUATOR_AMBIENT_PROBE;
  const first = frozenEvaluator.chooseMove(makeState()).map(({ x, y }) => [x, y]);
  process.env.EVALUATOR_AMBIENT_PROBE = 'changed';
  try {
    const second = frozenEvaluator.chooseMove(makeState()).map(({ x, y }) => [x, y]);
    assert.deepEqual(second, first);
  } finally {
    if (beforeEnv === undefined) delete process.env.EVALUATOR_AMBIENT_PROBE;
    else process.env.EVALUATOR_AMBIENT_PROBE = beforeEnv;
  }
});

test('the stamp carries the exact frozen version, parameters, and solver identity', () => {
  assert.deepEqual(calibrationStamp(), {
    version: 'calib-1',
    params: {
      wRoll: 1,
      wPlace: 1,
      turnover: 40,
      width: 24,
      bombMax: 9,
      tieBreak: 'degree',
      wHarvest: 0,
      offerFull: 0,
      pathWidth: 1,
    },
    solverIdentity: calibrationIdentity(),
  });
  assert.match(calibrationStamp().solverIdentity, /^[0-9a-f]{64}$/);
});
