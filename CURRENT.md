# Current work

This page is a bounded navigation record, not evidence. Read the [evidence ledger](EVIDENCE_LEDGER.md) for current proof standing and source-linked claims.

## Active milestone

Resolve whether the frozen Level 26 seed-0 run can reach 13,000 within 32 moves. The accepted boundary remains a replayed lower bound of 12,336 and a non-decisive proven upper bound of 326,390; reachability and the exact maximum are unresolved. See the ledger's [current snapshot](EVIDENCE_LEDGER.md#current-snapshot) and [open questions](EVIDENCE_LEDGER.md#open-question-registry).

The milestone exits only with accepted evidence of at least one of these outcomes:

- a replayed 13,000 witness;
- an exact result; or
- a proven upper bound below 13,000.

Timeouts, heuristic misses, terminal boards, and `UNKNOWN` do not close it. See the ledger's [resume boundary](EVIDENCE_LEDGER.md#resume-boundary).

## NEXT

[BL-0001 — Test compact state signature](docs/backlog/BL-0001-test-compact-state-signature.md) is ready. It evaluates the ledger's provisional compact-state hypothesis against exact small-horizon positions without treating the hypothesis as fact.

## Later

[BL-0002 — Evaluate decisive proof formulation](docs/backlog/BL-0002-evaluate-decisive-proof-formulation.md) remains proposed and depends on BL-0001. It compares possible exact continuations without selecting one in advance.

## Blockers and decisions needed

- No decisive certificate currently resolves 13,000 reachability or the exact maximum.
- Any formulation to pursue after BL-0001 requires an explicit owner decision; this page does not make it.

Last reviewed: 2026-08-11
