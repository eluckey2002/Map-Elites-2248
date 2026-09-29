# LC-0014 — timing board ancestry diagnostic

## Step: Landing and Ancestry Review

**Objective:** Identify the concrete post-action board property that separates
the helpful-wait `ed62dd5655e8…` replay from the helpful-cash
`9cd33937c5c0…` counterexample.

**Finding:** In both named cases, the faster first action creates a survivor
that lands at Level 54 cell `(1,5)`. That survivor remains a direct input to
the later decisive small-to-large harvest. The action is not better because it
waits or because it cashes; it is better because its output lands as a
compatible rung in the board's harvest path.

| Exact pair | Faster action | Winner landing | Slower landing | Winner decisive chain | Slower decisive chain |
| --- | --- | --- | --- | --- | --- |
| `ed62dd5655e8…` | Wait | `(1,5)` = 1,024 | `(2,6)` = 2,048 | 16 tiles, 62,400 points | 12 tiles, 38,080 points |
| `9cd33937c5c0…` | Cash now | `(1,5)` = 512 | `(3,4)` = 1,024 | 14 tiles, 49,280 points | 9 tiles, 38,400 points |

The ancestry explains what that landing buys. In the helpful-wait replay, the
winning decisive chain incorporates 26 common-board roots worth 9,472,
compared with 17 roots worth 7,040 in the slower cash arm. In the helpful-cash
counterexample, the winning chain incorporates 24 common-board roots worth
8,320, compared with 15 roots worth 7,040 in the slower wait arm. Every value
is conserved through the recorded merges.

Two tempting simpler explanations fail inside this comparison:

- Preserving the ready route helps in `ed62dd5655e8…`, but hurts in
  `9cd33937c5c0…`.
- Producing more first-action refills helps in the first case, but the faster
  arm produces fewer in the counterexample.

The supported insight is therefore exactly the owner's proposed one: evaluate
where the newly created chain tile lands and whether its value and position
fit the future harvest chain. This is still hindsight evidence from two named
replays; `(1,5)` is not yet a general rule or a metric.

**Next Step:** Before defining a metric, check the remaining 12 LC-0012 pairs
for the same prospective question: does the first-action survivor land on a
legal value-ordered path into the prepared high-value reservoir? Keep the
panel frozen and do not change the champion.

## Boundaries

- Exact deterministic reconstruction of the four already-retained arms in two
  named LC-0012 pairs; no new outcome run or population inference.
- Complete root and intermediate-merge ancestry for each arm's largest later
  chain, including the first survivor and all refill roots.
- No metric, threshold, timing rule, policy, champion, gameplay, level,
  target, receipt, recording, or authoring change.

## Verification

- All four arm traces reproduce the retained states, scores, RNG-call counts,
  terminal results, and target costs.
- Root-value conservation holds for every decisive-chain graph.
- The retained artifact recomputes exactly from the immutable LC-0012 raw
  matrix and its frozen recordings.
- Changed source identity and coherently changed ancestry data both fail
  closed.
- Focused test: `solver/tests/lc0014TimingBoardAncestry.test.js`.
