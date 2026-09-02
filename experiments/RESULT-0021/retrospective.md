# RESULT-0021 delivery retrospective

Status: retrospective complete; prevention mechanisms remain proposals until the owner accepts them.

Scope: the delivery from `1b40d80` through `68e8bee`, which reconstructed the seed-variance claim, measured within-level versus between-candidate variation, and recorded the verdict on repeated human play.

Evidence used:

- Git range `1b40d80^..68e8bee` for the delivery footprint.
- `.orch/friction/2026-09.jsonl`, entries 23–40, for observed reruns and workflow failures.
- The committed RESULT-0021 protocol, measurement, challenge bundle, report, admission, tests, tickets, and worklogs.

## Retrospective 1 — How to avoid repeating the hour-and-token-heavy run

The main failure was not slow computation. The owner asked to create a goal, and the session continued into delivery. The correct terminal behavior was: create the persistent goal, return its identity, and stop unless the same request explicitly authorized execution.

The expensive empirical step itself ran once: 53 candidates × 2 disjoint samples × 60 games = 6,360 games. Most repetition came from implementing and repairing newly invented assurance machinery, rerunning gates in the wrong sequence, and working around sandbox or worktree constraints. The session logged 18 friction events for this delivery.

The full suite was invoked five times: baseline; a sandbox-contaminated run; an escalated rerun; a terminal run before refreshing the Universe Map; and the final run after refresh. Only the baseline and final terminal run belonged in the ideal path. Focused tests should have carried the intermediate implementation cycle.

The prevention strategy is therefore procedural and architectural:

1. Make goal creation terminal. `create_goal` means stop after returning the goal identity unless execution is authorized in the same owner message.
2. Freeze the challenge receipt before implementing a new decision check. Name the exact claim, real subject identity, exercised seam, valid PASS, controlled broken-twin FAIL through the same verifier, downstream consumer, and identity-change invalidation.
3. Freeze the statistical scale before coding. State the estimand, unit of analysis, aggregation, formula, and one hand-computable fixture. This would have caught the comparison between variance of sample means and single-game variance before implementation.
4. Preserve the producer path in the acceptance test. The first entitlement correction accidentally blocked ordinary batch generation; the gate needed to cover both unselected production and protected downstream selection.
5. Use one experiment finalizer. It should verify the canonical receipt, refresh derived views, run experiment and Universe checks, then run the terminal suite with the required permissions. Raw logs can be retained while the console reports only the short failure delta.
6. Run the broad suite twice: once for the baseline and once at the terminal revision. Use focused tests between them unless a change touches a broader boundary.

## Retrospective 2 — Was every task necessary, and could rigor be cheaper?

No. The evidentiary objective required real rigor, but the delivery architecture became substantially more complex than the claim required.

The delivery footprint was 13 commits across 20 changed files: 140,562 insertions and 20 deletions. The challenge bundle contributed 92,597 lines and the measurement contributed 45,645 lines; together they account for 138,242 lines, or about 98.35% of all insertions. The challenge bundle stores two complete 6,360-row artifacts for the valid subject and broken twin.

Eight orchestration documents added another 743 lines: a composition, two specs, two worklogs, and three tickets. The core production and focused-test changes added 1,038 lines (`solver/seed-variance.js`, `solver/tests/seedVariance.test.js`, and insertions in `solver/generate-levels.js`), while protocol, report, verifier, and admission artifacts added a further 517 lines.

The following rigor was load-bearing once execution was authorized:

- Locate the historical claim and distinguish reconstruction from fresh evidence.
- Predeclare the statistic, samples, thresholds, and decision rule.
- Run the real 53-level, 6,360-game measurement once.
- Apply the same decision check to a valid real subject and a controlled broken twin.
- Prove that the actual downstream selector consumed the verdict.
- Invalidate acceptance when a covered source identity changes.
- Preserve an immutable receipt and admit the result without changing its proof class.
- Obtain one independent challenge review and one terminal suite result.

The following work was avoidable or overbuilt:

- Entering delivery at all during a goal-creation request.
- Building a bespoke `committedProtocol` lifecycle instead of first reusing the repository's experiment-registration guard.
- Splitting the evidence across measurement, entitlements, challenge receipt, challenge bundle, and admission when one compact measurement plus one manifest-style challenge receipt could carry the same decision authority.
- Embedding two full row-heavy artifacts in the bundle. A broken twin could reference the valid artifact plus a deterministic mutation specification and expected derived identity.
- Pretty-printing large row arrays where a compact matrix or JSON Lines artifact would be smaller and streamable.
- Adding `verify.js` to repair a self-invalidating CLI design. Post-commit verification and immutable preregistration identity should have been designed together before the first artifact format was frozen.
- Repeating broad-suite runs while focused checks were sufficient.
- Spreading closure across multiple orchestration and evidence commits. Once delivery began, much of this was required by the active process rules; the avoidable decision was entering that delivery path without authorization.

A lean design would use one immutable compact measurement artifact, one manifest-style challenge receipt that references it and declares a deterministic broken transform, the existing experiment guard, one pure statistics/check module with a hand-computable fixture, one consumer integration test that preserves the generator path, one independent review, one real measurement run, and one finalizer. That likely compresses the work to roughly four or five commits while retaining the six decisive propositions: artifact identity, same-check valid/broken behavior, protocol-before-data ordering, downstream consumption, source-drift invalidation, and validated mathematics.

## Triage

