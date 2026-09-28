# LC-0005 — complete-harvest-chain exact-state result

**Closure:** `CLOSED`

**Exact-state disposition:** `COMPLETE_HARVEST_SELECTED`

## Step

Complete-harvest topology review.

## Objective

Explain why the exact `M8-CONNECT` chain used only seven of ten built tiles,
then test whether one frozen placement repair could make all ten usable in one
legal small-to-large chain without changing tile values, score, policy, rules,
or random streams.

## Finding

The baseline reservoir was connected but forked. Starting from the ladder's
first built tile at `(0,3)`, exhaustive traversal of the ten-tile built graph
could use at most seven built tiles in one legal non-revisiting path. The
selected chain therefore left behind normalized `(0,6)=64`, `(0,7)=32`, and
`(1,7)=32`.

The frozen repair swapped `(3,7)=32` with `(2,7)=8`. That converted the fork
into one continuous path:

```text
4, 4, 4, 8, 8, 16,
32, 32, 32, 32, 32, 32, 32, 32, 32,
64
```

The unchanged champion selected that exact 16-tile chain. It contained all ten
built tiles and scored 63,360 immediately, versus 42,880 for the baseline
13-tile chain. The merge survivor had raw value 12,672 and settled at `(0,7)`
after gravity.

Both arms still reached the target on move 14. The repair raised final score
from 127,616 to 134,976 but did not save a move because the baseline already
crossed the target on move 14. This is exact evidence that complete-harvest
topology was feasible and recognized by the current champion in this one
counterfactual state; it is not evidence that such topology is generally
better or should become a policy term.

## Next Step

Before defining a metric, find one already-existing state with a superficially
similar small-to-large ladder where maximizing built-tile coverage is harmful
or impossible. That counterexample should distinguish the useful property from
the tempting but overbroad rule “always use every built tile.”

## Evidence

- Frozen protocol:
  `docs/learning-cycles/LC-0005-complete-harvest-chain-contract.md`
- Qualification:
  `docs/learning-cycles/LC-0005-complete-harvest-qualification.json`
- Raw retained run:
  `docs/learning-cycles/LC-0005-complete-harvest-raw.json`
- Independently recomputed outcome:
  `docs/learning-cycles/LC-0005-complete-harvest-recomputed.json`
- Executable closure:
  `docs/learning-cycles/LC-0005-complete-harvest-closure.json`

No champion, game rule, level, target, receipt, recording, or authoring file
changed.
