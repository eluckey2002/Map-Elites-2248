---
result: RESULT-0031
status: registered
registered: 2026-09-08T09:27:36Z
supersedes: RESULT-0030
reportable: confirmation
version_freeze:
  experiments/RESULT-0031/run.js: dff26d5c46f8d33c
  experiments/RESULT-0031/verify.js: 651100d9ae2d118d
  experiments/RESULT-0031/analyze.js: 680498d5ea5ff4f5
  solver/tests/syntheticDescriptorValidation.test.js: 8f29df1af6fc2c22
  solver/engine.js: 0ed4b31004df13e3
  solver/experiment-guard.js: 200ad71fad9492a3
  src/game.js: 22ebc237b6750fff
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — synthetic descriptor outcome validation

**Registered:** 2026-09-08, before any RESULT-0031 control or confirmation
game was played.
**Code result:** `41032d89e5435eaa5f9b24bd5d16939e23cfeb10`.

This protocol supersedes RESULT-0030, whose control passed but whose one
confirmation invocation stopped before artifact creation when its bounded
greedy pool missed a legal chain. This file is the sole
scientific authority for RESULT-0031. Orchestration records may point here but
cannot restate or revise its question, selection, denominator, analysis,
thresholds, or stopping rules.

## Question

Across the nine purposively selected shipped levels below, does the pair
`(halfScoreMove, meanBeamGreedRatio)` improve leave-one-level-out prediction of
synthetic-policy win rate over both its best one-descriptor model and the
training base rate under the frozen thresholds below?

## Evidence boundary

The corrected 15-game human corpus contains one loss. A win shares its
`halfScoreMove=0.500`, and another low-greed win lands at
`halfScoreMove=0.563`. Those observations motivated the measures but are not
inputs to this experiment and are not validated by it.

This is a controlled synthetic-policy experiment, not a 3x3 MAP-Elites
archive, policy search, human fit, level ranking, axis admission, or champion
comparison. The greed measurement is beam-relative: its denominator is the
best score inside the frozen bounded candidate pool, not the exhaustive move
space used by the human-corpus exploratory ratio.

## Policies, levels, and measures

The nine fixed policies cross greed centers `[0.35, 0.60, 0.85]` with timing
slopes `[-0.25, 0, 0.25]`. The frozen schedule is
`clamp(greedCenter + timingSlope * (2p - 1))`, where `p` is position in the
full move budget.

The level panel is `[1, 11, 20, 26, 31, 46, 51, 54, 56]`. It was selected
before RESULT-0031 outcomes by a purposive, deterministic coverage rule: span
5x8, 5x7, 4x8, and 6x5 boards; minimum chains 2, 3, and 4; and no blocker,
stone, and ice conditions. Bomb levels are excluded so bomb handling does not
become an undeclared third policy control. This is not a probability sample;
inference is limited to this panel and the frozen synthetic family.

`halfScoreMove` is the first move reaching half of terminal score divided by
the full level move budget. `meanBeamGreedRatio` is the episode mean of selected
points divided by the best points in the exact bounded candidate pool offered
on that move. If the bounded greedy generator finds no candidate while the
independent legal-move search finds one, the pool receives the first
deterministic minimum-length legal chain. This totality fallback prevents a
heuristic miss from becoming a false game terminal; it does not make the pool
exhaustive. Any cell failure is reported with policy, level, and seed.

## Denominator and seeds

- Control: `36000000..36000003`, four seeds, never reportable.
- Confirmation: `37000000..37000011`, twelve seeds, reportable once.
- One control artifact: 9 policies x 9 levels x 4 seeds = 324 cells.
- One confirmation artifact: 9 policies x 9 levels x 12 seeds = 972 cells.
- Hard total: 1,296 game executions.

The control corpus is deterministic and executes once. Its serialized artifact
is verified through the production verifier; duplicating all 324 games would
not add a distinct oracle or test a named nondeterminism risk.

For the primary analysis, seeds are repeated measurements aggregated before
modeling. The 81 policy-level aggregates are the analysis rows, not 972
independent generalization units. Each of nine levels is the held-out unit in
turn, while all nine policy identities repeat across train and test folds.
Therefore the primary result supports no population claim beyond the purposive
level panel. The fixed diagnostic reverses this seam by holding out each policy
identity; levels then repeat across its folds.

The 36M and 37M ranges were absent from `experiments/SEEDS.md`, the worktree,
and all local Git refs when selected. Registration burns both ranges even if a
control failure prevents confirmation.

## Starting state

- Code result: `41032d8`, regression-guarding the RESULT-0030 failure with the
  concrete legal chain `6→6→12→24` and adding cell identity to failures.
- Focused code suite: 47/47 PASS.
- Repository suite: 377 tests / 373 pass / 4 fail. The failures are the two
  stale candidate receipts (52 and 54), stale Universe Map generated views,
  and the Universe Map date-drift observation. All four are pre-existing.
- No RESULT-0031 protocol, seed reservation, control artifact, confirmation
  artifact, analysis, or report existed before this draft.

## Version hashes (SHA-256, first 16)

| File | Identity |
| --- | --- |
| `experiments/RESULT-0031/run.js` | `dff26d5c46f8d33c` |
| `experiments/RESULT-0031/verify.js` | `651100d9ae2d118d` |
| `experiments/RESULT-0031/analyze.js` | `680498d5ea5ff4f5` |
| `solver/tests/syntheticDescriptorValidation.test.js` | `8f29df1af6fc2c22` |
| `solver/engine.js` | `0ed4b31004df13e3` |
| `solver/experiment-guard.js` | `200ad71fad9492a3` |
| `src/game.js` | `22ebc237b6750fff` |
| `tools/verify-experiments.js` | `17d658d9f13a40b0` |

