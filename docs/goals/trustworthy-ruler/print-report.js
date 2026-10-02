#!/usr/bin/env node
'use strict';

// Display retained command output. This file does not calculate policy fitness.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../..');
const result = 'experiments/RESULT-0058';
const registrationCommit = '577163495b0e5bde2c34c6e7a59ed1189a44bb8e';
let missing = false;

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trimEnd();
}

function captured(command, file, select = (text) => text.trimEnd()) {
  console.log('\n$ ' + command);
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    console.log('UNVERIFIED: saved output is missing: ' + file);
    missing = true;
    return;
  }
  console.log(select(fs.readFileSync(absolute, 'utf8')));
}

function testSummary(text) {
  const lines = text.split(/\r?\n/).filter((line) =>
    /^✖ (?!failing tests:)/u.test(line) || /^ℹ /u.test(line)
    || /^not ok /u.test(line) || /^# (?:tests|pass|fail|skipped|duration_ms) /u.test(line)
    || /frozen roles still win their declared 512-seed population selection/u.test(line));
  return [...new Set(lines)].join('\n');
}

function section(text, heading) {
  const start = text.indexOf(heading + '\n');
  if (start < 0) throw new Error('frozen protocol section missing: ' + heading);
  const end = text.indexOf('\n## ', start + heading.length);
  return text.slice(start, end < 0 ? undefined : end).trimEnd();
}

const protocol = git(['show', registrationCommit + ':' + result + '/protocol.md']);
console.log('1. START STATE — recorded before measurement in the committed protocol');
console.log(section(protocol, '## Starting state'));
captured('node --test solver/tests/*.test.js (baseline; failure names and totals)',
  'docs/goals/trustworthy-ruler/baseline-output.txt', testSummary);
console.log('\n$ git show ' + registrationCommit + ':experiments/SEEDS.md (range rows)');
console.log(git(['show', registrationCommit + ':experiments/SEEDS.md'])
  .split(/\r?\n/).filter((line) => line.startsWith('|')).join('\n'));

console.log('\n2. PREREGISTRATION');
captured('git show registration commit; Get-Process measured-run start time',
  result + '/registration-output.txt');
console.log('$ git show -s --format=%H%n%cI%n%s ' + registrationCommit);
console.log(git(['show', '-s', '--format=%H%n%cI%n%s', registrationCommit]));
console.log(section(protocol, '## Seed blocks and maximum cost'));
console.log(section(protocol, '## Subject, units, and estimand'));
console.log(section(protocol, '## Frozen stage and archive decisions'));
console.log(section(protocol, '## Checks and exact oracles'));
console.log(section(protocol, '## Domain outcomes after controls pass'));

console.log('\n3, 4, 5, 7, 8, 9. ONE-SHOT CONTROLS, DIAGNOSTICS AND MAP RUN');
captured('node solver/ruler/run.js --protocol RESULT-0058', result + '/run-output.txt', (text) => {
  if (!/^RESULT RESULT-0058 raw_games=/m.test(text)) {
    missing = true;
    return text.trimEnd() + '\nUNVERIFIED: the one-shot report is not complete.';
  }
  return text.trimEnd();
});
captured('node docs/goals/trustworthy-ruler/print-timing.js ' + result + '/raw-games.json',
  result + '/timing-output.txt');
captured('node docs/goals/trustworthy-ruler/print-winner-curse.js ' + result + '/raw-games.json',
  result + '/winner-curse-output.txt');
console.log('\n6. SYNTHETIC ADMISSION — actual test names');
captured('node --test solver/tests/ruler.test.js', result + '/admission-output.txt');
console.log('\n10. INDEPENDENT RECOMPUTE');
captured('node solver/ruler/recompute.js ' + result + '/raw-games.json',
  result + '/recompute-output.txt');
captured('node solver/ruler/recompute.js ' + result + '/raw-games.json (reviewed audit; control win axes shown)',
  result + '/recompute-reviewed-output.txt', (text) => text.split(/\r?\n/)
    .filter((line) => !/^RECOMPUTE WIN_AXIS /u.test(line)
      || /^RECOMPUTE WIN_AXIS (?:null|positive3000|bad72) /u.test(line)).join('\n').trimEnd());
captured('node solver/ruler/compare-supplement.js', result + '/full-summary-match-output.txt');
captured('node --test solver/tests/ruler-review.test.js', result + '/review-regression-output.txt');
captured('node solver/ruler/recompute-legacy.js ' + result + '/raw-games.json .orch/policy-search-02.cells.json',
  result + '/legacy-recompute-output.txt');
captured('node --test solver/tests/rulerHoldoutBoundary.test.js (expected negative before repair)',
  result + '/boundary-before-output.txt');
captured('node --test solver/tests/rulerHoldoutBoundary.test.js (after unrounded-t repair)',
  result + '/boundary-after-output.txt');
captured('sealed artifact and frozen-source checks before repair', result + '/seal-output.txt');
console.log('\nCLOSE-OUT');
captured('node --test solver/tests/*.test.js (close-out; failure names and totals)',
  'docs/goals/trustworthy-ruler/closeout-tests.txt', testSummary);
captured('node --test solver/tests/*.test.js (reviewed close-out; failure names and totals)',
  'docs/goals/trustworthy-ruler/reviewed-closeout-tests.txt', testSummary);
captured('close-out repository and experiment checks', result + '/closeout-output.txt');
captured('reviewed close-out repository and experiment checks', result + '/reviewed-closeout-output.txt');
console.log('\n$ node docs/goals/trustworthy-ruler/print-publication.js (live, read-only)');
try {
  console.log(execFileSync(process.execPath, [path.join(__dirname, 'print-publication.js')],
    { cwd: root, encoding: 'utf8' }).trimEnd());
} catch (error) {
  console.log('UNVERIFIED: live pull-request evidence unavailable: ' + error.message);
  missing = true;
}

if (missing) process.exitCode = 1;
