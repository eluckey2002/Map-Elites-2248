const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { CALIBRATION_VERSION, CALIBRATION_PARAMS } = require('./calibrations/calib-1');

function calibrationIdentity() {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(path.join(__dirname, 'engine.js')));
  hash.update(fs.readFileSync(path.join(__dirname, 'calibrations', 'calib-1.js')));
  return hash.digest('hex');
}

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
