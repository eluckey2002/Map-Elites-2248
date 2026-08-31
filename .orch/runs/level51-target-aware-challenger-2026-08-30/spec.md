# Spec: target-aware immediate-win challenger

- **run:** `level51-target-aware-challenger-2026-08-30`
- **objective:** A separate, deterministic challenger preserves every champion decision except when one of the existing untrimmed routes legally reaches the level target immediately, with reproducible terminal-outcome evaluation support and no protected-file change.
- **routing:**
  - **pack:** `orch-code-pack`

## Non-goals

- Changing or promoting the champion.
- Allowing untrimmed routes before they can win immediately.
- Tuning a score-gap threshold, beam width, weights, or any Level 51-specific value.
- Changing game rules, levels, targets, recordings, receipts, calibration, or authoring.
- Claiming general improvement from the Level 51 seed-1 diagnostic.
- Re-running the falsified unconditional `offerFull` arm.

## Acceptance

1. The challenger calls the champion for the ordinary move and returns that exact chain unless all of these hold: score is below target; no bomb is present; and a legal untrimmed candidate reaches target on this move. When several qualify, selection is deterministic by the existing candidate order.
   - **runnable check:** `node --test solver/tests/targetAwareChallenger.test.js`; require fallback identity, immediate-win activation, multiple-winner determinism, post-target fallback, and target-miss negative controls; **oracle_class:** deterministic.
2. Bomb behavior is never overridden, inputs are not mutated, null/no-move behavior is preserved, and the challenger uses only exported engine/champion seams.
   - **runnable check:** the same targeted test file; require bomb, immutability, and null controls; **oracle_class:** deterministic.
3. On the diagnostic Level 51 seed-1 board, the protected champion reaches target in 17 moves/125,952 while the challenger reaches it in 13 moves/130,048, with the first 12 moves byte-equivalent and only the final move changed. This proves the instrument responds to the training example and nothing about generalization.
   - **runnable check:** `node solver/target-aware-evaluation.js --diagnostic`; require exact replay and a visible `TRAINING_ONLY` label; **oracle_class:** deterministic.
4. The evaluation runner emits complete level-major paired cell records for champion and challenger, fixed source identities, exact seed/level ranges, terminal reason, win, moves-to-target, score at termination, changed-move count, runtime, and a self-hash; malformed ranges, missing levels, incomplete cells, overlap with diagnostic seed 1, or an output overwrite fail closed.
   - **runnable check:** `node --test solver/tests/targetAwareEvaluation.test.js`; require schema, ordering, completeness, identity, and tamper controls; **oracle_class:** deterministic.
5. `--screen` is fixed to the composition's 14 levels and seeds `12000000-12000039`; `--holdout` is fixed to all 53 baseline levels and seeds `13000000-13000299`; no arbitrary seed option exists. The code step may run diagnostic and tests but may not run either dataset.
   - **runnable check:** CLI parsing tests and source inspection; **oracle_class:** deterministic.
6. Focused and full regressions are no worse than baseline by failure identity, protected hashes remain exact, and only the authorized new files plus run/ticket bookkeeping change.
   - **runnable checks:** focused target-aware tests; `node --test solver/tests/*.test.js` expecting 193/196 with the same three receipt failures; `node solver/verify-map-elites.js solver/map-elites-output`; protected SHA-256 manifest; `git diff --check`; **oracle_class:** deterministic.
7. The new modules follow the existing explicit CommonJS, fixed-worker, level-major ordering, and fail-closed output idioms without abstracting the champion or copying game rules.
   - **oracle:** fresh code-pack lens against standards owner and exemplars; **oracle_class:** judged.

## Binding constraints

- The fixed policy rule is exactly: before target and with no bomb present, inspect the current generator's untrimmed routes at existing default width/tie-break/path-width; if one or more wins immediately, take the first in existing best-first order; otherwise return the champion's move unchanged.
- “Wins immediately” uses the engine's exact chain score and current `targetScore`; no learned or tuned constant is allowed.
- Any bomb anywhere on the board disables the challenger for that move. This conservative rule prevents a cash-out from bypassing the champion's defusal policy.
- Once target is reached, the challenger is the champion. Counterfactual full-budget evaluation therefore cannot repeatedly cash out merely because score is already above target.
- Reuse exported engine primitives and `solver/bot.js`'s public exports. Do not fork legality, scoring, gravity, spawn, blocker, or terminal rules.
- Do not modify existing files. The experimental chooser and evaluator live in new modules only.
- Tests are written before production code. No push, champion promotion, or receipt refresh is authorized.
- The diagnostic Level 51 seed 1 can establish only that the instrument expresses the learned rule.

