const fs = require('node:fs');
const path = require('node:path');

function writeJsonOnce(file, artifact) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(artifact, null, 2)}\n`, { flag: 'wx' });
}

function persistBeforeVerdict({ file, artifact, validate = () => {}, evaluate }) {
  if (typeof evaluate !== 'function') throw new TypeError('evaluate must be a function');
  validate(artifact);
  writeJsonOnce(file, artifact);
  return evaluate(artifact);
}

module.exports = { persistBeforeVerdict, writeJsonOnce };
