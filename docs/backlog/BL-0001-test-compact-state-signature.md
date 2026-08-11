---
id: BL-0001
title: Test compact state signature
status: ready
milestone: frozen-level26-seed0-reachability
depends_on: []
updated: 2026-08-11
---

# BL-0001 — Test compact state signature

## Authority

This record captures accepted planning intent, not evidence. The [evidence ledger](../../EVIDENCE_LEDGER.md) remains authoritative for proof standing; any result must be verified and admitted there separately.

## Desired outcome

Determine whether a proposed state signature can preserve the distinctions needed for useful exact small-horizon reasoning. The candidate features come from provisional `HYPOTHESIS-0001`: score, moves remaining, spawn cursor, value histogram, and compact connectivity or survivor-position information. The hypothesis remains provisional while this test is pending.

## Acceptance criteria

- Freeze a small-horizon position set and define the candidate signature before evaluating it.
- Compare positions sharing a signature against exact legal continuations and achievable outcomes.
- Record any collision that loses a decision-relevant geometric distinction, plus the smallest reproducible counterexample.
- Conclude only what the bounded comparison supports: retained for further evaluation, rejected by counterexample, or inconclusive.
- Preserve the frozen Level 26 rules and proof classes; do not present this diagnostic as a 32-move witness, exact maximum, or upper bound.

## Current evidence

The ledger's [hypothesis registry](../../EVIDENCE_LEDGER.md#hypothesis-registry) records `HYPOTHESIS-0001` as provisional and says no compact-signature test has been recorded. Histogram plus cursor alone is described only as a relaxation; geometry is required for exactness.

## Next action

Specify the frozen small-horizon fixtures, candidate signature, rule for comparing exact continuations and achievable outcomes, and failure example format before running the evaluation.

## History

- 2026-08-11 — Created as the sole ready item for the active milestone from provisional `HYPOTHESIS-0001`; no experiment has started.