| Incident | Slip/Mistake | Existing rule that failed to fire (or "none") | Placement artifact | Tier | Patch |
|---|---|---|---|---|---|
| Delivery continued after the owner asked only to create the goal. | Mistake | `shape-goal` already separates creation from delivery, but no terminal stop was enforced. | `shape-goal` instruction | Control | After `create_goal`, return the identity and stop unless the same owner message explicitly says execute, run, or deliver. |
| A bespoke protocol/commit lifecycle was designed before testing reuse of the existing experiment guard. | Mistake | Existing preregistration and immutable-identity conventions failed to constrain the new design. | New-check design preflight | Design-out | Require an explicit reuse-or-reject decision for existing gates before adding another lifecycle. |
| The evidence model expanded to five related layers and duplicated two full measurement artifacts. | Mistake | None. | Challenge-receipt schema | Design-out | Prefer one compact artifact plus one manifest whose broken twin is a deterministic transform reference. |
| The first statistic compared quantities on different scales. | Mistake | The protocol named metrics but did not require a units/estimand fixture. | Experiment protocol preflight | Warning + script | Require unit of analysis, aggregation level, formula, and a hand-computable fixture before implementation. |
| Entitlement enforcement briefly broke ordinary batch generation. | Slip | Regression coverage existed but did not initially cover producer and consumer paths together. | Consumer integration acceptance | Script | Test that generation remains available and that only downstream selection consumes the entitlement. |
| The first receipt design invalidated itself after documentation commits and protocol status edits. | Mistake | Existing immutable-receipt lessons failed to fire during schema design. | Challenge lifecycle fixture | Script | Test protocol-before-data, post-commit verification, documentation-only commits, and completion recording before real execution. |
| The broad suite ran repeatedly and produced long sandbox-related failure output. | Slip | None enforced a baseline/focused/terminal sequence. | Experiment runner | Script | Permit one baseline and one terminal broad run; retain full logs but print a concise failure delta. |
| Ledger admission left the derived Universe Map stale until another run exposed it. | Slip | The existing Universe verifier fired only after admission was committed. | Admission finalizer | Script | Refresh derived views before the single terminal suite and refuse admission closure if they differ. |

## Patches

These are proposals, not changes made by this retrospective.

### P1. Terminal goal creation

Add one permanent rule to `shape-goal`: after a successful `create_goal`, return the goal identity and stop. Execution requires explicit authorization in that same owner message or a later message. This directly prevents the largest scope and cost error in this run.

### P2. New-check challenge preflight

Before implementing any new or modified decision check, require a tiny frozen fixture containing the real-subject shape, a controlled broken twin, the named downstream consumer, and one covered-identity mutation. The same verifier must PASS the valid fixture, FAIL the broken fixture, and invalidate the mutation.

### P3. Statistical-design preflight

Before a measurement implementation is accepted, require the estimand, units, aggregation level, formula, and a hand-computable example with expected output. This is a focused guard against scale mismatches, not a general statistics framework.

### P4. Experiment finalizer and suite budget

Provide one repo-local finalizer that verifies receipts, refreshes derived views, runs experiment-specific gates, and then runs the broad suite at the terminal revision. Intermediate changes use focused tests. The finalizer stores raw output and reports the failure delta against the baseline.

### Mechanism pricing and off-ramps

| Proposal | Fires when | Cost | Start mode | Crafted failure | Review or removal signal |
|---|---|---|---|---|---|
| P1 terminal goal creation | Every successful goal creation | One control-flow branch; negligible runtime | Permanent control | A fixture request saying only “create this goal” must terminate without dispatch or repository mutation | No removal; this preserves the authorization boundary |
| P2 challenge preflight | A new or modified check claims authority over a decision | Tiny fixture run, target under 2 seconds | WARN for the next qualifying check, then HARD after one accepted real example | Corrupt the subject identity or expected verdict and require the same verifier to fail | After 10 qualifying runs with no distinct failure caught, emit `REVIEW_UNUSED_GUARD` for owner review rather than silently retaining it |
| P3 statistical preflight | A protocol compares groups, seeds, samples, or estimated variation | One formula fixture, target under 1 second | WARN until RESULT-0022, then owner decides whether to harden | Supply a fixture whose sample-mean variance and single-observation variance differ by a known factor | After 10 applicable protocols with no discrepancy caught, emit `REVIEW_STATS_PREFLIGHT`; keep, simplify, or remove by explicit decision |
| P4 finalizer and suite budget | Once per experiment admission | One terminal broad suite instead of repeated suites; derived refresh cost | WARN on the next admission, then evaluate | Leave a derived view stale and require finalization to refuse closure | After 10 admissions, compare caught defects and runtime; emit `REVIEW_FINALIZER` if it caught none or exceeded the declared cost budget |

## Do not extract

- Do not treat worktree isolation as waste. It was the correct response to an occupied root checkout and protected both writers.
- Do not turn `apply_patch`, process-list permissions, or linked-worktree index-lock behavior into project design rules. They are environment/tooling observations.
- Do not rerun the 6,360-game measurement merely to improve packaging. The committed run completed once and should remain the source artifact unless its covered identity or protocol is intentionally replaced.
- Do not broaden this retrospective into repairs for pre-existing baseline failures or unrelated root `.orch` state.
- Do not weaken the challenge receipt's substantive standard. Reduce representation and sequencing cost while retaining real-subject inspection, same-check broken-twin failure, downstream consumption, and automatic identity invalidation.
