# Builder Pocket prototype

**Throwaway prototype. This is not shipped level content, and its sessions are
not evidence-ledger records.**

## Question

Does a stone-bounded side bay let the player deliberately park a valuable
survivor, continue working in the main field, and later reconnect it for a
payoff?

The 5×5 board has a three-cell pocket in its upper-right corner. A one-cell
mouth connects it to the main field, while stones below and beside it prevent
ordinary gravity churn from immediately pulling a stored tile away.

The board uses seed 447, a 60,000 target, 12 moves, minimum chain 3, and scale
32.

## Run

    node prototypes/builder-pocket/serve.js

Completed plays are saved under `prototypes/builder-pocket/sessions/`.

## Exact fixed-seed bot reference

The current bot reaches the target on move 9 with 68,416 points. Its board
demonstrates the intended mechanic:

- Move 4 builds a 1,024 survivor at the back of the pocket.
- Moves 5–8 leave that exact tile untouched while the bot plays elsewhere.
- Move 9 reconnects through the mouth, uses the stored 1,024 as the endpoint,
  and scores 32,640.

This is an exact result for this one board and seed, not evidence that the bot
planned the nine-move sequence or that humans will find the pocket legible.

## What to notice

- Does the pocket read as a useful place to store value?
- Can you intentionally put a valuable survivor there?
- While it is stored, does it feel protected or trapped?
- Does bringing it back into a chain feel earned rather than lucky?

The answer determines whether Builder Pocket survives as a distinct board
family. Do not tune it after one play merely to improve its score.

## Outcome

**Rejected at the concept level.** The owner stopped before completing the
board because the pocket did not feel meaningful. Rather than making stored
value feel protected and useful, the enclosure made the other tiles in that
area feel wasted.

This failure is structural, not a score or seed problem: the topology removes
useful board space without returning a sufficiently legible strategic choice.
Do not tune the mouth, target, or seed. Retire Builder Pocket in this form.
