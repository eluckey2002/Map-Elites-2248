# Certification results — Final pass (jobs 1-5)

Snapshot: `origin/main` at `fee085896a658d1461d76c3353e26659cdec72c6` (fetched and checked out into a scratch clone; no writes made to the working repo). All jobs run one at a time, `nice -n 5`, no CPU contention.

| # | Job | Command | Runtime | Expected | Observed | Verdict |
|---|---|---|---|---|---|---|
| 1a | Level 55 target recompute (CK-12) | `solver/level-author.js` `deriveCandidate` (shape from `src/game.js`, demand 0.80 from its comment, frozen calib-1, fit seeds 0-149) | ~78s | shipped target 122000 | measuredMedian 152832, recomputedTarget 122000 | MATCH |
| 1b | Level 57 target recompute (CK-12) | same method, demand 0.85 | ~79s (same run) | shipped target 129000 | measuredMedian 152640, recomputedTarget 129000 | MATCH |
| 1c | Level 58 target recompute (CK-12) | same method, demand 0.85 | ~79s (same run) | shipped target 162000 | measuredMedian 191104, recomputedTarget 162000 | MATCH |
| 2 | RESULT-0008 reverify (CK-01) | `node solver/verify-loop.js` | 1124.86s (18.7 min) | `RESULT: PASS`, exit 0 | `RESULT: PASS`, exit 0, all 7 checks pass (level 50: 97% win, 0% lockouts) | STALE (numeric mismatch): exit 0 and RESULT: PASS, but level 50 wins 97% with 0 lockouts, not the record's 37-100% range with late-level lockouts; the ledger already marks RESULT-0008 `stale` |
| 3 | Levels 1-50 target recompute (CK-12), 10-level sample | Custom script reproducing `solver/game-tester.js`'s shipped `powers2` policy (live bot, 150 seeds from 0, sawtooth demand within power-of-two chapters) for a fixed-seed (20260927) random sample of 10 of levels 1-50 | 2372.07s (39.5 min) | shipped targets | **10/10 mismatch**, recomputed target higher than shipped by a strikingly uniform ~28% across every sampled level regardless of chapter (levels 4, 8, 15, 16, 17, 24, 30, 36, 39, 48) — see detail below | MISMATCH (10/10), explained, not a level defect — see notes |
| 4a | RESULT-0009 reverify (verify-loop portion) | `node solver/verify-loop.js` | (reused job 2's run) | `RESULT: PASS`, `51/51` on target/tileScale check | `RESULT: PASS`, but current tool no longer prints a `N/N` count (now 58 levels shipped, tool prints a sampled table instead) | PARTIAL MATCH — outcome (PASS) matches, exact printed format is stale (pre-existing drift, matches levels-2026-09-28.md's noted pattern) |
| 4b | RESULT-0009 reverify (test-suite portion) | `node --test solver/tests/*.test.js` | 115.36s (measured wall; test runner parallelized) | 73 pass | 579 pass, 9 fail (588 total) | MISMATCH on exact count — stale expectation, suite has grown; see failing-test detail below |
| 4c | RESULT-0012 reverify (verify-loop portion) | `node solver/verify-loop.js` | (reused job 2's run) | `RESULT: PASS`, `52/52` on target/tileScale check | `RESULT: PASS`, same format drift as 4a | PARTIAL MATCH |
| 4d | RESULT-0012 reverify (test-suite portion) | `node --test solver/tests/*.test.js` | (reused job 4b's run) | 82 pass | 579 pass, 9 fail | MISMATCH on exact count — same stale expectation |
| 5 | Level 52 fixed-bot holdout diagnostic (CK-06 for RESULT-0012) | Custom script: same 300-seed holdout (seeds 100000-100299) and terminal-outcome method as RESULT-0012, run against (a) the current `solver/bot.js` and (b) the frozen `calib-1` evaluator | 7173.98s (119.6 min) | diagnostic re-check of recorded 290/300 wins, 0 lockouts | current bot: **300/300 wins, 0 lockouts, 0 bombs**; calib-1 frozen: **296/300 wins, 0 lockouts, 4 out-of-moves, 0 bombs** | Observed counts on seeds 100000-100299 only (post hoc diagnostic; supports no claim beyond this panel) |

**Total runtime: ~11,943s (~199 minutes, ~3.3 hours).** No processes left running (confirmed via `pgrep` after each job and at the end).

## Job 3 detail (per-level)

| level | scale | measured median | demand | recomputed target | shipped target | ratio (shipped/recomputed) |
|---|---|---|---|---|---|---|
| 4 | 1 | 7744 | 0.3267 | 2500 | 1850 | 0.740 |
| 8 | 1 | 7312 | 0.6422 | 4650 | 3350 | 0.720 |
| 15 | 2 | 16384 | 0.6833 | 11100 | 8100 | 0.730 |
| 16 | 2 | 15872 | 0.7167 | 11300 | 8300 | 0.735 |
| 17 | 2 | 16180 | 0.75 | 12100 | 8800 | 0.727 |
| 24 | 4 | 28360 | 0.6867 | 19400 | 13600 | 0.701 |
| 30 | 4 | 34560 | 0.90 | 31100 | 22300 | 0.717 |
| 36 | 8 | 63616 | 0.8089 | 51400 | 37200 | 0.724 |
| 39 | 8 | 51168 | 0.9222 | 47100 | 32500 | 0.690 |
| 48 | 16 | 96416 | 0.9711 | 93600 | 66400 | 0.709 |

Tile scale matched shipped in all 10 cases; only the target number differed, on all 10 sampled levels, by a shipped/recomputed ratio of 0.69-0.74. This run used today's bot, not the bot that set these targets, so it is not a like-for-like recompute. The like-for-like check is `results-oldbot.md`: with the code at `8e1e232` every Level 1-50 target reproduces exactly. No claim is made here about why today's bot scores higher; that would need its own registered protocol.

## Job 4 failing tests (9 of 588)
`LIVE: every generalizing result in this ledger has a protocol or a grandfather entry`; `the real ledger cites only paths and commits that exist` (+3 related citation-resolution sub-tests); `a real revision and checkout label pass`; `every SHA in a real plural commit list passes`; `candidate-levels-52.json has a receipt that verifies against the current bot`; `candidate-levels-54.json has a receipt that verifies against the current bot`; `the builder is byte-stable and the committed generated views are current`. The two candidate-receipt failures are the active Level 52 and Level 54 receipts (`solver/candidate-levels-52.receipt.json`, `solver/candidate-levels-54.receipt.json`), which `AGENTS.md` documents as known, deliberate stale-receipt failures; they are unrelated to Level 53's archived receipt `043ca53f`. The Universe Map check (`the builder is byte-stable and the committed generated views are current`) is the third genuine, documented failure: the Universe Map is really stale. Only the remote-ref citation failures are scratch-clone artifacts; CI at the same commit shows exactly the three documented failures.

## Corrections to prior agent output
None beyond what levels-2026-09-28.md already records. The RESULT-0009/0012 reverify commands' stated pass counts (73, 82) and `verify-loop.js`'s stated `N/N` format are stale relative to the current tool and test suite, as levels-2026-09-28.md's own pattern of "line ~NNN references pointed at a layout that had moved" predicts — not a new defect, just confirmation that the reverify text itself needs updating.
