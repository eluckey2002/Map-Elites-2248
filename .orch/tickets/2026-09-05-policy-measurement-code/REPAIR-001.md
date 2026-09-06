---
id: REPAIR-001
run: 2026-09-05-policy-measurement-code
status: ready
executor: orch-repair
pack: orch-code-pack
independence: gate
depends_on: [GATE-001]
bound: 25 minutes
write_scope:
  - solver/human-benchmark.js
  - solver/benchmark-inputs.js
  - solver/benchmark-metrics.js
  - solver/benchmark-replay.js
  - solver/tests/humanBenchmark.test.js
  - solver/tests/policyBenchmark.test.js
  - docs/evaluation/POLICY-EVAL-0001/measurement-checks.md
---

## Objective and fixed inputs

Correct only F1-F5 accepted in the adjacent run's gate-f407d9c.md, under every
constraint and C1-C7 of spec.md. That report states each failed oracle and source.
This is the single orch-review-fix correction pass; no opportunistic changes.
No policy audit, frozen-input edits, receipt refreshes, external writes, or main operations.

Workspace: /private/tmp/2248-policy-measurement-2026-09-05, own branch. Before
writing, check exclusivity and fast-forward that branch to root's dispatch
commit, which preserves the exact reviewed code plus admin evidence. Nobody else
writes this worktree. Do not write any root-checkout file during this dispatch.
Ticket result may be written only in your own worktree and committed with your
return. Do not terminally accept the ticket yourself.

## Completion test

- F1: controlled reference/runtime faults through collect never become losses,
  converted wins or full-panel rankings; unavailable score data are not aggregated.
  Component missingness and any known regressions stay explicit per contract.
- F2: exact real candidate good control remains admitted; receipt lacking both
  identities and forged identities are rejected with precise reasons.
- F3: real missing-file collect/render control names required/available coverage
  and labels any resolved-subset metrics; cannot show full coverage by dropping it.
- F4: JSON and text include N/n with denominators, faster/slower/tied distribution,
  and subject/candidate identity appropriate to both provenance classes.
- F5: permanent negative controls drive public loading/collect/render for runtime
  faults, missing required file, actual extra file, and corrupted frozen package.
  Assert exact detection reasons, not crashes; cards state actual coverage.
- Run focused tests, both real CLI modes, full suite by exact failure identity,
  experiment gate and diff check. Preserve all protected hashes and all 15 inputs.
  The prior complete suite is 377/373 with only the four known failures. A new
  test count may grow; no new failure identity is acceptable.

Oracle provenance: pre-existing contract/spec, independent gate controls F1-F5.
New regression tests authored in repair, independently verified after return.
Read gate-check before altering checks; current cards are the scoped owner.
Return commits, changed_artifacts, per-F disposition, exact red/green evidence,
CLI summary/raw identity, no-worse failure names, limits and queued uncertainties.

## Result

Pending.
