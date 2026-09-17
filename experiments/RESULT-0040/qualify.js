#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { valueIdentity } = require('../../solver/benchmark-inputs');
const { REGISTERED_CHALLENGE_IDENTITY, RESULT, ROOT, fileHash, sourceHashes } = require('./subject');

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 1) throw new Error('usage: qualify.js <new-qualification.json>');
  const destination = path.resolve(ROOT, argv[0]);
  if (fs.existsSync(destination)) throw new Error('refusing to overwrite qualification artifact');
  const test = spawnSync(process.execPath, ['--test', 'experiments/RESULT-0040/run.test.js'], {
    cwd: ROOT, encoding: 'utf8', timeout: 120000,
  });
  process.stdout.write(test.stdout);
  process.stderr.write(test.stderr);
  if (test.status !== 0) throw new Error(`qualification tests exited ${test.status}`);
  const body = {
    schemaVersion: 1, result: RESULT, verdict: 'PASS', attempt: 1,
    challengeIdentity: REGISTERED_CHALLENGE_IDENTITY,
    captureManifestIdentity: fileHash('experiments/RESULT-0040/captures.json'),
    sources: sourceHashes(),
    calibration: {
      command: 'node --test experiments/RESULT-0040/run.test.js', exitCode: test.status,
      knownGood: 'PASS through public report-file CLI',
      plantedDefect: 'confirmed on disk; FAIL comparison mismatch through the same CLI',
      coherentSubstitution: 'FAIL against externally supplied registered challenge identity',
      boundedMiss: 'inherited process-deadline UNKNOWN control in solver/tests/oracle.test.js',
    },
  };
  const qualification = { ...body, qualificationIdentity: valueIdentity(body) };
  fs.writeFileSync(destination, `${JSON.stringify(qualification, null, 2)}\n`, { flag: 'wx' });
  process.stdout.write(`QUALIFICATION PASS ${qualification.qualificationIdentity}\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
}
