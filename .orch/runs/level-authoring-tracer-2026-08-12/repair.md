# Repair receipt: level-authoring tracer gate findings

- **run:** `level-authoring-tracer-2026-08-12`
- **workflow:** one permitted `orch-repair` pass after the independent gate
- **accepted defect set:** [`review.md`](review.md), SHA-256 `5cd5506710443d7ce6b1f154c63eeb7645dccd83ee8c826806484f343223c9c5`
- **repair revision:** `9fb28b021bc4cdb8b5309ff6986c5a317cd7bf1f`
- **derived-receipt refresh:** `2e26ad26ab725300b6441edaa21864162703fe54`
- **status:** repaired and reverified; rendered-browser evidence remains outside this repair

## Per-defect disposition

1. **PASS — Undo preserves a replayable candidate session.** `Game.saveState` now snapshots the authoring capture length and the state of a seeded RNG; `Game.undo` restores both when the session supports them. The candidate-only regression proves an executed move, capture, RNG consumption, Undo, and replacement RNG draw return to the same capture length and seeded stream. It prevents the previously observed chain-count mismatch at recording submission.
2. **PASS — Receipt verification remeasures fitting evidence.** `verifyCandidate` now derives the source shape from the receipt/candidate contract, validates the level-derived tile scale, reruns the fitting range, verifies the fitting measurement and median, and recomputes the target rounding before it runs the holdout. New negative controls resign a false fitting record, false median, false target, and false tile scale; each is rejected. A self-identified content hash is no longer treated as proof that the content is true.
3. **PASS — Explicit invalid tile scales fail closed.** The browser seam defaults a missing legacy `tileScale` only; explicit `0`, `NaN`, and `null` now reach integer validation and are rejected. The regression tests cover all three values.

## Rerun evidence

- Before repair, `node --test solver/tests/levelAuthor.test.js solver/tests/customLevel.test.js` produced three intended failures: false fitting evidence accepted, explicit invalid tile scale accepted, and Undo leaving capture/RNG state divergent.
- After repair, the affected suite passed **19/19**; the fresh final check passed `levelAuthor` **7/7**, server **5/5**, custom-play plus query behavior **12/12**, and the full solver suite **90/90**.
- `node solver/author-level.js --verify solver/candidate-levels.json solver/candidate-levels.receipt.json` passed at the refreshed identity: candidate `524f37c0063d61e5ab4b636b720f3cd644ec83cba62324e48304d5a12bb3dd5c`, receipt `f113a598faba9a2d190d5c10d3bb4a2eb072cdb772f904aed6ce5ff2759f62d9`, 297 holdout wins, 0 lockouts, 0 bombs, 300 total.
- The repaired `--write` command was run twice in succession. Both retained canonical store SHA-256 `49920ea643bbb060fc351be38f46ad5382513713becc0b05e491c1e921a73f33` and receipt-file SHA-256 `4886484a092f03da0fd0cb638b8f514cf3215e837ba3002d4acee1db0f719878`; the second write left the worktree clean.
- The frozen `LEVELS` hash stayed `162fff8123052a8eb5a3584172115844d6ea4675657b6005e1120cdad80e7cff`; `node solver/verify-loop.js` passed all seven checks; the baseline diff remains exactly the twelve ticket-authorized paths; and `git diff --check` is clean.

## Scope and remaining boundary

The repair touched only `solver/level-author.js`, `solver/tests/levelAuthor.test.js`, `src/game.js`, and `solver/tests/customLevel.test.js`; refreshing `solver/candidate-levels.receipt.json` was required because the receipt intentionally binds the authoring-code identity. No shipped level, rule, target curve, ledger, backlog, or handoff changed. Candidate 51 remains heuristic proposal data, not shipped or accepted evidence.

The required rendered smoke is not repaired or inferred here. It remains the sole final-gate criterion.
