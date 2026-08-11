# Investigate current experimentation and testing status

- **Run:** `status-experiment-testing-2026-08-10`
- **Question:** What is the latest status of experimentation and testing in this checkout?
- **Scope/bound:** Read current `HANDOFF.md`, solver experiment scripts and tests, repository status/history, and run the existing deterministic solver test and verification commands once. No product files will be changed.
- **Source policy:** Current checkout files and reproducible command output are primary evidence. Prior-session material is context only and must be marked if it conflicts.
- **Acceptance criteria:** Report (1) the active experiment outcome, (2) passing and failing verification evidence, (3) whether the central feasibility question is answered, and (4) concrete next study boundary.
- **Oracles:** `node --test solver/tests/*.test.js`; `node solver/verify-loop.js`; current source/receipt inspection. A nonzero verification exit is evidence, not a reason to alter the checkout.
- **Provenance:** All findings must come from pre-existing files or this run's read-only command output; no independent lane is required for this bounded status question.

## Result

- **Status:** complete — current checkout inspected; no solver experiment is active.
- **Fresh verification:** `node --test solver/tests/*.test.js` passed 56/56. `node solver/verify-loop.js` exited 1: levels 1 and 11 and bomb safety passed; level 26 remained 0% against the frozen >=30% gate.
- **Experiment state:** the earlier tuning loop is terminal `blocked` by owner decision after two iterations; the later remnant-placement POC is complete as a tactical-signal test but did not improve Level 26's win rate.
- **Claim boundary:** the available score samples and tuning results are evidence about the current heuristic bot, not a policy-independent proof that the 13,000 target is impossible. The prescribed next study is frozen-scenario exact/branch-and-bound search with admissible upper bounds and small exhaustive fixtures.
- **Coverage gap:** root `package.json` is absent, so no generic project-wide package test command exists. Browser UAT material is present, but its reports are historical/manual and were not freshly run here.

## Clarification: score-limit experiment

- The solver sweep tool (`sweepLevel`) runs complete seeded games with `chooseMove`; it measures the greedy/lookahead bot's win rate and loss reasons, not a maximum-score policy.
- `findBestChain` is exhaustive for one board but is limited to bomb defusal because unrestricted DFS is too expensive. Ordinary turns use a no-backtracking greedy walk, then rank only a capped candidate set with short lookahead.
- The 500-seed Level-26 sample (median 7,842; best observed 11,370) is therefore below the 13,000 target but cannot guarantee that every legal policy runs out of moves. No policy-independent scoring bound was implemented.
- The evidence supports a level-design/scoring concern; changing the score system or target was deferred until an exact/upper-bound score-envelope study establishes which rule is load-bearing.

## Active certified-score goal progress

- **Frozen sequence:** Level 26, solver seed `0`; the seeded headless initial board and subsequent spawn stream are deterministic.
- **New production search artifacts:** `solver/exact-score.js` contains a position-aware exhaustive search for small fixtures, frozen-spawn replay, and a clearly labeled beam lower-bound search. Its small four-tile fixture has exact maximum 18 and rejects 19.
- **Replayable lower bound:** the wider deterministic beam found and replayed a 32-move legal seed-0 sequence scoring **10,132**. This is not an upper bound and does not answer whether 13,000 is reachable.
- **Current certificate status:** incomplete. A full position-aware 32-move search is much larger than the old greedy sweeps; an exact fixed-seed constraint model passed the small fixture but returned `unknown` under both two- and ten-minute budgets. `unknown` is not a feasibility result.
- **Regression proof:** `node --test solver/tests/*.test.js` passed 60/60 after the new search and replay tests were added.

## Certification follow-up (2026-08-10)

- **Regression proof updated:** `node --test solver/tests/*.test.js` now passes **61/61**, including a 40-cell visited-mask regression for the exact small-fixture enumerator.
- **Formal-model fidelity:** the temporary exact SMT model was corrected to consume spawn values in the game's column-major order. It now passes both the one-row score fixture (18 reachable, 19 unreachable) and a two-column gravity/spawn-order fixture. Its seed-0 initial board and first frozen spawn draws match the headless engine exactly.
- **Full-trace parity:** constraining that model to the deterministic 32-move JavaScript beam witness is satisfiable with exactly **10,132** points. This independently checks the witness's coordinate transitions, gravity, frozen spawns, and accumulated score, but it remains a lower-bound check.
- **Bound query:** the corrected `score >= 13,000` query returned `unknown` within a fresh 120-second Z3 budget. A cvc5 cross-check passed the fixtures but did not honor its configured 120-second limit and was stopped after 3½ minutes without a result. Neither observation is a score bound or a feasibility conclusion.
