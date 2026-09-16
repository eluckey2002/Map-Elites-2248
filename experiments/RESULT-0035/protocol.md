---
result: RESULT-0035
status: registered
registered: 2026-09-16T11:30:00Z
supersedes: null
reportable: confirmation
version_freeze:
  experiments/RESULT-0035/registered-protocol.md: 057e40b693678a7d
  experiments/RESULT-0035/closeout-contract.json: b3e0389b74d48ab9
  experiments/RESULT-0035/subject.js: 6108a56670512004
  experiments/RESULT-0035/run.js: 95dbcb24944533fd
  experiments/RESULT-0035/recompute.js: 76fb2bc1c658cb3b
  experiments/RESULT-0035/verify.js: 197220df77884276
  experiments/RESULT-0035/run.test.js: ed2f876d17f49bb8
  experiments/RESULT-0035/verify.test.js: ab0ca16f1e7da605
  solver/merge-spread-map.js: 93f9ac24e1f82f64
  solver/tests/mergeSpreadMap.test.js: 4f170b518f0557d4
  solver/merge-spread-descriptors.js: c8a7b07596a55a4c
  solver/tests/mergeSpreadDescriptors.test.js: 0533aabfe21e3ec8
  solver/choice-recovery-descriptors.js: e6e64c71d2f0ce8b
  solver/exact-score.js: edf48486735048e8
  solver/engine.js: 0ed4b31004df13e3
  src/game.js: 3d405595707621ce
  solver/experiment-guard.js: 200ad71fad9492a3
  tools/verify-experiments.js: 17d658d9f13a40b0
---

# Pre-registration — merge-depth × spatial-spread MAP corpus

**Registered:** 2026-09-16, before any confirmation seed was opened.

This lifecycle record binds the immutable scientific protocol at
`registered-protocol.md` (SHA-256 `057e40b693678a7d4ab1033bd9868dba8dff8fab9074dcd9dd82f5c5687fe8c8`)
and executable closeout contract at `closeout-contract.json` (SHA-256
`b3e0389b74d48ab99be5770e7850f500e60e78e7019a55324d2e5dbb22c5c423`).
The frozen final subject identity is
`db17076e31a5b54de3483c461986e6da4d15dc93aa9a091a6abb067c9fb1e5d6`.

## Question

Can 128 fresh representative puzzle identities populate a reproducible 2×2
quality-diversity corpus using RESULT-0033's validated successful-witness
coordinates?

## Fixed axes, archive rule, and non-claims

The design panel is RESULT-0033 and is excluded from confirmation. Its rounded
median fixes the spread boundary at 0.82. The cells cross peak witness merge
depth `1` versus `>=2` with mean normalized witness-chain span `<0.82` versus
`>=0.82`. Each cell retains four representatives.

Admission requires target witnesses at widths 12 and 48, exact cell agreement,
and spread difference at most 0.10. Ranking prefers smaller spread difference,
then greater distance from the boundary, then puzzle identity. This is a
measurement-reproducibility quality score. It is not difficulty, fun,
preference, minimum required depth, all-solution geometry, or full evolutionary
MAP-Elites.

## Denominator and seeds

Shipped Levels 10, 31, 53, and 54 use confirmation seeds
33,000,000–33,000,031 each: 128 distinct puzzle identities and 256 paired
search observations. Widths are 12 and 48, with 16 combined candidates per
expanded state and path width 2. Targets and move budgets remain shipped.

The unit of generalization is one level/seed puzzle identity. Widths are paired
measurements, not independent units. The seed range was unused and reserved in
`experiments/SEEDS.md` before the run.

## Starting state

- Parent HEAD `207886bbc51f3669ed8f3455112c39653214ec83` on isolated branch
  `feat/merge-spread-map-corpus`.
- Focused controls: 12 pass, 0 fail.
- Solver baseline: 401 tests, 396 pass, the same four deliberate failures, and
  one skip.

## Checks, classified before outcomes are assigned

### C1 — axis boundary control (PASS / FAIL)

Four planted descriptor pairs must land in the four named cells, with 0.82 on
the broad side.

### C2 — archive positive and negative controls (PASS / FAIL)

A planted balanced panel must reach ready; a planted two-cell collapse must be
falsified. Cell flips, spread drift above 0.10, and misses must be refused.

### C3 — inherited descriptor controls (PASS / FAIL)

Lineage depth, spatial span, uniform-scale invariance, bounded-miss, and
illegal-witness controls from RESULT-0033 must pass unchanged.

### C4 — replay, identity, registration, and closure (PASS / FAIL)

Unregistered execution and overwrite must fail. Every row must bind one puzzle
across widths and replay legally. Planted artifact and row mutations must fail.
Source hashes, ancestry, artifact identity, deterministic decision
recomputation, and executable closeout must verify.

### C5 — suite unchanged (PASS / FAIL)

The post-run suite must retain exactly the four named deliberate failures and
one skip; any new failure is `FAIL`.

### P1 — representative-panel coverage

- `SUPPORTED`: at least 120/128 deep witnesses and all four profiles.
- `FALSIFIED`: fewer than 96 witnesses or any profile absent.
- `INCONCLUSIVE`: otherwise.

### P2 — four-cell corpus occupancy

- `SUPPORTED`: all four cells retain four stable representatives.
- `FALSIFIED`: at most two cells occupied.
- `INCONCLUSIVE`: otherwise.

### P3 — cross-width cell stability

- `SUPPORTED`: at least 112 paired witnesses and at least 75% stable cells.
- `FALSIFIED`: fewer than 96 pairs or stability below 50%.
- `INCONCLUSIVE`: otherwise.

### P4 — scoped disposition

All three supported with all controls passing gives
`CANONICAL_MAP_CORPUS_READY`. Any falsification gives
`MAP_CORPUS_NOT_SUPPORTED`; remaining valid outcomes give
`MAP_CORPUS_INCONCLUSIVE`.

## Budget and stopping rules

1. Commit this record, sources, controls, seed reservation, immutable protocol,
   and closeout contract before opening confirmation seeds.
2. Run C1–C3 and stop on failure.
3. Run the 128-puzzle confirmation once; refuse overwrite.
4. Replay every witness and independently recompute the decision.
5. Preserve bounded misses as `UNKNOWN`; add no seeds, levels, widths, cells,
   or thresholds after outcomes.
6. Deterministic verification is allowed; a second evidence run is not.

## Adoption boundary

A ready disposition admits this exact corpus as a deterministic research
surface. It ships no puzzles and validates no player-facing label.
