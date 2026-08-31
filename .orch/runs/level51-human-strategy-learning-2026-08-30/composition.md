# Runtime composition: Level 51 human-strategy learning

- **name:** `level51-human-strategy-learning-2026-08-30`
- **description:** Derive one human-play principle, build one challenger, and test it once without changing the champion.
- **entry:** `named`
- **request:** Learn from the owner's two Level 51 strategies without turning Level 51 into evidence of general improvement.

## Steps

1. **id:** `diagnosis`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/spec.md`
   - **context packet:** reconstruct and compare both human replays with the champion; return one supported shared principle or `INCONCLUSIVE`.
   - **lens:** research-pack provenance, contradiction, causal-boundary, and rigor lens.
2. **id:** `challenger`
   - **unit:** `orch-deliver`
   - **pack:** `orch-code-pack`
   - **spec:** pending until `diagnosis` returns a fixed `SUPPORTED_SHARED_PRINCIPLE` result identity; `orch-spec` must create `.orch/runs/level51-human-strategy-challenger-2026-08-30/spec.md` with that identity in evidence.
   - **when:** skip if diagnosis is `INCONCLUSIVE`.
   - **context packet:** implement exactly one experimental policy rule behind a separate challenger seam; do not modify or replace the champion.
   - **lens:** code-pack correctness, scope, testability, and simplicity lens.
3. **id:** `evaluation`
   - **unit:** `orch-deliver`
   - **pack:** `orch-research-pack`
   - **spec:** pending until `challenger` returns its fixed revision identity; `orch-spec` must create `.orch/runs/level51-human-strategy-evaluation-2026-08-30/spec.md` with that identity in evidence.
   - **when:** skip if challenger is skipped or fails its deterministic gate.
   - **context packet:** evaluate the frozen challenger once against the frozen champion, preserving screen/holdout separation and reporting failures by identity.
   - **lens:** research-pack estimator, provenance, leakage, contradiction, and claim-boundary lens.
4. **id:** `records`
   - **unit:** `orch-deliver`
   - **pack:** `orch-content-pack`
   - **spec:** pending until the terminal research result exists; `orch-spec` must create `.orch/runs/level51-human-strategy-records-2026-08-30/spec.md` with that identity in evidence.
   - **context packet:** append the exact result to project records, including `INCONCLUSIVE` or negative outcomes, without changing product or policy code.
   - **lens:** content-pack claims, authority, correction, and skim lens.

## Edges

- **seq:** `diagnosis` result identity becomes required evidence for the `challenger` spec; `INCONCLUSIVE` terminates the implementation path.
- **seq:** `challenger` revision identity becomes required evidence for the `evaluation` spec.
- **seq:** `evaluation` result identity, or the terminal `INCONCLUSIVE` diagnosis identity when later steps are skipped, becomes required evidence for the `records` spec.

## Frozen evaluation protocol

- **Diagnostic/training evidence:** Level 51, seed 1, the two human trajectories, and all counterfactual states derived from them. These can never be counted as screen or holdout evidence.
- **Screen set:** shipped levels `[1, 5, 10, 15, 20, 26, 30, 35, 40, 45, 50, 51, 52, 53]`, seeds `12000000-12000039`. It may be run once to catch sign errors and choose between `off` and the one fixed challenger; no parameter sweep is allowed.
- **Sealed holdout:** all shipped levels present at baseline `be843368`, seeds `13000000-13000299`, paired per level/seed. It is run exactly once after the challenger revision is frozen and is not available to diagnosis or implementation.
- **Primary outcome:** paired log-ratio score lift over the champion, conservatively clustered on both level and seed using `pairedLift`; promotion-quality evidence requires positive lift with `t > 3`, no win-rate decline, and no worse bomb or lockout rate.
- **Human imitation check:** report whether the challenger changes the first material divergence on each Level 51 replay state. This is diagnostic and cannot rescue a failed holdout.

## Invariants

- `diagnosis` cannot implement a policy, inspect sealed seeds, or claim general improvement.
- `challenger` cannot alter the champion, game rules, levels, targets, recordings, receipts, calibration ruler, or level-authoring system; it may implement only the one principle fixed by the diagnosis result.
- `evaluation` cannot tune after seeing holdout, replace the estimator, drop losing levels or seeds, or call Level 51 evidence a holdout.
- `records` cannot promote the challenger, edit historical claims in place, refresh receipts, or weaken known failures.
- Every step preserves the protected hashes for `solver/bot.js`, `solver/engine.js`, `solver/level-author.js`, `solver/generate-levels.js`, `src/game.js`, every tracked recording, and every tracked receipt.
- No step changes the current champion. A passing challenger earns a promotion recommendation and a separate owner decision; it does not become champion inside this composition.
- Any ambiguity, missing original input, replay mismatch, holdout contamination, incomplete run, or resource exhaustion is explicit `INCONCLUSIVE` or failure, never a pass.

## Done check

A fresh verifier, given only the terminal result and this composition, must confirm that: both human recordings were exactly reconstructed and replayed; any implemented rule is identical to the single principle supported by both; Level 51 seed 1 appears only in diagnostic evidence; screen and sealed holdout are disjoint and carry their frozen ranges; the holdout was run at most once against a frozen revision; the paired estimator and gates were applied without dropping cells; all protected hashes and known receipt failures are unchanged; and the final record says `SUPPORTED`, `NOT_SUPPORTED`, or `INCONCLUSIVE` at exactly the evidence's scope. A passing result may recommend promotion but cannot report that promotion occurred.

## Require

- Owner authorization given on 2026-08-30 for this bounded sequence.
- Completed intake `.orch/tickets/level51-human-strategy-learning-2026-08-30/intake-investigation.md`.
- Git baseline `be843368be8e19ec59501aae38f19eebaf188b87` on `map-elites-learning`.
- Baseline verifier PASS, focused tests 93/93, and full suite 193/196 with the same three documented receipt failures.

## Return

- Result envelope with terminal result identity, end-to-end verification verdict, per-step identities or skip reasons, protected-hash verdict, the exact learned principle if supported, screen and holdout outcomes if run, promotion recommendation only if every gate passes, uncovered remainder, and this composition path.
