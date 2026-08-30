const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CALIBRATION_VERSION, CALIBRATION_PARAMS, calibrationIdentity, calibrationStamp } = require('../calibration');
const { DEFAULT_PARAMS } = require('../bot');

// The whole point of the file is that it does NOT track the live bot. If a
// future edit replaces the literal snapshot with a reference to DEFAULT_PARAMS
// -- which looks like a tidy de-duplication -- targets silently start moving
// with the bot again and this test is the thing that catches it.
test('calibration params are a literal snapshot, not a view of the live bot', () => {
  assert.deepEqual(CALIBRATION_PARAMS, {
    wRoll: 1, wPlace: 1, turnover: 40, width: 24, bombMax: 9, tieBreak: 'degree', wHarvest: 0,
    offerFull: 0, pathWidth: 1, heavyAfter: 0,
  });
  assert.notEqual(CALIBRATION_PARAMS, DEFAULT_PARAMS); // not the same object
});

// The trap this catches: chooseMove resolves { ...DEFAULT_PARAMS, ...params },
// so a parameter present on the live bot but MISSING from the ruler silently
// takes the live bot's value. The ruler would look frozen and would not be.
// Adding a bot parameter must be a deliberate decision about calibration.
test('the ruler pins every parameter the live bot has', () => {
  assert.deepEqual(Object.keys(CALIBRATION_PARAMS).sort(), Object.keys(DEFAULT_PARAMS).sort());
});

test('calibration params cannot be mutated in place', () => {
  // A write to a frozen object throws in strict mode and fails silently in
  // sloppy mode, and these files are sloppy. Assert what holds in both: the
  // object is frozen, and the write does not take.
  assert.equal(Object.isFrozen(CALIBRATION_PARAMS), true);
  CALIBRATION_PARAMS.width = 99;
  assert.equal(CALIBRATION_PARAMS.width, 24);
});

test('mutating the live bot params does not move the calibration ruler', () => {
  const before = { ...CALIBRATION_PARAMS };
  const restore = DEFAULT_PARAMS.width;
  DEFAULT_PARAMS.width = 3;
  try {
    assert.deepEqual({ ...CALIBRATION_PARAMS }, before);
  } finally {
    DEFAULT_PARAMS.width = restore;
  }
});

test('the stamp carries the version, the params, and a solver identity', () => {
  const stamp = calibrationStamp();
  assert.equal(stamp.version, CALIBRATION_VERSION);
  assert.deepEqual(stamp.params, { ...CALIBRATION_PARAMS });
  assert.match(stamp.solverIdentity, /^[0-9a-f]{64}$/);
});

test('the solver identity is stable across calls and covers engine and bot', () => {
  assert.equal(calibrationIdentity(), calibrationIdentity());
  // A hash over two real files, so it is not the empty-input digest.
  const emptySha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  assert.notEqual(calibrationIdentity(), emptySha256);
});
