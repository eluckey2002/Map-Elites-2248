# Captured-corpus oracle result — 2026-09-16

**20/20 verified wins.** Against the best human win on each exact puzzle, the
oracle is faster on 17, tied on 2, and slower on none. It also wins the remaining
loss-only puzzle. Every search, including current-bot generation, finishes within
the 30-second allowance. These statements concern this saved run only.

## Primary evidence

- Artifact: [attempt-05-full-corpus.json](runs/attempt-05-full-corpus.json).
- Report identity: `397ca4631966e659bbedbd8f5e1e7c41fa39fd04ad973d9fb6443ec6b80dee05`.
- Corpus identity: `59daa4e54dceef9b5da7eacb730d3cecb08f43fc389f9721adec6b4c3dc31308`.
- Mechanism identity: `7b9b7592bf2ed880af95041ca4e2dc87138308bb9f212125682a4138bd5ded1c`.
- Runtime: Node v26.0.0, darwin/arm64.
- Command: `node solver/oracle/cli.js --out docs/oracle/runs/attempt-05-full-corpus.json --budget-ms 30000`.
- Observed final verification: `{"valid":true,"pass":true,"puzzles":20,"wins":20}`; exit 0.

Reproduce with a new output filename, then verify the saved report:

```bash
node solver/oracle/cli.js --verify docs/oracle/runs/attempt-05-full-corpus.json
node solver/oracle/cli.js --show docs/oracle/runs/attempt-05-full-corpus.json --puzzle 8de7adce
```

Hashes bind the producing sources and frozen corpus. A later source change needs
a new run or verification from this version; do not re-sign the old artifact.

## Move comparison

Saved = best human winning moves minus oracle moves. A dash means no recorded
human win. Level numbers are labels, not puzzle identities: Level 54 seed 1 is
the archived tighter-pace candidate, and the two Level 52 seed-777 rows have
different blockers. Compare the identified puzzles, never just their labels.

| Puzzle | Level | Seed | Human | Bot | Oracle | Saved | Search seconds | Termination |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1726f3e5 | 53 | 424242 | 19 | 15 | 13 | 6 | 18.406 | portfolio-complete |
| 24a49a4c | 58 | 4010386357 | 15 | 17 | 11 | 4 | 26.466 | portfolio-complete |
| 2bb321b4 | 53 | 2 | 13 | 11 | 9 | 4 | 13.982 | portfolio-complete |
| 3214dbd4 | 54 | 1 | 16 | 16 | 13 | 3 | 29.855 | time-budget |
| 342fa036 | 52 | 2173441018 | 11 | 12 | 9 | 2 | 14.855 | portfolio-complete |
| 3808ee88 | 54 | 2832419099 | 16 | 16 | 14 | 2 | 17.829 | portfolio-complete |
| 3e0d1c86 | 54 | 424242 | 20 | 19 | 16 | 4 | 18.226 | portfolio-complete |
| 6b0d3ffd | 57 | 2389915636 | 15 | 15 | 11 | 4 | 23.889 | portfolio-complete |
| 742e23f0 | 52 | 777 | 11 | 10 | 8 | 3 | 9.819 | portfolio-complete |
| 783ac318 | 54 | 1044860360 | — | 19 | 15 | — | 16.457 | portfolio-complete |
| 7ab85e63 | 54 | 3310936729 | 16 | 15 | 15 | 1 | 16.305 | portfolio-complete |
| 81d2beb2 | 53 | 10 | 12 | 12 | 10 | 2 | 18.199 | portfolio-complete |
| 8de7adce | 56 | 1761047823 | 10 | 12 | 10 | 0 | 16.343 | portfolio-complete |
| 8fe7db24 | 58 | 4255346895 | 16 | 19 | 13 | 3 | 29.852 | time-budget |
| a2577c1f | 51 | 1 | 12 | 13 | 11 | 1 | 26.173 | portfolio-complete |
| aa9efa2f | 56 | 3504920448 | 11 | 12 | 11 | 0 | 27.041 | portfolio-complete |
| abcba517 | 55 | 2600645753 | 14 | 14 | 11 | 3 | 20.208 | portfolio-complete |
| bd5bda0e | 52 | 1 | 15 | 16 | 9 | 6 | 16.968 | portfolio-complete |
| c1bd39cb | 54 | 1313839221 | 15 | 23 | 14 | 1 | 13.983 | portfolio-complete |
| ebe52ad4 | 52 | 777 | 16 | 19 | 11 | 5 | 19.386 | portfolio-complete |

Total recorded search time is 394.242 seconds; maximum per puzzle is 29.855
seconds. The maximum parent-controller elapsed time, including worker startup
and result transfer, is 29.950 seconds. Loading took 0.101 seconds; per-row replay
and baseline-policy validation totaled 14.998 seconds, outside search. The final
whole-report verification repeats those checks and takes additional time.

Search recorded 251,860 expanded beam states and 11,726,680 generated actions.
Eighteen rows completed their bounded portfolio; two reached the internal time
budget with valid winning incumbents. Neither stopping condition proves optimality.

## Goal proof

> Deliver a reproducible authoring oracle that independently wins every exact
> puzzle in the frozen current captured-human-play corpus and reaches the target
> in no more moves than the owner's best verified winning attempt, using a
> 30-second search budget per puzzle.

| Proof condition | Evidence |
| --- | --- |
| Freeze all captures and compare exact puzzles | `corpus.json`: 25 replayed recordings, 20 puzzle identities; source-pinned identity checked against actual files |
| Independent search, no human move inputs | `cli.js:runPuzzle` sends only level, seed and budget; `worker.js` imports search, not the corpus or human recordings |
| Win and meet the best human pace on every eligible puzzle | All 20 report rows replay legally; 19 non-null human comparators are met or beaten |
| Preserve current-bot wins | Every baseline's action choices replay as the current policy; every oracle move count is no larger |
| Full game semantics and first target crossing | Separate verifier uses `benchmark-replay.js` and the engine; every post-move board, score and spawn cursor agrees |
| Thirty-second budget includes baseline and search | Child and controller timing fields, internal reserve and parent-process deadline; no row exceeds the budget |
| Inspectable replay and qualified checker | Every chain and post-move board retained; `--show` renders chain order; qualification attempt 2 has 14 passing positive/negative tests |
| Preserve historical evidence and shipped behavior | Failed/partial attempts remain in `runs/`; no changes to game, engine, live bot, calibration, captures or candidate archives |

The witnesses prove these targets are reachable within the listed move counts.
They do **not** prove those counts minimal. These are inspected development
puzzles, not fresh validation. Future-board superiority and human difficulty
remain unknown. No level target or authoring acceptance threshold is changed.
