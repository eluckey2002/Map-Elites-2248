# Runtime composition: Level 51 target-aware human-strategy learning v2

- **name:** `level51-human-strategy-learning-v2-2026-08-30`
- **description:** Learn one target-aware cash-out rule from human play and test it once without changing the champion.
- **entry:** `named`
- **supersedes:** `level51-human-strategy-learning-2026-08-30`, whose frozen score-lift gate did not match the moves-to-target question exposed by diagnosis.
- **request:** Learn from the owner's two Level 51 strategies without turning Level 51 into evidence of general improvement.

## Steps

1. **id:** `diagnosis`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/spec.md`
   - **result:** `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/report.md` SHA-256 `be659e86cda9e9baca660ab1952cf6caf04fa73d86c9d5835abd5ec47b9658fd` (`SUPPORTED_SHARED_PRINCIPLE`).
   - **context packet:** exact replay diagnosis supporting target-aware route diversity and ruling out unconditional untrimmed offers.
   - **lens:** research-pack provenance, contradiction, causal-boundary, and rigor lens.
2. **id:** `challenger`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** `.orch/runs/level51-target-aware-challenger-2026-08-30/spec.md`
   - **context packet:** implement one separate challenger that uses an untrimmed route only when that move legally wins now; leave the champion untouched.
   - **lens:** code-pack correctness, scope, testability, and simplicity lens.
3. **id:** `evaluation`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** pending until `challenger` returns its fixed revision identity; `orch-spec` must create `.orch/runs/level51-target-aware-evaluation-2026-08-30/spec.md` with that identity in evidence.
   - **context packet:** evaluate the frozen challenger once against the champion on actual terminal outcomes and moves-to-target.
   - **lens:** research-pack estimator, provenance, leakage, contradiction, and claim-boundary lens.
4. **id:** `records`
   - **unit:** `orch-deliver`
   - **pack:** `orch-content-pack`
   - **spec:** pending until the evaluation result exists; `orch-spec` must create `.orch/runs/level51-target-aware-records-2026-08-30/spec.md` with that identity in evidence.
   - **context packet:** append the exact result, including negative or inconclusive outcomes, without changing product or policy code.
   - **lens:** content-pack claims, authority, correction, and skim lens.

## Edges

- **seq:** fixed `diagnosis` result identity is required evidence for `challenger`.
- **seq:** `challenger` revision identity becomes required evidence for `evaluation`.
- **seq:** `evaluation` result identity becomes required evidence for `records`.

## Frozen evaluation protocol

- **Diagnostic/training evidence:** Level 51 seed 1, both human trajectories, and all derived states. It can never count as screen or holdout.
- **Screen set:** shipped levels `[1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51, 52, 53]`, seeds `12000000-12000039`. Run once only as an implementation sanity check; it cannot change the rule.
- **Sealed holdout:** all 53 shipped levels at baseline `be843368`, seeds `13000000-13000299`, paired per level/seed. Run exactly once after the challenger identity is frozen.
- **Product outcome:** the real terminal game, which stops when the target is reached. For every paired cell report win/loss, moves-to-target, terminal reason, and score at termination.
- **Primary gate:** no cell the champion wins may become a challenger loss; no both-win cell may become slower; at least 1% of all holdout cells must become faster; faster cells must span at least 10 levels; and the two-way clustered mean move saving across all cells must be positive at `t > 3`, with losses encoded as zero savings only when both arms lose and as a preregistered fail when only the challenger loses.
- **Secondary diagnostics:** score at termination, changed-move count, per-level faster-cell rate, compute cost, and counterfactual full-budget score if measured. None may replace the primary gate.
- **Promotion boundary:** a passing challenger earns a recommendation for a separate owner decision. It does not become champion in this composition.

## Invariants

- `diagnosis` is frozen and cannot be widened after seeing implementation or evaluation results.
- `challenger` may implement only “take a legal untrimmed route when it wins immediately”; it cannot tune thresholds, memorize Level 51, alter earlier moves, or change bomb handling.
- `evaluation` cannot tune after screen or holdout, replace the terminal objective with full-budget score, drop cells, or use Level 51 seed 1 as evaluation.
- `records` cannot promote the challenger, refresh receipts, or edit historical records in place.
- Every step preserves the protected hashes for the champion, engine, levels, targets, recordings, receipts, calibration ruler, and level-authoring system.
- Unconditional `offerFull` remains falsified and cannot be re-run as this challenger.
- Any replay mismatch, holdout contamination, incomplete cell, changed protected hash, or resource exhaustion is explicit failure or `INCONCLUSIVE`, never a pass.

## Done check

A fresh verifier, given only the terminal result and this composition, must confirm that: the challenger differs from the champion only on a pre-target move that reaches the target immediately; bombs retain champion behavior; the Level 51 seed-1 improvement is labeled diagnostic; screen and holdout ranges are disjoint and unchanged; the sealed holdout ran once against a frozen challenger; all 15,900 paired cells are present; every primary gate is applied as written; the protected hashes and known receipt failures are unchanged; and the final record reports `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE` without promoting the challenger.

## Require

- Owner authorization given on 2026-08-30.
- Diagnosis result SHA-256 `be659e86cda9e9baca660ab1952cf6caf04fa73d86c9d5835abd5ec47b9658fd`.
- Historical negative control `530deb3dcf7f7edf43d86d74910ce92a25f2b18a:.orch/runs/chain-offer-2026-08-23/stop-record.md`, content SHA-256 `4dcc7c8efdbca97056468ce256955442632a3047d44ebcef89f1bfc79c036494`.
- Git baseline `be843368be8e19ec59501aae38f19eebaf188b87` on `map-elites-learning`.

## Return

- Result envelope with terminal result identity, end-to-end verification verdict, per-step identities, protected-hash verdict, complete screen and holdout outcomes, primary-gate verdict, promotion recommendation only if every gate passes, uncovered remainder, and this composition path.
