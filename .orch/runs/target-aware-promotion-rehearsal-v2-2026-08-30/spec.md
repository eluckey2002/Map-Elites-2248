# Spec: corrected target-aware promotion rehearsal

- **run:** `target-aware-promotion-rehearsal-v2-2026-08-30`
- **objective:** The isolated candidate at `ab8cbb5a381f3628a9084b738bc0836d1636fdef` either proves sampled behavioral equivalence to the frozen target-aware outputs and no regression on fixed Level 53 seeds, becoming `PROMOTION_ELIGIBLE`, or stops with a named non-promotion outcome; canonical main remains unchanged.
- **routing:** `pack: orch-code-pack`

## Target repository

`/Users/eluckey/Documents/Codex/2026-08-30/yes-it-is-created-verified-and/work/target-aware-promotion-rehearsal`, isolated branch `codex/target-aware-promotion-rehearsal-2026-08-30`, candidate `ab8cbb5a381f3628a9084b738bc0836d1636fdef`, derived from main `76871b12ebf5c75b2681360c1941fbd7ec908012`.

## Standards owner by pointer

- Repository `AGENTS.md` at base `76871b1`.
- `solver/bot.js` at base `76871b1` for chooser locality and public contract.
- `/Users/eluckey/.orchflows/lib/packs/orch-code-pack/references/craft.md`.

## Non-goals

- Merging, pushing, or changing canonical `main`.
- Changing the engine, game rules, levels, targets, receipts, recordings, calibration, authoring, MAP-Elites artifacts, ledger, or Universe Map.
- Claiming committed `solver/target-aware-challenger.js` is byte-identical to historical `ba75b5…` source, which is absent.
- Re-estimating the accepted Levels 1-52 effect or optimizing terminal score.

## Acceptance

1. **Corrected evidence claim.** The frozen artifact records challenger SHA-256 `ba75b5a66883a63562eb7a819e339dd6b398279a7fe0178512e231c11a77dd90`; the committed source is `6b375b159c836b1eb672647b98fd9b2c6d1229bb8d04db67a18d13df118e2f15`. Promotion rests on the explicit wrapper contract plus sampled terminal equivalence, never a false byte-identity claim.
   - **oracle:** raw SHA-256 and frozen manifest comparison; **oracle_class:** deterministic; **provenance:** pre-existing.
2. **Exact wrapper contract.** The public chooser first calls the unchanged private base chooser, preserves `null`, and replaces the base move only with the first deterministic untrimmed immediate winner for a finite unmet target while no bomb exists. Public exports/defaults remain unchanged.
   - **oracle:** focused bot tests and code lens; **oracle_class:** deterministic plus judged; **provenance:** pre-existing tests, gate re-verified.
3. **Exact sampled translation.** All 15,600 ordered Levels 1-52 promoted terminal tuples equal the frozen challenger terminal tuples: win, moves-to-target, moves, score, and termination reason.
   - **oracle:** `solver/promotion-replay.js --verify`; **oracle_class:** deterministic; **provenance:** pre-existing golden artifact and checker.
4. **Fixed write-once Level 53 gate.** Against the captured pre-change 300-cell baseline on seeds `14000000-14000299`, the candidate has zero lost champion wins, zero slower both-win cells, and zero changed losing outcomes. No improvement threshold applies.
   - **oracle:** promotion replay validator and result artifact; **oracle_class:** deterministic; **provenance:** pre-existing baseline and checker.
5. **Gate can fail.** Permanent tests reject a lost win, slower win, changed losing outcome, source drift, malformed order/uniqueness, and overwrite; `docs/CHECK-CARDS.md` records scope and blind spots.
   - **oracle:** focused tests and card inspection; **oracle_class:** deterministic plus judged; **provenance:** pre-existing tests and authored-here card, gate re-verified.
6. **No ordinary regression.** Focused tests and curve health pass; the full suite has no new failure identity beyond the three preflight receipt failures.
   - **oracle:** named Node tests, `node solver/verify-loop.js`, and exact failure-name comparison; **oracle_class:** deterministic; **provenance:** pre-existing.
