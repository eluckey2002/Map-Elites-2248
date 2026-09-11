# No-Blocker Nemesis prototype

**Throwaway prototype. This is not shipped level content, and its sessions are
not evidence-ledger records.**

## Question

Can an exact seed create a legible setup puzzle and a meaningful beat-the-bot
challenge on a fully open board?

The board is an open 6×5 field: no stones, ice, or bombs. Its only authored
feature is seed 3190, selected because its opening offers are unusually sparse.
Among the first 5,000 seeds screened with the bot's greedy chain generator,
only two had an initial best generated chain shorter than seven tiles.

The board uses a 90,000 target, 12 moves, minimum chain 3, and scale 32.

## Run

    node prototypes/no-blocker-nemesis/serve.js

Completed plays are saved under `prototypes/no-blocker-nemesis/sessions/`.

## Exact fixed-seed bot reference

The current bot reaches the target on move 10 with 95,488 points. Its first two
moves score only 1,536 each. Its two largest later moves score 20,800 on move 3
and 33,600 on move 9.

This is an exact result for this one board and seed. Selecting the seed against
the current bot may expose that bot's preferences rather than intrinsic human
difficulty.

## What to notice

- Does the sparse opening make you plan, or merely make the start annoying?
- Can you see a useful setup before the large chains become available?
- Does the exact seed create an identity you would recognize on replay?
- Does the board feel meaningfully different despite having no blockers?

The answer determines whether an authored board sequence can be a board family
of its own. Do not tune it after one play merely to improve its score.

## Outcome

**Successful challenge; rejected board family.** The owner reached 93,504 in 9
moves, beating the fixed-seed bot's 95,488 in 10. The human's decisive move was
a 19-tile, 45,120-point chain on move 7.

Despite the competitive result, the owner reported that the style created
nothing new: after one or two moves, refills made it feel like a fresh ordinary
board. The authored seed therefore gives the opening an identity but does not
make that identity persist through play. Do not search for another seed as a
layout-only fix; retire No-Blocker Nemesis as a distinct board family under the
current refill rules.
