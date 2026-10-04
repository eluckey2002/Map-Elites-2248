---
result: RESULT-0082
status: complete
registered: 2026-10-04T09:26:54.805Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0082/registered-protocol.md: 6de995a072d80b47
  experiments/RESULT-0082/closeout-contract.json: 05aac5a7afe28852
  docs/goals/policy-terms-loop/prepare-resume-registration.js: 33b016859140e850
  docs/goals/policy-terms-loop/advance-resume-reviewed.py: 644b67471a92d7e8
  docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt: 6ca161a44c32b5e3
  docs/goals/policy-terms-loop/BUDGET_AMENDMENT.json: ea7fed778bec3e75
  docs/goals/policy-terms-loop/BUDGET_APPROVAL.txt: ff9c1d429f7ca6c7
  docs/goals/policy-terms-loop/EXPLORATION_PLAN.md: 2cca4f44105f3ae9
  docs/goals/policy-terms-loop/GOAL.txt: eb1ab4968afdc6d7
  docs/goals/policy-terms-loop/RECOVERY_APPROVAL.txt: ce33804554c7c0be
  docs/goals/policy-terms-loop/RECOVERY_PLAN.md: bc97fadad85044d4
  docs/goals/policy-terms-loop/RESUME_GOAL.txt: bbd6913e342d27f1
  docs/goals/policy-terms-loop/RESUME_PLAN.md: 341ceb6acabaa548
  docs/goals/policy-terms-loop/poststop-exception-audits.json: 82a30a8d8467d5d9
  docs/goals/policy-terms-loop/poststop-recompute.js: 44f42fcaf1c391b5
  docs/goals/policy-terms-loop/prepare-resume-confirmation-protocol.js: 55c4c08efcd2f8aa
  docs/goals/policy-terms-loop/recovery-interruption-audits.json: 448353b78967902a
  docs/goals/policy-terms-loop/recovery-result-id-check.json: 81387dc2bea38be4
  docs/goals/policy-terms-loop/recovery-stop-journal.json: 86137b2e1bb9e04c
  docs/goals/policy-terms-loop/resume-result-id-check.json: 3245c276eba68dd7
  docs/goals/policy-terms-loop/verify-poststop-closeout.js: bd467f410805796e
  experiments/RESULT-0080/closure.json: b65e04ac5db1c26f
  experiments/RESULT-0081/closure.json: 82847825c7589a84
  experiments/RESULT-0081/reservation.json: 47362b038f15d1ae
  experiments/SEEDS.md: 0e489768f3306b38
  solver/behavior-descriptors.js: b87820b67b8ea004
  solver/bot.js: 3efd50ce4b4cc8ad
  solver/engine.js: 0ed4b31004df13e3
  solver/experiment-guard.js: 200ad71fad9492a3
  solver/policy-lab/chooser.js: 3a043470c5eeeecc
  solver/policy-lab/decision.js: 1db3eeee3d9752bf
  solver/policy-lab/journaled-pool.js: 9deb9952e3fed0d4
  solver/policy-lab/play.js: 9ae72e532be4034a
  solver/policy-lab/pool.js: 48a2c4019407628c
  solver/policy-lab/proposal-space.js: 113a2723a505f441
  solver/policy-lab/recovery-controls.js: 97c66e61a8f243cd
  solver/policy-lab/recovery-core.js: 5e91e10ac4563969
  solver/policy-lab/registration.js: 9f3ec75e36484b94
  solver/policy-lab/resume-confirmation.js: db6078f08ef426c8
  solver/policy-lab/resume-controls.js: 3a2074b2e1c63521
  solver/policy-lab/resume-core.js: 0ab5a567a4f103ce
  solver/policy-lab/resume-frozen-candidate.js: c475648e8d977820
  solver/policy-lab/resume-pipeline.js: ea1aaf47e774c8ab
  solver/policy-lab/resume-proposal-planning.js: d2fc4e599dc99b89
  solver/policy-lab/resume-proposal-recompute.js: 46366f4d23a2baaf
  solver/policy-lab/resume-proposals.js: e7939aa0846c33b4
  solver/policy-lab/resume-recompute.js: 8dec0f09ce3cb760
  solver/policy-lab/run-controls.js: b37827fafd876e49
  solver/policy-lab/runs/controls-raw.json: deb60ca48b2bbb82
  solver/policy-lab/runs/generation.json: c2b96a5cb8eeb982
  solver/policy-lab/runs/recovery/controls-raw.json: 05b7a71b2a432431
  solver/policy-lab/runs/resume/controls-raw.json: 050865106c6db0e1
  solver/policy-lab/runs/resume/proposals-raw.json: 1172cd49f7cafd33
  solver/policy-lab/settings.js: 7678a525fc7a867e
  solver/policy-lab/worker.js: 681a40646a04950f
  solver/ruler/core.js: fcf02b2a2cdded6b
  solver/ruler/game.js: c87b519c34d735d2
  solver/tests/failedRunLedger.test.js: 01f3aed52f402832
  src/game.js: 3d405595707621ce
  tools/persist-before-verdict.js: 02df81dbcf6264f4
  tools/verify-experiments.js: 27a2cd2b686753cd
