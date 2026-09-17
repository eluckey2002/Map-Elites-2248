#!/usr/bin/env node
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { buildRun, writeRun } = require('../../solver/board-map-elites');
const { requireProtocolOrExit } = require('../../solver/experiment-guard');
const { CONFIG, FINAL_SUBJECT_IDENTITY, RESULT, assertSubject } = require('./subject');

const ROOT = path.resolve(__dirname, '../..');

function main() {
  assertSubject();
  const registration = requireProtocolOrExit(process.argv, { name: RESULT });
  if (registration.exploratory) throw new Error('reportable runner refuses --exploratory');
  const artifact = buildRun(CONFIG, registration, (message) => process.stderr.write(`${message}\n`));
  if (artifact.finalSubjectIdentity !== FINAL_SUBJECT_IDENTITY) throw new Error('run subject identity mismatch');
  const paths = writeRun(artifact, `experiments/${RESULT}/output`);
  const verification = execFileSync(process.execPath, [
    path.join(ROOT, 'solver/verify-board-map-elites.js'), paths.artifactPath, paths.mapPath,
  ], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  process.stdout.write(`WROTE ${path.relative(ROOT, paths.artifactPath)} ${artifact.artifactIdentity}\n`);
  process.stdout.write(verification);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`FAIL: ${error.stack || error.message}\n`); process.exitCode = 1; }
}

module.exports = { main };

