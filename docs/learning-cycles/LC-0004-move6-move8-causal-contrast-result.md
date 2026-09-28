# LC-0004 — move-6 versus move-8 causal contrast result

**Date:** 2026-09-28  
**Scope:** two exact Level 54 owner-arm cutoff states and four frozen tile swaps  
**Status:** complete exact-case diagnostic; no metric, population, policy, or adoption claim

## Step

Matched causal replay.

## Objective

Test whether spatial arrangement, rather than the amount of stored built value
alone, changes how quickly the unchanged champion converts the exact move-6 and
move-8 owner states to the target.

## Finding

Spatial arrangement is causally consequential in these exact states, but
**more connected built reservoir is not a monotonic rule**.

| Exact arm | Built components | Built-only reservoir | Next champion move | Total target cost | Change |
| --- | ---: | ---: | ---: | ---: | ---: |
| move 6 baseline | `6 + 2` | 14,336 | 5,120 | 15 | — |
| `M6-CONNECT` | `8` | 24,576 | 4,800 | 16 | **+1 worse** |
| `M6-DISCONNECT` | `5 + 2 + 1` | 12,288 | 3,072 | 18 | **+3 worse** |
| move 8 baseline | `8 + 2` | 24,576 | 6,144 | 17 | — |
| `M8-CONNECT` | `10` | 24,576 | 42,880 | 14 | **−3 better** |
| `M8-DISCONNECT` | `5 + 2 + 2 + 1` | 12,288 | 12,288 | 20 | **+3 worse** |

Every intervention preserved score, move count, target, move budget, exact tile
multiset, RNG position at the cutoff, and the production champion. Only the
declared tile coordinates changed.

## Replay evidence

### Helpful reference: move 6

At its three-step cutoff, the owner arm is at score 39,424 on move 9 and needs
six more champion moves, finishing on move 15. Its built occupancy is split
into components of six and two:

```text
 4   4   4   4
 4   4   2   2
 4  16   8  16
 2   #   #   8
 4  32   2   8
32   2   2   4
64  32   8  32
32  32   8  32
```

`M6-CONNECT` swaps `(3,6)=32` with `(2,6)=8`, joining all eight built
tiles. The built-only reservoir rises from 14,336 to 24,576, but the champion
switches from a 5,120-point next chain to a 4,800-point low-value ladder and
finishes on move 16. Connectivity and reservoir magnitude increased while the
actual objective worsened by one move.

`M6-DISCONNECT` removes `(1,4)=32` from the lower-left group. The next move
falls to 3,072 and the target is delayed to move 18. Fragmentation is harmful
in this exact state, but its opposite is not automatically helpful.

### Counterexample and reversal: move 8

At its three-step cutoff, the owner arm is at score 48,896 on move 11 and also
needs six more champion moves, finishing on move 17. Its built occupancy is
split into components of eight and two:

```text
 2   2   4   4
 2   2   4   2
32  16   8   8
32   #   #   4
 2   8   2   8
32  16  32   4
64  32   8  32
32  32   8  32
```

`M8-CONNECT` swaps `(0,2)=32` with `(0,4)=2`. This fills the one-cell
vertical gap at `(0,4)` and joins all ten built tiles. The built-only reservoir
measure stays exactly 24,576, yet the next champion chain changes from four
`32`-normalized tiles worth 6,144 points to a 13-tile mixed ladder:

```text
4, 4, 4, 8, 8, 16, 32, 32, 32, 32, 32, 32, 32
```

That chain scores 42,880 immediately. The arm reaches the target on move 14,
three moves earlier than the baseline and one move earlier than the original
move-8 champion alternative at move 15. This is a counterfactual board edit,
not a legal candidate policy action or a new champion.

`M8-DISCONNECT` removes the lower bridge at `(2,5)=32`. Target cost rises from
17 to 20. As at move 6, fragmentation is harmful in the exact manipulated
state.

## What this does and does not establish

The four swaps establish that placement can change target cost while score and
tile multiset remain fixed. They also rule out both of these simple readings:

1. larger built-only reservoir is always better; and
2. one larger connected built component is always better.

The sharper mechanism candidate is **executable bridge compatibility**: a
placement is valuable when low and built tiers form a long legal ladder that
the current chooser can cash at the right time. Move 8's connection does this;
move 6's connection increases stored value but diverts the chooser into a
different, slower route.

That phrase is a replay-grounded hypothesis, not a metric. Four deliberately
chosen edits on two opened states cannot establish unseen-board prediction,
general causal direction, or a promotion rule.

## Next Step

Do not add a score term. If this line is continued, first trace the exact
mixed-tier bridge and survivor placement through the move-8 42,880-point chain,
then find an already-existing state where a superficially similar bridge fails.
That would test whether “executable bridge compatibility” survives a genuine
counterexample before it is formalized.

## Evidence and verification

- Frozen contract:
  `docs/learning-cycles/LC-0004-move6-move8-causal-contrast-contract.md`
- Bound manifest identity:
  `54fe5e6027a8dbcc326260af239acb0a3531c45bb7ceefc827e7a8b426f4d4fb`
- Harness qualification: `PASS`, artifact identity
  `0b8f1baf09ce722b1442e19aa4d77a105824f9fecdd1d308ab69babd3bd49d4b`
- Raw six-arm artifact identity:
  `aba76b65d3c7a89a034c6dc8b2937e1c5b086f9ac23c23f9bcf00b27a42280d1`
- Collector: `tools/diagnose-lc0004-move6-move8.js`
- Focused test: `solver/tests/lc0004CausalContrast.test.js`
- Exact retained-result test: `solver/tests/lc0004Result.test.js`
- Focused policy and diagnostic set: 36/36 passed.
- Full suite: 624/629 passed, 4 failed, 1 skipped. The failures all predate
  LC-0004: the two documented stale candidate receipts, the stale Universe Map,
  and a live failed-run-ledger fixture that still expects only `FR-0005` after
  commit `792b5b4` added `FR-0006`.
- `node tools/verify-experiments.js`: passed.

No champion, engine, shipped game, level, target, receipt, recording, or
authoring file changed.
