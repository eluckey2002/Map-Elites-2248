---
id: REPAIR-002
run: 2026-09-05-policy-measurement-extra-repair
status: claimed
executor: orch-repair
independence: gate
depends_on: []
write_scope:
  - solver/benchmark-metrics.js
  - solver/human-benchmark.js
  - solver/tests/humanBenchmark.test.js
  - docs/evaluation/POLICY-EVAL-0001/measurement-checks.md
bound: 20 minutes
claimed_by: /root
claimed_at: 2026-09-06T02:35:00Z
---

## Objective

Repair only the remaining all-unresolved regression-reporting defect from the
independent verification at ce21196. Explicitly unavailable counts must not
look like zero observed regressions or a complete reliability assessment.

## Fixed inputs

- Owner authorization: latest message `yes` approves exactly one additional
  narrow repair pass after the original review-fix pass was exhausted. This
  record accompanies the authorized action; it does not reopen the failed pass.
- Base: 236b03f2af0f12f105e7ffb52ba36b4c0b39ad73; executable measurement
  revision ce21196aca799b0c72c1e9b3025692dd45c3e861.
- Accepted defect/oracle: `.orch/runs/2026-09-05-policy-measurement-code/verification-ce21196.md`,
  C5/C7 failure. Both reference and diagnostic fault injection into public
  collect/render yield `regressions undefined attempts in undefined cases`.
- Frozen scope: original code spec C1-C7, POLICY-EVAL-0001 contract/input
  identities, DECISION-0006 and the unchanged four-step plan. Step 2 only.
- Inline execution by /root under delegation section 2; independent fresh
  downstream verification supplies the outside-context acceptance. Root lease
  confirmed from process working directories and unchanged log/reflog.
- Workspace is the foreground root checkout. No other tree writer. No change
  to gameplay, bot, engine, level author, frozen contract/inputs, recordings,
  receipts, old gates, Steps 3-4, external publication or main operations.
- execution_guard=2026-09-05-policy-measurement-extra-repair.

## Completion test

1. R1: Both reference-fault and diagnostic-fault collect/render controls account
   for 15 unresolved files, zero admitted rows, UNRESOLVED panels, null ranking
   and score data, and explicit unavailable regression counts (not undefined,
   zero regressions, or eligible). Oracle: the independently recorded failed
   control above plus existing runtime-fault tests widened to renderText;
   oracle_class=deterministic; provenance=pre-existing specification.
2. R2: Known regressions on a resolved subset remain visible, and complete real
   panel results do not change. Oracle: fixed contract sections 4-6, original
   focused 38-test suite, and fresh CLI baseline independently reconciled to
   rows; oracle_class=deterministic; provenance=pre-existing specification.
3. R3: No new full-suite failure identity beyond the four listed in
   checks-ce21196.json; experiment gate and diff check pass; frozen hashes and
   game/reference source identities stay unchanged. Oracle: named live commands
   from original spec C6 and exact SHA-256 comparison; oracle_class=deterministic;
   provenance=pre-existing.
4. R4: Fresh independent reviewer verifies the accepted defect is closed and
   no blocking correctness/scope/check-coverage defect remains in this repair.
   Oracle: fixed R1-R3 and original C5/C7, actual public-path bad/good controls,
   not producer conclusions; oracle_class=judged; provenance=pre-existing.

## Return fields

Changed artifact identities, red/green command evidence, fresh CLI identity,
exact full-suite failure names, per-criterion verdict, limits, queued items.

## Result

Inline producer changed only the four granted paths. Empty/unresolved
comparison results explicitly carry null regression counts; renderText uses
the existing unavailable formatter. Both existing runtime-fault controls now
assert the rendered output. The existing missing-file control also requires
the known regression to remain visible on its unresolved full panel.

Pre-repair command `node --test --test-name-pattern='runtime fault'
solver/tests/humanBenchmark.test.js`: 0/2 pass, both fail at undefined versus
expected null. Same command after repair: 2/2 pass. The widened missing-file
control passed 1/1. No new test suite or gate was added. Independent acceptance
and final source-pinned checks remain pending.

## Verification

Pending independent acceptance.

## Feedback

[]

## Risks

These inspected human panels are descriptive, not a population estimate or
promotion result. Old code-review findings other than the accepted survivor
remain resolved or explicitly withdrawn; this pass cannot expand that set.
