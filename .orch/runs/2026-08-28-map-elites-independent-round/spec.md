# MAP-Elites shared-axis independent round

- **run:** `2026-08-28-map-elites-independent-round`
- **objective:** A verifier-accepted MAP-Elites archive exists on the original archive's exact behavior coordinates and wholly new evaluation seed ranges, with an honest comparison of coverage, selection fitness, holdout generalization, and champion standing.
- **routing:**
  - **pack:** `orch-research-pack`
- **question:** Holding the game, champion, policy genome, behavior descriptors, original 5x5 axes, and run bound fixed, what behavior coverage and holdout-supported policy evidence does one 120-mutation MAP-Elites round produce on evaluation seeds unused by either prior archive?
- **source policy:** Execute only committed revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53` in its clean isolated worktree. Use the accepted original archive at SHA-256 `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c` as the sole axis source and primary comparison. Use the 2026-08-28 transition archive at SHA-256 `3905956c2fc0f32e078058938dd2128a47e862f6fd56fc184137cb1b26e63ffa` only to establish previously used seed sets and to explain why its native cell count is not a shared-coordinate comparison. The new archive, its verifier output, exact hashes, and deterministic calculations are the only authority for the new result. No web source, chat claim, selected-screen score, or memory-derived fact may establish experiment standing.
- **rigor bar:** Every load-bearing artifact claim must trace to a fixed SHA-256 and pass the committed independent verifier. Exact coverage comparison requires axes identity `07ac51b0e1d4d69509052baf5b0af02f5c98854d1387e2701db85e0baf4e8457` on both original and new archives. Every new evaluation seed must be absent from both prior archives. Policy-quality claims use only paired holdout scores against the unchanged champion; “stronger” requires positive lift and the existing clustered `t > 3` bar. Anything weaker is a `heuristic_observation`, negative result, or `INCONCLUSIVE` as appropriate.

## Non-goals

- Do not modify or promote the champion, game, levels, rules, scoring, policy genes, descriptors, selection, mutation, generator, authoring system, accepted archives, ledger, or backlog.
- Do not tune after seeing the result, rerun with different parameters, merge archives, resume from an archive, or use the prior drifting-axis archive as exact occupancy evidence.
- Do not claim optimality, human strength, or a general improvement in MAP-Elites from one bounded round.

## Acceptance

1. **One frozen run produces new run-scoped artifacts.**
   - Oracle: from clean revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`, run `node solver/map-elites.js --seed 20260829 --iterations 120 --screen-seeds 12 --screen-seed-start 4000000 --holdout-seeds 24 --holdout-seed-start 5000000 --bins 5 --axes-from solver/map-elites-output/archive.json --out <absolute-run-evidence-path>` exactly once; require new `archive.json` and `map.html` without overwriting any prior artifact.
   - Oracle class: `deterministic`.
2. **The archive is structurally, replay, and provenance valid.**
   - Oracle: `node solver/verify-map-elites.js <new-output-path>` reports PASS; assertions require source archive SHA-256 `11e50d6b...`, axes SHA-256 `07ac51b...`, exact equality of both frozen axis objects to the original, five bins per axis, and three exact representative replays.
   - Oracle class: `deterministic`.
3. **Evaluation evidence is wholly fresh and internally disjoint.**
   - Oracle: compare machine-readable seed arrays across the original, 2026-08-28 transition, and new archives; require the new screen and holdout sets to be disjoint from each other and from every earlier screen and holdout set.
   - Oracle class: `deterministic`.
4. **The protected baselines remain exact.**
   - Oracle: require the code worktree clean at `8508c3b`; re-hash original archive/map and every protected game/solver path named in the predecessor spec; re-hash the prior transition archive/map; require exact equality.
   - Oracle class: `deterministic`.
5. **Coverage is compared only where coordinates are shared.**
   - Oracle: synthesis reports original-versus-new occupied cells, row/column distribution, added/emptied/shared cells, evaluated policies, and replacements from the two exact-axis artifacts. It labels the drifting-axis transition archive's native 24/25 count non-comparable and does not use it to claim exact expansion.
   - Oracle class: `evidence`.
6. **Policy evidence is interpreted against holdout, not selection.**
   - Oracle: recompute paired holdout lift and clustered significance for all three new representatives using `solver/policy-eval.js`; report selection and holdout separately. “Stronger” is permitted only for positive holdout lift with `t > 3`; otherwise explicitly refuse champion replacement.
   - Oracle class: `deterministic`.