## Frozen analysis

### Manipulation calculation

For each policy, average both realized descriptors over every control level and
seed. At each fixed timing slope, order the three policy means by greed center
and calculate the high-minus-low `meanBeamGreedRatio` span. At each fixed greed
center, order by timing slope and calculate the late-minus-early
`halfScoreMove` span.

### Primary prediction calculation

Aggregate confirmation seeds before modeling to one row per policy and level:
mean `halfScoreMove`, mean `meanBeamGreedRatio`, and win rate. Hold out each
level in turn. Using only the other eight levels, standardize the descriptors
used by that model and predict held-out win rates with deterministic k=5
nearest-neighbor regression. Distance ties resolve by policy identity, then
level. Score the training base rate, half-score-only, greed-only, and joint
models by mean Brier loss across the resulting 81 held-out rows.

Zero training variance in any used feature invalidates that model. The
calculator reports metrics only; this protocol owns every verdict.

### Policy-held-out diagnostic

Using the same 81 seed-aggregated rows and the same standardization, k, models,
tie-break, and Brier calculation, hold out each of the nine policy identities
in turn and train on the other eight. Report all four mean losses, both gains,
the number of policy folds where joint beats both single descriptors, invalid
folds, and every per-policy fold result. This diagnostic cannot replace or
change the primary verdict.

## Checks, classified before outcomes

### C1 — registration, source, artifact, and matrix closure

Before the registration commit, the public draft checker must accept every
declared 16-character hash against the real source. Every produced artifact
must then bind the reachable registration commit, frozen runtime source set,
exact nine policy identities, exact levels and seeds, and complete Cartesian
matrix. The production verifier must pass. A draft-check failure stops
registration; a later mismatch, bounded-policy exhaustion, non-finite cell,
missing cell, or verifier failure is `FAIL` or `BREACH` and stops the run.

### C2 — factorial manipulation

For all three fixed timing slopes, the three mean greed measurements must be
strictly increasing with greed center and the high-minus-low span must be at
least `0.15`. For all three fixed greed centers, mean half-score timing must be
strictly increasing with timing slope and the late-minus-early span must be at
least `0.05`. All six slices must pass. Any failure is `FAIL` and withholds
confirmation.

### P1 — joint out-of-level prediction

Let `jointGainBase = baseRateBrier - jointBrier` and
`jointGainSingle = min(halfBrier, greedBrier) - jointBrier`.

- `SUPPORTED` — P2 passes, `jointGainBase >= 0.02`,
  `jointGainSingle >= 0.01`, and joint Brier beats the better single model on
  at least 6 of 9 held-out levels.
- `FALSIFIED` — P2 passes and either `jointGainBase <= 0` or
  `jointGainSingle <= 0`.
- `INCONCLUSIVE` — every other complete outcome.

### P2 — usable outcome and descriptor support

`PASS` requires overall confirmation win fraction in `[0.10, 0.90]`, at least
four of nine levels containing both wins and losses, all descriptors finite and
within `[0,1]`, and no invalid primary-model fold. Otherwise P1 is
`INCONCLUSIVE`.

### P3 — fixed diagnostics

Report per-policy and per-level win rates and descriptor means; descriptor
ranges; terminal-reason counts; all four overall and per-level Brier losses;
both primary gains; joint level-win count; the complete policy-held-out
diagnostic; exact artifact/source/analysis identities; and wall-clock runtime.
None can replace or change P1.

## Budget and stopping rules

1. Run `node tools/new-experiment.js --check RESULT-0031`; stop before commit
   if it fails.
2. Commit this protocol, calculator, calculator tests, and seed reservations
   before any RESULT-0031 game.
3. Run the focused tests and experiment gate. Stop on a new failure.
4. Write the control artifact exactly once; verify and analyze it. Stop unless
   C1 and C2 pass exactly.
5. Write confirmation exactly once. A failure or interruption is retained and
   reported; it is not rerun on other seeds.
6. Verify confirmation, calculate its metrics twice into distinct new paths,
   and require byte-identical canonical analyses.
7. Write the report and change only protocol `status` from `registered` to
   `complete`.
8. Run the experiment gate, focused tests, full suite, protected diff, and one
   fixed-revision research review.

No alternate seeds, levels, subjects, controls, model, k, thresholds,
tie-break, or confirmation run. No external calls or human time.

## Instrument bound

The load-bearing values are the six control slices, the four primary Brier
losses, two primary gains, joint level-win count, and P2 support fields. The
policy-held-out analysis and raw per-policy, per-level, terminal, and runtime
values are diagnostic only. The production verifier proves artifact structure
and arithmetic; it does not prove that the beam proxy represents human
strategy or that this purposive panel represents other levels.

## Adoption is a separate decision

Any `SUPPORTED`, `FALSIFIED`, or `INCONCLUSIVE` result applies only to these
synthetic policies, current simulator, declared levels/seeds, and beam-relative
proxy. It does not validate the human anecdote, formalize either descriptor,
choose MAP-Elites axes, alter a level, promote a policy, or admit a ledger
claim. Those require separate owner decisions.
