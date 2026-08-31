# Spec: correct target-aware evaluator denominator

- **run:** `level51-target-aware-challenger-v2-2026-08-30`
- **objective:** The unchanged challenger is paired with an evaluator whose fixed screen and holdout contain exactly the 52 shipped baseline levels and no nonexistent level.
- **routing:**
  - **pack:** `orch-code-pack`

## Non-goals

- Changing challenger behavior, champion behavior, gates, seeds, or evaluation semantics.
- Running screen or holdout.
- Treating the stopped v1 screen attempt as evidence.

## Acceptance

1. `HOLDOUT_LEVELS` is exactly Levels 1-52 from baseline `be843368`; `SCREEN_LEVELS` is the prior literal minus nonexistent 53, yielding 13 levels; fixed seed ranges remain unchanged.
   - **runnable check:** targeted evaluator tests assert exact arrays and 52/13 counts; **oracle_class:** deterministic.
2. Diagnostic behavior and every other focused challenger/evaluator test remain unchanged.
   - **runnable check:** both target-aware test files and diagnostic command; **oracle_class:** deterministic.
3. Full suite failure identity and protected hashes remain unchanged; screen and holdout artifacts remain absent.
   - **runnable check:** full suite, MAP-Elites verifier, protected hashes, and path absence; **oracle_class:** deterministic.
4. Code shape remains explicit and no runtime fallback silently drops missing levels.
   - **oracle:** code-pack lens; **oracle_class:** judged.

## Binding constraints

- Change only the fixed level constants and their literal tests.
- Missing requested levels continue to fail closed in the worker.
- Do not run `--screen` or `--holdout` in this correction step.
- Preserve every protected surface and all prior evidence.

## Evidence

- Stopped run `.orch/runs/level51-target-aware-evaluation-2026-08-30/stop-record.md`.
- Baseline `src/game.js` exports exactly 52 sequential levels, 1-52.
- Prior challenger identity `9133ac70f3ff1b15b49404c340f00e27200bf7dd92892bf3257182d77e5ed60d`; only evaluator and evaluator-test hashes will move.

## Affected surfaces

- `solver/target-aware-evaluation.js`
- `solver/tests/targetAwareEvaluation.test.js`
- Run/ticket bookkeeping for this correction.

## Exemplars

- `src/game.js` at protected SHA-256 `9493407cd9dc8b7cefaefac811b52969c89a078aa7df4fd2a5fa1c1e64207115`: its exported literal `LEVELS` is the denominator authority.
- The v1 evaluator/test files: preserve all behavior except the invalid level literal.

## Target repository

- `/Users/eluckey/Documents/Codex/2026-08-21/i/work/2248-map-elites` at baseline `be843368` plus the uncommitted bounded challenger/run artifacts.

## Standards owner

- `AGENTS.md` and `solver/README.md` at their previously fixed identities.

## Acceptance as runnable checks

```sh
node --test solver/tests/targetAwareChallenger.test.js solver/tests/targetAwareEvaluation.test.js
node solver/target-aware-evaluation.js --diagnostic
node --test solver/tests/*.test.js
node solver/verify-map-elites.js solver/map-elites-output
test ! -e .orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/screen.json
test ! -e .orch/runs/level51-target-aware-evaluation-v2-2026-08-30/evidence/holdout.json
```

## Bound

- **implementation:** two literal corrections only.
- **effort:** one red/green correction and one verification pass.
- **runtime:** under 3 minutes.
- **plan_gate:** false.

## Risks

- Silently filtering Level 53 would hide the protocol defect; explicit literals and failing worker behavior must remain.

## Assumptions

- Baseline Levels 1-52, not generated candidate 53, define “shipped.”
