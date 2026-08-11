---
id: BL-0002
title: Evaluate decisive proof formulation
status: proposed
milestone: frozen-level26-seed0-reachability
depends_on:
  - BL-0001
updated: 2026-08-11
---

# BL-0002 — Evaluate decisive proof formulation

## Authority

This record is proposed planning intent, not evidence or an adopted method. The [evidence ledger](../../EVIDENCE_LEDGER.md) remains authoritative for proof standing, and [BL-0001](BL-0001-test-compact-state-signature.md) is a dependency, not empirical support.

## Desired outcome

Produce a decision-ready comparison of exact continuation formulations for the frozen Level 26 seed-0 horizon after BL-0001 reports what its compact signature preserves or loses. No formulation is selected by this record.

## Acceptance criteria

- Carry forward the frozen input, 32-move horizon, shipped rules, and current accepted numerical boundary without alteration.
- Compare candidate formulations on completeness, state identity, memory behavior, reproducibility, and independently checkable output.
- Include the ledger's provisional possibilities—a streaming or partitioned physical frontier, a materially tighter complete tail abstraction, or another exact formulation—without assuming any is viable.
- State which outcomes would be decisive: a replayed 13,000 witness, an exact result, or a proven upper bound below 13,000. Keep timeouts and `UNKNOWN` non-decisive.
- Return any recommendation as a proposal for owner acceptance, with gaps and tradeoffs visible.

## Current evidence

The ledger's [current snapshot](../../EVIDENCE_LEDGER.md#current-snapshot) records a 12,336 replayed lower bound, a non-decisive 326,390 proven upper bound, and unresolved 13,000 reachability. Its [hypothesis registry](../../EVIDENCE_LEDGER.md#hypothesis-registry) records `HYPOTHESIS-0002` as provisional; no decisive continuation result is recorded.

## Next action

Wait for BL-0001. Then use its bounded findings to define comparison candidates and evaluation criteria without starting a solver run or adopting a formulation.

## History

- 2026-08-11 — Captured as proposed dependent work from `HYPOTHESIS-0002`; no formulation has been accepted.
