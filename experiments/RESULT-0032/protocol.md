---
result: RESULT-0032
status: registered
registered: 2026-09-16T09:57:19Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0032/subject.js: 976d82e8e504c4e4
  experiments/RESULT-0032/run.js: c8a008713564d712
  experiments/RESULT-0032/verify.js: e95b2bb3f730e5d6
  experiments/RESULT-0032/run.test.js: b908f5946c858f79
  experiments/RESULT-0032/verify.test.js: 57b5f47842f54b33
  solver/choice-recovery-descriptors.js: e6e64c71d2f0ce8b
  solver/tests/choiceRecoveryDescriptors.test.js: 55d428684e19e694
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — choice-density × recovery candidate descriptors

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record freezes the constructs, executable proxies, controls, 32-board
panel, paired search arms, thresholds, and disposition rule. The calibration
seed and its role are disclosed below and excluded from confirmation.

## Question

Do the candidate proxies for choice density and recovery respond to their
intended controlled manipulations, vary across a fresh representative board
panel, and remain sufficiently stable under a fourfold beam-width increase to
be eligible for a later MAP-Elites corpus?

## Why this is being asked

The descriptor roadmap named three pairs beyond the previously tested budget
tightness × chain-length dependence pair. This is the first remaining pair.
It must be validated as measurement before it can be used as a MAP coordinate.
`RESULT-0031` also showed that bounded-search coordinates can change materially
with search width, so search sensitivity is load-bearing here.

## Intended constructs and executable proxies

- **Choice density construct:** how many meaningful choices a puzzle offers.
  **Proxy:** `initialViableStartFraction`, the exact fraction of nonblocked
  opening tiles that can start at least one legal chain. This counts viable
  starts, not distinct chain paths or player-perceived choices.
- **Recovery construct:** ability to remain solvable after a non-solution
  move. **Proxy:** `oneDetourRecoveryWitnessRate`, the fraction of up to eight
  lowest-scoring non-reference chains from a deterministic 64-candidate pool
  for which bounded search finds a replayable continuation to target.

A found continuation is a replayed lower bound. A bounded miss stays
`UNKNOWN`; the aggregate is a bounded witness fraction, not an estimate of
true recoverability. Neither proxy measures difficulty, fun, preference, or
natural player move frequency.

## Shape of the run

One deterministic paired confirmation on the static/no-blocker shipped board
profiles represented by Levels 10, 31, 53, and 54. Calibration on excluded
seed 32,300,000 selected tight move budgets 13, 15, 14, and 27 respectively;
each fresh puzzle is paired with a `+4`-move slack arm. Each tight/slack pair
runs at beam widths 12 and 48. Both widths use 16 search actions per state,
path width 2, eight recovery alternatives, and a 64-candidate recovery pool.

This validates candidate measures. It is not a MAP-Elites run, exhaustive
reachability proof, player study, level change, or claim about shipped-level
difficulty.

## Denominator and seeds

- Confirmation seeds: 32,400,000–32,400,007 on each of four profiles.
- 32 fresh starting boards, 64 tight/slack puzzle instances, and 128
  search-width observations.
- Calibration seed 32,300,000 is burned and excluded.
- The confirmation range was unused before registration; repository search
  and `experiments/SEEDS.md` recorded the reservation before the run.

## Starting state, recorded independently

- Parent git HEAD `b241fcc918458bde8cf8952ca7b36b74463e8a40`, branch
  `feat/choice-recovery-descriptors`, isolated worktree.
- Focused controls: 8 tests, 8 pass, 0 fail.
- Solver baseline inherited from merged RESULT-0031: 391 tests, 386 pass,
  the same four deliberate failures, and one skip.

## Checks, classified before outcomes are assigned

### C1 — choice-density positive control (PASS / FAIL)

A six-cell all-2 row must produce viable-start fraction 1, while two isolated
pairs separated from legal double continuations must produce 0. Any failure
stops the confirmation.

### C2 — recovery positive control (PASS / FAIL)

On excluded calibration seed 32,300,000, Level 53 at 14 moves must produce a
bounded recovery-witness rate of 0.75 and the same opening with 16 moves must
produce 1. The initial choice proxy must remain exactly equal. Any failure
stops the confirmation.

### C3 — negative and orthogonal controls (PASS / FAIL)

Uniformly scaling every tile and the target by 32 must preserve both proxies.
Move-budget manipulation and search width must preserve the exact initial
choice proxy in every confirmation row. Any failure is `FAIL`.

### C4 — replay, identity, registration, and source closure (PASS / FAIL)

The runner must refuse unregistered execution. Every recorded reference and
recovery witness must replay legally on its bound puzzle; planted witness and
artifact mutations must fail; source hashes, artifact identity, registration
commit, and full recomputation must close. Any failure is `FAIL`.

### C5 — suite unchanged (PASS / FAIL)

The post-run solver suite must retain exactly the four named deliberate
failures and one skip. Any new failure is `FAIL`.

### P1 — choice proxy range and invariance

- `SUPPORTED` — the 32 opening values span at least 0.20 and all 32 rows keep
  the exact same value across tight/slack and shallow/deep arms.
- `INCONCLUSIVE` — otherwise.

### P2 — held-out recovery sensitivity

An eligible pair has measured deep-arm rates for both budgets and a tight-arm
rate below 1.

- `SUPPORTED` — at least 12 pairs are eligible, at least 75% improve by 0.125
  or more with four extra moves, and none decreases.
- `INCONCLUSIVE` — otherwise.

### P3 — search-width stability

- `SUPPORTED` — at least 48 of the 64 budget arms are measured at both widths,
  and at least 75% of comparable arms differ by no more than 0.25.
- `INCONCLUSIVE` — otherwise.

### P4 — scoped disposition

- `SUPPORTED` when C1–C5 pass and P1–P3 are supported: this pair is eligible
  for a separate registered MAP corpus.
- `INCONCLUSIVE` otherwise: revise before building that corpus.

## Budget and stopping rules

1. Commit this protocol, instrument, controls, verifier, and seed reservation
   before opening any confirmation seed.
2. Run C1–C4 before confirmation; stop on failure.
3. Run all 32 fresh boards exactly once; refuse overwrite.
4. Verify by legal replay and deterministic full recomputation exactly once.
5. Preserve all `UNKNOWN` outcomes. Do not add seeds, levels, widths, move
   budgets, or candidate counts after seeing confirmation results.
6. One confirmation run. No re-run on different seeds.

Hard limits: four profiles, eight seeds each, two move budgets, two widths,
16 search actions per state, path width 2, eight recovery alternatives, and a
64-candidate recovery pool.

## Instrument bound

Load-bearing evidence is exact opening-board enumeration, controlled response,
legal witness replay, fresh paired confirmation, search-width comparison, and
deterministic recomputation. The witness-path mean viable-start fraction is
diagnostic only and cannot replace the registered initial-state choice proxy.

## Adoption is a separate decision

Clearing the bar permits only a later registered MAP corpus to use these proxy
coordinates. It does not change a level, promote a solver policy, establish
player-facing meaning, or validate either of the two remaining descriptor
pairs.
