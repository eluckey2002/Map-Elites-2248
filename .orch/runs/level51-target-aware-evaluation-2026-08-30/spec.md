# Spec: target-aware challenger evaluation

- **run:** `level51-target-aware-evaluation-2026-08-30`
- **objective:** One sealed paired evaluation decides whether the fixed target-aware challenger reaches real level targets faster across fresh levels and seeds without turning any champion win into a loss.
- **routing:**
  - **pack:** `orch-research-pack`

## Question

Does the fixed target-aware immediate-win challenger generalize beyond Level 51 seed 1 by producing earlier real terminal wins without any win regression?

## Source policy

- Use only the fixed challenger result identity `9133ac70f3ff1b15b49404c340f00e27200bf7dd92892bf3257182d77e5ed60d`, baseline Git `be843368`, the exact screen and holdout protocols in the v2 composition, and generated artifacts that validate against their self-identities.
- The screen may be executed once before holdout only to detect instrument failure. It cannot change code, gates, or the challenger.
- The holdout may be executed exactly once. No alternate seeds, subsets, reruns, or dropped cells.
- Level 51 seed 1 is diagnostic/training evidence and excluded from both sets.

## Rigor bar

- Complete paired terminal outcomes for every declared cell, in level-major order, with source identities fixed before execution.
- Primary gates applied exactly as frozen, including win-regression and slower-cell falsifiers.
- A fresh verifier receives only the artifacts, fixed sources, and protocol; it recomputes identities, completeness, cell comparisons, clustered mean move saving, and the final verdict.
- Screen and holdout disagreements remain visible; no blended estimate.

## Non-goals

- Tuning or changing the challenger after screen or holdout.
- Promoting or modifying the champion.
- Using full-budget counterfactual score as the product objective.
- Re-authoring levels, changing targets, or refreshing receipts.
- Inferring human equivalence or optimal play.

## Acceptance

1. Screen artifact covers exactly 14 declared levels x 40 seeds = 560 paired cells, passes its self-identity and source checks, contains no champion-win regression or slower both-win cell, and demonstrates at least one changed terminal result; otherwise evaluation stops as failed/vacuous before holdout.
   - **oracle:** fixed evaluator plus independent artifact verifier; **oracle_class:** evidence.
2. The challenger source, evaluator source, champion, engine, and levels are byte-identical between screen completion and holdout completion.
   - **oracle:** before/after SHA-256 manifest; **oracle_class:** evidence.
3. Holdout artifact covers exactly 53 levels x 300 seeds = 15,900 paired cells with no missing/duplicate/reordered cell and validates its self-identity.
   - **oracle:** independent artifact verifier; **oracle_class:** evidence.
4. The primary gate is evaluated exactly: zero champion-win to challenger-loss cells; zero slower both-win cells; at least 159 faster cells; faster cells on at least 10 levels; positive all-cell mean move saving at two-way clustered `t > 3`.
   - **oracle:** independent recomputation from holdout cells, with level and seed cluster estimates and the larger standard error used; **oracle_class:** evidence.
5. Report includes win rates, faster/tied/slower/lost cell counts, mean/median saving, per-level faster counts, changed decisions, score-at-termination difference, and relative compute cost, but none can replace a failed primary gate.
   - **oracle:** coverage audit from artifact to report; **oracle_class:** evidence.
6. Final verdict is exactly `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE`; any incomplete run, identity drift, or invalid artifact is `INCONCLUSIVE`/failure rather than an empirical negative.
   - **oracle:** research rigor and contradiction lens; **oracle_class:** judged.
7. Protected hashes, recordings, receipts, calibration, levels, and authoring remain unchanged; full-suite failure identity stays the same.
   - **oracle:** protected manifest, MAP-Elites verifier, and full suite; **oracle_class:** evidence.

## Binding constraints

- Execute screen once with `node solver/target-aware-evaluation.js --screen --out .orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/screen.json`.
- If and only if screen is operationally valid and non-vacuous, execute holdout once with `node solver/target-aware-evaluation.js --holdout --out .orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/holdout.json`.
- Do not edit any solver/test file after screen begins.
- For move saving, a faster challenger contributes `champion.movesToTarget - challenger.movesToTarget`; a tie contributes zero; both-loss contributes zero; challenger-only win is recorded separately and contributes the champion move budget minus challenger moves; champion-only win is an immediate gate failure and is not converted into a numeric benefit.
- Cluster move saving first by level and separately by seed; use the larger standard error. Effective `n` is the binding cluster count, never 15,900 independent cells.
- A zero-variance positive saving pattern is supported only if every nonzero cell is directionally favorable and all other gates pass; report the standard error as zero and the directional condition explicitly.
- No result changes the champion inside this run.

## Evidence

- Challenger ticket `.orch/tickets/level51-target-aware-challenger-2026-08-30/T-001.md`, fixed five-file identity `9133ac70f3ff1b15b49404c340f00e27200bf7dd92892bf3257182d77e5ed60d`.
- V2 composition `.orch/runs/level51-human-strategy-learning-v2-2026-08-30/composition.md`.
- Diagnosis result SHA-256 `be659e86cda9e9baca660ab1952cf6caf04fa73d86c9d5835abd5ec47b9658fd`.
- Baseline verifier PASS and full suite 205/208 after adding 12 passing challenger tests, with the same three receipt failures.

## Affected surfaces

- `.orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/screen.json`
- `.orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/holdout.json`
- `.orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/verification.json`
- `.orch/runs/level51-target-aware-evaluation-2026-08-30/evidence/report.md`
- `.orch/tickets/level51-target-aware-evaluation-2026-08-30/`

## Exemplars

- `solver/map-elites-output/archive.json` plus `solver/verify-map-elites.js`: imitate source binding, disjoint seeds, complete replay, and selection/holdout separation.
- `solver/policy-eval.js` at baseline: imitate level-major cells and conservative two-axis clustered standard errors.
- Historical `chain-offer-v2` stop record at Git object `530deb3:.orch/runs/chain-offer-2026-08-23/stop-record.md`: imitate preregistered stopping and clean negative-result language.

## Bound

- **execution:** one 560-cell screen and, if valid, one 15,900-cell holdout; no rerun.
- **effort:** one analysis packet, one independent verifier, one correction pass for report transcription only.
- **runtime:** screen under 5 minutes; holdout under 30 minutes; no extra seed set if either bound is exceeded.
- **plan_gate:** false; protocol and execution were owner-approved by the accepted bounded sequence.

## Risks

- Faster terminal wins may occur mainly on easy levels already near 100% win rate; per-level spread is therefore a gate.
- Runtime may increase because untrimmed routes are generated on every pre-target bomb-free move.
- Cell savings are highly tied at zero, so naive cell-level significance would overstate evidence; clustered inference is mandatory.
- Full-budget score can fall after a risky cash-out, but the product has already ended; report it only if separately measured and never substitute it for terminal outcomes.

## Assumptions

- The evaluator's terminal order matches the shipped/solver game: bomb failure, then target win, then move exhaustion.
- The challengeer's conservative all-bomb fallback makes champion-win regression structurally unlikely but the holdout still checks it empirically.
- All 53 level definitions at baseline are the complete intended holdout population for this bounded result.
