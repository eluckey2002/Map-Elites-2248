# Sequential Defusal Relay prototype

**Question:** Can a reachable bomb followed by an ice-gated bomb make the
player's priority change twice before the board settles into ordinary score
play?

This is throwaway level 5908 on fixed seed 27. The first bomb has a three-move
timer. Two stones enclose the second bomb behind a three-move ice gate; its
six-move timer is already running, so the gate opens with only three moves
left to reach it. The existing rules cannot delay the second timer itself.

The fixed-seed reference bot clears the first bomb on move 1, clears the second
on move 6, and reaches the 50,000 target on move 8 with 54,976 points.

Run it with one command:

```sh
node prototypes/sequential-defusal-relay/serve.js
```

Then open:

<http://127.0.0.1:8258/index.html?candidate=5908&seed=27>

The useful playtest question is not simply whether the level is hard. Notice
whether your attention genuinely shifts from the first bomb, to preparing for
the thawed route, to scoring—or whether it just feels like two chores followed
by an ordinary board.

## Outcome

**Rejected after owner playtests.** The owner first won with 64,448 points in 7
moves, beating the reference bot's 54,976 in 8 moves, and reported that the
board did not change their play. The first bomb disappeared inside the move-1
chain. The second disappeared inside the move-4 chain as soon as the ice
thawed. Neither required a special defusal move; both were simply swept into
the same long chains the owner already wanted to make.

This answers the prototype question negatively. With the current rule that a
bomb can be consumed at any position in an ordinary chain, sequencing access
does not by itself create sequential strategy. It creates visible timers, but
not a new decision. Do not tune this layout or seed; a meaningful relay would
need a different bomb interaction, which is a game-rule proposal rather than
another board variant.

A second owner play strengthens that rejection. The owner deliberately used
the same rule on every turn—take the maximum available chain—and improved to
57,920 points in 6 moves. All six chains contained 21–24 tiles. The first bomb
was cleared by the move-1 maximum chain and the second by the move-5 maximum
chain, without departing from that rule. This is not merely an easy version of
the intended strategy: the board's visible objectives are aligned with the
ordinary score-maximizing action, so there is no strategic tradeoff to notice.
