---
id: BUILD-001
run: 2026-09-06-policy-trajectory-instrument
status: claimed
executor: orch-tdd
pack: orch-code-pack
profile: orch-worker
independence: gate
depends_on: []
write_scope: [solver/trajectory-audit.js, solver/tests/trajectoryAudit.test.js, docs/evaluation/POLICY-AUDIT-0001/instrument-checks.md]
bound: 24 minutes
claimed_by: /root/trajectory_build_gpt_5_6_sol_high
claimed_at: 2026-09-06T08:12:18Z
---

## Objective

Deliver the real serialized-session -> independently verified replay -> bounded
immediate-win audit seam specified in A1-A5, using red-green increments.

## Fixed inputs

Root /Users/eluckey/Developer/research and games/2248-challenge. Frozen spec
.orch/runs/2026-09-06-policy-trajectory-instrument/spec.md; read entirely.
Worktree /private/tmp/2248-trajectory-instrument.dX4Rcr, derived from the claim
commit, sourcebase54a4251. Standards: AGENTS.md and spec's standards pointers.
Craft: /Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md.
Source intake GROUND-001 supplies exact existing APIs/tests; inspect relevant
implementation, do not infer that a proposed audit API already exists.
Follow gate-check and use check-design.md's planned controls as design input,
not evidence of execution. Qualification only on constructed/existing inspected
cases; no fresh audit population or protocol registration in this code ticket.

## Completion test

A1-A5 from frozen spec, verbatim by reference. Commands:
node --test solver/tests/trajectoryAudit.test.js solver/tests/botVision.test.js solver/tests/policyBenchmark.test.js
node tools/verify-experiments.js
git diff --check
node --test --test-reporter=spec solver/tests/*.test.js
Oracle classes: A1-A5 deterministic; test-body provenance authored-here with
outside independence at A6 gate. Preserve every required negative case and exact
four known full-suite failure identities. Full suite only at clean committed
state, no concurrent ticket/card writes; collect output then write evidence.
A6 independent judged qualification is downstream, never your self acceptance.

## Return fields

Incremental result in canonical ROOT ticket: committed slice identities,
changed paths, red/green and actual good/bad controls, complete command outcomes,
protected identities, scope/coverage limits and gaps. Per A1-A5 evidence/covers;
A6 deferred. Explicitly release worktree/ticket leases before returning.

## Result

Pending.

## Verification

Pending.

## Feedback

[]

## Risks

You are not alone; preserve other changes. Only own three worktree files and
canonical ROOT ticket result sections; never root target edits/commit or a
worktree-copy ticket. Root read-only during lease. No redelegation. apply_patch
only. Commit verified slices in worktree. Parent hardstop08:52:18Z; this claim
ends08:36:18Z. No framework expansion, protected source changes, global gates,
fresh measurement, Atlas, PR/push/main action. Reply_to=/root.