## Evidence

- Diagnosis result `.orch/runs/level51-human-strategy-diagnosis-2026-08-30/evidence/report.md`, SHA-256 `be659e86cda9e9baca660ab1952cf6caf04fa73d86c9d5835abd5ec47b9658fd`.
- Machine decision table SHA-256 `2f30244b37a3dd6bfa9bd65c62c2d76e213469caac325cd8a43cf6e2d6dcd904` and verification SHA-256 `17dcb30fc26ab151ddeaebd393077a1f9543d9ec51491ff22005689dd2b2ff75`.
- Historical falsification Git object `530deb3dcf7f7edf43d86d74910ce92a25f2b18a:.orch/runs/chain-offer-2026-08-23/stop-record.md`, content SHA-256 `4dcc7c8efdbca97056468ce256955442632a3047d44ebcef89f1bfc79c036494`.
- Git baseline `be843368be8e19ec59501aae38f19eebaf188b87`.
- Protected hashes already recorded by the parent composition and verified by `solver/verify-map-elites.js`.

## Affected surfaces

- `solver/target-aware-challenger.js`
- `solver/target-aware-evaluation.js`
- `solver/target-aware-worker.js`
- `solver/tests/targetAwareChallenger.test.js`
- `solver/tests/targetAwareEvaluation.test.js`
- Run bookkeeping under `.orch/runs/level51-target-aware-challenger-2026-08-30/`
- Ticket bookkeeping under `.orch/tickets/level51-target-aware-challenger-2026-08-30/`

## Exemplars

- `solver/bot.js` SHA-256 `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`: reuse its exported defaults and exact candidate-generator options; do not copy its evaluator.
- `solver/policy-pool.js` SHA-256 `72750d85e897544ed0d380674f15488ef9891130bb75d9e722fdfb8ba31972ca`: imitate fixed worker bounds and level-major reassembly.
- `solver/policy-worker.js` SHA-256 `89b44ef7aea64aa7d7d6b4853048c108363ca65053943694137501631d054ca2`: imitate simple structured-clone jobs and deterministic worker results.
- `solver/tests/bot.test.js` SHA-256 `13fe4d7ecf865a97905c2f4548cff0557d9e1e629ec5944534946330f791b94d`: imitate small public-seam behavioral fixtures and negative controls.

## Target repository

- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites` at Git `map-elites-learning` / `be843368be8e19ec59501aae38f19eebaf188b87`, preserving run-bookkeeping additions and all protected surfaces.

## Standards owner

- `AGENTS.md` SHA-256 `478afe52937882710a474736b75c44c830b2bf5b71d18abaa5d90d6ca8e5bb72` owns evidence and correction discipline.
- `solver/README.md` SHA-256 `e77c979ad502680b1c073b05a0f933e900f3a910c8df66a0759fca65cd257e26` owns solver terminology and CommonJS/deterministic evaluation idioms.
- Existing tests under `solver/tests/` own Node test style.

## Acceptance as runnable checks

```sh
node --test solver/tests/targetAwareChallenger.test.js solver/tests/targetAwareEvaluation.test.js
node solver/target-aware-evaluation.js --diagnostic
node --test solver/tests/*.test.js
node solver/verify-map-elites.js solver/map-elites-output
shasum -a 256 solver/bot.js solver/engine.js solver/level-author.js solver/generate-levels.js src/game.js
git diff --check
```

## Bound

- **implementation:** one fixed challenger rule and one deterministic paired-evaluation runner; five new files only.
- **effort:** one TDD slice, one correction pass, one independent code gate.
- **runtime:** focused tests and diagnostic each under 30 seconds; full suite under 2 minutes. Screen and holdout execution belong to the next research step.
- **plan_gate:** false; the owner approved the bounded sequence.

## Risks

- Candidate enumeration adds compute before target; runtime must be reported in evaluation.
- Skipping all bomb states is conservative but may leave valid faster wins untouched; it prevents a safety regression in this first experiment.
- A diagnostic improvement from 17 to 13 moves can still be peculiar to Level 51 seed 1; it is not an acceptance result.
- Continuing after target is counterfactual to the product. The challenger intentionally falls back to champion after target to keep diagnostics interpretable.

## Assumptions

- The existing untrimmed candidate order is deterministic and best-first by immediate points.
- Reaching target ends the real level after blocker failure checks, so cash-out has no future-board cost in a bomb-free state.
- All 53 baseline levels are present and unseeded; evaluator-provided RNG fixes paired boards without changing shipped data.
