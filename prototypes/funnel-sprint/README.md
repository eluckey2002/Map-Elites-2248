# Funnel Sprint prototype

**Throwaway prototype. This is not shipped level content, and its sessions are
not evidence-ledger records.**

## Question

Do three narrow feeder lanes and an eight-move budget create a distinct
routing-and-timing problem rather than ordinary chain hunting?

The 5×5 board has two short stone dividers. They separate the upper board into
three one-cell-wide lanes, then end above a shared two-row payoff zone. There
is no timed gate: all routes are available immediately, but every route must
pass through the same limited convergence space.

The board uses seed 403, a 22,000 target, eight moves, minimum chain 3, and
scale 32.

## Run

    node prototypes/funnel-sprint/serve.js

Completed plays are saved under `prototypes/funnel-sprint/sessions/`.

## Exact fixed-seed bot reference

The current bot reaches the target on move 8 with 41,216 points. It enters its
last move at 18,496, then scores 22,720 by joining lane material through the
lower zone.

This is an exact result for this one board and seed, not a population
difficulty claim.

## What to notice

- Do the three lanes make you choose where to spend a move?
- Do you preserve one route while working another?
- Does the lower zone feel like a useful convergence area or merely a cramped
  bottom row?
- Does eight moves create an exciting sprint or just arbitrary pressure?

The answer determines whether Funnel Sprint survives as a distinct board
family. Do not tune it after one play merely to improve its score.

## Outcome

**Distinct but spawn-sensitive.** The owner beat the fixed-seed bot by one
move: 24,704 in 7 moves versus the bot's 41,216 in 8. The human entered move 7
with 7,424 points, then won with a 13-tile, 17,280-point chain spanning all
three feeder lanes. The bot entered its last move with 18,496 and finished with
a 22,720-point chain using the left and center lanes.

The owner reported that coordinating the lanes was the objective, but the
result felt like "a little bit of both" strategy and luck because of what
spawned. Funnel Sprint therefore passes the distinct-objective probe but does
not yet demonstrate reliable player agency. Preserve the family as promising;
do not treat this particular layout as solved or generalize from its single
player and seed.
