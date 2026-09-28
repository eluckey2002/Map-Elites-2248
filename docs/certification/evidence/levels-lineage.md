# Level target chain-of-custody — 2248-challenge

Snapshot: `origin/main` at commit `ce0930a9865433254d6b16e9f42628bb4299e486` (verified via `git fetch -q origin` + `git rev-parse`).

Confirmed: `src/game.js` (`LEVELS` array, lines 33-159) has exactly **58** entries. `solver/tests/gameLevels.test.js` pins `LEVELS.length === 58` with the comment "58 since levels 54-58 shipped on 2026-09-05."

## Summary

| Verdict | Count | Levels |
| --- | --- | --- |
| TRACED | 52 | 1-50, 51, 52 |
| PARTIAL | 6 | 53, 54, 55, 56, 57, 58 |
| UNTRACED | 0 | — |

## Distinct upstream claims all 58 levels rest on

1. **DECISION-0003** (`EVIDENCE_LEDGER.md`, accepted, `owner_decision`) — a level's target is *demand* (a chosen share of measured achievable score), not a fixed step; tile scale doubles once per 10-level chapter so tiles stay on the 2/4/8/16/32/64/128 family. Governs the *rule* every subsequent level (1-58) claims to follow.
2. **RESULT-0008** (accepted, `heuristic_observation`) — the demand-based retune of levels 1-50 (100 seeds/level, seed 100000+): no level below 5% bot win rate, versus 34/50 at 0% before. Set in commit `8e1e232` (2026-08-12).
3. **RESULT-0009** (accepted) — Level 51 shipped through the authoring tracer (BL-0004): target = 70% of measured achievable score (300-seed holdout), plus direct human replay evidence. Commit `32b90b3` (2026-08-20).
4. **RESULT-0011** (accepted) — later reference-bot chain-walk tie-break fix (+5.25% median score, 2026-08-20), which is *why* Level 52's stated 0.70 demand and actual ~0.667 effective demand diverge, and why "levels 1-52" and "levels authored after" are two distinct eras of comparable target.
5. **RESULT-0012** (accepted) — Level 52 shipped, target explicitly *held* at its pre-RESULT-0011 value rather than re-derived, an explicit owner decision to not retune underneath the human who validated it. Commit `0a73bf5` (2026-08-20).
6. **RESULT-0027** (accepted, narrowed 2026-09-03) — freezes the `calib-1` evaluator for authoring (calibration solver identity `c3cefaf3...`); reproduces the gen-0014/Level-53-lineage candidate (fitted median 107,904, rounded target 102,000 — not the shipped 101,000) but explicitly disclaims retargeting or shipping Level 53. This is the mechanism levels 55-58 claim to use.
7. **RESULT-0028** (accepted) — HUMAN-PILOT-0002 recording (Level 54's geometry) replays exactly to 140,544/20 moves, seed 424242; explicitly establishes nothing about calibration for that layout.
8. **DECISION-0007** (branch `docs/owner-decisions-0007-0008` only, status **provisional**, as_of 2026-09-28 — **not on `origin/main`**) — formalizes Level 54's 126,000 target as a deliberate owner exception, and separately flags that the commit's own bot-comparison figures (105,664 median, 23.3% win rate) are invalid citations under `docs/MEASUREMENT-AND-ANALYSIS-STANDARDS.md`.
9. **CURRENT.md** (main) — states plainly that Level 53's move from rejected to shipped "carries no ledger record" and that adjudicating it is open.
10. Commit `3bcb5a6` ("Ship levels 54-58", 2026-09-05) — the sole source, other than in-code comments, for the levels-55-58 per-level median/demand/win-rate figures and for the explicit statement that they "carry no authoring receipt."

## Grouped table

### Levels 1-50 — TRACED (DECISION-0003 + RESULT-0008)

All 50 tutorial-through-chapter-5 levels (`src/game.js:35-92`) got their current targets from the single demand-based retune. Set in commit `8e1e232` ("Make every level winnable by deriving targets from measured score", 2026-08-12). Ledger: DECISION-0003 (rule) + RESULT-0008 (measurement: 100 seeds/level from seed 100000, all ≥5% win rate). Full per-level fields (target/tileScale/moves/minChain/blockers/line) are in `levels-lineage.json`.

### Level 51 — TRACED

`src/game.js:101`, target 124,000, tileScale 32, 24 moves, minChain 4, 5×7, no blockers. Origin: RESULT-0009 (authoring tracer, BL-0004's exit milestone) — 70% of measured achievable score, 300-seed holdout (seeds 100000-100299): 297 wins/0 lockouts/0 bombs, plus 3 direct human replays. Set in commit `32b90b3` (2026-08-20).

### Level 52 — TRACED

`src/game.js:112`, target 102,000, tileScale 32, 24 moves, minChain 4, 5×7, 1 stone (2,3). Origin: RESULT-0012 — 70% of measured achievable score (median 146,688; 300-seed holdout: 290 wins/0 lockouts/0 bombs), target deliberately held at its pre-RESULT-0011 value rather than re-derived (owner decision). Set in commit `0a73bf5` (2026-08-20).

### Level 53 — PARTIAL

`src/game.js:128`, target 101,000, tileScale 32, 16 moves, minChain 3, 6×5, no blockers. **No ledger record for the shipping decision.** Entered `src/game.js` via commit `530deb3` ("Integrate preserved MAP-Elites baseline evidence", 2026-08-28) — a commit about MAP-Elites evidence, not level authoring. CURRENT.md confirms: "Level 53's move from rejected to shipped carries no ledger record... Adjudicating that is open." The in-code comment cites gen-0014 receipt `043ca53f...`, and RESULT-0027 (2026-09-03) later reproduces that candidate's fitted numbers (102,000, not 101,000) but explicitly says it does **not** retarget or ship Level 53 and calls the archived receipt's old bot measurements "stale and non-quotable." Matches known answer.

### Level 54 — PARTIAL

`src/game.js:147`, target 126,000, tileScale 32, 24 moves, minChain 3, 4×8, 2 stones (1,3)/(2,3). Origin: owner exception to the demand rule, from human evidence (HUMAN-PILOT-0002 / RESULT-0028: 140,544 in 20 moves, seed 424242) — demand rule would have given 89,800. Set in commit `3bcb5a6` (2026-09-05), whose message says "deliberate exception." **DECISION-0007 formalizes this but lives only on branch `docs/owner-decisions-0007-0008`, status provisional, not on `origin/main`.** Matches known answer exactly.

### Levels 55-58 — PARTIAL

All four (`src/game.js:149-158`) were calibrated via the pipeline's `roundTarget(measured median achievable × demand)` rule under the frozen `calib-1` evaluator, 150 fit seeds + 120 fresh check seeds, zero lockouts/zero bomb losses — per commit `3bcb5a6`'s message, which also states plainly they "carry no authoring receipt." Per-level bot median/demand/win-rate figures exist only as `game.js` comments (e.g. Level 55: median 152,832, demand 0.80, win rate 88.3%; Level 56: median 120,832, demand 0.90, win rate 71.7%; Level 57: median 152,640, demand 0.85, win rate 77.5%; Level 58: median 191,104, demand 0.85, win rate 85.8%), never captured in an accepted DECISION/RESULT record. The general mechanism (`calib-1`) is TRACED via RESULT-0027, but that record predates (2026-09-03) and does not certify these five levels (shipped 2026-09-05).

Full per-level JSON (all fields, exact line numbers, blockers) is at `levels-lineage.json` in this same folder.
