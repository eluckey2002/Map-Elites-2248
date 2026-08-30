# Spec: target-aware champion promotion rehearsal

- **run:** `target-aware-promotion-rehearsal-2026-08-30`
- **objective:** An isolated current-main candidate either proves it is the exact supported target-aware policy with no regression on newly shipped Level 53 and becomes `PROMOTION_ELIGIBLE`, or stops with a named non-promotion outcome; canonical main remains unchanged.
- **routing:**
  - **pack:** `orch-code-pack`

## Target repository

`/Users/eluckey/Developer/research and games/2248-challenge`, in a new isolated worktree from main commit `76871b12ebf5c75b2681360c1941fbd7ec908012`. If main moves before execution, the run may continue only when `solver/bot.js`, `solver/engine.js`, Levels 1-52, and Level 53 remain exactly as pinned below; otherwise return `INVALIDATED` and respecify.

## Standards owner by pointer

- Repository `AGENTS.md` at the target revision.
- `solver/bot.js` at `76871b1` for chooser locality and existing policy idiom.
- `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md` for code shape.

## Non-goals

- Merging into, committing directly on, pushing, or otherwise changing canonical `main`.
- Changing the rule, weights, parameters, engine, game rules, levels, targets, receipts, recordings, calibration, authoring, MAP-Elites artifacts, evidence standing, or Universe Map.
- Re-running the 1-52 statistical selection/holdout experiment or claiming a new lift estimate from its reused cells.
- Optimizing terminal score or removing the accepted approximately 1.45x compute tradeoff.

## Acceptance

1. **Clean, exact preflight.** Before any candidate code is written, all owner-owned work in registered worktrees is preserved and the isolated candidate passes the repository candidate-baseline verifier. Its base has champion SHA-256 `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`, engine SHA-256 `4e2323b9218aed6a552017ca37eab16becf8ef0a314f7081d02717ef1f7a12c6`, Levels 1-52 JSON-projection SHA-256 `dfa4cbb20140a17fbfa03a6f157575c8c905f5dbf564142ffc9d7ab6e2dcb7a9`, and the exact shipped Level 53 from main `76871b1`.
   - **oracle:** hashes, Git diff, and `node tools/verify-repo-baseline.js --candidate`; **oracle_class:** deterministic; **provenance:** pre-existing.
2. **Write-once Level 53 baseline.** Before `solver/bot.js` changes, the old champion is captured on Level 53 seeds `14000000-14000299` as 300 complete, unique, level-major terminal records bound to base/source hashes. The artifact refuses overwrite. These seeds have no prior use in the inspected evaluation sources.
   - **oracle:** promotion replay validator plus embedded identity/source manifest; **oracle_class:** deterministic; **provenance:** authored-here and independently rechecked.
3. **Exact, minimal port.** The old chooser body becomes one private base chooser without behavioral edits. The public `chooseMove` applies the exact fixed target-aware wrapper: call the base chooser; return `null` if it does; otherwise replace its move only with the first deterministic untrimmed candidate that reaches the finite unmet target immediately; never override while any bomb exists. The base chooser is not exported. Defaults and public call shape remain unchanged.
   - **oracle:** focused public-seam tests plus code-pack correctness/contract/scope lens against challenger SHA-256 `ba75b5a66883a63562eb7a819e339dd6b398279a7fe0178512e231c11a77dd90`; **oracle_class:** deterministic for behavior and judged for code shape; **provenance:** pre-existing behavior and authored-here integration.
4. **Exact 1-52 translation gate.** On every cell in holdout artifact identity `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0`, the promoted public `chooseMove` exactly reproduces the frozen challenger's terminal tuple: win, moves-to-target, moves used, score, and termination reason. All 15,600 ordered cells must match. This is an equivalence replay, not a fresh effectiveness estimate.
   - **oracle:** independent promotion replay tool reading the fixed artifact; **oracle_class:** deterministic; **provenance:** pre-existing evidence plus authored-here checker.
