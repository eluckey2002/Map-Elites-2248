# LC-0019 — Ordered-path substitution

**Step:** Ordered-Path Slot Check

**Objective:** Test whether the equal-birth, equal-value root that stayed outside a cash target chain can occupy the included root’s exact ordered slot in that already-recorded chain.

**Finding:** It cannot in either selected example, because the replacement breaks required adjacency in the existing path. On Level 3 (`e81f8323ede9…`), the chain segment is `(2,4)=2 → (1,3)=2 → (0,2)=2`; replacing included `S0026` at `(1,3)` with adjacent equal `S0022` at `(2,3)` creates the invalid jump `(2,3) → (0,2)`. On Level 52 (`b42b2e0e4d40…`), the segment is `(4,1)=128 → (4,2)=256 → (4,3)=256`; replacing included `S0024` with equal `S0020` at `(0,1)` breaks both neighboring edges. The relevant fact is an exact tile’s place in the ordered, value-compatible path—not merely whether an equal tile exists nearby.

**Next Step:** Keep the scope narrow: enumerate whether either excluded root can enter *some other* legal target-crossing path on its same pre-target board, while holding every other board tile fixed. This separates “cannot occupy this slot” from “cannot participate at all”; it still does not define a metric or change the policy.

## Boundary

This is a static coordinate substitution into the retained cash target chain. The original chain is checked legal with the level’s actual minimum-chain length; the substituted chain is checked by the same validator. The study does not execute the substitution, search a reordered chain, claim that the excluded tile is generally useless, define a feature, or alter the champion, gameplay, levels, targets, receipts, recordings, or authoring system.
