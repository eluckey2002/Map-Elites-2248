# MAP-Elites independent-round verification correction

- **run:** `2026-08-28-map-elites-independent-round-verification`
- **objective:** The already-produced shared-axis MAP-Elites archive is admitted or refused through corrected artifact identities, deterministic verification, and an evidence-grounded synthesis without rerunning evolution.
- **routing:**
  - **pack:** `orch-research-pack`
- **question:** Given the fixed new archive `ab8ed417...` and map `a94fc614...`, what did the shared-axis, fresh-evaluation-seed round establish about behavior coverage and holdout performance, and what remains unknown?
- **source policy:** Use only committed verifier revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`; the accepted original archive/map at `11e50d6b...` and `c1e27d78...`; the prior transition archive/map at `3905956c...` and the primary-record identity `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`; and the fixed new archive/map at `ab8ed417a7cf2f1f8adf95268b2ca2c3a7c96ed699ef95d74eb13874ad65fc22` and `a94fc61469d36ab672bcb4722f1b08d628f9bee7d0137dfe0f4afb3568d7a0fb`. The exact prior map identity is sourced from `.orch/tickets/2026-08-28-map-elites-transition/T-001.md` and its matching worklog, not memory. Do not rerun evolution or use chat, web, or selected-screen evidence as authority for generalization.
- **rigor bar:** Load-bearing artifact claims require exact SHA-256, committed-verifier PASS, and deterministic recomputation. Exact coverage comparison requires original and new axes identity `07ac51b...`. “Stronger” requires positive paired holdout lift with clustered `t > 3`; lesser results remain heuristic observations or negative evidence. The failed predecessor spec is evidence only of its identity defect, not of experiment failure.

## Non-goals

- Do not rerun evolution, alter any artifact, tune parameters, change code/product/ledger/backlog, promote a champion, or rehabilitate the drifting-axis transition count as exact coverage evidence.

## Acceptance

1. **Fixed identities and verifier establish artifact validity.**
   - Oracle: exact SHA-256 assertions for all source/new artifacts plus `node solver/verify-map-elites.js <fixed-new-output>`; require PASS and three exact representative replays.
   - Oracle class: `deterministic`.
2. **Axes and evaluation-seed independence are exact.**
   - Oracle: assert exact chain/patience axis equality and axes SHA `07ac51b...`; assert new screen/holdout arrays are internally disjoint and have empty intersection with every prior screen/holdout array.
   - Oracle class: `deterministic`.
3. **Coverage comparison uses shared coordinates only.**
   - Oracle: measurement and synthesis report original 20/25 versus new occupancy, exact shared/added/missing/empty cells, row/column distributions, evaluated policies, and replacements. The prior transition's native count is labeled non-comparable because its axes SHA is `0fc8cf...`, not `07ac51b...`.
   - Oracle class: `evidence`.
4. **Holdout decides champion language.**
   - Oracle: recompute paired lift and clustered t for all three new representatives; report selection separately; refuse champion replacement unless positive holdout and `t > 3` both hold.
   - Oracle class: `deterministic`.
5. **Synthesis preserves correction, contradictions, and gaps.**
   - Oracle: final synthesis names the predecessor spec defect, separates observation/inference, answers coverage/diversity/generalization/champion standing, and states what evidence could flip each inference.
   - Oracle class: `evidence`.

## Binding constraints

- No experiment rerun. Read the fixed new artifacts in `.orch/runs/2026-08-28-map-elites-independent-round/evidence/` by the identities above.
- Writes only under `.orch/runs/2026-08-28-map-elites-independent-round-verification/` and `.orch/tickets/2026-08-28-map-elites-independent-round-verification/`.
- Correct prior transition map SHA-256: `d69c0dcf583ad41361a46609b49672f12f24be2d67515c29660a923b7f7a1201`.
- Preserve proof classes and all protected identities from the predecessor code spec.

## Evidence

- Fixed new archive `ab8ed417...` and map `a94fc614...`.
- Failed predecessor worklog, which retains the single completed run and exact identity defect.
- Prior accepted transition ticket `.orch/tickets/2026-08-28-map-elites-transition/T-001.md`, lines carrying the exact map identity.
- Code result revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.

## Affected surfaces

- `.orch/runs/2026-08-28-map-elites-independent-round-verification/worklog.md`
- `.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/measurement.md`
- `.orch/runs/2026-08-28-map-elites-independent-round-verification/evidence/synthesis.md`
- `.orch/tickets/2026-08-28-map-elites-independent-round-verification/T-001.md`
- `.orch/tickets/2026-08-28-map-elites-independent-round-verification/T-002.md`

## Exemplars

- The fixed machine-readable new archive: source for all new observations.
- Prior transition synthesis: preserve its holdout refusal, but explicitly correct the cross-run axis limitation.

## Bound

- One deterministic verification/measurement lane and one synthesis; zero evolution runs; `plan_gate: false`.

## Risks

- Only three representatives have holdout evidence; exact coverage says nothing by itself about policy superiority.
- Fixed edge bins aggregate out-of-range behavior.

## Assumptions

- The fixed new artifacts are the sole experimental outcome to verify; correction changes only the defective expected prior-map identity.
