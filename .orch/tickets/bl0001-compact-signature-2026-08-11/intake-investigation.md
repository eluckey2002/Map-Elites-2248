---
id: intake-investigation
run: bl0001-compact-signature-2026-08-11
status: complete
executor: orch-investigate
depends_on: []
write_scope: []
excluded_actions:
  - edit solver, product, project-record, evidence, or prior run artifacts
  - start the BL-0001 experiment beyond bounded read-only sizing probes
bound: one repository inspection plus at most three isolated small-fixture sizing probes
claimed_by: root
claimed_at: 2026-08-11T04:38:33-05:00
---

## Objective

The existing exact-search primitives, safe fixture boundary, and concrete implementation surfaces needed to execute BL-0001 are identified from primary repository evidence.

## Fixed inputs

- `docs/backlog/BL-0001-test-compact-state-signature.md` at SHA-256 `439c75dff6ec4e897dd6b41e805cb7a5b9c5746bf6667a868c4fcf5dcaf0b04b`.
- `EVIDENCE_LEDGER.md` at SHA-256 `79783d22de27bc0a462ebb522b13492ee7a5fbd2c0f4b32bcffbb185835cf3e2`.
- Source policy: `solver/engine.js`, `solver/exact-score.js`, focused solver tests, and existing frozen-run schemas only.

## Completion test

1. Identify the exact transition, action-enumeration, state-cloning, and frozen-randomness interfaces reusable by BL-0001.
   - Oracle: cited source symbols plus their pre-existing focused tests; oracle_class: evidence; provenance: pre-existing.
2. Identify a bounded exact fixture design that can expose signature collisions without requiring the full 32-move search.
   - Oracle: at most three isolated read-only enumeration probes whose action/state counts are reported, plus direct source inspection; oracle_class: evidence; provenance: pre-existing.
3. Identify the smallest code, data, experiment, and documentation surfaces the accepted BL-0001 outcome must touch while preserving evidence authority.
   - Oracle: live path inventory, BL-0001 acceptance criteria, backlog protocol, and evidence-ledger rules; oracle_class: evidence; provenance: pre-existing.

## Return fields

- status
- result identity
- verification
- cited findings with confidence
- contradictions
- dead ends
- gaps and uncovered bound

## Result

- **status:** complete
- **result identity:** this ticket at its completed revision
- **verification:** PASS; weakest oracle class `evidence`

### Cited findings

- High confidence: `solver/exact-score.js` already exports complete physical action enumeration, frozen-chain transition, and exact position search. `solver/engine.js` exports deep state cloning and the shipped scoring, gravity, and transition primitives. Their focused test surfaces include hand-enumerated exact fixtures, distinct-survivor preservation, frozen input identity, cloning, and transition parity.
- High confidence: `node --test solver/tests/engine.test.js solver/tests/exact-score.test.js solver/physical-branch-bound/branch-bound.test.js` passed 52 tests, including negative controls and exact one- and two-move fixture checks.
- High confidence: exhaustive `{2,4,8}` board probes under the shipped equal-or-double rule, minimum chain four, deterministic `[2,4,8]` refill cycle, and a two-move horizon remained small enough for a durable experiment: 1x4 produced 81 boards, 16 physical first actions, and 7 distinct successors; 1x5 produced 243 boards, 120 actions, and 51 successors; 2x3 produced 729 boards, 6,710 actions, and 875 successors.
- High confidence: a preliminary 1x5 three-move probe already exposes the central comparison. The baseline signature `(accumulated score, moves remaining, cursor, value histogram)` merged positions with the same signature but exact remaining maxima of 0 and 48. Adding the last survivor's post-gravity position/value or the multiset of immediate legal action classes separated every future-maximum collision in this 120-successor fixture. That survival is bounded to this tiny fixture and is not a proof for larger boards or horizons.
- High confidence: a 2x3 two-move probe found 67 baseline-signature groups and 171 survivor-augmented groups with different one-move outcome sets. An immediate-action-class summary had no collision because, with only one move remaining, it directly encodes the outcome classes. A longer horizon is required to test whether that summary predicts more than the next move.
- High confidence: the smallest coherent implementation surface is a tested solver-side experiment runner plus a first experiment bundle containing its frozen scenario manifest and machine-readable result. A later research step must execute the frozen runner and judge collisions; only then may project records and the evidence ledger be updated.

### Contradictions

- None. The preliminary probes reinforce, rather than contradict, the ledger's warning that histogram plus cursor is only a relaxation and geometry matters for exactness.

### Dead ends

- One-move-remaining fixtures cannot test whether an immediate legal-action summary preserves multi-move futures: by construction, that summary already contains the final move's action classes.
- The existing `solveExactPosition` reports one exact maximum and witness, not the full set of reachable future totals. Maximum-value divergence is sufficient for a decision-relevant counterexample, while full outcome-set enumeration would be a separate expansion.

### Gaps and uncovered bound

- The preliminary 1x5 probe does not decide whether survivor or action-class summaries remain collision-free on the declared 2x3 three-move fixture.
- No reusable runner, scenario manifest, frozen receipt, experiment protocol, backlog update, or ledger result exists yet; those belong to delivery.

## Verification

1. PASS — source symbols and 52 focused tests establish the reusable exact primitives.
2. PASS — three bounded probe families establish tractable fixture sizes and expose a concrete baseline-signature counterexample without running the full Level 26 search.
3. PASS — live inventory and project-record rules support a code → research → content composition with disjoint authority surfaces.

## Feedback

[]

## Risks

- A signature that survives the bounded fixtures may still fail on larger boards or longer horizons; survival must be reported as retained for further evaluation, not proven exact.
- Cross-fixture collisions are meaningful only when every signature field controlling future transitions—including score, remaining moves, cursor, and refill stream—is frozen identically.
