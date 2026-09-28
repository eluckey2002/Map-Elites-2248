# LC-0007 — decision-lineage course-persistence result

**Closure:** `CLOSED`

**Panel disposition:** `WINNER_LINEAGE_EXPLAINS_SOME`

## Step

Decision-lineage review.

## Objective

Test the narrowest replayable meaning of “stay the course”: whether the exact
tile created by the eventual winner's decision survives gravity and later
participates in the selected chain that first reverses the three-step ordering.

## Finding

The exact created tile explains two of the four reversals, not all four.

| Owner move | Winner | Winner lineage in reversal? | Loser lineage in reversal? | Exact observation |
| ---: | --- | --- | --- | --- |
| 4 | champion | yes | no | The champion's landed `1024` was preserved for four continuations, then entered the 31,680-point reversal chain and transferred into its `6336` survivor. |
| 6 | owner | no | no | The owner's landed `1024` remained untouched through the continuation-5 reversal and was first reused at continuation 8. The losing champion reused its own carrier immediately, so earlier reuse was not better. |
| 9 | champion | yes | no | The champion lineage was reused twice and entered the 48,960-point reversal chain; the owner's lineage did not enter its correction chain. |
| 11 | owner | no | no | The owner lineage was reused once at continuation 1, but the continuation-4 56,320-point reversal chain came from other prepared tiles. The losing champion lineage was never reused. |

This supports the owner's idea while sharpening its scale. “Stay the course”
cannot mean “keep merging the one tile I just made.” At moves 4 and 9, that
literal interpretation is exactly what happened. At move 6, the winner did
better by leaving its anchor alone while the surrounding board matured. At
move 11, the anchor helped an earlier setup merge but was not part of the final
reversal chain.

The persistent object is therefore sometimes a tile, but more generally it is
the board plan: the entry, connectors, reservoir, and value-ordered route that
must remain compatible long enough to cash out. This exact four-case result
does not say how to score that plan or that it generalizes beyond the retained
replay.

## Next Step

Trace the full reversal chain backward to the post-decision board in the same
four cases. That ancestry map should show which existing tiles, newly spawned
tiles, and intermediate merges actually assembled the payoff, allowing us to
see the persistent route rather than forcing the strategy into one anchor tile.
Keep it diagnostic; do not define a metric yet.

## Evidence

- Frozen protocol:
  `docs/learning-cycles/LC-0007-decision-lineage-contract.md`
- Qualification and pre-outcome admission:
  `docs/learning-cycles/LC-0007-decision-lineage-qualification.json`
- Raw retained lineage replay:
  `docs/learning-cycles/LC-0007-decision-lineage-raw.json`
- Independently recomputed outcome:
  `docs/learning-cycles/LC-0007-decision-lineage-recomputed.json`
- Executable closure:
  `docs/learning-cycles/LC-0007-decision-lineage-closure.json`

No champion, game rule, level, target, receipt, recording, or authoring file
changed. No fresh gameplay outcome was generated.