---

# Pre-registration — one frozen policy in the all-level target race

**Registered:** 2026-10-04T09:26:54.805Z, before any confirmation game.
**Goal:** docs/goals/policy-terms-loop/RESUME_GOAL.txt, with the owner-approved
RESUME_PLAN.md. Both interrupted RESULT-0080 and RESULT-0081 remain unchanged.

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

Frozen code: solver/policy-lab/resume-frozen-candidate.js, SHA256 c475648e8d9778208f8b92c1fbee16a4fc8a589efbcba239494d30d337a62d3f.
Selected exploration identity P09, fresh block
R4. Its literal policy is:

```json
{
  "kind": "lab",
  "params": {
    "width": 48
  }
}
```

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
  0.4973236097931599 moves at 80% power and 5%
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

- git HEAD 68c0a036, branch codex/latest-main-20261002.
  This is the pre-registration identity retained from tools/new-experiment.js,
  not the temporary template commit that is amended before F. The finalized
  first protocol commit is recorded by experiment-guard.
- Full-suite totals before F: {"tests":672,"pass":668,"fail":3,"skipped":1}; current raw transcript is docs/goals/policy-terms-loop/resume-before-confirmation-tests.txt.
- Exact original deliberate failures:

```text
not ok 526 - candidate-levels-52.json has a receipt that verifies against the current bot
not ok 527 - candidate-levels-54.json has a receipt that verifies against the current bot
not ok 651 - the builder is byte-stable and the committed generated views are current
```

All other tests pass; the existing one skip remains. The only existing-test
edits are the owner's approved RESULT-0080 and RESULT-0081 failed-run inventory additions.

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
2. Carried counters before F: {"controls":30160,"proposals":16240,"jointSearch":4640,"confirmation":0,"replays":1380,"buffer":0}; never reset.
3. Preflight the full17400 games against the reserved20000 confirmation
   allowance and120160 total cap before any one-shot marker or dispatch.
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

## Executable closeout identity

Registered snapshot: registered-protocol.md (6de995a072d80b4782ef82df1dbf8b859d460d48ed65d818da1695f9c137b07e).
Closeout contract: closeout-contract.json (05aac5a7afe288527d09a75446d71fe1b3ff3402743ba863b62a5c46969c1619), committed before F.
Final subject identity is the exact frozen candidate code SHA256 c475648e8d9778208f8b92c1fbee16a4fc8a589efbcba239494d30d337a62d3f.
Required instrument claims C1/C2/C3 govern valid closure; primary FALSIFIED
or INCONCLUSIVE remains a valid CLOSED result, never an instrumentation failure.
