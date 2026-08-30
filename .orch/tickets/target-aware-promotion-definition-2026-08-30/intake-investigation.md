# Investigation: smallest target-aware promotion rehearsal

- **status:** complete
- **question:** What is the smallest regression-gated experiment that can test promotion of the supported target-aware rule without changing canonical main automatically?
- **source policy:** Current map experiment artifacts and source; Git objects for current `main`; current-main promotion and baseline files read only.
- **bound:** Promotion seam, regression surfaces, exact branch/source identities, and Level 53 coverage only.
- **verification:** Findings are directly checkable from the cited Git/source/artifact identities; no candidate was implemented or run.

## Findings

1. **The tested rule can be ported as a wrapper without changing the old chooser's body.** The fixed challenger first calls the existing `chooseMove`, then replaces that choice only with the first deterministic untrimmed route that reaches the target now; it refuses the override when any bomb exists. The smallest production shape is therefore to rename the current body to a private base chooser and wrap it with the same fixed helper. Confidence: high. Sources: `solver/target-aware-challenger.js` SHA-256 `ba75b5a66883a63562eb7a819e339dd6b398279a7fe0178512e231c11a77dd90`; `solver/bot.js` SHA-256 `9abe8ca83dc26d8596320ce3e9b84aae9e3c342e6e79cac2c4c743c43c70b840`.
2. **Current main has the same champion and engine as the tested baseline.** `main` is `76871b12ebf5c75b2681360c1941fbd7ec908012`; its `solver/bot.js` and `solver/engine.js` hashes exactly equal the tested branch. The only product-code difference between `map-elites-learning` and main is the addition of shipped Level 53 in `src/game.js`; Levels 1-52 are unchanged and their JSON projection hash is `dfa4cbb20140a17fbfa03a6f157575c8c905f5dbf564142ffc9d7ab6e2dcb7a9`. Confidence: high. Sources: `git diff map-elites-learning..main -- solver/bot.js solver/engine.js src/game.js`; `git show main:src/game.js`.
3. **The 15,600-cell artifact can serve as an exact golden regression oracle, avoiding another two-arm 1-52 experiment.** A promoted `chooseMove` can replay each level/seed and must exactly equal every frozen challenger terminal tuple. This checks the port, not a new statistical claim. Confidence: high. Source: holdout artifact identity `83316f3055bb136b181dcf8e837989ead0f3c1e39ab78a7f1c777eeb64b059b0`, file SHA-256 `b6fe43d6a7818868c10b40cc95399259c689bf958679f5c8fb4aa4e37e3217c8`.
4. **Only Level 53 needs new paired regression evidence.** It ships on current main but was absent from baseline `be843368`. Capture the old main champion on one fixed 300-seed set before editing, then compare the promoted chooser on those identical seeds. Confidence: high. Sources: `src/game.js` on main, Level 53; target-aware v2 evaluation spec, Levels 1-52 only.
5. **An actual main merge has a larger bookkeeping surface than the rehearsal.** The Universe Map pins the champion hash, while the historical MAP-Elites verifier intentionally requires the old protected champion. The rehearsal should not weaken either verifier: it stops on an isolated candidate branch. A later approved promotion must update current derived views/records while preserving the historical safety ref. Confidence: high. Sources: `universe/resolved.json`; `solver/verify-map-elites.js`; `tools/verify-universe-map.js`.
6. **Execution cannot safely start from the repository's current dirty state.** The supported target-aware artifacts in this worktree are uncommitted, and current main also contains unrelated untracked run/ticket paths. Preserve/resolve those owner-owned changes before creating the isolated promotion worktree; do not clean, overwrite, or absorb them speculatively. Confidence: high. Source: `git status --short` in both registered worktrees.

## Contradictions

- The old experiment's MAP-Elites verifier defines success as an unchanged champion, while a promotion necessarily changes the champion. This is intentional historical protection, not a gate to weaken. Resolve it by running the old verifier before the candidate change and preserving its safety commit; use the new promotion regression oracle after the change.
- Current main describes 53 shipped levels, while the supported holdout contains 52. The first 52 remain transferable because bot, engine, and their level projection are identical; Level 53 requires the one new paired slice.

## Dead ends

- The existing untracked main ticket named `2026-08-30-target-aware-promotion-experiment` contains only an in-progress investigation contract, not findings or an accepted experiment. It was left untouched.
- A curve-health probe was started on current main but had not completed within the inspection window, so no result from it is used here; the accepted experiment must capture a fresh pre/post baseline itself.

## Gaps and bound

- No current-main baseline suite result is claimed here; execution must capture it before any bot edit and compare failure identities afterward.
- No Level 53 seeds were consumed. The proposed `14000000-14000299` range was not found in the inspected promotion/evaluation sources and remains unobserved until the protocol is approved.
- No implementation, benchmark, commit, push, merge, ledger update, or derived-view update was performed.
