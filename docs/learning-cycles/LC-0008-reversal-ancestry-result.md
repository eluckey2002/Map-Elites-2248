# LC-0008 — reversal-chain ancestry result

**Closure:** `CLOSED`

**Panel disposition:** `FULL_ANCESTRY_TRACED`

## Step

Reversal-ancestry review.

## Objective

Trace each correction-producing chain backward to show the complete route from
the post-decision board and later spawns through intermediate merges. Determine
what “stay the course” physically preserved without defining a metric.

## Finding

In all four paired states, the eventual winner's correction chain used more
tiles and more value that were already present immediately after the decision
than the loser's correction chain. Every winner also made at least one
intermediate merge that became a rung in the final value-ordered chain.

| Owner move | Winner | Post-decision roots used, winner : loser | Post-decision value used, winner : loser | Later-spawn value used, winner : loser | Intermediate merges, winner : loser |
| ---: | --- | ---: | ---: | ---: | ---: |
| 4 | champion | 16 : 3 | 5,504 : 384 | 832 : 640 | 2 : 0 |
| 6 | owner | 6 : 2 | 1,216 : 384 | 1,408 : 640 | 1 : 0 |
| 9 | champion | 11 : 6 | 9,344 : 896 | 448 : 1,216 | 1 : 1 |
| 11 | owner | 13 : 1 | 10,688 : 64 | 576 : 1,280 | 1 : 0 |

The winner routes show the same concrete shape:

- At move 4, the champion first assembled `1024` and `512` rungs, then joined
  them to prepared `1024` and `2048` tiles in a 6,336-value correction chain.
- At move 6, the owner assembled a `1024` rung and used it above
  `64-64-64-128-256-256-256-512` in a 2,624-value correction chain. The
  decision survivor itself remained preserved elsewhere.
- At move 9, the champion merged four prepared `1024` tiles into `4096`, then
  used the complete ascending route from `64` through `4096` for 9,792 value.
- At move 11, the owner assembled the missing `1024` rung from small tiles,
  then joined it to eight prepared `1024` tiles and a `2048` for 11,264 value.
  The decision survivor had already served an earlier setup merge and was not
  required in this final chain.

The move-9 loser is the useful counterexample. It also made an intermediate
merge, but only a `512`, and its correction route had just 896 value from the
post-decision board. Building a bridge is therefore not sufficient by itself;
the bridge must enter a preserved higher-value reservoir through a complete
small-to-large path.

This makes the owner's “stay the course” strategy concrete for these four
states: preserve the high-value reservoir while manufacturing the missing
entry or connector, then cash out the whole compatible route. The persistent
object is the route plan, not necessarily the decision-created tile.

This is hindsight ancestry of eight retained arms. It does not yet tell the
policy how to recognize that route prospectively, and it is not a score,
threshold, feature, or general claim.

## Next Step

Build a replay-time readiness timeline for the same eight arms. Immediately
before each continuation, show which exact value rung or spatial adjacency is
still missing, when the full route first becomes executable, and whether the
selected move advances or abandons it. Keep this as an exact diagnostic; do not
define a metric yet.

## Evidence

- Frozen protocol:
  `docs/learning-cycles/LC-0008-reversal-ancestry-contract.md`
- Qualification and pre-outcome admission:
  `docs/learning-cycles/LC-0008-reversal-ancestry-qualification.json`
- Raw ancestry graphs:
  `docs/learning-cycles/LC-0008-reversal-ancestry-raw.json`
- Independently recomputed outcome:
  `docs/learning-cycles/LC-0008-reversal-ancestry-recomputed.json`
- Executable closure:
  `docs/learning-cycles/LC-0008-reversal-ancestry-closure.json`

No champion, game rule, level, target, receipt, recording, or authoring file
changed. No fresh gameplay outcome was generated.
