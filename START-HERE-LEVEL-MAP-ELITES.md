# Start Here: Level MAP-Elites Authoring

**Resume snapshot:** 2026-09-22  
**Current main baseline:** `2475ec5747e58d314ba942bceb0fde15ddb17fd4`

This is the operational entry point for the [Level MAP-Elites authoring plan](docs/plans/2026-09-16-2225-feat-level-map-elites-authoring-plan.md). It does not replace the plan or change evidence standing. Use [CURRENT.md](CURRENT.md) for navigation and [EVIDENCE_LEDGER.md](EVIDENCE_LEDGER.md) for proof standing.

## Deliverable and boundary

Build a reproducible authoring instrument that maps **level designs across a frozen seed panel** by successful plan breadth and harvesting advantage. The subject is not a policy and not a single seeded board. Difficulty remains metadata; machine descriptors do not certify fun, fairness, or difficulty; the output is an identity-bound shortlist for human play, not shipped levels.

Do not change game rules, scoring, spawn behavior, `calib-1`, shipped levels, `solver/engine.js`, or `solver/level-author.js` as part of this plan.

## Identity state that must be reconciled

- Main is fixed here at `2475ec5747e58d314ba942bceb0fde15ddb17fd4`.
- The bounded-oracle lineage ends at `c88668d1499a449b2638153231a435649594bca4` on `origin/experiment/harvest-policy-corpus`.
- A substantial adjacent board-map lineage ends at `e7ac53746db7ca98b5f9335ef59e5345377f290a` on `origin/feat/board-map-elites-20260917`. A family prototype later ends at `b5e5a85f3429546a7d68c361459cc19912ef3f6e`.
- `RESULT-0041` collides: the oracle lineage uses it for the harvesting-policy result cited by the plan, while current main uses it for the hardened greed-harness run.
- `RESULT-0042` and `RESULT-0043`, proposed for U3 and U7 in the plan, are already occupied on main by the greed-validation lineage.
- No implementation branch has yet been adjudicated as canonical for this plan. The adjacent board-map branch is evidence to review, not proof that any unit below is complete.

Do not merge, renumber evidence, append ledger claims, or run fresh reportable experiments. Reconciliation must pass before implementation begins.

## Unit status

Every unit's current status is `unadjudicated` until the readiness review proves otherwise.

| Order | Unit | Current status | What must be established |
| --- | --- | --- | --- |
| 1 | U1 — oracle dependency | **Unadjudicated** | Select the accepted oracle ancestry and give its harvesting subject a non-colliding local identity without rewriting either `RESULT-0041`. |
| 2 | U4 — legal level genome | **Unadjudicated** | Show legal deterministic mutations over the existing level schema; do not infer this from board-map artifacts. |
| 3 | U2 — pre-discovery | **Unadjudicated** | Establish developmental-only range, independence, cost, seed sensitivity, depth sensitivity, and mutation response. |
| 4 | U3 — descriptor qualification | **Unadjudicated** | Reserve a fresh result ID, commit the protocol first, and obtain the frozen disposition. Only `SUPPORTED` unlocks U5–U7. |
| 5 | U5 — multi-candidate archive | **Unadjudicated** | Prove level-design, seed-panel coordinates and top-three evidence-valid retention. |
| 6 | U6 — coverage-seeking search | **Unadjudicated** | Prove deterministic lineage, immigrants, frontier trials, caching, and checkpoint resume. |
| 7 | U7 — saturation and shortlist | **Unadjudicated** | Reserve a fresh result ID; prove convergence or retain a diagnostic archive, then identity-bind any human shortlist. |

Execution order is `U1 → U4 → U2 → U3 → U5 → U6 → U7`. Do not mark a unit complete merely because similarly named files or a closed map report exist on an adjacent branch.

## Readiness gate

Create one dated reconciliation record from read-only inspection. It must contain:

1. the chosen base and implementation branch, with full commit identities;
2. the accepted source commits for the oracle and harvesting ranker;
3. a non-colliding mapping for the oracle lineage and new U3/U7 experiment IDs, preserving all existing records append-only;
4. a U1/U4/U2/U3/U5/U6/U7 conformance matrix against the plan's tests, with each row `reuse`, `repair`, `replace`, or `not started` and cited evidence;
5. a clean integration simulation identifying conflicts in `CURRENT.md`, `EVIDENCE_LEDGER.md`, and experiment directories; and
6. confirmation that every future reportable generalization will have a committed protocol before its run.

Gate outcomes:

- **PASS:** all six items are recorded, identities are unique, integration is conflict-accounted, and the next incomplete unit is unambiguous. Proceed only from that unit.
- **FAIL:** a known collision, source mismatch, protocol violation, or plan nonconformance remains. Repair the reconciliation; do not implement around it.
- **UNKNOWN:** evidence or an owner decision is missing, including which lineage is canonical. Preserve the alternatives and request that decision; `UNKNOWN` never degrades to `PASS`.

### First safe action

Compare `e7ac53746db7ca98b5f9335ef59e5345377f290a` unit-by-unit with the plan while treating main and both branch histories as read-only. Produce the reconciliation record above. The first implementation action is chosen only by the resulting PASS; absent that PASS, there is no justified implementation starting point.

## Terminal paths

- **`STOPPED_VALIDLY`:** U2 shows an axis cannot be moved independently or evaluated affordably; U3 returns `FALSIFIED`, `INCONCLUSIVE`, or `UNVERIFIED`; or U7 misses its frozen convergence bars. Preserve the failed requirement and evidence at its actual standing. Do not claim an admitted archive, saturation, or unreachable empty regions.
- **`FULL_SUCCESS`:** U3 is `SUPPORTED`; U5–U7 pass their focused and planted-negative tests; every retained candidate has a valid authoring receipt, stable seed-panel coordinate, and replay-valid witnesses; convergence satisfies the frozen rules; and at least three distant qualified regions yield exact candidates for human play.

## Source packet

- [Plan and requirements](docs/plans/2026-09-16-2225-feat-level-map-elites-authoring-plan.md)
- [Current navigation record](CURRENT.md)
- [Evidence ledger](EVIDENCE_LEDGER.md)
- [Historical handoff and receipt traps](HANDOFF.md)
- [Older MAP-Elites pivot handoff](HANDOFF-NEXT-MAP-ELITES.md)
- [Fresh-agent conflict audit](.orch/tickets/2026-09-22-plan-handoff-conflict-audit/INV-001.md)

The historical handoffs are context, not current authority. If this page conflicts with the ledger's proof standing, the ledger wins; if it conflicts with the plan's requirements, stop and reconcile the discrepancy rather than improvising.
