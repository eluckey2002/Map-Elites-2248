# LC-0017 — No-reentry target-chain ancestry

**Step:** Target-Chain Root Review

**Objective:** In the two retained cash-faster pairs where cash reaches target without reusing its first survivor, trace the exact target-crossing chain back to its common-board and refill roots, then compare it with the slower wait continuation.

**Finding:** Both cash target chains use none of the ready-route roots and never carry the first-action survivor. They are instead built chiefly from later-refill roots: on `b42b2e0e4d40…`, cash reaches target in 4 moves with 17 later-refill roots worth 1,664 plus 3 common-board roots worth 256, versus wait's 6 moves with 7 later-refill roots worth 896 plus 11 common-board roots worth 1,536. On `e81f8323ede9…`, cash reaches target in 5 moves with 15 later-refill roots worth 50 plus one common root worth 8, versus wait's 8 moves with 13 later-refill roots worth 50 plus 29 common roots worth 190 and 5 first-action-refill roots worth 16. The shared fact is reliance on later refills, not a shared amount of preserved common-board value; it therefore does not yet identify a causal ranking rule.

**Next Step:** Compare the exact later-refill roots that enter each cash target chain—their spawn move, values, positions, and predecessor merges—with matched later-refill roots that did not enter. First look for a concrete replay-level distinction and counterexample; do not name a metric or modify the policy.

## Exact replay matrix

| Pair | Cash / wait moves to target | Cash target-chain roots | Wait target-chain roots |
| --- | ---: | --- | --- |
| `b42b2e0e4d40…` | 4 / 6 | common: 3 / 256; first refill: 0 / 0; later refill: 17 / 1,664 | common: 11 / 1,536; first refill: 0 / 0; later refill: 7 / 896 |
| `e81f8323ede9…` | 5 / 8 | common: 1 / 8; first refill: 0 / 0; later refill: 15 / 50 | common: 29 / 190; first refill: 5 / 16; later refill: 13 / 50 |

Each root entry is `count / value`. “Later refill” means a tile spawned after the first post-readiness action. A root can be repeatedly merged into a descendant; the ancestry graph counts each original root once and checks that its total value equals every descendant merge output.

## Boundary

Each arm replays its retained continuation exactly, checking every pre-state, action points, score, move count, RNG refill count, post-state identity, and terminal result. The check traces only the final retained target-crossing chain. It does not search alternative continuations, estimate whether a root category causes the result, define a metric, rank a policy, or change the champion, gameplay, levels, targets, receipts, recordings, or authoring system.