5. **One sealed Level 53 regression gate.** Only after criterion 4 passes and the candidate source identity is frozen, run the promoted chooser once on the 300 baseline seeds. Every cell must either reproduce the baseline terminal tuple exactly or improve it by reaching the target sooner / converting a loss to a win. There may be zero champion-win regressions, zero slower both-win cells, and zero changed losing outcomes. No threshold requires Level 53 to improve; Levels 1-52 already supply non-vacuous benefit evidence.
   - **oracle:** independently validated paired Level 53 artifact; **oracle_class:** deterministic; **provenance:** authored-here, seeds frozen here.
6. **No ordinary regression.** Focused bot/promotion tests pass; `node solver/verify-loop.js` remains PASS; the full solver suite has no new failing-test identity relative to the pre-edit baseline. Known receipt failures remain named and untouched rather than waived. Level 51 seed 1 reaches 130,048 in 13 moves; bomb, target-met, null-move, parameter-override, and input-nonmutation controls pass.
   - **oracle:** named test commands and exact before/after failure-name comparison; **oracle_class:** deterministic; **provenance:** pre-existing suite plus authored-here controls.
7. **Strict change boundary.** Product-code changes are limited to `solver/bot.js`. Test/harness changes are limited to `solver/tests/bot.test.js`, `solver/promotion-replay.js`, and `solver/tests/promotionReplay.test.js`. Run evidence and tickets may change only under this run id. No other path changes, and `git diff --check` passes.
   - **oracle:** Git path allowlist, protected hashes, and diff check; **oracle_class:** deterministic; **provenance:** authored-here.
8. **Named terminal outcome.** The result is exactly one of:
   - `PROMOTION_ELIGIBLE`: every gate passes; preserve a local candidate commit on its isolated branch and stop before merge.
   - `RETAIN_CHAMPION`: the exact candidate completes but adds a real Level 53 regression, a new ordinary regression, or violates the accepted compute/behavior contract; do not promote or tune after seeing the result.
   - `INCONCLUSIVE`: execution, resource, or measurement failure prevents a complete valid result; do not promote.
   - `INVALIDATED`: source/evidence identity drift, dirty-state ambiguity, seed reuse, incomplete artifacts, or inability to reproduce the fixed challenger means this is not the approved experiment; do not promote.
   - **oracle:** final gate evaluator over criteria 1-7; **oracle_class:** deterministic.
9. **Owner gate remains final.** `PROMOTION_ELIGIBLE` is a recommendation, not authorization to merge, push, rewrite receipts, rebuild derived views, or update the ledger. Those require a separate owner-approved promotion step.
   - **oracle:** branch/remote/working-tree inspection and result contract; **oracle_class:** deterministic.

## Binding constraints

- `plan_gate: true`: do not execute this spec until the owner explicitly approves it.
- Before execution, preserve the currently uncommitted supported-result artifacts on `map-elites-learning` and resolve—not delete or absorb—the unrelated untracked paths on current main.
- Copy the fixed 1-52 holdout and verification artifacts into the run evidence directory only after their SHA-256 values match `b6fe43d6a7818868c10b40cc95399259c689bf958679f5c8fb4aa4e37e3217c8` and `5bdf5baa5b55672337d52379d5b43920671f5ae2e9ef4a8fd0d51063010e41e9`.
- The 1-52 golden gate may expose translation defects and permits at most one implementation-only correction because it asks exact equivalence to already accepted behavior. Freeze the candidate hash immediately after it passes.
- Level 53 promoted results run once against the write-once baseline. No code, threshold, seed, or gate may change afterward; a negative is `RETAIN_CHAMPION`, not a tuning prompt.
- Never weaken or update the historical MAP-Elites verifier to accept the new champion. Its safety ref and old protected identity remain historical evidence.
- Baseline failures are compared by exact test name and message class, never count alone.
- Runtime bound: one 15,600-game promoted replay (one arm, not two), one 300-game Level 53 baseline, one 300-game promoted Level 53 run, focused tests, one pre/post full suite, and one pre/post curve-health check.

## Evidence

