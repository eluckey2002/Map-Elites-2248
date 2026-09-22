# RESULT-0048 — family-island persistence and refill search

## Outcome

**Closure: `CLOSED`. Primary outcome: `ISLANDS_SUFFICIENT`.**

The single registered run completed all 4,096 openings and all four paired
refill arms, for 16,384 deterministic games. The corpus verifier accepted the
artifact identity, opening matrix, source closure, paired arms, and contiguous
traces. Independent recomputation returned the same primary outcome.

This outcome means blue-only refills produced enough candidate boards in every
target family to proceed to human playtesting. It does not mean mixed-family
spawns have no effect, and it does not authorize a spawn-rule or gameplay
change.

## P1 — islands alone sustain family play — SUPPORTED

P1 is **SUPPORTED**. Under blue-only refills, every target family exceeded the
registered minimum of 10 move-six-sustained boards and five conversion-rejoin
boards:

| Family | Boards | Sustained at move 6 | Conversion rejoined later |
| --- | ---: | ---: | ---: |
| 3 | 1,024 | 396 | 136 |
| 5 | 1,024 | 350 | 164 |
| 7 | 1,024 | 288 | 175 |
| 9 | 1,024 | 271 | 181 |

## P2 — mixed spawning supplies candidates when islands do not — FALSIFIED

P2 is **FALSIFIED by its frozen conditional rule** because P1 passed; mixed
spawning was not required to discover viable candidates. P3 therefore returns
`ISLANDS_SUFFICIENT`.

## P3 — scoped disposition — SUPPORTED

P3 is **SUPPORTED** with disposition `ISLANDS_SUFFICIENT`. The frozen P1/P2
routing rule returns that disposition. This routes the
retained island-only openings to human playtesting and makes no production
spawn-rule decision.

## What the refill arms actually did

| Refill arm | Still split into viable islands after move 2 | Sustained at move 6 | Conversion-rejoin boards |
| --- | ---: | ---: | ---: |
| Blue only | 1,925 (47.0%) | 1,305 (31.9%) | 656 |
| 25% target family | 2,648 (64.6%) | 2,272 (55.5%) | 1,610 |
| 50% target family | 2,843 (69.4%) | 2,409 (58.8%) | 1,352 |
| 75% target family | 2,610 (63.7%) | 2,512 (61.3%) | 774 |

Mixed spawning is therefore still a strong pressure/duration lever. The result
only says it is unnecessary for finding the first human-test candidates.

The three-vertical-island template was the clearest blue-only source: 594 of
the 1,305 sustained boards used it. The two-vertical-island template supplied
another 360. Across all blue-only sustained candidates, the frozen recommended
goal was usually six moves (median and interquartile value), with a median
score target of 1,184. Those are trace properties, not adopted level goals.

Representative highest-ranked blue-only candidates by family are:

| Family | Seed | Template | Trace goal | Full 16-move score |
| --- | ---: | --- | --- | ---: |
| 3 | 44,003,516 | vertical-3 | 306 in 5 moves | 1,026 |
| 5 | 44,003,157 | vertical-3 | 110 in 3 moves | 894 |
| 7 | 44,003,678 | vertical-3 | 966 in 8 moves | 1,808 |
| 9 | 44,003,991 | horizontal-4 | 1,262 in 7 moves | 3,086 |

These four examples are navigation into the retained corpus, not a claim that
they will be fun or difficult for a human.

## C1 — clean production-seam baseline — PASS

Deterministic replay was byte-identical. All five templates produced their
declared target-family counts and disconnected island counts, and all 4,096
unique confirmation openings completed their four paired arms.

## C2 — positive refill manipulation — PASS

The exact confirmation refill seam produced only blue-family tiles at rate
zero and only target-family tiles at rate one on the frozen five-hole fixture.

## C3 — known-kill family-classification mutation — PASS

A disposable classifier that assigned 54 to family 3 and 60 to family 5
failed the public exact-root control as required. The registered source was
unchanged and retained its frozen hash.

## C4 — known-kill pairing and artifact mutations — PASS

The public verifier rejected a missing paired arm and separately rejected an
outcome changed after artifact identity was calculated. The retained corpus
passed both checks.

## C5 — objective equivalence — PASS

Every opening has all four unique arms with the same dimensions, move limit,
scoring, chain rules, screening policy, opening identity, spawn-seed identity,
and target family. Only refill family rate changes before gameplay paths
diverge.

## C6 — restoration and suite — PASS

All 12 frozen source identities were restored, the six focused tests passed,
and the exact synthetic closeout route passed. The first synthetic fixture was
rejected because it omitted `summary.P3`; the corrected fixture passed before
any reportable seed was opened.

The active design worktree has one pre-existing UI-title test failure in
addition to the repository's four documented failures. The experiment diff
does not touch that UI or any solver test. A clean git-backed checkout of the
qualified experiment commit reported the required 420 tests, 415 passes, four
documented failures, and one skip. No experiment-caused suite failure appeared.

## Evidence boundary

The screening policy is a deterministic greedy candidate generator, not a
human model or the shipped target-aware bot. The result generalizes only to
the registered 4,096-opening panel, five templates, four target families, and
16-move bound. It establishes candidate availability, not player strategy,
fun, difficulty, or a production rule. Human play on selected boards is the
next admissible decision point.
