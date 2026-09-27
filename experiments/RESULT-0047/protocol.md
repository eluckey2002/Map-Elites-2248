---
result: RESULT-0047
status: complete
registered: 2026-09-22T15:16:05.200Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0047/subject.json: c08610ae092e238f
  experiments/RESULT-0047/subject.js: 4a96963b51481391
  experiments/RESULT-0047/run.js: ba4af546970451c9
  experiments/RESULT-0047/verify.js: a17e9b513136802f
  experiments/RESULT-0047/recompute.js: 344a002634294559
  experiments/RESULT-0047/run.test.js: f25f3d66eda4c988
  solver/oracle/harvest-policy.js: 2b6c6ff96a6d10f6
  solver/oracle/search.js: 592d155120892330
  solver/oracle/simulation.js: 9cafa661bfb9bed1
  solver/oracle/verify.js: 6eeba60f146e1641
  solver/oracle/corpus.js: 15d9c87486696778
  solver/benchmark-inputs.js: 655ce8a84ffa03cc
  solver/benchmark-replay.js: a714232d4e4bf308
  solver/human-benchmark.js: aeb2bef796ecedb8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — evolved harvesting policy on the captured corpus

**Registered:** 2026-09-22, before either policy is executed on the frozen
20-puzzle comparison matrix under this corrected identity.
**Goal:** none binding; exploratory infrastructure relevant to BL-0013
(`docs/backlog/BL-0013-policy-vocabulary-gaps.md`, the missing fitness-function
problem for policy search).

This record is a corrected-identity re-registration. It was originally
registered 2026-09-17 as `RESULT-0041` on this same branch
(`experiment/harvest-policy-corpus`); that ID collided with an unrelated,
independently-registered `RESULT-0041` on `main` (a greed-ratio validation
result). Per `tools/new-experiment.js`'s own `addedIn()` check, an ID
registered anywhere in git history can never be reused, so this experiment is
re-registered here as `RESULT-0047` and actually re-run under this identity —
not relabeled. The scientific design, corpus, and thresholds are unchanged
from the original 2026-09-17 registration.

This record is frozen. If the question or the denominator changes, that is a
new scope and a new record — not an edit to this one.

---

## Question