7. **The synthesis answers the research question and preserves uncertainty.**
   - Oracle: `synthesis.md` separates observations from inferences; answers coverage, diversity, generalization, and champion standing; includes contradictions, gaps, and what the next round can now measure.
   - Oracle class: `evidence`.

## Binding constraints

- Frozen command: seed `20260829`, 120 mutations, 12 screen seeds starting `4000000`, 24 holdout seeds starting `5000000`, five bins, axes from the accepted original archive.
- New writes are limited to `.orch/runs/2026-08-28-map-elites-independent-round/` and `.orch/tickets/2026-08-28-map-elites-independent-round/` in the controlling checkout. The code worktree is read-only during this delivery.
- Original accepted archive/map identities: `11e50d6b3c5a7f923de81eba772e9a48b67c6df4170fe0e8a5b825671a1d029c` and `c1e27d78431f64e4378c286bc6a3cb1882db131573f1aa0cbba357174a692b1a`.
- Prior transition archive/map identities: `3905956c2fc0f32e078058938dd2128a47e862f6fd56fc184137cb1b26e63ffa` and `d69c0dcf6cbef3ebc0bc89dcf8b19f09b3847a52b8130b49bf6a5691a9f7b388`.
- Protected code-worktree identities are those in the predecessor code spec, plus result revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`.
- Preserve proof classes exactly: archive coverage is exact for the artifact; screen lift is selection evidence; holdout lift is a heuristic observation unless the stated significance bar clears; optimality and human strength remain unknown.
- If the run fails, retain its partial evidence and stop. Do not change seeds, parameters, code, or bounds.

## Evidence

- Code result ticket `.orch/tickets/2026-08-28-map-elites-measurement-controls/T-001.md`, revision `8508c3b4aa2bac9eceaac0bcaf91e3838e303a53`, all deterministic acceptance criteria PASS.
- Accepted original archive SHA-256 `11e50d6b...` and axes SHA-256 `07ac51b...`.
- Prior transition archive SHA-256 `3905956c...` and its synthesis SHA-256 `4305da...`.
- Project `EVIDENCE_LEDGER.md` accepted `RESULT-0017`, establishing the original archive as a heuristic observation rather than a champion promotion.

## Affected surfaces

- `.orch/runs/2026-08-28-map-elites-independent-round/worklog.md`
- `.orch/runs/2026-08-28-map-elites-independent-round/evidence/archive.json`
- `.orch/runs/2026-08-28-map-elites-independent-round/evidence/map.html`
- `.orch/runs/2026-08-28-map-elites-independent-round/evidence/measurement.md`
- `.orch/runs/2026-08-28-map-elites-independent-round/evidence/synthesis.md`
- `.orch/tickets/2026-08-28-map-elites-independent-round/T-001.md`
- `.orch/tickets/2026-08-28-map-elites-independent-round/T-002.md`

## Exemplars

- Accepted original `archive.json` at SHA-256 `11e50d6b...`: preserve machine-readable reference, screen, archive, representative, and holdout separation.
- Prior transition `synthesis.md` at SHA-256 `4305da...`: preserve explicit refusal to promote the best-screen candidate after negative holdout, while correcting its axis-comparability limitation here.
- Committed verifier at `8508c3b`: use as the independent artifact/replay oracle.

## Bound

- One 120-mutation run, one verifier pass, one deterministic comparison packet, and one synthesis. No changed-parameter retry.
- One evidence lane followed by terminal synthesis.
- `plan_gate: false` — the owner explicitly said to continue into the next round.

## Risks

- Exact shared bins make occupancy comparable, but different evaluation seeds still mean old and new fitness estimates are independent samples rather than the same score vector.
- Fixed bins clip behavior outside the original pilot range into edge cells; an edge-cell increase may mean true extremity, not newly resolved nuance beyond the boundary.
- Only three representatives receive holdout evaluation, so most archive cells remain selection-only evidence.

## Assumptions

- The first accepted archive is the intended shared coordinate system.
- “Next round” means one new bounded evolution from the same pilot start, not continuation from saved elites.
- Fresh evaluation evidence means no new seed integer appears in any prior screen or holdout set.
