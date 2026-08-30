---
id: target-aware-promotion-experiment
run: 2026-08-30-target-aware-promotion-experiment
status: in_progress
executor: orch-investigate
independence: checker
depends_on: []
write_scope:
  - .orch/tickets/2026-08-30-target-aware-promotion-experiment/target-aware-promotion-experiment.md
excluded_actions:
  - modify the champion or challenger
  - run or consume any sealed audit or holdout partition
  - change game rules, levels, scoring, calibration, policy defaults, or evidence standing
  - implement or execute the promotion experiment
bound: 30 minutes; EVIDENCE_LEDGER.md, CURRENT.md, exact target-aware result artifacts, their cited source and tests, and only the minimal comparison evidence needed to define a regression gate
claimed_by: codex-root
claimed_at: 2026-08-30T22:35:28Z
---

## Question

What is the smallest identity-frozen, regression-gated experiment that can determine whether the supported target-aware challenger merits owner consideration for promotion without automatically modifying the champion?

## Source policy

- Read `EVIDENCE_LEDGER.md` first and preserve every recorded proof class.
- Read `CURRENT.md` second for the active milestone and linked status.
- Resolve the target-aware result to its exact artifact, policy identities, cases, seed ranges, estimator, and verifier before proposing a gate.
- Treat an unavailable identity, reused selection data, or absent independent regression oracle as `INCONCLUSIVE`, not as permission to invent a threshold.

## Completion test

1. The proposed experiment freezes champion, challenger, code, corpus/case identities, seeds, estimator, and compute bound. Oracle: exact cited result artifacts and deterministic repository identity checks; oracle_class: deterministic; provenance: pre-existing.
2. Promotion eligibility requires positive primary lift plus named no-regression checks on pre-existing behavior, with explicit `PROMOTION_ELIGIBLE`, `RETAIN_CHAMPION`, `INCONCLUSIVE`, and `INVALIDATED` outcomes. Oracle: existing project evidence and pre-existing regression surfaces; oracle_class: evidence; provenance: pre-existing.
3. The experiment consumes no sealed audit evidence and cannot mutate the champion; owner approval remains a separate final gate. Oracle: direct protocol inspection; oracle_class: deterministic; provenance: pre-existing.

## Return fields

- status
- result identity
- verification
- cited findings with confidence
- proposed minimal experiment contract
- contradictions
- dead ends
- gaps and bound

