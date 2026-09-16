# RESULT-0031 — Corrected-cap representative-board descriptor proxies

**Outcome:** `INCONCLUSIVE`; revise before building a MAP corpus.

This fresh confirmation replaces invalidated RESULT-0030. The corrected
generator applied one hard 16-action cap after combining both candidate
families. It found replayable target witnesses on all eight puzzles, but only
four of eight retained the same coarse descriptor bin when beam width rose
from 12 to 48. The 50% agreement rate missed the frozen 75% bar.

## C1 — deterministic repeat and scale control: PASS

The focused controls passed 10/10 before confirmation. They covered repeat,
scaled spawns, legal witness replay, planted witness failure, bounded misses
remaining `UNKNOWN`, representative dimensions, and combined-cap behavior.

## C2 — combined candidate cap: PASS

All 96 cap/search runs satisfied `generatedActions <= expandedStates × 16`.
No run exceeded the registered per-state limit.

## C3 — suite unchanged: PASS

The post-run solver suite reported 391 tests: 386 pass, the same four
deliberate failures, and one skip. There was no new failure.

## C4 — registration, replay, identity, and source closure: PASS

The artifact binds registration commit `3a6c38c`, the corrected instrument,
and every frozen source. Both arms share each puzzle identity. Every successful
witness replayed under its recorded cap. Independent verification regenerated
the full corpus byte-for-byte and returned artifact identity
`d68b5492dd55464f9a957e0b72cb3ee5cb82022b9eef71b77eac7de474bb6048`.

## P1 — representative-panel coverage: SUPPORTED

The deep arm found replayable target witnesses on all 8/8 puzzles and covered
all four shipped board profiles. The frozen bar was at least 7/8 and every
profile.

## P2 — paired search-width stability: INCONCLUSIVE

All eight puzzles had witnesses in both arms, and the deeper arm worsened
neither upper bound. Only four retained the same coarse bin, for 50% agreement
against the required 75%.

Four cells changed under deeper search:

- Level 10, seed 32,200,000: `tight-short` to `relaxed-short`.
- Level 31, seeds 32,200,000 and 32,200,001: `tight-short` to
  `relaxed-short`.
- Level 54, seed 32,200,000: `tight-long` to `tight-short`.

## P3 — compute accounting: PASS

The shallow arm expanded 11,594 states and the deep arm expanded 43,275, a
3.733x ratio. This is diagnostic only; the arms are not compute matched.

## P4 — scoped disposition: INCONCLUSIVE

The disposition is `REVISE_BEFORE_MAP_CORPUS`. The corrected proxy reaches
targets across the representative shapes, but its cell assignment remains
materially dependent on search width. A later design should represent that
uncertainty directly instead of treating one bounded upper bound as a settled
coordinate.

## Confirmation rows

| Level | Shape | Seed | Shallow bin | Deep bin | Deep move UB | Deep tightness UB | Deep cap UB |
|---:|:---:|---:|:---|:---|---:|---:|---:|
| 10 | 5x8 | 32,200,000 | tight-short | relaxed-short | 11 | 0.500 | 12 |
| 10 | 5x8 | 32,200,001 | tight-short | tight-short | 12 | 0.545 | 12 |
| 31 | 5x7 | 32,200,000 | tight-short | relaxed-short | 15 | 0.500 | 12 |
| 31 | 5x7 | 32,200,001 | tight-short | relaxed-short | 14 | 0.467 | 12 |
| 53 | 6x5 | 32,200,000 | tight-short | tight-short | 11 | 0.688 | 12 |
| 53 | 6x5 | 32,200,001 | tight-short | tight-short | 12 | 0.750 | 12 |
| 54 | 4x8 | 32,200,000 | tight-long | tight-short | 18 | 0.750 | 12 |
| 54 | 4x8 | 32,200,001 | tight-short | tight-short | 20 | 0.833 | 12 |

## Exclusions preserved

These are replayed upper bounds, not exact minimum moves or exact chain
dependence. This result does not measure difficulty, fun, preference, policy
quality, or natural puzzle frequency, and it changes no shipped level or rule.
