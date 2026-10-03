'use strict';
// Reporting only: never plays a game, assigns a verdict, or edits evidence.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = file => fs.existsSync(path.join(ROOT, file));
function show(label, file) {
  console.log(`\n${label}\n$ cat ${file}`);
  if (exists(file)) process.stdout.write(read(file));
  else console.log('UNVERIFIED_NOT_RUN');
}
show('1. ORIGINAL START STATE', 'docs/goals/policy-terms-loop/start-output.txt');
show('1. RECOVERY ID COLLISION CHECK', 'docs/goals/policy-terms-loop/recovery-result-id-check.json');
show('1. CURRENT PRE-GAME FULL TEST SUITE', 'docs/goals/policy-terms-loop/recovery-baseline-tests.txt');
show('1. SEED DECLARATIONS', 'experiments/SEEDS.md');
show('2. HISTORICAL NOISE TABLE', 'solver/policy-lab/runs/noise-output.txt');
console.log('Adding seeds does not shrink the level-axis error. Historical detectable gain is conditional on champion/base variance.');
show('3. HISTORICAL GENERATION DIAGNOSIS', 'solver/policy-lab/runs/generation-output.txt');
show('3. ALL-SESSION DIAGNOSTIC SCOPE AND LIMITATION', 'docs/goals/policy-terms-loop/CORPUS_SCOPE.md');
console.log('\n4. ORIGINAL AND RECOVERY REGISTRATION COMMITS');
for (const file of ['EXPLORATION_PLAN.md', 'RECOVERY_PLAN.md']) {
  const registered = `docs/goals/policy-terms-loop/${file}`;
  console.log(`$ git log --diff-filter=A --format=%H -- ${registered}`);
  process.stdout.write(execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', registered], {cwd: ROOT, encoding: 'utf8'}));
}
show('4. EXACT OWNER RECOVERY AUTHORIZATION', 'docs/goals/policy-terms-loop/RECOVERY_APPROVAL.txt');
show('4. FROZEN RECOVERY REGISTRATION', 'docs/goals/policy-terms-loop/RECOVERY_PLAN.md');
const controls = 'solver/policy-lab/runs/recovery/controls-raw.json';
console.log('\n5. CARRIED PARITY, INERT, CONTROL ROWS AND AGGREGATE');
console.log(`$ node - read ${controls}`);
if (exists(controls)) {
  const raw = JSON.parse(read(controls));
  for (const key of ['result', 'registration', 'status', 'parity', 'inert', 'excludedOriginalPanels', 'counts', 'headlines', 'error'])
    if (Object.hasOwn(raw, key)) console.log(key.toUpperCase(), JSON.stringify(raw[key]));
  for (const row of raw.headlines.controls) {
    const negate = value => value === null ? null : -value;
    const loss = summary => ({meanMovesLost: negate(summary.meanMovesSaved),
      lostCi95: [negate(summary.moveCi95[1]), negate(summary.moveCi95[0])],
      detected: summary.moveCi95[1] !== null && summary.moveCi95[1] < 0});
    console.log('MEASURED_HANDICAP_LOSS', JSON.stringify({block: row.block, every10: loss(row.mild), every5: loss(row.strong)}));
  }
} else console.log('UNVERIFIED_NOT_RUN');
show('5. JOURNALED CONTROLLER RAW OUTPUT', 'solver/policy-lab/runs/recovery-controls.log');
show('6-9. PROPOSAL, JOINT-SEARCH AND CANDIDATE-FREEZE OUTPUT', 'solver/policy-lab/runs/recovery/proposals-output.txt');
show('7. PROPOSAL LOG', 'solver/policy-lab/runs/proposals.csv');
console.log('G CPU reference includes the carried inert qualification callbacks. Gate CPU ratios are physical instrumented totals, not pure policy overhead. Fresh R, S and F references have no inert qualification callbacks; CPU and wall time are reported separately.');
show('10-11. CONDITIONAL ONE-SHOT CONFIRMATION OUTPUT', 'docs/goals/policy-terms-loop/recovery-confirmation-output.txt');
show('INDEPENDENT HISTORICAL ARITHMETIC', 'solver/policy-lab/runs/recompute-output.txt');
show('12. INDEPENDENT RECOVERY ARITHMETIC, COVERAGE AND DISJOINTNESS', 'docs/goals/policy-terms-loop/recovery-recompute-output.txt');
show('12. INDEPENDENT PROPOSAL ARITHMETIC, COVERAGE AND DISJOINTNESS', 'docs/goals/policy-terms-loop/recovery-proposal-recompute-output.txt');
show('11-12. INDEPENDENT CONFIRMATION ARITHMETIC AND COVERAGE', 'docs/goals/policy-terms-loop/recovery-confirmation-recompute-output.txt');
console.log('Independent re-implementation by the same author checks arithmetic and transcription only; independent scientific verification and acceptance remain separate.');
show('RECOVERY CLOSURE RECEIPT', 'experiments/RESULT-0081/closure.json');
show('OBSERVED EXECUTION INTERRUPTION', 'docs/goals/policy-terms-loop/recovery-transport-observation.json');
show('INDEPENDENT PARTIAL-JOURNAL AUDIT', 'docs/goals/policy-terms-loop/recovery-interruption-output.txt');
show('COMMITTED FAILED-RECEIPT AUDIT IDENTITIES', 'docs/goals/policy-terms-loop/recovery-interruption-audits.json');
show('FINAL FULL TEST SUITE', 'docs/goals/policy-terms-loop/recovery-final-tests.txt');
show('COMMITTED CLOSEOUT AUDIT IDENTITIES', 'docs/goals/policy-terms-loop/recovery-closeout-audits.json');
show('CLOSE-OUT RAW OUTPUT', 'docs/goals/policy-terms-loop/recovery-closeout-output.txt');
show('PUBLICATION AND ACTUAL REVIEW RECEIPT', 'docs/goals/policy-terms-loop/recovery-publication-output.txt');
console.log('The original RESULT-0080 failed closure is retained unchanged. No policy is adopted and this report does not authorize a merge.');
