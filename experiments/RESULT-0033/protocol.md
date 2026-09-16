---
result: RESULT-0033
status: registered
registered: 2026-09-16T10:18:21Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0033/subject.js: 9cfe253f943c7fdc
  experiments/RESULT-0033/run.js: 6b8cd94e0fdf63c1
  experiments/RESULT-0033/verify.js: 0eb3facad2794be4
  experiments/RESULT-0033/run.test.js: 1c690378869e8b81
  experiments/RESULT-0033/verify.test.js: 7e8257a16aeeedc8
  solver/merge-spread-descriptors.js: c8a7b07596a55a4c
  solver/tests/mergeSpreadDescriptors.test.js: 0533aabfe21e3ec8
  solver/choice-recovery-descriptors.js: e6e64c71d2f0ce8b
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — merge-depth × spatial-spread candidate descriptors

**Registered:** 2026-09-16, before any confirmation seed was opened.

This record freezes the constructs, witness proxies, controls, 32-board panel,
paired widths, thresholds, and disposition rule. Calibration seed 32,500,000
is disclosed and excluded from confirmation.

## Question

Do successful-witness proxies for merge depth and spatial spread respond to
their intended manipulations, occupy a useful range on fresh representative
boards, and remain stable enough under a fourfold beam-width increase to be
eligible for a later MAP-Elites corpus?

## Intended constructs and executable proxies

- **Merge depth construct:** how many dependent generations of player-created
  tiles a successful construction uses. **Proxy:** `peakMergeDepth`, the
  largest recursively tracked merge-tree depth created along one registered
  successful witness. Initial and spawned tiles have depth zero; a merged tile
  has one plus the maximum depth among its inputs.
- **Spatial spread construct:** how far apart the tiles used by successful
  chains are. **Proxy:** `meanNormalizedChainSpan`, the mean per-move
  Chebyshev span of witness-chain coordinates divided by the board's
  Chebyshev diameter.

These are properties of a bounded-search witness, not minimum required depth,
all-solution geometry, player behavior, difficulty, fun, or preference. A
bounded miss remains `UNKNOWN`.

## Shape of the run

One deterministic paired confirmation on shipped Levels 10, 31, 53, and 54,
covering 5x8, 5x7, 6x5, and 4x8-with-stones profiles. Each level/seed puzzle
runs at beam widths 12 and 48 with 16 combined candidates per expanded state
and path width 2. The shipped target and move budget remain unchanged.

This validates candidate measurements. It is not exhaustive search, a player
study, a level change, a gameplay-rule change, or a MAP-Elites run.

## Denominator and seeds

- Confirmation seeds: 32,600,000–32,600,007 on each of four profiles.
- 32 fresh puzzle identities and 64 paired search observations.
- Calibration seed 32,500,000 is burned and excluded.
- The confirmation range was unused before registration and was reserved in
  `experiments/SEEDS.md` before the run.

## Starting state, recorded independently

- Parent git HEAD `f966ef7398066dcc7186e997265f7911c1f49ca3`, branch
  `feat/merge-spread-descriptors`, isolated worktree.
- Focused controls: 8 tests, 8 pass, 0 fail.
- Solver baseline before this instrument: 395 tests, 390 pass, the same four
  deliberate failures, and one skip.

## Checks, classified before outcomes are assigned

### C1 — merge-depth positive control (PASS / FAIL)

A hand-replayed two-generation dependency must report peak depth 2, while a
single flat merge must report depth 1. Any failure stops confirmation.

### C2 — spatial-spread positive control (PASS / FAIL)

On a 4x4 fixture, a compact legal three-tile chain must report normalized span
1/3 and a diagonal board-wide legal chain must report 2/3. Any failure stops.

### C3 — negative scale control (PASS / FAIL)

Uniformly scaling every tile and the target by 32 must preserve both proxies.
Any failure stops confirmation.

### C4 — replay, identity, registration, and source closure (PASS / FAIL)

The runner must refuse unregistered execution. Every witness must replay
legally with the same score, descriptor trace, and puzzle identity. Planted
witness and artifact mutations must fail. Source hashes, registration commit,
artifact identity, and full deterministic recomputation must close.

### C5 — suite unchanged (PASS / FAIL)

The post-run solver suite must retain exactly the four named deliberate
failures and one skip. Any new failure is `FAIL`.

### P1 — representative-panel coverage

- `SUPPORTED` — the deep arm finds replayable target witnesses on at least
  30/32 puzzles and covers all four profiles.
- `INCONCLUSIVE` — otherwise.

### P2 — descriptor range

- `SUPPORTED` — at least two peak-depth values each contain at least four deep
  rows, and deep-arm mean normalized chain span has range at least 0.15.
- `INCONCLUSIVE` — otherwise.

### P3 — search-width stability

- `SUPPORTED` — at least 28 puzzles have witnesses at both widths, at least
  75% retain exactly the same peak depth, and at least 75% keep mean normalized
  chain span within 0.10.
- `INCONCLUSIVE` — otherwise.

### P4 — scoped disposition

- `SUPPORTED` when C1–C5 pass and P1–P3 are supported: this pair is eligible
  for a separate registered MAP corpus.
- `INCONCLUSIVE` otherwise: revise before building that corpus.

## Budget and stopping rules

1. Commit this protocol, instrument, controls, verifier, and seed reservation
   before opening a confirmation seed.
2. Run C1–C4 first; stop on failure.
3. Run the 32-board confirmation exactly once and refuse overwrite.
4. Verify through legal replay and one full deterministic recomputation.
5. Preserve `UNKNOWN`; do not add levels, seeds, widths, or thresholds after
   seeing confirmation outcomes.
6. One confirmation run. No re-run on different seeds.

Hard limits: four profiles, eight seeds each, widths 12 and 48, 16 combined
candidates per state, path width 2, and shipped move budgets.

## Instrument bound

Load-bearing evidence is controlled response, recursive lineage replay,
coordinate-span replay, fresh paired confirmation, width comparison, and
deterministic recomputation. No witness proxy may be relabelled as a necessary
property of the puzzle.

## Adoption is a separate decision

Clearing the bar permits only a later registered MAP corpus to use these
witness-qualified coordinates. It changes no shipped content and does not
validate the final forced-move-ratio × solution-diversity pair.
