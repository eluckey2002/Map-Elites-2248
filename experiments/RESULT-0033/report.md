# RESULT-0033 — Merge-depth × spatial-spread candidate descriptors

**Outcome:** `SUPPORTED`; eligible for a separate registered MAP corpus.

The 32-board confirmation cleared coverage, range, and search-width stability
for both successful-witness proxies. This qualifies the pair for later corpus
construction; it does not turn either proxy into an exact property of every
solution or establish player-facing meaning.

## C1 — merge-depth positive control: PASS

The hand-replayed dependent construction produced peak merge depth 2, while
the flat one-generation construction produced 1.

## C2 — spatial-spread positive control: PASS

The compact legal chain on the 4x4 fixture produced normalized span 1/3, and
the diagonal chain produced 2/3.

## C3 — negative scale control: PASS

Uniformly scaling every tile and the target by 32 preserved both proxies.

## C4 — replay, identity, registration, and source closure: PASS

Every successful witness replayed with its recorded score, recursive lineage,
descriptor trace, and puzzle identity. Planted witness and artifact mutations
failed. Full recomputation matched artifact identity
`48c31d54296c5ddf6f833717992e2039a32e504ce4d1debb6770e71626325e45`
and registration commit `dae2ef1`.

## C5 — suite unchanged: PASS

The post-run solver suite reported 399 tests: 394 pass, the same four
deliberate failures, and one skip. No new failure appeared.

## P1 — representative-panel coverage: SUPPORTED

The deep arm found replayable target witnesses on all 32/32 puzzles and all
four profiles. The frozen bar was at least 30/32 and every profile.

## P2 — descriptor range: SUPPORTED

Deep witnesses produced peak merge depth 1 on 20 boards and depth 2 on 12,
well above the four-row population floor for each value. Mean normalized chain
span ranged from 0.7143 to 0.9538, a span of 0.2396 against the 0.15 bar.

## P3 — search-width stability: SUPPORTED

Twenty-eight puzzles had witnesses at both widths. Twenty-five retained the
same peak depth (89.3%), and 27 kept mean normalized chain span within 0.10
(96.4%). Both exceeded the frozen 75% bars. The four unpaired shallow misses
were all Level 54 and remain `UNKNOWN` at that width.

## P4 — scoped disposition: SUPPORTED

The disposition is `ELIGIBLE_FOR_A_SEPARATE_MAP_CORPUS`. A later registered
corpus may use these coordinates with their witness-qualified names and
standing. Adoption still requires its own sampling design and does not validate
the remaining forced-move-ratio × solution-diversity pair.

## Panel summary

| Measure | Result | Frozen bar |
|---|---:|---:|
| Deep witnesses | 32/32 | at least 30/32 and all profiles |
| Depth 1 / depth 2 | 20 / 12 | at least 4 in two values |
| Spatial-spread range | 0.2396 | at least 0.15 |
| Paired witnesses | 28 | at least 28 |
| Exact depth agreement | 25/28 (89.3%) | at least 75% |
| Spatial agreement within 0.10 | 27/28 (96.4%) | at least 75% |

## Exclusions preserved

`peakMergeDepth` is the peak created along one registered witness, not the
minimum depth the puzzle requires. `meanNormalizedChainSpan` is the geometry
of that witness, not every solution or player behavior. Bounded misses remain
`UNKNOWN`. This run changes no level, rule, policy, or MAP archive and makes no
claim about difficulty, fun, or preference.
