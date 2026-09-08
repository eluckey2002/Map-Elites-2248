---
result: RESULT-0029
status: complete
registered: 2026-09-08T06:22:43Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0029/run.js: a5810bad6f0b95f9
  experiments/RESULT-0029/verify.js: 651100d9ae2d118d
  experiments/RESULT-0029/analyze.js: 30d15bb86e4c5ba8
  solver/tests/syntheticDescriptorValidation.test.js: 16616933bb9b385f
  solver/engine.js: 0ed4b31004df13e3
  solver/experiment-guard.js: 200ad71fad9492a3f
  src/game.js: 22ebc237b6750fff
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — synthetic descriptor outcome validation

**Registered:** 2026-09-08, before any RESULT-0029 control or confirmation
game was played.
**Goal:**
`.orch/runs/2026-09-07T23-15-28Z-synthetic-descriptor-validation-study/spec.md`
at commit `40d5151`, SHA-256
`4443a50282337fb389edf480f2f5e97297c695f59693cc6ae77985525d0c9192`.

This record is frozen. Changing its question, denominator, controls, model,
thresholds, or tie-break after a game is a breach, not an amendment.

## Question

Across nine frozen, structurally varied, bomb-free shipped levels, does the
pair `(halfScoreMove, meanBeamGreedRatio)` improve leave-one-level-out
prediction of synthetic-policy win rate over both its best one-descriptor model
and the training base rate under the thresholds below?

## Why this is being asked

The corrected 15-game human corpus contains one loss and no longer supports the
handoff's unique-cell interpretation: a win shares its `halfScoreMove=0.500`,
and another low-greed win lands at `halfScoreMove=0.563`. RESULT-0029 therefore
tests the proposed measurements on controlled synthetic policies rather than
treating that one loss as a result.

The greed measurement is explicitly beam-relative. It uses the maximum score
inside the frozen bounded candidate pool and cannot validate the human corpus's
exhaustive greed ratio.

## Shape of the run

One factorial manipulation check followed, only if it passes, by one
level-held-out confirmation. This is not a 3x3 MAP-Elites archive, policy
search, level ranking, human fit, axis admission, or champion comparison.

## Policies, levels, and measures

The nine fixed policies cross greed centers `[0.35, 0.60, 0.85]` with timing
slopes `[-0.25, 0, 0.25]`. The frozen schedule is
`clamp(greedCenter + timingSlope * (2p - 1))`, where `p` is position in the
full move budget.

The levels are `[1, 11, 20, 26, 31, 46, 51, 54, 56]`. They cover 5x8, 5x7,
4x8, and 6x5 boards; minimum chains 2, 3, and 4; and no blocker, stone, and ice
conditions. Bomb levels are excluded so bomb handling does not become an
undeclared third policy control.

`halfScoreMove` is the first move reaching half of terminal score divided by
the full level move budget. `meanBeamGreedRatio` is the episode mean of selected
points divided by the best points in the exact bounded candidate pool offered
on that move.

## Denominator and seeds

- Control: `32000000..32000003`, four seeds, never reportable.
- Confirmation: `33000000..33000011`, twelve seeds, reportable once.
- One control artifact: 9 policies x 9 levels x 4 seeds = 324 cells.
- Controls are executed twice into distinct new files: 648 game executions.
- Confirmation: 9 policies x 9 levels x 12 seeds = 972 cells.
- Hard total: 1,620 game executions.

The ranges were absent from the tree and all Git refs before this protocol's
study spec named them. Registration burns both ranges even if a control failure
prevents confirmation.

## Starting state, recorded independently

- Code result:
  `7f9caf7bdd5769ce27630b36d4bce3090c45b6a6`; run-state closeout `a3d20e2`.
- Study spec: `40d5151`.
- Full suite at the code result: 371 tests / 367 pass / 4 fail. The failures are
  the two stale candidate receipts (52 and 54), stale Universe Map generated
  views, and the Universe Map date-drift observation. All are pre-existing.
- No RESULT-0029 control, pilot, confirmation, or shipped-level synthetic
  artifact existed before registration.

## Version hashes (sha256, first 16)

