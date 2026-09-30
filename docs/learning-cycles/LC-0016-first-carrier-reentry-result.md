# LC-0016 — First carrier re-entry

**Step:** Carrier Re-entry Review

**Objective:** In the seven LC-0015 disagreements, trace the retained replay until the first-action survivor, or the tile descended from it, actually re-enters a later completed legal chain.

**Finding:** Re-entry is real but not a timing rule. In two cash-faster pairs, cash re-enters earlier than wait (`10e4dff8050d…`: move 3 versus 6; `9cd33937c5c0…`: 5 versus 10), and in one wait-faster pair wait re-enters while cash never does (`ecc4053a8c93…`: 10 versus never). But `b068afb04eb9…` reverses that pattern—cash re-enters at move 2 while the faster wait arm re-enters at 5—and two cash-faster pairs reach target without reusing their cash survivor at all. The survivor can contribute to a later chain, but neither the existence nor the timing of that re-entry alone explains which first action is better.

**Next Step:** Compare the target-reaching chains in the two cash-faster no-re-entry cases with their slower survivor-reusing alternatives. The question is no longer whether the first survivor is reused, but what other retained board resource reaches the target when it is not.

## Exact replay matrix

`—` means that the first-action survivor was not an input to another retained chain before that arm reached target.

| Pair | Faster arm | Wait first re-entry | Cash first re-entry |
| --- | --- | ---: | ---: |
| `10e4dff8050d…` | Cash | 6 | 3 |
| `267a43735c9d…` | Cash | — | — |
| `9cd33937c5c0…` | Cash | 10 | 5 |
| `b068afb04eb9…` | Wait | 5 | 2 |
| `b42b2e0e4d40…` | Cash | 4 | — |
| `e81f8323ede9…` | Cash | 8 | — |
| `ecc4053a8c93…` | Wait | 10 | — |

## Boundary

Each arm replays its retained continuation exactly, checking every pre-state, points total, score, move count, RNG refill count, post-state identity, and terminal result. Re-entry is deliberately narrower than a new board search: it means that the tracked survivor descendant is an input to a later chain the retained replay actually executes. No alternative continuations were searched; no metric, threshold, policy rule, champion, gameplay, level, target, receipt, recording, or authoring system changed.