7. **Strict boundary.** Relative to `ab8cbb5`, changes are limited to this run's records/evidence, its ticket, and `docs/CHECK-CARDS.md`; protected gameplay and authoring surfaces remain unchanged; `git diff --check` passes.
   - **oracle:** Git diff allowlists and protected hashes; **oracle_class:** deterministic; **provenance:** pre-existing.
8. **Named outcome and owner stop.** Return exactly one of `PROMOTION_ELIGIBLE`, `RETAIN_CHAMPION`, `INCONCLUSIVE`, or `INVALIDATED`; stop before merge, push, ledger, receipt, or derived-view changes.
   - **oracle:** final evaluator and Git inspection; **oracle_class:** deterministic; **provenance:** authored-here, gate re-verified.

## Binding constraints

- Owner approval followed the corrected plan on 2026-08-30.
- Reuse Level 53 baseline identity `21ae8d14c949f9993a428fc2d6cbd078b9c086c17693efa258e4516b378d430a`; never recapture or overwrite it.
- Run promoted Level 53 once, only after all 15,600 golden cells match and candidate sources freeze. No code, threshold, seed, or gate changes afterward.
- Historical MAP-Elites and Universe checks remain pre-change evidence and are never weakened.
- Compare baseline failures by exact test name and message class, never count alone.

## Evidence

- Candidate `ab8cbb5a381f3628a9084b738bc0836d1636fdef`; base `76871b12ebf5c75b2681360c1941fbd7ec908012`.
- Candidate bot SHA-256 `6f58e6c136f58dc52df5d1b4203d0c032b497109ef4c517cd0ca1628057e1fd1`.
- Golden SHA-256 `b6fe43d6a7818868c10b40cc95399259c689bf958679f5c8fb4aa4e37e3217c8`, identity `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0`.
- Level 53 baseline SHA-256 `d8305fc9f3908ce767d4094c75363d25c4f77b7f53a49fc4af43031a4878bdde`, identity above.
- Original preflight and worklog under `.orch/runs/target-aware-promotion-rehearsal-2026-08-30/`.

## Affected surfaces

- `docs/CHECK-CARDS.md`
- `.orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/`
- `.orch/tickets/target-aware-promotion-rehearsal-v2-2026-08-30/`

## Exemplars

- Candidate `solver/bot.js` at `ab8cbb5`: preserve its explicit base-first wrapper contract, subject to exact golden replay.
- `solver/promotion-replay.js` SHA-256 `5c7ff9e9e9c8203f0ae5929c3f8adeb97c9f1f8426915aa7e4c8dc9ebc1832c0`: preserve write-once, source-bound, level-major, fail-closed evaluation.
- Existing `docs/CHECK-CARDS.md` cards: imitate their complete scope/blind-spot/enforcement structure.

## Acceptance as runnable checks

```sh
node --test solver/tests/bot.test.js solver/tests/promotionReplay.test.js
node solver/promotion-replay.js --verify --golden52 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/holdout-1-52.json --baseline53 .orch/runs/target-aware-promotion-rehearsal-2026-08-30/evidence/level53-baseline.json --out .orch/runs/target-aware-promotion-rehearsal-v2-2026-08-30/evidence/promotion-verification.json
node --test solver/tests/*.test.js
node solver/verify-loop.js
git diff --check 76871b12ebf5c75b2681360c1941fbd7ec908012..HEAD
```

## Bound

- One check card, one 15,600-cell one-arm replay, one 300-cell promoted Level 53 replay, one review/correction gate, and final verification.
- No implementation correction after Level 53 reveal; no push or merge.

## Risks

- Exact terminal equality proves sampled behavioral equivalence, not byte identity or equivalence on every board.
- The published Level 53 slice is deterministic regression coverage, not a sealed effectiveness holdout.

## Assumptions

- Candidate and harness at `ab8cbb5` are complete inputs, not authority for their own correctness.
- Published Level 53 seeds are acceptable because no tuning or positive-effect threshold is permitted.
