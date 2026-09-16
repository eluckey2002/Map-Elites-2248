# RESULT-0035 — Merge-depth × spatial-spread MAP corpus

The registered 128-puzzle confirmation closed validly with disposition
**`MAP_CORPUS_INCONCLUSIVE`**. Coverage and four-cell occupancy were supported;
cross-width cell stability was inconclusive.

## C1 — axis boundary control: PASS

The four fixed boundary fixtures land in the four named cells. A spread of
0.82 is assigned to the broad side as registered.

## C2 — archive positive and negative controls: PASS

The balanced 128-row fixture fills all four cells and receives
`CANONICAL_MAP_CORPUS_READY`. The two-cell collapse is `FALSIFIED` and receives
`MAP_CORPUS_NOT_SUPPORTED`. Cross-width cell flips, spread drift above 0.10,
and bounded misses are refused archive admission.

## C3 — inherited descriptor controls: PASS

The recursive two-generation fixture reports depth 2 against the flat
fixture's depth 1. Compact and board-wide chains separate spatial span,
uniform scaling preserves both proxies, bounded misses remain `UNKNOWN`, and a
planted illegal witness fails replay.

## C4 — replay, identity, registration, and closure: PASS

The unregistered runner refused before compute. The artifact binds registration
commit `f68edd2`, all 128 rows bind the same puzzle across widths, and every
recorded witness replayed. Planted artifact and row mutations failed. Source
closure, artifact identity, decision recomputation, and the executable closeout
contract passed. Corpus artifact identity:
`52bf543e937358e4ba4f2f2fe2812df05bfae74b1b08b81ce226f3f452f4fef2`.

## C5 — suite unchanged: PASS

The solver suite reported 406 tests: 401 pass, the same four deliberate
failures remain, and one test is skipped. The five added solver tests passed;
no new failure appeared.

## P1 — representative-panel coverage: SUPPORTED

Deep search found replayable witnesses on **128/128** puzzle identities and
covered all four registered profiles, exceeding the 120-row bar.

## P2 — four-cell corpus occupancy: SUPPORTED

All cells retained the registered four representatives. Stable eligible counts
before the per-cell cap were:

| Cell | Eligible | Retained |
| --- | ---: | ---: |
| depth 1 / compact | 12 | 4 |
| depth 1 / broad | 30 | 4 |
| depth 2+ / compact | 10 | 4 |
| depth 2+ / broad | 11 | 4 |

## P3 — cross-width cell stability: INCONCLUSIVE

Both widths found witnesses on 115 puzzles, above the 112 paired-row floor.
Only **63/115 (54.8%)** met exact cell agreement plus the 0.10 spread-difference
limit, below the registered 75% support bar but above the 50% falsification
bar. Exact depth agreed on 90/115; spread alone stayed within 0.10 on 105/115.
The instability is therefore mostly cell-boundary and witness-choice movement,
not lack of deep-search coverage.

## P4 — scoped disposition: INCONCLUSIVE

Because P3 is inconclusive, the frozen joint disposition is
`MAP_CORPUS_INCONCLUSIVE`. The retained 16 representatives are a useful
diagnostic corpus, but they are not admitted as the canonical MAP corpus.

## Evidence boundary and next step

This result does not invalidate merge depth or spatial spread, and it does not
license changing the 0.82 boundary after seeing these data. A repair needs a
new registered subject that reduces witness dependence—such as an ensemble or
uncertainty-aware cell assignment—or a new independent panel. Adding seeds to
this opened range cannot repair the frozen stability miss.
