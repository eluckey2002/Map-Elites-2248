# Double Vault Rescue prototype

**Throwaway prototype. This is not shipped level content, and its sessions are
not evidence-ledger records.**

## Question

If bombs sit in true dead ends, does the required short defusal move create a
valuable survivor the player deliberately returns to later?

This is not another divider or opening-board variation. Four stones form two
bottom vaults. Each bomb has only one adjacent doorway, so any chain that
clears it must end there; a large chain cannot merely sweep through it. The
left vault is open immediately. The right doorway is frozen for four moves.

## The decision being tested

On seed 34, the opening offers a 15-tile, 6,080-point chain elsewhere, but the
urgent left-bomb route is only three tiles and 384 points. The intended choice
is to reject the tempting large chain, rescue the bomb, and leave its merged
survivor banked in the vault for a later chain. The right vault creates the
same decision after its doorway thaws.

The screen's comparison arm is repeated bounded-largest-chain play. It takes
the 15-tile opening and then explodes after move 3 with 22,080 points. That arm
is a solver heuristic, not evidence of the owner's normal strategy. The current
bot clears the left bomb on move 1, reuses that banked survivor as the endpoint
of a 16-tile chain on move 5, clears the right bomb on move 6, and reaches the
45,000 target on move 7 with 45,184 points.

This prototype is not ready to ask the owner to play. First, replay the exact
seed-34 opening against a captured example of the owner's build-and-harvest
baseline and name the board state where that baseline's expected move is
suboptimal. If no such divergence can be shown, retire the board without
turning it into another playtest chore.

The mechanism persists through refills because both bombs and their defused
survivors remain in bottom-row dead ends. Clearing a threat does not erase the
space or the tile it created; it turns the rescue move into a possible later
payoff.

Reject this design after one play if the rescue moves feel like chores rather
than investments, if the banked survivors do not affect a later decision, or
if ordinary largest-chain play still feels sufficient despite losing to the
timer.

## Run

    node prototypes/double-vault-rescue/serve.js

Then open:

<http://127.0.0.1:8264/index.html?candidate=5909&seed=34>

If the readiness check passes, completed plays are saved under
`prototypes/double-vault-rescue/sessions/` for replay-backed analysis.
