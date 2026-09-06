---
id: VERIFY-002
run: 2026-09-05-policy-measurement-extra-repair
status: claimed
executor: orch-verify
profile: orch-planner
depends_on: []
write_scope: []
bound: 12 minutes
claimed_by: /root/extra_repair_review_gpt_5_6_sol_ultra
claimed_at: 2026-09-06T02:39:00Z
---

## Objective

Independently decide whether the one authorized extra repair closes the
remaining measurement defect at c61d443 without hiding unresolved evidence.

## Fixed inputs

Exact source c61d4430c08fd4e47c9b25bb9885b6b585becd95; repair baseline
236b03f2af0f12f105e7ffb52ba36b4c0b39ad73. Root foreground tree; target files
read-only. No other writer will change targets or this ticket during review.
Frozen R1-R4 in adjacent REPAIR-002.md; original C1-C7 in
.orch/runs/2026-09-05-policy-measurement-code/spec.md; original independent
verification-ce21196.md supplies prior uninvalidated coverage, not acceptance
of changed files. Real baseline in this run: baseline-c61d443.json,
SHA-256 a79fe73494dbff59dc7bc8a822c558caf18f3ce0b194412f4e02cbf38b03889e;
baseline-c61d443.txt; suite-c61d443.txt; checks-c61d443.json.
The original plan/contract/source hashes are in REPAIR-002's fixed references.
Use planner override because C7 requires independent judged code review.
No game/bot changes, Step 3 audit, experiment, receipt/gate rewrite, external
action, or target edits. Ticket Result/Verification/Feedback/Risks are the
only root write exception; do not write a second report or commit.

## Completion test

1. V1: R1-R2 and original C5: execute independent reference-fault and
   diagnostic-fault public collect/render probes, require explicit unavailable
   regression counts and complete unresolved dispositions; known partial
   regression remains visible; real text/JSON arithmetic/classifications agree.
   Oracle_class=deterministic; provenance=pre-existing specification.
2. V2: R3 and original C6: validate exact recorded full-suite failure identities,
   affected permanent tests, experiment/diff result and protected identities.
   Reuse exact uninvalidated full-suite evidence; do not rerun 75 seconds of
   unchanged checks solely for ceremony. Oracle_class=deterministic;
   provenance=pre-existing.
3. V3: R4/original C7: inspect the narrow source/test/card diff for blocking
   correctness, contract, scope and check-coverage defects; wider previously
   accepted implementation is not a new feature scope. Each finding must name
   evidence and violated criterion. Oracle_class=judged;
   provenance=pre-existing.

## Return fields

Completed ticket with fixed identities, per-criterion verdict entries and
actual oracle evidence, ranked findings separate from uncertainties, coverage
limits, weakest-class overall verdict. Return ticket path to /root; do not set
terminal status yourself. Fresh context supplies acceptance independence.

## Result

Pending.

## Verification

Pending.

## Feedback

[]

## Risks

[]
