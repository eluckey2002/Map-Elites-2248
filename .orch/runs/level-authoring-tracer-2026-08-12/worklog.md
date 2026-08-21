# Worklog: level-authoring tracer

- **run:** `level-authoring-tracer-2026-08-12`
- **spec:** `.orch/runs/level-authoring-tracer-2026-08-12/spec.md`
- **tickets:** `.orch/tickets/level-authoring-tracer-2026-08-12/`

## Goal

### Objective

The repository can turn one declared level shape and pacing intent into a measured-target candidate, open that candidate as a seeded playable level, and persist a replayable human playthrough without changing the 50 shipped levels.

### Acceptance

1. A target-free shape manifest deterministically yields a measured candidate and canonical receipt.
2. A disjoint 300-seed holdout passes the candidate fairness floor and records its terminal outcomes.
3. A fail-closed localhost authoring server serves candidates and persists valid recordings.
4. Seeded custom play uses the existing game path and captures one complete playthrough.
5. Shipped level identity, curve health, regressions, and authorized-path scope stay green.
6. The result follows the repository's explicit CommonJS and small-module idiom.

## State

- **opened:** 2026-08-12T14:55:02Z
- **intake revision:** `e76bab5607cb32198c875fa3b1bba43fbc773a0e` (`Activate level authoring tracer`).
- **code baseline:** `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`; the intake commit changes only planning and run records and will receive the verified code result after the isolated gate.
- **workspace:** `.orch/runs/level-authoring-tracer-2026-08-12/workspace/repo` on branch `codex/level-authoring-tracer`, clean at `8e1e2328e731b2b7ca4b9b4bc90364fc79acfcf6`.
- **baseline evidence:** `node solver/verify-loop.js` passed all seven checks; `node --test solver/tests/*.test.js` passed 73 tests with 0 failures.

## Iterations

### Iteration 1 — intake frozen

- Completed intake evidence packet: `.orch/tickets/level-authoring-tracer-2026-08-12/intake-investigation.md`.
- Frozen code spec: `.orch/runs/level-authoring-tracer-2026-08-12/spec.md`.
- Planning state corrected append-only: `BL-0001` blocked with the parked proof track; `BL-0004` active for this tracer.
- Clean isolated worktree established with provenance at the code baseline and baseline checks green.
- Issued `authoring-tracer` as the sole ready tracer ticket and dispatched `/root/authoring_tracer` under `orch-tdd`; the caller will recheck ticket/worktree state no later than the 180-minute item bound and at normal tool-call boundaries.
- Next: join the executor result, then run the one independent code gate.

### Iteration 2 — one gate correction and final verification

- The executor result at `dee3083965447be2de520e62b2872326f7d8214d` crossed the independent code gate. The review at `review.md` SHA-256 `5cd5506710443d7ce6b1f154c63eeb7645dccd83ee8c826806484f343223c9c5` validated three defects: Undo left candidate capture/RNG state divergent; receipt verification accepted self-identified false fitting evidence; and explicit invalid tile scales defaulted instead of failing closed.
- The one authorized repair pass committed `9fb28b021bc4cdb8b5309ff6986c5a317cd7bf1f`. Its regression controls first failed for the three demonstrated defects, then focused checks passed 19/19. The repaired authoring-code identity correctly invalidated the generated receipt, so the caller refreshed the authorized derived receipt and committed `2e26ad26ab725300b6441edaa21864162703fe54`.
- Fresh final verification at `2e26ad26ab725300b6441edaa21864162703fe54` records AC-1, AC-2, AC-3, AC-5, and AC-6 as `PASS`. AC-4's deterministic portion passed 12/12, but its required rendered browser smoke is `UNVERIFIED`; the Browser runtime had no available tab. Exact evidence is retained in `repair.md` and `verification.md`.
- The result is parked, not complete and not a product failure. The sole resume condition is a connected browser for the exact local candidate smoke. No second correction pass is available in this run.

### Iteration 3 — external rendered-smoke gate closed

- A user-run macOS local render at `http://127.0.0.1:54717/index.html?candidate=51&seed=1` supplied the required AC-4 display evidence against unchanged result `2e26ad26ab725300b6441edaa21864162703fe54`.
- The preserved screenshot at `evidence/rendered-smoke-2026-08-12.png` has SHA-256 `4d91228e1c297878af637d380901f9038bbfe99c1e3453f71d0e42c47c80567d` and visibly shows Level 51, `Candidate 51 · seed 1 · ready`, and a 5x7 board.
- The gate did not infer unshown console or final-recording state. Its display verdict is `PASS`; existing deterministic AC-4 coverage remains the evidence for capture behavior. All frozen completion criteria now pass, so the join accepted the ticket.

### Iteration 4 — evidence-state correction

- Focused source-versus-note audit `.orch/audits/recording-replay-closure-2026-08-12/` found that Iteration 3's display-only evidence was promoted into an unobserved human terminal recording and replay result. The independent review confirmed the fixed worktree's `recordings/` directory contains only `.gitkeep`, while the preserved screenshot is the ready state rather than a terminal saved state.
- The server and deterministic tests remain valid capability evidence, but their synthetic temporary-directory fixture is not a recorded human session and the bounded source inventory found no semantic replay consumer or test.
- The ticket is restored to `suspended` pending one source-pinned human terminal recording and independent replay or semantic verification of its candidate, seed, chains, score, moves, and outcome. No source code or candidate data changed.

## Blame classes