- Investigation packet SHA-256 `747adda65ac2940ef49e6bdf317f5d205e15806ae555a483d5c2c7770c57cbbb` at `.orch/tickets/target-aware-promotion-definition-2026-08-30/intake-investigation.md`.
- Supported-result report SHA-256 `d69194cafdf2526305ae7f6097cf0fa927965304b34548730c1fa80015b4f766`.
- Fixed challenger five-file identity `c68247ce390bfec8f32e5c3c6a676efc1ea012ec81da958deeb5c19d840a20a7` and challenger source hash above.
- 1-52 holdout identity/file hash and independent-verification hash named in the constraints.
- Current-main commit `76871b12ebf5c75b2681360c1941fbd7ec908012`, with bot/engine equality and sole product-code addition of Level 53 established by Git diff.

## Affected surfaces

- `solver/bot.js`
- `solver/tests/bot.test.js`
- `solver/promotion-replay.js`
- `solver/tests/promotionReplay.test.js`
- `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/`
- `.orch/tickets/target-aware-promotion-rehearsal-2026-08-30/`

## Exemplars

- `solver/target-aware-challenger.js` at SHA-256 `ba75b5a66883a63562eb7a819e339dd6b398279a7fe0178512e231c11a77dd90`: imitate its base-first wrapper, finite/unmet-target guard, bomb exclusion, untrimmed enumeration parameters, and first-winner ordering exactly.
- `solver/target-aware-evaluation.js` at SHA-256 `53aa4b2ef23d3245010cacd6e5f121eb99c697f9802549d360a501c4ac3dddb1`: imitate complete level-major cells, source-bound artifacts, write-once output, and deterministic terminal order.
- `solver/tests/targetAwareChallenger.test.js` at SHA-256 `2dbddc00abb42bffad3c1467744e9fe7fc85c871f5e948c168e4615e024a7fbd`: carry its positive, bomb, target-met, null, deterministic-order, and nonmutation seams into the promoted public API.
- Main `tools/verify-repo-baseline.js`: preserve its candidate-mode clean-state and safety-ref behavior; do not copy or weaken it.

## Acceptance as runnable checks

```sh
node tools/verify-repo-baseline.js --candidate
node tools/verify-universe-map.js
node --test solver/tests/*.test.js
node solver/verify-loop.js
node solver/promotion-replay.js --capture-level53 --out .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/level53-baseline.json
node --test solver/tests/bot.test.js solver/tests/promotionReplay.test.js
node solver/promotion-replay.js --verify --golden52 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/holdout-1-52.json --baseline53 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/level53-baseline.json --out .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/promotion-verification.json
node --test solver/tests/*.test.js
node solver/verify-loop.js
git diff --check
```

`node tools/verify-universe-map.js` is a pre-change baseline check only. It is expected to require regeneration after a later approved merge because the map pins the champion identity; the rehearsal must not update it.

## Bound

- **implementation:** one private-base rename, the exact fixed wrapper/helper, one replay tool, and focused regression tests.
- **evaluation:** reuse 15,600 fixed outputs as a one-arm golden; add only 600 Level 53 executions across baseline and candidate.
- **correction:** at most one translation-only correction before Level 53 is revealed; none afterward.
- **publication:** one local candidate commit only on `PROMOTION_ELIGIBLE`; no push or merge.
- **plan_gate:** true.

## Risks

- Relocating the wrapper into `bot.js` could accidentally change fallback or caller semantics; exact 1-52 replay and public-seam controls catch this.
- Main or another worktree may move while this definition waits; identity drift invalidates rather than broadening the run.
- Universe/ledger-derived views will intentionally remain tied to the old champion during rehearsal; actual promotion needs a separate synchronized records step.
- Timing is noisy; the accepted approximately 1.45x cost is inherited only because the implementation must be the exact same base-first algorithm. This rehearsal does not claim a more precise performance estimate.

## Assumptions

- The owner wants promotion evaluated against canonical main, not merely against the older MAP-Elites branch.
- Exact terminal equality across all accepted 1-52 holdout cells is sufficient to establish that relocation preserved the tested policy.
- Level 53 is the only shipped gameplay input absent from the accepted holdout at the pinned main revision.