| File | Identity |
| --- | --- |
| `experiments/RESULT-0029/run.js` | `a5810bad6f0b95f9` |
| `experiments/RESULT-0029/verify.js` | `651100d9ae2d118d` |
| `experiments/RESULT-0029/analyze.js` | `30d15bb86e4c5ba8` |
| `solver/tests/syntheticDescriptorValidation.test.js` | `16616933bb9b385f` |
| `solver/engine.js` | `0ed4b31004df13e3` |
| `solver/experiment-guard.js` | `200ad71fad9492a3f` |
| `src/game.js` | `22ebc237b6750fff` |
| `tools/verify-experiments.js` | `17d658d9f13a40b0` |

## Frozen analysis

### Manipulation calculation

For each policy, average both realized descriptors over every control level and
seed. At each fixed timing slope, order the three policy means by greed center
and calculate the high-minus-low `meanBeamGreedRatio` span. At each fixed greed
center, order by timing slope and calculate the late-minus-early
`halfScoreMove` span.

### Prediction calculation

Aggregate confirmation seeds before modeling to one row per policy and level:
mean `halfScoreMove`, mean `meanBeamGreedRatio`, and win rate. Hold out each
level in turn. Using only the other eight levels, standardize the descriptors
used by that model and predict held-out win rates with deterministic k=5
nearest-neighbor regression. Distance ties resolve by policy identity, then
level. Score the training base rate, half-score-only, greed-only, and joint
models by mean Brier loss across the resulting 81 held-out rows.

Zero training variance in any used feature invalidates that model. The
calculator reports metrics only; this protocol owns every verdict.

## Checks, classified before outcomes

### C1 — deterministic repeated controls

Both independently written 324-cell control artifacts must pass the production
verifier and have byte-identical canonical bodies and artifact identities. Any
difference is `FAIL` and stops confirmation.

### C2 — factorial manipulation

For all three fixed timing slopes, the three mean greed measurements must be
strictly increasing with greed center and the high-minus-low span must be at
least `0.15`. For all three fixed greed centers, mean half-score timing must be
strictly increasing with timing slope and the late-minus-early span must be at
least `0.05`. All six slices must pass. Any failure is `FAIL` and stops
confirmation.

### C3 — registration, source, and matrix closure

Every artifact must bind this reachable registration commit, the frozen source
set, exact nine policy identities, exact levels/seeds, and complete Cartesian
matrix. Bounded-policy exhaustion, source drift, a missing/non-finite cell, or
any verifier failure is `FAIL` or `BREACH` and stops the run.

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
within `[0,1]`, and no invalid model fold. Otherwise P1 is `INCONCLUSIVE`.

### P3 — fixed diagnostics

Report per-policy and per-level win rates and descriptor means; descriptor
ranges; terminal-reason counts; all four overall and per-level Brier losses;
both gains; joint level-win count; exact artifact/source identities; and
wall-clock runtime. None can replace or change P1.

## Budget and stopping rules

1. Commit this protocol, calculator, calculator tests, and SEEDS rows together.
2. Run the focused tests and experiment gate. Stop on a new failure.
3. Write both controls once each; verify and analyze both. Stop unless C1 and
   C2 pass exactly.
4. Write confirmation exactly once. A failure or interruption is retained and
   reported; it is not rerun on other seeds.
5. Verify confirmation, calculate its metrics twice into distinct paths, and
   require byte-identical analysis.
6. Write the report and change only protocol `status` from `registered` to
   `complete`.
7. Run the experiment gate, focused tests, full suite, protected diff, and one
   research lens.

No alternate seeds, levels, subjects, controls, model, k, thresholds, tie-break,
or confirmation run. No external calls or human time.

## Instrument bound

The load-bearing values are the six control slices, the four overall Brier
losses, two gains, joint level-win count, and P2 support fields. Raw per-policy,
per-level, terminal, and runtime values are diagnostic only. The production
verifier proves artifact structure and arithmetic; it does not prove that the
beam proxy represents human strategy.

## Adoption is a separate decision

Any `SUPPORTED`, `FALSIFIED`, or `INCONCLUSIVE` result applies only to these
synthetic policies, current simulator, declared levels/seeds, and beam-relative
proxy. It does not validate the 15-game human anecdote, formalize either
descriptor, choose MAP-Elites axes, alter a level, promote a policy, or admit a
ledger claim. Those require separate owner decisions.
