# LC-0018 — Later-refill contrast

**Step:** Equal-Birth Refill Contrast

**Objective:** For every later-refill root that directly enters either retained cash target-crossing chain, compare it with an equal-value root born in the same refill that remains live but does not enter the chain.

**Finding:** Refill age and value do not decide whether a root joins the target chain. On Level 52 (`b42b2e0e4d40…`), the 4th-move cash chain uses all six `64` roots born on relative move 2, so no same-birth `64` counterexample remains; among relative-move-3 roots, it uses `S0024` (`256`, pre-target `(4,2)`) while equal `S0020` (`256`, `(0,1)`) stays out. On Level 3 (`e81f8323ede9…`), every one of the 15 entering later-refill roots has an equal-value, same-birth live counterpart that stays out. The sharp counterexample is `S0026` and `S0022`: both are `2`s born on relative move 3, and immediately before cash wins they sit at `(1,3)` and `(2,3)`, one cell apart; `S0026` enters the final small-to-large chain and `S0022` does not. The observed distinction is membership in the whole legal ordered path, not root age, value, or local proximity by itself.

**Next Step:** On the Level 3 adjacent-pair counterexample, replay the exact final target chain with its ordered edges and show which required value transition the excluded `2` cannot replace without breaking the path. Then check one counterexample from Level 52 before proposing any general feature.

## Matching rule

A comparison root must be a later-refill root that is still live immediately before cash crosses target, was born on the same relative move as the entering root, has the same value, and is absent from the target-chain roots. When several qualify, the replay selects the one with the smallest Manhattan distance from the entering root, breaking ties by root ID. A missing match remains missing rather than being substituted from a different time or value.

## Boundary

The artifact replays only the two retained cash continuations, checking the retained state, points, score, moves, refill RNG calls, post-state identity, and terminal result at every move. It records existing roots and their positions immediately before the retained target-crossing move. It does not test a replacement action, search another continuation, assert that position causes inclusion, define a metric, or change the champion, gameplay, levels, targets, receipts, recordings, or authoring system.