Under identical seeded rules and exactly 600 expanded states per cell, does
the evolved harvest ranker (`solver/oracle/harvest-policy.js`'s `rankState`)
transfer better than a baseline ranker across the 18 non-tuning puzzles of the
frozen captured corpus, without adding human misses or regressing any puzzle
the baseline wins?

## Why this is being asked

BL-0013 identifies that the shipped bot has no term for "hold value now to
build a larger chain later" — the strategy that measurably outscores it in
owner play. `solver/oracle/harvest-policy.js` is a candidate evolved ranker
carrying exactly that kind of term (`harvestableMass`, weighted toward
compatible tile ladders). This confirmation checks whether that candidate
actually transfers on a held-out, non-tuning puzzle panel before it is
considered relevant to BL-0013 at all.

## Shape of the run

Confirmation of a paired comparison. Not a search: both rankers are fixed and
frozen before this run; nothing is tuned during it.

## The change under test

`rankState` passed to `search()` in `solver/oracle/search.js`: baseline
(`state.score + potentialWeight * baselineHarvestableMass(state)`, defined
locally in `subject.js`) versus evolved (`solver/oracle/harvest-policy.js`'s
exported `rankState`).

## Denominator

18 primary puzzles (a frozen 20-puzzle corpus minus 2 puzzles reserved as the
four-board optimization/tuning panel) × 2 policies = 36 primary cells. The 2
excluded puzzles are run too, as diagnostics only (40 cells total), never
counted toward the primary outcome. Unpaired across policies within a puzzle,
paired by puzzle identity for the win/loss/moves comparison.

## Seeds

Not seed-generated. The corpus is a fixed, already-frozen set of captured
puzzle identities (`solver/oracle/corpus.js`'s `loadCorpus()`), not a fresh
random draw — no new entry in `experiments/SEEDS.md` is needed.

## Starting state, recorded independently

- git HEAD 17e80bf5, branch experiment/harvest-policy-corpus.
- Test suite and search execution recorded live in this run; see report.md.

## Version hashes (sha256, first 16)

See `version_freeze` above; computed from the real files at registration and
re-verified unchanged before the run.

## Checks, classified before outcomes are assigned

### C1 — negative control (PASS / FAIL)
Running the baseline ranker against itself (both arms using
`baselineRankState`) must show zero difference. Structural argument: `search()`
is a pure function of its `rankStateFn` argument and the puzzle's seeded
state; calling it twice with the identical function reference on the identical
input is deterministic and must return identical output. No sampling needed.

### C2 — positive control, run BEFORE any measurement (PASS / FAIL)
The evolved ranker must produce a different move choice than baseline on at
least one puzzle in the corpus before the full panel is trusted. Checked by
running both rankers on the corpus's first puzzle before the reportable run
and confirming the resulting move chains differ.

### C3 — suite unchanged (PASS / FAIL)
Named failures before this run equal named failures after (this project's four
pre-existing documented failures, no more, no fewer).

### P1 — paired transfer efficiency
Computed by `verify.js#analyze` on the 18 primary puzzles.
- `SUPPORTED` — evolved wins at least as many puzzles as baseline AND has
  strictly lower aggregate loss-adjusted moves.
- `FALSIFIED` — evolved wins fewer puzzles, or has higher aggregate
  loss-adjusted moves.
- `INCONCLUSIVE` — neither condition holds (e.g. tied wins, tied moves).

### P2 — human-comparator guard
Computed by `verify.js#analyze`: evolved's human-miss count (moves null, or
moves exceeding the puzzle's recorded human-best) versus baseline's, on the
18 primary puzzles.
- `SUPPORTED` — evolved's human-miss count is ≤ baseline's.
- `FALSIFIED` — evolved's human-miss count is > baseline's.

### P3 — per-puzzle regression guard
Computed by `verify.js#analyze`: for each of the 18 primary puzzles baseline
already wins, evolved must not lose or take more moves.
- `SUPPORTED` — zero such regressions.
- `FALSIFIED` — one or more regressions.

The primary outcome is the intersection: `SUPPORTED` only if P1, P2, and P3
are all `SUPPORTED`; `FALSIFIED` if any is `FALSIFIED`; `INCONCLUSIVE`
otherwise. A single P3 regression is sufficient to falsify the primary
outcome even when P1 and P2 are favorable — this mirrors the original
2026-09-17 registration's stopping rule exactly (see the provenance note in
this record's introduction).

Separately, both arms run under literally identical `budgetMs` (30,000 ms)
and `maxExpandedStates` (600) per cell — satisfied by construction: neither
policy can win by simply being allotted more search budget than the other,
so a favorable P1/P2/P3 result cannot be explained by unequal compute.
bounded search.

## Budget and stopping rules

1. C1 and C2 pass before the reportable panel runs.
2. No pilot phase — the corpus and thresholds were already fixed at the
   original 2026-09-17 registration; this is the confirmation run.
3. One sequential 40-cell matrix (18 primary + 2 diagnostic puzzles × 2
   policies), run once.
4. **One confirmation run. No re-runs on a different corpus or budget.**
5. A search that hits `maxExpandedStates` or the time ceiling without a
   witness on a primary puzzle is recorded as `no-win` for that cell, not
   retried, and counted against `INCONCLUSIVE` per P1's threshold if it
   affects the aggregate.

## Instrument bound

The primary-panel win/loss/moves comparison is load-bearing. The 2 diagnostic
(tuning-panel) puzzles are informational only and never enter the P1
threshold.

## Adoption is a separate decision

Clearing P1 does not adopt the evolved ranker into `solver/bot.js` or any
shipped policy. It only establishes whether the candidate transfers past the
puzzles it was tuned on — a prerequisite for, not a conclusion of, any
BL-0013 vocabulary decision.
