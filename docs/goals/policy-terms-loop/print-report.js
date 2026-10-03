'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { completionProblems } = require('../../../solver/policy-lab/completion');
const ROOT = path.resolve(__dirname, '../../..');
function show(label, file) {
  console.log(`\n${label}\n$ cat ${file}`);
  if (fs.existsSync(path.join(ROOT, file))) process.stdout.write(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  else console.log('UNVERIFIED_NOT_RUN');
}
show('1. START STATE', 'docs/goals/policy-terms-loop/start-output.txt');
show('2. HISTORICAL NOISE TABLE', 'solver/policy-lab/runs/noise-output.txt');
show('3. GENERATION CHECK', 'solver/policy-lab/runs/generation-output.txt');
console.log('\n4. EXPLORATION PLAN REGISTRATION');
console.log('$ git log --diff-filter=A --format=%H -- docs/goals/policy-terms-loop/EXPLORATION_PLAN.md');
process.stdout.write(execFileSync('git', ['log', '--diff-filter=A', '--format=%H', '--', 'docs/goals/policy-terms-loop/EXPLORATION_PLAN.md'], { cwd: ROOT, encoding: 'utf8' }));
show('5. CONTROLS', 'solver/policy-lab/runs/controls-output.txt');
show('5d. MEASURED HANDICAP LOSS', 'solver/policy-lab/runs/control-table-output.txt');
show('CONTROL COMPLETENESS FENCE', 'solver/policy-lab/runs/completion-output.txt');
const rawFile = path.join(ROOT, 'solver/policy-lab/runs/controls-raw.json');
const raw = fs.existsSync(rawFile) ? JSON.parse(fs.readFileSync(rawFile, 'utf8')) : null;
const complete = raw && completionProblems(raw).length === 0;
if (raw?.headlines.path === 'C' && complete) {
  console.log('\nCLOSURE PATH C: CONTROL FAILURE');
  console.log('No idea was judged. Items 1-4 and the failing controls are retained above.');
  console.log('6-11 UNVERIFIED_NOT_RUN: stopped at the owner-declared control boundary.');
} else {
  const closure = path.join(ROOT, 'experiments/RESULT-0080/closure.json');
  if (fs.existsSync(closure)) {
    show('RETAINED INTERRUPTION CLOSURE', 'experiments/RESULT-0080/closure.json');
    console.log('No Path A-D completed; no effort bound was exhausted. Stopped under the rule: if an item cannot be met, stop and report it.');
    console.log('No idea was judged. Items 1-4, parity and inert are met; aggregate controls and items 6-11 UNVERIFIED_NOT_RUN.');
    show('PROCESS STATE AFTER CONNECTION LOSS', 'docs/goals/policy-terms-loop/process-stop-output.txt');
    show('EXEC TOOL TRANSPORT OBSERVATION', 'docs/goals/policy-terms-loop/transport-observation.json');
  } else console.log('\nEXPERIMENT CLOSURE UNVERIFIED_IN_PROGRESS');
}
show('INDEPENDENT ARITHMETIC RE-IMPLEMENTATION', 'solver/policy-lab/runs/recompute-output.txt');
show('12. COVERAGE AND DISJOINTNESS', 'solver/policy-lab/runs/coverage-output.txt');
show('CLOSE-OUT', 'docs/goals/policy-terms-loop/closeout-output.txt');
show('PUBLICATION', 'docs/goals/policy-terms-loop/publication-output.txt');
