# Spec: target-aware challenger evaluation v2

- **run:** `level51-target-aware-evaluation-v2-2026-08-30`
- **objective:** One valid screen and one sealed 52-level paired holdout decide whether the corrected fixed challenger reaches real targets faster without any win regression.
- **routing:**
  - **pack:** `orch-research-pack`

## Question

Does the target-aware immediate-win challenger generalize across the 52 shipped baseline levels and fresh seeds?

## Source policy

- Fixed code identity `c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7`, Git baseline `be843368`, and only the v3 composition's literal inputs.
- Execute the 520-cell screen once; it cannot change code or gates.
- If valid and non-vacuous, execute the 15,600-cell holdout once. No subsets, reruns, or alternate seeds.
- The stopped v1 attempt and Level 51 seed 1 are not evaluation evidence.

## Rigor bar

- Complete self-identifying level-major pairs, fixed source hashes before/after, conservative two-way clustered move-saving inference, and independent artifact verification.
- Contradictory per-level effects remain visible; no average can hide a win regression or slower cell.

## Non-goals

- Changing or promoting any policy; tuning after observation; using full-budget score as the primary outcome; changing levels, targets, receipts, calibration, or authoring.

## Acceptance

1. Screen validates at exactly 13 levels x 40 seeds, has zero win regressions/slower cells, and at least one changed terminal result; otherwise stop before holdout.
   - **oracle:** independent artifact validator; **oracle_class:** evidence.
2. The fixed six-file source manifest is identical before screen and after holdout.
   - **oracle:** SHA-256 manifest; **oracle_class:** evidence.
3. Holdout validates at exactly 52 levels x 300 seeds, with all 15,600 unique ordered paired cells.
   - **oracle:** independent artifact validator; **oracle_class:** evidence.
4. Primary gate: zero champion-win regressions; zero slower both-win cells; at least 156 faster cells; faster cells on at least 10 levels; positive two-way-clustered mean move saving at `t > 3`.
   - **oracle:** independent recomputation; **oracle_class:** evidence.
5. Report includes win/timing counts, move-saving distribution, per-level coverage, changed decisions, termination score, and relative cost without replacing a failed gate.
   - **oracle:** artifact-to-report coverage audit; **oracle_class:** evidence.
6. Verdict is exactly `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE`, with operational failures distinguished from empirical negatives.
   - **oracle:** research rigor lens; **oracle_class:** judged.
7. Protected hashes and the three known receipt failures remain unchanged.
   - **oracle:** MAP-Elites verifier, protected manifest, and full suite; **oracle_class:** evidence.

## Binding constraints

- Screen command writes only `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/screen.json`.
- Holdout command writes only the sibling `holdout.json` and runs only after screen validation.
- No solver/test edit after screen begins.
- Savings: both-win uses champion minus challenger moves; both-loss is zero; challenger-only win uses champion move budget minus challenger moves; champion-only win fails immediately.
- Cluster by level and seed separately; use the larger SE. Zero-variance positive direction is reported explicitly.
- No champion change follows automatically.

## Evidence

- Corrected code ticket `.orch/tickets/level51-target-aware-challenger-v2-2026-08-30/T-001.md`.
- V1 stop record `.orch/runs/level51-target-aware-evaluation-2026-08-30/stop-record.md`.
- V3 composition and diagnosis result.

## Affected surfaces

- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/screen.json`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/verification.json`
- `.orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/report.md`
- Evaluation ticket bookkeeping.

## Exemplars

- MAP-Elites archive/verifier for source binding and disjoint evidence.
- `solver/policy-eval.js` for conservative two-axis clustering.
- Historical chain-offer stop record for honest stopping.

## Bound

- **execution:** one 520-cell screen and, conditionally, one 15,600-cell holdout.
- **effort:** one packet, one verifier, one report-transcription correction.
- **runtime:** screen under 5 minutes; holdout under 30 minutes.
- **plan_gate:** false.

## Risks

- Effects may concentrate on easy levels; breadth gate prevents one-level success.
- Untrimmed enumeration increases compute; cost is reported.
- Ties dominate; clustered inference is mandatory.

## Assumptions

- Exported Levels 1-52 are the full shipped population at baseline.
- Terminal order matches the product and conservative bomb fallback prevents safety drift.
