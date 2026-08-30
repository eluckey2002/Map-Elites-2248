// The frozen ruler used to set level targets.
//
// WHY THIS FILE EXISTS, and why it must not import DEFAULT_PARAMS.
//
// A level's target is a share of the score the bot can reach (`DECISION-0003`).
// That made the target a function of however the bot happened to play on the
// day it was authored, which has three consequences, all of them bad:
//
//   1. Improving the bot silently rewrites what every future target means.
//      "70% demand" measured one thing on 2026-08-17 and another on 2026-08-20.
//   2. Receipts stop verifying. `level-author.js`'s verifier re-runs the
//      measurement and throws if it disagrees with the recorded median. It
//      calls the LIVE bot, so every existing receipt broke the moment the bot
//      changed -- candidate 52 recorded 146,688 and now measures 153,984.
//   3. It is circular. The bot is also the only instrument for judging whether
//      a NEW level is any good. If levels are defined in terms of it, it cannot
//      be a neutral measure of them, and you can never tell whether a level got
//      harder or the ruler got longer.
//
// So the ruler is separated from the player. The values below are a LITERAL
// SNAPSHOT, deliberately not a reference to `DEFAULT_PARAMS`. The live bot is
// free to improve; this does not move with it. Targets set with a given
// calibration version stay valid forever, and the version is recorded in the
// receipt so anyone can tell which ruler produced a number.
//
// TO RE-BASELINE: add a new version below, never edit an existing one. Levels
// authored under an older version keep their targets -- a target is a fixed
// property of a level once shipped, not a live quantity.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// calib-1: the bot as of 2026-08-20, after RESULT-0011's chain-walk tie-break
// and before RESULT-0014's harvest term. Every value is written out rather than
// referenced, on purpose.
//
// EVERY parameter must appear here, including ones set to zero. chooseMove
// resolves `{ ...DEFAULT_PARAMS, ...params }`, so a key omitted here silently
// falls through to whatever the LIVE bot uses -- which is exactly the drift
// this file exists to stop, wearing a disguise. `wHarvest: 0` is not padding:
// it is what pins calib-1 to the bot that actually set the existing targets.
// `calibration.test.js` fails if the two key sets diverge.
const CALIBRATION_VERSION = 'calib-1';
const CALIBRATION_PARAMS = Object.freeze({
  wRoll: 1,
  wPlace: 1,
  turnover: 40,
  width: 24,
  bombMax: 9,
  tieBreak: 'degree',
  wHarvest: 0,
  offerFull: 0,
  pathWidth: 1,
  heavyAfter: 0,
});

// Pinning the parameters is not enough on its own: the same parameters against
// a changed engine or a changed candidate generator still produce different
// numbers. Fully freezing those would mean vendoring a copy of the solver,
// which is a heavier commitment than this is worth. Hashing them instead means
// drift cannot happen SILENTLY -- a receipt carrying a different identity is a
// visible mismatch rather than a number that quietly moved.
function calibrationIdentity() {
  const hash = crypto.createHash('sha256');
  for (const file of ['engine.js', 'bot.js']) {
    hash.update(fs.readFileSync(path.join(__dirname, file)));
  }
  return hash.digest('hex');
}

// What a receipt should carry so a target can be traced to the ruler that set
// it, and so a later re-derivation can say "different ruler" instead of
// "different answer".
function calibrationStamp() {
  return {
    version: CALIBRATION_VERSION,
    params: { ...CALIBRATION_PARAMS },
    solverIdentity: calibrationIdentity(),
  };
}

module.exports = {
  CALIBRATION_VERSION,
  CALIBRATION_PARAMS,
  calibrationIdentity,
  calibrationStamp,
};