- **caller under-supplied:** The repair packet omitted the receipt artifact whose authoring-code identity necessarily changes during a verifier repair. The child correctly left it untouched; the caller regenerated the receipt within the original ticket's authorized path and reverified it before final verification.

## Failed approaches

[]

## Queued scope

- Batch generation up to five accepted levels remains outside this tracer.
- Shipping any candidate into `LEVELS` remains owner-gated follow-up work.
- Human candidate acceptance and any evidence-ledger admission follow the playable result.
- The rendered candidate smoke was the sole gate-owned continuation and is now complete; its source-pinned result is recorded in Iteration 3. No continuation remains inside this tracer ticket.
- Correction: the display smoke remains complete, but the separate end-to-end human recording and replay/semantic-verification evidence remains open for the next round.
- Resolved 2026-08-17: see Iteration 5. Queued scope unaffected — batch generation, shipping to `LEVELS`, and ledger admission remain owner-gated follow-up work outside this tracer.

### Iteration 5 — recording found, independently replayed, and owner-confirmed

- A real (non-placeholder) recording, `recordings/8ac6c9d4c533e92769438127be1ba8fccac89bd49b47cc8b7afd8814615315d6.json`, was found present in the fixed worktree at unchanged result `2e26ad26ab725300b6441edaa21864162703fe54`, bound to the correct candidate identity.
- A from-scratch replay against `solver/engine.js` reproduced the recording's exact score (59584), moves (24), and outcome (`lose` / `out of moves`); a separate independent context re-derived the same result from primary sources without reusing the first script, and ruled out test fixtures and the bot's own self-play as accidental sources. Evidence: `.orch/audits/recording-replay-verification-2026-08-17/finding.md` and `verdict.md`.
- The owner directly confirmed having played candidate 51. Combined with the independent replay, this closes AC-4's outstanding requirement.
- Full detail appended to the ticket's **Recording and replay verification — 2026-08-17** section.

### Iteration 6 — input-handling parity fix while replaying candidate 51

- The workspace's `src/game.js`/`src/index.html` still used the original drag-to-chain input, which the shipped game replaced with click-to-select-then-submit (main-repo commit, this session, unrelated to this ticket's scope) because it doesn't work on a trackpad.
- Applied the identical input-handling change here (`handleStart`/`handleMove`/`handleEnd` → `handleTileClick`/`submitChain`/`clearChain`, plus the Submit button and Enter/Escape bindings) so the owner could actually play candidate 51 live via the authoring server. `AuthoringCapture`'s recording hook in `executeChain` and all authoring/custom-session code were untouched.
- Both files are within this ticket's `write_scope`. No game rule, scoring, chain-legality, candidate data, or curve behavior changed — confirmed by inspection, not a new test run.

### Iteration 7 — second human recording, after the input fix

- With Iteration 6's input fix live, the owner played candidate 51 seed 1 again and won: 12 moves, score 127040 (target 124000), 3 stars, best chain 27. Saved as `recordings/1c87356748ee23c9388d27f6c66ae60ed7d448f2f327f27dbe4d36a46ea6a0d0.json`.
- Replayed from scratch against `solver/engine.js`, same method as Iteration 5: zero discrepancies, exact score/move/outcome match.
- The board is now genuinely instrumented across three complete sessions on the same seed: the original human loss (drag input, 24 moves, 59584), the bot's self-play (17 moves, 152512), and this win (12 moves, 127040, fewer moves than the bot used). This is consistent with the earlier loss being an input-handling artifact rather than a level-design or human-skill problem — no conclusion is drawn beyond what these three sessions show.

### Iteration 8 — third human session, then owner acceptance and shipping

- A third session on the same seed (different strategy, deliberately): `recordings/78749fc07834f892542e7abd3317e9ed0b124082fe5b9b36876dac5918aa4b40.json`, win, 14 moves, score 130496. Replayed from scratch: zero discrepancies, exact match.
- Owner's verdict, quoted: "I honestly liked it. It is a really good balance because... I just went back and played the level again and tried a different strategy... while i didn't almost die and had 12 moves less, it also has this tension that you might make the wrong mistake once and it could block you and make it really close." Two different winning strategies (12 moves/127040, 14 moves/130496) on one board is the acceptance evidence — a bot win rate alone never showed this.
- Owner authorized shipping in conversation: "SHIP IT!"
- Candidate 51 added to shipped `LEVELS` in `src/game.js` as Level 51, continuing the tile-scale ladder (16→32). `solver/tests/gameLevels.test.js`'s level-count assertion updated 50→51. Full suite re-run: 73/73 pass. `node solver/verify-loop.js`: 7/7 checks pass, `51/51` on the target/tileScale check. Manually verified Level 51 loads and plays correctly through the ordinary game (`src/index.html?level=51`), not just the authoring server.
- Ledger record: `EVIDENCE_LEDGER.md`, `RESULT-0009`.

## Terminal

- **status:** suspended — the rendered startup gate passed at `2e26ad26ab725300b6441edaa21864162703fe54`, but a human terminal recording and independent replay/semantic verification were not demonstrated. See the append-only correction in `verification.md` and the ticket. **Superseded 2026-08-17, see below — left in place per append-only convention.**
- **status (current):** complete — Iteration 5 closes the sole remaining gap. All six frozen completion criteria (AC-1 through AC-6) are `PASS`; weakest oracle class is `judged`. Queued scope (batch generation, shipping, ledger admission) remains outside this tracer and is unaffected.
