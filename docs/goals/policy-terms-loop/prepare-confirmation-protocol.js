'use strict';
// Render a conditional protocol only after actual candidate selection. No games,
// registrations or writes; tools/new-experiment.js still performs registration.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../../..');
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const json=f=>JSON.parse(read(f));
const sha=f=>crypto.createHash('sha256').update(read(f)).digest('hex');
function startingState(template) {
  const line=/^- git HEAD [0-9a-f]{7,40}, branch [^\n]+\.$/m.exec(template)?.[0];
  if(!line)throw new Error('pre-registration starting identity absent from generated template');
  return line;
}
function render() {
  const plan='docs/goals/policy-terms-loop/RECOVERY_PLAN.md';
  const config=JSON.parse(/```json\n([\s\S]*?)\n```/.exec(read(plan))[1]);
  const control=json('solver/policy-lab/runs/recovery/controls-raw.json');
  const phase=json('solver/policy-lab/runs/recovery/proposals-raw.json');
  if(control.status!=='CONTROLS_COMPLETE'||control.headlines.path!=='CONTROLS_PASSED'
    ||phase.status!=='EXPLORATION_COMPLETE'||phase.path!=='CONFIRMATION_REGISTRATION_PENDING'||!phase.selected)throw new Error('actual qualified selected candidate required');
  const candidate='solver/policy-lab/frozen-candidate.js';
  const code=read(candidate),literal=/^(?:'use strict';\n)?module\.exports = ([\s\S]*);\n$/.exec(code);
  if(!literal||JSON.stringify(JSON.parse(literal[1]))!==JSON.stringify(phase.selected.policy))throw new Error('selected literal candidate required');
  const protocol=`experiments/${config.result}/protocol.md`;
  const registered=/^registered: (.*)$/m.exec(read(protocol))?.[1];
  if(!registered)throw new Error('tools/new-experiment.js registration required before rendering');
  const files=[...new Set([...Object.keys(config.harnessFreeze),...Object.keys(config.carryForward.sourceHashes),
    ...Object.keys(phase.sourceHashes),plan,'experiments/SEEDS.md',candidate,
    'solver/policy-lab/run-confirmation.js','solver/policy-lab/proposal-recompute.js',
    'solver/experiment-guard.js','tools/verify-experiments.js','tools/persist-before-verdict.js',
    'solver/policy-lab/runs/recovery/proposals-raw.json'])].sort();
  const freeze=files.map(f=>`  ${f}: ${sha(f).slice(0,16)}`).join('\n');
  const startingLine=startingState(read(protocol));
  const suite=read('docs/goals/policy-terms-loop/recovery-final-tests.txt');
  const totals=suite.split('\n').filter(l=>/^# (tests|pass|fail|skipped) /.test(l)).join('; ');
  const failures=suite.split('\n').filter(l=>/^not ok /.test(l)).join('\n');
  return `---
result: ${config.result}
status: registered
registered: ${registered}
supersedes: null
reportable: confirmation
version_freeze:
${freeze}
---

# Pre-registration — one frozen policy in the all-level target race

**Registered:** ${registered}, before any confirmation game.
**Goal:** docs/goals/policy-terms-loop/GOAL.txt, with the owner-approved
RECOVERY_PLAN.md. The original interrupted RESULT-0080 remains unchanged.

## Question

Does the selected policy reduce moves to target among mutual wins without
reducing the number of wins against the champion on this all-58-level panel?

## Why this is being asked

The explicit owner goal requests one confirmation after bounded exploration.
The historical diagnostic and exploration are selection data outside
experiments/, not confirmation evidence or a population claim. The original
diagnostic includes ordinary replayed captures under the all-session request;
CORPUS_SCOPE.md documents that scope limitation. RESULT-0049 identifies the
current champion; RESULT-0058 supplies the unchanged paired ruler.

## Shape of the run

One candidate, one fixed paired confirmation, no pilot and no retuning.
All 58 shipped levels, four worker threads at most. The goal's existing
budgets, consumed charges, stop rules and protected inputs remain fixed.

## The change under test

Frozen code: ${candidate}, SHA256 ${sha(candidate)}.
Selected exploration identity ${phase.selected.id}, fresh block
${phase.selected.recheckBlock}. Its literal policy is:

\`\`\`json
${JSON.stringify(phase.selected.policy,null,2)}
\`\`\`

## Denominator

58 levels x 150 seeds = 8700 games per arm, 8700 paired cells and 17400
confirmation games. Both arms use identical level definitions and seeds.
Every game stops at target, blocker failure, no moves or its shipped budget.
Speed is champion moves minus candidate moves only among mutual wins.
Wins gained and lost include all 8700 cells. No loss-adjusted replacement.

## Sample size and margin

- **Per verdict:** the all-58-level 8700-pair panel. Reuse unchanged ruler
  summarizePairs/twoAxis: SE=max(level-axis SE, seed-axis SE), 95% interval
  mean +/-1.96 SE. Historical and zero-control power calculations are
  conditional on those contrasts, not a guarantee for this new candidate.
  The 580-cell exploration detectable gain is
  ${control.headlines.bars.reportedDetectableGain} moves at 80% power and 5%
  significance; adding seeds cannot shrink the level-axis error. Confirmation
  reports both observed axes; its actual interval governs.
- **Margin:** SUPPORTED needs net wins >=0 and speed lower interval >0.
  A net-win decrease of netWins+1 would break the win guard; if netWins=0,
  one extra regressed win is enough. Speed headroom is the observed lower
  endpoint; an endpoint exactly zero is insufficient. Report the measured
  margin without post-hoc threshold changes.
- **Downstream quantity:** all-level reliability and speed jointly govern.
  Secondary and per-level results cannot override the primary outcome.

## Seeds

- **Pilot:** none; no new pilot games.
- **Confirmation:** 60100000-60100149, fixed F, 150 seeds per level.

F was reserved in SEEDS.md and the original plan. It is disjoint from G,
S, all twelve retained controls, replaced burned old C3 and all one-use
R1-R11. No exploration seed is confirmation evidence. No other F is allowed.

## Starting state, recorded independently

${startingLine}
  This is the pre-registration identity retained from tools/new-experiment.js,
  not the temporary template commit that is amended before F. The finalized
  first protocol commit is recorded by experiment-guard.
- Full-suite totals before F: ${totals}.
- Exact original deliberate failures:

\`\`\`text
${failures}
\`\`\`

All other tests pass; the existing one skip remains. The only existing-test
edit is the owner's approved RESULT-0080 failed-run inventory addition.

## Version hashes (sha256, first 16)

The complete frontmatter pins the candidate, unchanged measurements,
threshold/seed registration, completed selection inputs, executable
independent audits and guard. Frozen input drift prevents dispatch.

## Checks, classified before outcomes are assigned

### C1 — negative control (PASS / FAIL)

Require inherited trace parity 200/200 in each champion/base/variant arm and
7858/7858 inert ordered choices, with immutable source identities. These
qualification cells are diagnostic, not F evidence. All weights at zero use
the unchanged champion generator and target-aware finish.

### C2 — positive control, run BEFORE confirmation (PASS / FAIL)

Require all twelve complete disjoint control blocks independently audited:
zero accepts <=1/12 and the every-fifth-move handicap detected >=10/12.
The two planted handicaps differ from the champion by a prescribed candidate
choice. Twelve blocks catch only roughly17% false accepts: a sanity check,
not calibration. No failing control can be bypassed to reach F.

### C3 — suite unchanged (PASS / FAIL)

The full suite must have exactly the original three named failures and one
skip, with the permitted inventory addition and no other existing-test edit.

### P1 — primary empirical prediction

- SUPPORTED: net wins >=0, mean moves saved >0, lower 95% speed endpoint >0.
- FALSIFIED: net wins <0 or upper 95% speed endpoint <0.
- INCONCLUSIVE: every other result, including unavailable intervals.

The primary denominator is all58 levels. Pre-declared secondary reports:
levels56-58 together, levels1-55 together, and each level separately.
One-level two-axis intervals are unavailable and remain null; descriptive
per-level speed/win numbers cannot override the all-level verdict.

### P2 — guard against a worse system that scores better

Print wins gained, wins lost, net wins and mutual-win denominator. Any
negative net wins makes the primary FALSIFIED regardless of speed.

### P3 — is the gain just more compute?

Print physical worker CPU and wall seconds per arm, their ratios and CPU per
game. Both F references run normally, without G's inert instrumentation.
This is not a compute-matched control. A speed gain with more compute remains
an empirical result under the declared bars, not a claim of equal-cost gain.

## Budget and stopping rules

1. C1/C2 and complete independent exploration audits qualify before F.
2. Carried counters before F: ${JSON.stringify(phase.counts)}; never reset.
3. Preflight the full17400 games against the reserved20000 confirmation
   allowance and120000 total cap before any one-shot marker or dispatch.
4. One confirmation run. No re-runs on different seeds or after interruption.
5. Four workers maximum; journals persist ten-seed job results before promise
   completion. Charge each8700-game arm before dispatch. Persist all8700 raw
   pairs through persist-before-verdict before computing any verdict.
6. Missing cells, recording reads in measurement, identity drift or execution
   failure stop UNVERIFIED/INVALID with actual failure-ledger prevention.
   Operational Blackboard telemetry failure warns and cannot invalidate a
   durably retained scientific job. Original effort bounds remain in force.

## Instrument bound

The all-level paired primary outcome is load-bearing. Selection, historical
diagnostics, secondary and individual-level summaries are diagnostic.
Node-builtin-only proposal-recompute.js --confirmation re-implements the
arithmetic and verifies sources, coverage, disjointness and journals; its
--json output binds the executable closeout receipt. Same-author arithmetic
checks are not independent scientific verification. No checked_by is set.

## Adoption is a separate decision

The result stays provisional, including SUPPORTED. No merge, policy adoption,
scientific self-acceptance or shipped rule/target change is authorized.
`;
}
if(require.main===module){try{process.stdout.write(render());}catch(error){console.error(error.stack);process.exitCode=1;}}
module.exports={render,startingState};
