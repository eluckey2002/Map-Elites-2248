# LC-0013 — target-gap arithmetic diagnostic

## Step: Target-Gap Arithmetic Review

**Objective:** Determine whether current score, score needed, ready-chain
points, preserving-move points, and moves remaining explain when to cash an
already legal route in the 14 closed LC-0012 pairs.

**Finding:** The arithmetic supplies one hard boundary: if the ready route
itself closes `target − current score`, cash-now wins immediately. None of the
14 retained routes reaches that boundary, and none of the complete observed
wait-through-cash packages reaches it either. All 14 decisions therefore
remain dependent on later play. Choosing whichever first action scores more
agrees with the faster target result in only 7 of 14 pairs.

The replay evidence shows why the missing term is downstream board value—not
another rearrangement of the same four scalars:

| Exact Level 54 replay | Score needed | Moves left | Ready route | First wait score | Target result |
| --- | ---: | ---: | ---: | ---: | --- |
| `ed62dd5655e8…` | 92,208 | 18 | 4,096 | 5,120 | Wait faster by 4 moves |
| `9cd33937c5c0…` | 97,328 | 18 | 768 | 3,072 | Cash-now faster by 2 moves |

In both cases waiting scores more on the first action and neither timing
package reaches the target. In `ed62dd5655e8…`, the wait path later accesses a
62,400-point chain on relative move 6, while the cash path's largest later
chain is 38,080 points on relative move 9. In `9cd33937c5c0…`, cash-now
overcomes its first-move deficit with a 49,280-point chain on relative move 5,
while the wait path's corresponding largest later chain is 38,400. The first
action changes the survivor, landing positions, refill consumption, and thus
the later legal routes.

The same insufficiency appears another way: `98c224c73680…` and
`ecc4053a8c93…` each have a 3,072-point ready route and nearly the same
102,000-point score gap, yet cash-now is faster in the first and waiting is
faster in the second.

**Next Step:** Do not define a timing metric yet. Trace the exact post-action
survivor landing, refilled tiles, and ancestry of the decisive later chain in
the wait-helpful `ed62dd5655e8…` case and the cash-helpful `9cd33937c5c0…`
counterexample. That is the smallest comparison that can turn “future board
value” into a concrete board property.

## Boundaries

- Exact deterministic derivation from the immutable LC-0012 raw matrix; no
  new panel run and no population inference.
- This establishes that the proposed common-state arithmetic is necessary but
  insufficient on these 14 cases. It does not establish which prospective
  board property will distinguish them.
- No metric, threshold, policy rule, champion, gameplay, level, target,
  receipt, recording, or authoring change.

## Verification

- All 14 selected LC-0012 pairs are present and identity-bound.
- The retained artifact recomputes exactly from the LC-0012 raw matrix.
- A changed source identity and a changed derived row both fail verification.
- Focused test: `solver/tests/lc0013TargetGapArithmetic.test.js`.
